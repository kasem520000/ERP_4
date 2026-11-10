-- PHASE-036 · migration 0049 · custom fields & productivity
--
-- Purpose (PHASE-036 §2/§4 T36-1): the extensibility backbone — the layer
-- that lets two different tenants run two different businesses on the same
-- release (the external evaluation's FD-18: "not a missing feature but a
-- missing business model"). This migration ships the six tenant-owned
-- tables of the productivity suite:
--
--   · custom_picklists + custom_picklist_options (FD-20 — tenant-managed
--     option sets consumed by SELECT-type custom fields);
--   · custom_field_definitions + custom_field_values (FD-18 — typed
--     tenant-defined fields over the closed entity-kind list; the value
--     rows carry a denormalized field_type snapshot so the one-CHECK
--     value-family invariant is enforceable in pure SQL);
--   · saved_views (FD-02/FD-03 — per-user or shared list views: columns +
--     filters + sort + default flag);
--   · record_comments (FD-15 — the per-record collaboration thread; the
--     mentions jsonb is data-only, delivery rides PHASE-052's fabric).
--
-- INV-027 (new, the frozen-core guard): custom fields are DATA dimensions
-- only — no custom-field value may appear in journal lines, tax lines, or
-- posting payloads. Machine-checked by the contracts forbidden-surface
-- test; nothing in this migration touches the accounting core.
--
-- Money precision (ADR-0009): the MONEY family column is NUMERIC(19,4),
-- never float. NUMBER (free numeric) uses NUMERIC(28,10) headroom.
--
-- Permissions (matrix §3.16 — the extensibility family): three keys seeded
-- here — settings.custom_fields.manage, settings.picklists.manage,
-- settings.views.share. NOTE vs the phase doc §4 projection: the projected
-- "platform.views.manage" landed as settings.views.share because matrix
-- §3.10's platform-plane rule keeps platform.* keys non-assignable to
-- tenant roles (the owner CROSS JOIN wave excludes platform.*) — a shared
-- list view is a tenant-admin action; recorded in the completion report.
--
-- Plan grants (FEATURE_CATALOG §25 protocol step 3): the six platform.*
-- extensibility keys join business + enterprise (starter does NOT get
-- them — the tier-4 posture, the 0025/0026/0027/0037/0047 precedent).
--
-- The duplicate-invoice tolerance lands as the SETTINGS_REGISTRY key
-- purchasing.duplicate_invoice_tolerance_pct (the 028/029 wave pattern —
-- code-side registry default, no SQL seed; the golden re-pin discipline
-- applies, see the phase's agent-ctx record).
--> statement-breakpoint
SET ROLE erp_migrate;

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 1. custom_picklists (FD-20): tenant-owned option sets. key is the stable
-- identifier SELECT-type field definitions reference; labels are bilingual
-- (the triple-parity rule); is_active hides without deleting (definitions
-- referencing an inactive picklist keep resolving historical values).
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_picklists" (
  "id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "version" integer NOT NULL DEFAULT 1,
  "created_by" uuid,
  "key" varchar(60) NOT NULL,
  "name" text NOT NULL,
  "name_ar" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  CONSTRAINT pk_custom_picklists PRIMARY KEY ("id"),
  CONSTRAINT uq_custom_picklists_id_tenant UNIQUE ("id", "tenant_id"),
  CONSTRAINT uq_custom_picklists_tenant_key UNIQUE ("tenant_id", "key"),
  CONSTRAINT ck_custom_picklists_key_format CHECK ("key" ~ '^[a-z][a-z0-9_]{0,59}$')
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_custom_picklists_tenant_active
  ON "custom_picklists" ("tenant_id", "is_active", "key");
--> statement-breakpoint
COMMENT ON TABLE "custom_picklists" IS
  'PHASE-036 T36-1 (FD-20): tenant-owned custom picklists — bilingual option sets consumed by SELECT-type custom_field_definitions; is_active hides without delete (historical values keep resolving).';

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 2. custom_picklist_options: the options. value is the stable code stored
-- on custom_field_values.value_picklist_option_id-referenced rows (option
-- ids are the reference; value stays human-readable in exports); sort
-- drives the form order; deactivating an option hides it from new picks.
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_picklist_options" (
  "id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "version" integer NOT NULL DEFAULT 1,
  "created_by" uuid,
  "picklist_id" uuid NOT NULL,
  "value" varchar(60) NOT NULL,
  "label" text NOT NULL,
  "label_ar" text NOT NULL,
  "sort" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  CONSTRAINT pk_custom_picklist_options PRIMARY KEY ("id"),
  CONSTRAINT uq_custom_picklist_options_id_tenant UNIQUE ("id", "tenant_id"),
  CONSTRAINT uq_custom_picklist_options_picklist_value UNIQUE ("picklist_id", "tenant_id", "value"),
  CONSTRAINT fk_custom_picklist_options_picklist FOREIGN KEY ("picklist_id", "tenant_id")
    REFERENCES "custom_picklists" ("id", "tenant_id") ON DELETE CASCADE,
  CONSTRAINT ck_custom_picklist_options_value_format CHECK ("value" ~ '^[a-z0-9][a-z0-9_-]{0,59}$')
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_custom_picklist_options_picklist_sort
  ON "custom_picklist_options" ("picklist_id", "tenant_id", "sort", "value");
--> statement-breakpoint
COMMENT ON TABLE "custom_picklist_options" IS
  'PHASE-036 T36-1 (FD-20): picklist options — stable value codes + bilingual labels + sort + is_active; ON DELETE CASCADE confined to the owning picklist row (option rows are definition-scoped data, never cross-referenced elsewhere).';

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 3. custom_field_definitions (FD-18 — the register's #1 functional gap):
-- one row per tenant-defined field. entity_kind is the CLOSED list (the
-- contracts CUSTOM_FIELD_ENTITY_KINDS mirror); type is the six-family
-- enum; SELECT requires its picklist (ck shape); validation jsonb carries
-- {regex?, min?, max?} per family (service-validated; MONEY/NUMBER min/max
-- numeric, TEXT regex, DATE min/max ISO); show_in_list drives the list
-- payload fold-in cap (the payload-bloat rule, phase §7).
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_field_definitions" (
  "id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "version" integer NOT NULL DEFAULT 1,
  "created_by" uuid,
  "entity_kind" text NOT NULL,
  "key" varchar(60) NOT NULL,
  "label" text NOT NULL,
  "label_ar" text NOT NULL,
  "type" text NOT NULL,
  "picklist_id" uuid,
  "required" boolean NOT NULL DEFAULT false,
  "default_value" jsonb,
  "validation" jsonb,
  "help_text" text,
  "help_text_ar" text,
  "show_in_list" boolean NOT NULL DEFAULT false,
  "sort" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  CONSTRAINT pk_custom_field_definitions PRIMARY KEY ("id"),
  CONSTRAINT uq_custom_field_definitions_id_tenant UNIQUE ("id", "tenant_id"),
  CONSTRAINT uq_custom_field_definitions_tenant_entity_key UNIQUE ("tenant_id", "entity_kind", "key"),
  CONSTRAINT fk_custom_field_definitions_picklist FOREIGN KEY ("picklist_id", "tenant_id")
    REFERENCES "custom_picklists" ("id", "tenant_id") ON DELETE RESTRICT,
  CONSTRAINT ck_custom_field_definitions_key_format CHECK ("key" ~ '^[a-z][a-z0-9_]{0,59}$'),
  CONSTRAINT ck_custom_field_definitions_type_values CHECK ("type" IN
    ('TEXT', 'NUMBER', 'MONEY', 'DATE', 'BOOLEAN', 'SELECT')),
  CONSTRAINT ck_custom_field_definitions_entity_kind_values CHECK ("entity_kind" IN
    ('PARTNER', 'ITEM', 'SALES_QUOTATION', 'SALES_ORDER', 'SALES_INVOICE',
     'PURCHASE_ORDER', 'SUPPLIER_INVOICE', 'JOURNAL_ENTRY', 'FIXED_ASSET',
     'EMPLOYEE', 'EXPENSE')),
  CONSTRAINT ck_custom_field_definitions_select_shape CHECK (
    ("type" = 'SELECT') = ("picklist_id" IS NOT NULL)),
  CONSTRAINT ck_custom_field_definitions_validation_shape CHECK (
    "validation" IS NULL OR jsonb_typeof("validation") = 'object')
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_custom_field_definitions_tenant_entity_active
  ON "custom_field_definitions" ("tenant_id", "entity_kind", "is_active", "sort", "key");
--> statement-breakpoint
COMMENT ON TABLE "custom_field_definitions" IS
  'PHASE-036 T36-1 (FD-18): tenant-defined fields over the closed entity-kind list — six value families, SELECT bound to a custom_picklists row (ck shape), bilingual labels/help, validation jsonb {regex?,min?,max?}, show_in_list caps the list fold-in. INV-027: values are DATA dimensions only — never journal/tax/posting surfaces (contracts machine-check).';

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 4. custom_field_values: the typed-value store. ONE row per (entity,
-- definition) with a value — an optional field with no value has NO row
-- (DELETE clears). field_type is the denormalized definition snapshot so
-- the value-family invariant is a pure CHECK (the repo convention the
-- phase §2 names): exactly ONE value column populated, matching the
-- family. MONEY is NUMERIC(19,4) (ADR-0009); NUMBER is NUMERIC(28,10).
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_field_values" (
  "id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "version" integer NOT NULL DEFAULT 1,
  "created_by" uuid,
  "entity_kind" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "definition_id" uuid NOT NULL,
  "field_type" text NOT NULL,
  "value_text" text,
  "value_number" numeric(28,10),
  "value_money" numeric(19,4),
  "value_date" date,
  "value_boolean" boolean,
  "value_picklist_option_id" uuid,
  CONSTRAINT pk_custom_field_values PRIMARY KEY ("id"),
  CONSTRAINT uq_custom_field_values_id_tenant UNIQUE ("id", "tenant_id"),
  CONSTRAINT uq_custom_field_values_entity_definition UNIQUE ("tenant_id", "entity_kind", "entity_id", "definition_id"),
  CONSTRAINT fk_custom_field_values_definition FOREIGN KEY ("definition_id", "tenant_id")
    REFERENCES "custom_field_definitions" ("id", "tenant_id") ON DELETE CASCADE,
  CONSTRAINT fk_custom_field_values_option FOREIGN KEY ("value_picklist_option_id", "tenant_id")
    REFERENCES "custom_picklist_options" ("id", "tenant_id") ON DELETE RESTRICT,
  CONSTRAINT ck_custom_field_values_kind_values CHECK ("entity_kind" IN
    ('PARTNER', 'ITEM', 'SALES_QUOTATION', 'SALES_ORDER', 'SALES_INVOICE',
     'PURCHASE_ORDER', 'SUPPLIER_INVOICE', 'JOURNAL_ENTRY', 'FIXED_ASSET',
     'EMPLOYEE', 'EXPENSE')),
  CONSTRAINT ck_custom_field_values_type_values CHECK ("field_type" IN
    ('TEXT', 'NUMBER', 'MONEY', 'DATE', 'BOOLEAN', 'SELECT')),
  -- entity_kind ↔ definition.entity_kind consistency is SERVICE-enforced
  -- (a CHECK cannot join across tables; the contracts zod schema + the
  -- store's typed writes own the invariant — recorded in the TABLES spec).
  CONSTRAINT ck_custom_field_values_typed_family CHECK (
    ("field_type" = 'TEXT' AND "value_text" IS NOT NULL
       AND "value_number" IS NULL AND "value_money" IS NULL AND "value_date" IS NULL
       AND "value_boolean" IS NULL AND "value_picklist_option_id" IS NULL)
    OR ("field_type" = 'NUMBER' AND "value_number" IS NOT NULL
       AND "value_text" IS NULL AND "value_money" IS NULL AND "value_date" IS NULL
       AND "value_boolean" IS NULL AND "value_picklist_option_id" IS NULL)
    OR ("field_type" = 'MONEY' AND "value_money" IS NOT NULL
       AND "value_text" IS NULL AND "value_number" IS NULL AND "value_date" IS NULL
       AND "value_boolean" IS NULL AND "value_picklist_option_id" IS NULL)
    OR ("field_type" = 'DATE' AND "value_date" IS NOT NULL
       AND "value_text" IS NULL AND "value_number" IS NULL AND "value_money" IS NULL
       AND "value_boolean" IS NULL AND "value_picklist_option_id" IS NULL)
    OR ("field_type" = 'BOOLEAN' AND "value_boolean" IS NOT NULL
       AND "value_text" IS NULL AND "value_number" IS NULL AND "value_money" IS NULL
       AND "value_date" IS NULL AND "value_picklist_option_id" IS NULL)
    OR ("field_type" = 'SELECT' AND "value_picklist_option_id" IS NOT NULL
       AND "value_text" IS NULL AND "value_number" IS NULL AND "value_money" IS NULL
       AND "value_date" IS NULL AND "value_boolean" IS NULL))
);
--> statement-breakpoint
-- The hot read path (phase §2): (tenant, entity_kind, entity_id) — the
-- batch fold-in for list/detail payloads.
CREATE INDEX IF NOT EXISTS ix_custom_field_values_tenant_entity_row
  ON "custom_field_values" ("tenant_id", "entity_kind", "entity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_custom_field_values_tenant_definition
  ON "custom_field_values" ("tenant_id", "definition_id");
--> statement-breakpoint
COMMENT ON TABLE "custom_field_values" IS
  'PHASE-036 T36-1 (FD-18): typed custom-field values — one row per (entity, definition) with a value (no row = empty); field_type snapshot + the ck_custom_field_values_typed_family one-column invariant; MONEY NUMERIC(19,4) per ADR-0009; values cascade with their definition, options RESTRICT (renaming an option label never breaks history).';

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 5. saved_views (FD-02/FD-03): per-user list views (user_id) or shared
-- tenant views (user_id NULL — writing a shared row requires the
-- settings.views.share permission, service-enforced). columns/filters/sort
-- are jsonb snapshots of the DataTable state; is_default marks the view a
-- user's list opens with (one default per user/entity — service-guarded;
-- the COALESCE unique index below carries the NULL-shared shape).
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_views" (
  "id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "version" integer NOT NULL DEFAULT 1,
  "created_by" uuid,
  "user_id" uuid,
  "entity_kind" text NOT NULL,
  "name" text NOT NULL,
  "columns" jsonb NOT NULL,
  "filters" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "sort" jsonb,
  "is_default" boolean NOT NULL DEFAULT false,
  CONSTRAINT pk_saved_views PRIMARY KEY ("id"),
  CONSTRAINT uq_saved_views_id_tenant UNIQUE ("id", "tenant_id"),
  CONSTRAINT ck_saved_views_kind_values CHECK ("entity_kind" IN
    ('PARTNER', 'ITEM', 'SALES_QUOTATION', 'SALES_ORDER', 'SALES_INVOICE',
     'PURCHASE_ORDER', 'SUPPLIER_INVOICE', 'JOURNAL_ENTRY', 'FIXED_ASSET',
     'EMPLOYEE', 'EXPENSE')),
  CONSTRAINT ck_saved_views_name_length CHECK (length("name") BETWEEN 1 AND 120),
  CONSTRAINT ck_saved_views_columns_shape CHECK (jsonb_typeof("columns") = 'array'),
  CONSTRAINT ck_saved_views_filters_shape CHECK (jsonb_typeof("filters") = 'object')
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_views_tenant_entity_owner_name
  ON "saved_views" ("tenant_id", "entity_kind", (COALESCE("user_id", '00000000-0000-4000-8000-000000000000'::uuid)), "name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_saved_views_tenant_entity_user
  ON "saved_views" ("tenant_id", "entity_kind", "user_id");
--> statement-breakpoint
COMMENT ON TABLE "saved_views" IS
  'PHASE-036 T36-1 (FD-02/FD-03): saved list views — columns/filters/sort jsonb snapshots per user (user_id) or shared across the tenant (NULL; write-gated by settings.views.share); the COALESCE unique index keeps shared + personal name spaces collision-free.';

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 6. record_comments (FD-15): the per-record collaboration thread. Body
-- max 4,000 chars; mentions jsonb = the parsed @uuid token list (data-only
-- now — notification delivery rides PHASE-052's fabric, no fabrication).
-- Append-only 🔒 like audit_events: UPDATE never; DELETE only under
-- erp.purge_mode (the offboarding purge path) — the guard trigger owns
-- the policy.
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "record_comments" (
  "id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants" ("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "author_id" uuid NOT NULL,
  "entity_kind" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "body" text NOT NULL,
  "mentions" jsonb,
  CONSTRAINT pk_record_comments PRIMARY KEY ("id"),
  CONSTRAINT uq_record_comments_id_tenant UNIQUE ("id", "tenant_id"),
  CONSTRAINT ck_record_comments_kind_values CHECK ("entity_kind" IN
    ('PARTNER', 'ITEM', 'SALES_QUOTATION', 'SALES_ORDER', 'SALES_INVOICE',
     'PURCHASE_ORDER', 'SUPPLIER_INVOICE', 'JOURNAL_ENTRY', 'FIXED_ASSET',
     'EMPLOYEE', 'EXPENSE')),
  CONSTRAINT ck_record_comments_body_length CHECK (length("body") BETWEEN 1 AND 4000),
  CONSTRAINT ck_record_comments_mentions_shape CHECK (
    "mentions" IS NULL OR jsonb_typeof("mentions") = 'array')
  -- (the @uuid token format itself is zod-validated at the contracts edge;
  -- a CHECK cannot carry the array-element regex without a subquery)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ix_record_comments_tenant_entity_time
  ON "record_comments" ("tenant_id", "entity_kind", "entity_id", "created_at");
--> statement-breakpoint
COMMENT ON TABLE "record_comments" IS
  'PHASE-036 T36-1 (FD-14/FD-15): the per-record comment thread — append-only 🔒 (guard trigger; DELETE only under erp.purge_mode), mentions = parsed @uuid tokens (delivery rides PHASE-052, data-only now). The record timeline composes audit_events + these rows client-side through GET /extensibility/timeline.';

--> statement-breakpoint
CREATE OR REPLACE FUNCTION erp.record_comments_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF COALESCE(current_setting('erp.purge_mode', true), '') = 'on' THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'record_comments is append-only (FD-15) — DELETE is confined to the offboarding purge path'
      USING ERRCODE = '42501';
  END IF;
  RAISE EXCEPTION 'record_comments rows are immutable — UPDATE is never allowed'
    USING ERRCODE = '42501';
END
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_record_comments_guard ON "record_comments";
--> statement-breakpoint
CREATE TRIGGER trg_record_comments_guard
  BEFORE UPDATE OR DELETE ON "record_comments"
  FOR EACH ROW EXECUTE FUNCTION erp.record_comments_guard();

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 7. RLS (TENANT_ISOLATION §2): the house macro on every new tenant-owned
-- table.
--> statement-breakpoint
SELECT erp.apply_tenant_policy('"custom_picklists"');
--> statement-breakpoint
SELECT erp.apply_tenant_policy('"custom_picklist_options"');
--> statement-breakpoint
SELECT erp.apply_tenant_policy('"custom_field_definitions"');
--> statement-breakpoint
SELECT erp.apply_tenant_policy('"custom_field_values"');
--> statement-breakpoint
SELECT erp.apply_tenant_policy('"saved_views"');
--> statement-breakpoint
SELECT erp.apply_tenant_policy('"record_comments"');

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 7b. Purge path (the 0036/0037/0038 discipline): every new tenant table
-- gains the erp_migrate DELETE/UPDATE policies confined to the GUC-named
-- tenant.
--> statement-breakpoint
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['custom_picklists', 'custom_picklist_options',
                            'custom_field_definitions', 'custom_field_values',
                            'saved_views', 'record_comments']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS purge_path_delete ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS purge_path_update ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY purge_path_delete ON public.%I FOR DELETE TO erp_migrate '
        || 'USING (tenant_id = erp.current_tenant_id())', t);
    EXECUTE format(
      'CREATE POLICY purge_path_update ON public.%I FOR UPDATE TO erp_migrate '
        || 'USING (tenant_id = erp.current_tenant_id()) WITH CHECK (true)', t);
  END LOOP;
END $$;

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 8. Grants (per-table shapes):
--  - custom_picklists / custom_picklist_options / custom_field_definitions
--    / saved_views: SELECT/INSERT/UPDATE/DELETE (full management surface;
--    value/definition deletes are service-guarded, grants stay plain);
--  - custom_field_values: SELECT/INSERT/UPDATE/DELETE (DELETE clears an
--    optional field's row — the "no row = empty" contract);
--  - record_comments: SELECT/INSERT only — append-only 🔒 with the guard
--    trigger owning the DELETE policy (UPDATE is grant-denied outright).
--> statement-breakpoint
REVOKE ALL ON "custom_picklists", "custom_picklist_options",
  "custom_field_definitions", "custom_field_values", "saved_views",
  "record_comments" FROM erp_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "custom_picklists" TO erp_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "custom_picklist_options" TO erp_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "custom_field_definitions" TO erp_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "custom_field_values" TO erp_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "saved_views" TO erp_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON "record_comments" TO erp_app;
--> statement-breakpoint
GRANT SELECT ON "custom_picklists", "custom_picklist_options",
  "custom_field_definitions", "custom_field_values", "saved_views",
  "record_comments" TO erp_readonly;
--> statement-breakpoint
GRANT SELECT ON "custom_picklists", "custom_picklist_options",
  "custom_field_definitions", "custom_field_values", "saved_views",
  "record_comments" TO erp_definer;

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 9. Permission seeds (matrix §3.16 — the extensibility family; the 0037
-- §11 convention): three keys + the role-template grant waves (owner =
-- every tenant-plane key; accountant = the finance-configuration set).
--> statement-breakpoint
INSERT INTO "permissions" ("key", "module", "description") VALUES
  ('settings.custom_fields.manage', 'configuration', 'Create/maintain tenant custom field definitions and picklists / إدارة الحقول المخصصة وقوائم الخيارات'),
  ('settings.picklists.manage', 'configuration', 'Maintain custom picklists (option sets) / إدارة قوائم الخيارات المخصصة'),
  ('settings.views.share', 'configuration', 'Publish a saved list view as shared / نشر عرض قائمة مشترك')
ON CONFLICT ("key") DO UPDATE
  SET "module" = EXCLUDED."module", "description" = EXCLUDED."description";

--> statement-breakpoint
-- Owner: the whole extensibility family (the 0005/0037 CROSS JOIN wave,
-- explicit IN-list so the grant is idempotent and self-documenting).
INSERT INTO "role_permissions" ("role_id", "tenant_id", "permission_id")
SELECT r."id", NULL, p."key"
FROM "roles" r JOIN "permissions" p ON p."key" IN (
  'settings.custom_fields.manage', 'settings.picklists.manage', 'settings.views.share'
)
WHERE r."key" = 'owner' AND r."tenant_id" IS NULL
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

--> statement-breakpoint
-- Accountant: field + picklist management (finance staff configure the
-- data capture) + view sharing (list productivity); viewer/sales/purchasing
-- keep their own personal views only (no share key).
INSERT INTO "role_permissions" ("role_id", "tenant_id", "permission_id")
SELECT r."id", NULL, p."key"
FROM "roles" r JOIN "permissions" p ON p."key" IN (
  'settings.custom_fields.manage', 'settings.picklists.manage', 'settings.views.share'
)
WHERE r."key" = 'accountant' AND r."tenant_id" IS NULL
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- 10. Plan grants (FEATURE_CATALOG §25 protocol step 3; the 0027/0047
-- array_cat convention): the six extensibility keys join business +
-- enterprise — starter does NOT get them (the tier-4 posture; the phase
-- §4 projection). Idempotent, guarded.
--> statement-breakpoint
UPDATE "plans" SET "feature_keys" = array_cat("feature_keys",
  ARRAY['platform.custom_fields', 'platform.custom_picklists',
        'platform.saved_views', 'platform.list_export',
        'platform.bulk_actions', 'platform.record_timeline'])
WHERE "key" IN ('business', 'enterprise')
  AND NOT ('platform.custom_fields' = ANY("feature_keys"));

--> statement-breakpoint
RESET ROLE;

--> statement-breakpoint
-- Schema-state marker for /health/ready (mirrors the migration manifest).
INSERT INTO erp._schema_state (key, value) VALUES ('schema_version', 49)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, at = now();
