-- PHASE-035 · migration 0048 · platform console overview aggregate
--
-- Purpose (PHASE-035 §3 T35-A2): the platform control-panel dashboard
-- (web /{locale}/platform/overview) needs cross-tenant aggregates the
-- platform GUC cannot read directly — subscriptions, devices and
-- e-invoicing submissions are tenant-RLS'd by the 0002 macro (the same
-- constraint erp.subscriptions_needing_attention() documents). This
-- migration ships the sanctioned SECURITY DEFINER read for the dashboard:
-- ONE STABLE jsonb aggregate (erp.platform_console_overview) that joins
-- per-tenant state into platform-shaped counters, plus nothing else.
--
-- Scope contract (mirrors the 0021 definer precedent):
--   · read-only (STABLE, no side effects);
--   · the platform tenant (20000000-…-01) is excluded from business
--     aggregates exactly as subscriptions_needing_attention() excludes it;
--   · no row-level tenant data crosses the boundary — only grouped
--     counts/labels (plan keys, status counters), so the definer cannot
--     leak tenant-identifying rows;
--   · revoked to PUBLIC, granted to erp_app only (the API's app role).
--
-- The tenants/audit_events/plans aggregates the platform scope CAN read
-- stay in ordinary SQL inside the service (no definer needed) — this
-- function carries only the RLS-blocked slices.
--> statement-breakpoint
SET ROLE erp_migrate;

--> statement-breakpoint
-- The dashboard aggregate: plan distribution + subscription lifecycle
-- counters + device registry counts + the e-invoicing funnel, each as a
-- grouped projection over the tenant-owned tables.
--> statement-breakpoint
CREATE OR REPLACE FUNCTION erp.platform_console_overview()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, erp
AS $$
  SELECT jsonb_build_object(
    -- Latest subscription per business tenant (the console's own
    -- current-subscription rule), grouped by plan.
    'planDistribution', (
      SELECT COALESCE(jsonb_agg(plan_row ORDER BY plan_row->>'sortOrder', plan_row->>'planKey')), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
                 'planKey', p.key,
                 'planName', p.name,
                 'planNameAr', p.name_ar,
                 'sortOrder', p.sort_order,
                 'count', count(*)
               ) AS plan_row
        FROM (SELECT DISTINCT ON (s.tenant_id) s.plan_id
              FROM subscriptions s
              WHERE s.tenant_id <> '20000000-0000-4000-8000-000000000001'
              ORDER BY s.tenant_id, s.created_at DESC) latest
        JOIN plans p ON p.id = latest.plan_id
        GROUP BY p.key, p.name, p.name_ar, p.sort_order
      ) plans
    ),
    -- The same latest-subscription projection grouped by lifecycle status
    -- (ACTIVE / TRIAL / GRACE_READ_ONLY / PAST_DUE / …).
    'subscriptionStatuses', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('status', status, 'count', count)), '[]'::jsonb)
      FROM (SELECT status, count(*) AS count
            FROM (SELECT DISTINCT ON (s.tenant_id) s.status
                  FROM subscriptions s
                  WHERE s.tenant_id <> '20000000-0000-4000-8000-000000000001'
                  ORDER BY s.tenant_id, s.created_at DESC) latest
            GROUP BY status) statuses
    ),
    -- Device registry health (PHASE-020 registry): totals + active/revoked.
    'devices', (
      SELECT jsonb_build_object(
               'total', count(*),
               'active', count(*) FILTER (WHERE revoked_at IS NULL),
               'revoked', count(*) FILTER (WHERE revoked_at IS NOT NULL)
             )
      FROM devices
    ),
    -- The e-invoicing funnel (PHASE-023 registry) across tenants.
    'einvoicingByStatus', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('status', status, 'count', count)), '[]'::jsonb)
      FROM (SELECT status, count(*) AS count
            FROM e_invoicing_submissions
            GROUP BY status) funnel
    )
  )
$$;

--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION erp.platform_console_overview() FROM PUBLIC;

--> statement-breakpoint
GRANT EXECUTE ON FUNCTION erp.platform_console_overview() TO erp_app;

--> statement-breakpoint
RESET ROLE;

--> statement-breakpoint
-- Schema-state marker for /health/ready (mirrors the migration manifest).
INSERT INTO erp._schema_state (key, value) VALUES ('schema_version', 48)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, at = now();
