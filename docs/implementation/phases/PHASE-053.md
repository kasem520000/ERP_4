# PHASE-053 — BI & Scheduled Reporting v2 (ذكاء الأعمال والتقارير المجدولة v2)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W4, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §15 (R-01…R-15) + §28 (PP-20, PP-22…PP-28) + the
> evaluation's F-7 surface ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE053.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-053
- **Title:** BI & Scheduled Reporting v2 (ذكاء الأعمال والتقارير المجدولة v2)
- **Objective:** turn the reporting axis from "85 تقريراً ممتاز، لكن لا BI" (48%)
  into self-service analytics. The F-7 finding was an honesty problem, not just a
  feature gap: `reporting.scheduled_reports` was **documented-claimed but unbuilt**
  — 037 shipped the DEFERRED decision record; this phase ships the implementation.
  Deliverables: **(1)** scheduled reports (F-7/R-05/R-06/PP-20/PP-22) — cron-driven
  delivery over pg-boss through 052's channels; **(2)** the report builder (R-01) —
  curated datasets + a dimension/filter/sort builder executing through the
  **existing report-engine contract** (entitlements + export apply unchanged) with
  **no arbitrary tenant SQL, by construction**; **(3)** pivot/cross-tab (R-02) with
  drill-through to source documents; **(4)** self-service dashboards (R-03) with
  per-role home assignment; **(5)** report alerts (R-04) on the 039 rules engine;
  **(6)** the KPI engine (R-09); **(7)** saved report views (R-15); **(8)** what-if
  parameters on budget reports (R-08, tying 050's scenarios); **(9)** authenticated
  BI export feeds (R-12/IN-23); and **(10)** the polish set (PP-23…PP-28).
- **Business value:** the finance manager builds her own margin-by-warehouse pivot
  without a support ticket; every report gains a "send me this weekly" button; and
  Power BI/Tableau/Looker Studio consumers get stable authenticated feeds — the
  axis the evaluation weighted at 52% missing.
- **Tier / effort:** P2 · ~5 weeks single-stream (migration + contracts + api unit
  suite + web screens + docs + completion report).
- **Source gaps closed:** R-01…R-06, R-08, R-09, R-12, R-15, F-7 (the
  implementation — 037 recorded the deferral, this closes it), PP-20, PP-22…PP-27,
  PP-28 (candidate). **R-07 (predictive) stays out** — AI territory, decision-gated
  with the 058 proposal per register §2; **R-13 (OLAP) stays out** with reasoning
  (§2); R-10/R-11/R-14 remain unassigned.

## 2. Scope

In scope:

1. **Scheduled reports (F-7/R-05/R-06/PP-20/PP-22):** `report_schedules` — report
   key + params jsonb + cron/frequency + recipients + channels (email,
   WhatsApp-template, webhook — 052's ports; fakes refuse live sends exactly as
   there); a pg-boss runner executes through the existing report engine + export
   pipeline and logs every delivery. The **"send me this weekly" button lands on
   every report screen** (PP-20) — the F-7 feature-key row finally points at real
   code.
2. **Report builder (R-01):** a **dataset registry** — curated read-models (GL,
   partner, item, sales, purchase, inventory, payroll dimensions + measures with
   documented joins) — plus a query builder (dimensions, rows/columns, filters,
   sort) persisted as `custom_report_definitions` (tenant data), executing through
   the **existing report-engine contract** (defineReport-compatible) so entitlements
   + export apply unchanged. **No arbitrary tenant SQL** — dataset + field
   allowlists make injection impossible by construction.
3. **Pivot/cross-tab (R-02):** pivot rendering of builder results
   (rows × columns × measure) with drill-through to source documents (the PP-21
   pattern, generalized from the dashboards to every builder result).
4. **Self-service dashboards (R-03/TB-04):** `dashboard_layouts` — a widget grid of
   report-widgets, saved-view-widgets, and KPI-widgets; per-user or shared; a
   drag-drop layout editor; **home-page assignment per role** (PP-14 adjacency —
   the assignment surface ships here, the broader per-role home polish stays 057's
   row).
5. **Report alerts (R-04):** threshold/exception rules on report outputs
   (value-out-of-range → in-app/email/webhook) — riding the **039 rules engine**,
   not a new rule interpreter.
6. **KPI engine (R-09):** `kpi_definitions` — formula over dataset measures with
   target + period — KPI widgets + a `kpi_history` table for trend rendering.
7. **Saved views for reports (R-15):** saved parameter-sets per user on registry
   reports — extending 036's `saved_views` to report params (the same table family,
   a report-param kind).
8. **What-if (R-08):** scenario parameters on budget reports (±% revenue/cost
   overlay comparison) — reading 050's scenario machinery where shipped, otherwise
   local param overlays on the existing budget contracts.
9. **BI export feeds (R-12/IN-23):** CSV/JSON feeds per dataset for Power
   BI/Tableau/Looker Studio — authenticated via **052's API keys**, paged with
   incremental cursors. **No OLAP cube (R-13):** explicitly out — the curated
   dataset registry + feeds give the standard BI tools what they need without a
   cube server, its ops burden, and a second query semantics to keep honest;
   recorded as a reasoned exclusion, not an oversight.
10. **Professional polish (PP-23…PP-28):** annotations on saved report results,
    side-by-side compare of two parameter-sets, variance highlighting, image export
    (PP-26, through the existing render/export pipeline), and share-links with
    scoped view-only expiring tokens (PP-27). **PP-28 (signed reports) is
    decision-gated** — cryptographic signing ties into 056's identity work and
    requires a decision record before implementation; recorded honestly.

Out of scope (explicit):

- **R-07 predictive analytics** — AI, decision-gated with the 058 proposal (SCOPE
  non-goal #9 stands until an ADR reopens it).
- **R-13 OLAP cube** — reasoned exclusion above.
- **Tenant-written SQL of any kind** — the builder is allowlist-based by
  construction (INV-034).
- **Register §J discipline (binding):** builder reports are tenant **DATA**
  (`custom_report_definitions` rows), **NOT report-registry keys** — register §J
  stays closed; the catalog documents the builder as a *capability*, and no
  tenant-authored definition ever becomes a claimed platform report.
- **Live external channel sends** — delivery channels ride 052's gated ports; until
  gates pass, schedules deliver to email (the existing path) and log the rest.

## 3. Prerequisites

- **PHASE-036** (saved views + the report-export substrate) and **PHASE-052**
  (API keys for BI feeds; webhook/WhatsApp channels) — the register lists both as
  dependencies; **PHASE-039** — the rules engine report alerts ride; **037's F-7
  decision record** — the DEFERRED-with-pointer this phase retires by shipping.
- **Binding decisions:** ADR-0009 (money precision in every dataset measure),
  ADR-0012 (offline authority — BI feeds are read-only, never sync sources), the
  register §3.3 drift rule (new registry reports land in REPORT_CATALOG in the same
  phase), the §J discipline above.
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [REPORT_CATALOG.md](../../reporting/REPORT_CATALOG.md) (dataset registry + the
  F-7 row's honest flip), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md).

## 4. Design Impact

- **Database:** one additive migration `0073_bi_reporting_v2.sql` (schema_version
  73): `report_schedules`, `report_schedule_deliveries` (append-only),
  `report_datasets` (the curated registry — platform-owned, seeded),
  `custom_report_definitions` (tenant data), `dashboard_layouts`,
  `kpi_definitions`, `kpi_history`, `report_annotations`, `report_share_links`
  (hashed tokens, expiry). `saved_views` gains the report-param kind. Journal →
  **73 entries**.
- **New invariant (INV-034 candidate — re-pinned if earlier waves consumed the
  numbers):** *builder safety + data-not-keys* — a `custom_report_definition` may
  only reference allowlisted dataset fields, filters are typed operators (never
  raw expressions), execution always passes the report-engine entitlement check,
  and no tenant-authored row can register as a platform report key. Machine-checked
  by the contracts suite (schema-level allowlist validation + a §J negative test:
  the report registry rejects builder rows).
- **No new goldens** — the phase posts nothing; every number a builder renders
  reconciles to the same report contracts the registry reports use.
- **Feature keys (projection):** `reporting.report_builder`,
  `reporting.pivot_viewer`, `reporting.self_service_dashboards`,
  `reporting.report_alerts`, `reporting.kpi_engine`, `reporting.report_views`,
  `reporting.what_if`, `reporting.bi_feeds`, `reporting.report_sharing` — +9 keys
  (projection ≈315 program total; the delta is the binding figure, the total
  re-pinned at execution; the F-7 `reporting.scheduled_reports` key already exists
  in the catalog — its implementation lands here, so it is **not** a new key).
  Plan grants: business + enterprise (builder/alerts/KPI enterprise posture).
- **Permissions (projection):** `reporting.builder.manage`,
  `reporting.dashboards.manage`, `reporting.schedules.manage`,
  `reporting.alerts.manage`, `reporting.shares.manage` — +5 keys, a named bump
  (projection ≈360; re-pinned consciously at delivery).
- **API:** extensions to the `reporting` module — additive routes only; the builder
  executes through a defineReport-compatible adapter (the existing engine
  contract); BI feeds authenticate via 052's ApiKeyGuard with scoped read
  permissions; Idempotency-Key on schedule mutations.
- **Web:** builder screen, pivot viewer, dashboard editor, schedules console,
  alerts manager, share-link flow — on the @erp/ui archetypes; i18n +~200 keys
  (AR/EN parity from day one).
- **Docs:** FEATURE_CATALOG (+9 + the F-7 row's honest implementation note),
  REPORT_CATALOG (dataset registry documentation), ENTITY_CATALOG (+9 entities —
  re-pinned), NAVIGATION_MODEL, AUTHORIZATION_MATRIX (+5),
  IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T53-A | Migration 0073: schedules + deliveries, dataset registry, custom definitions, dashboards, KPIs, annotations, share links | `apps/api/migrations/0073_bi_reporting_v2.sql`, `meta/_journal.json` | migrations.spec journal 73 entries; RLS battery |
| T53-B | Contracts: dataset/definition/dashboard/KPI/schedule DTOs + INV-034 allowlist + §J negative tests | `packages/contracts/src/reporting/**` (+ index exports) | contracts suite green (baseline grows; re-pinned) |
| T53-C | Dataset registry (curated read-models with documented joins) + builder execution through the existing report-engine adapter (entitlements + export apply) | `apps/api/src/modules/reporting/**` | unit: allowlist rejects unknown fields/operators; entitlement denial on a restricted dataset; results identical to the registry report for the same query |
| T53-D | Pivot/cross-tab renderer + drill-through to source documents | `apps/web/**`, `apps/api/src/modules/reporting/**` | unit: pivot aggregation ties to flat totals; drill links resolve to real documents |
| T53-E | Scheduled reports: pg-boss runner + delivery log + channels (email live; WhatsApp/webhook via 052 gated ports) + the "send me this weekly" button on every report | `apps/api/src/modules/reporting/**`, `apps/web/**` | unit: schedule fires, renders through the export pipeline, delivery row written; gated channels refuse honestly |
| T53-F | Self-service dashboards: widget grid + drag-drop editor + per-role home assignment | `apps/web/**`, `packages/ui/**` | web typecheck; layout persistence round-trip |
| T53-G | Report alerts (039 rules engine) + KPI engine + history | `apps/api/src/modules/reporting/**`, `apps/api/src/modules/workflow/**` (039 surface) | unit: threshold rule fires on out-of-range output; KPI formula over measures exact; history rows append-only |
| T53-H | Saved report views (036 saved_views extension) + what-if scenario parameters on budget reports | `apps/api/src/modules/reporting/**`, `apps/api/src/modules/budgeting/**` | unit: param-set round-trip; ±% overlay compare exact (ties 050 scenarios when present) |
| T53-I | BI export feeds (API-key auth, paged + incremental cursors) + share links with scoped expiring tokens + polish (annotations, side-by-side, variance, image export) | `apps/api/src/modules/reporting/**`, `apps/api/src/modules/integrations/**` (052 guard) | unit: feed auth via ApiKeyGuard with scoped reads; cursor pagination stable; share token view-only + expiry enforced |
| T53-J | Web: builder screen, pivot viewer, dashboard editor, schedules console + i18n | `apps/web/**`, `packages/ui/**` | web typecheck; browser smoke of the builder→pivot→schedule chain |

## 6. Verification

- Contracts suite green (new DTOs + INV-034 allowlist + §J negative tests); API unit
  suite green (the 479-test baseline grows with the reporting specs; re-pinned at
  delivery).
- `migrations.spec.ts`: journal 73 entries, manifest consistency.
- Permissions drift: projected 360 = 360 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the SETTINGS keys (schedule defaults, alert posture) ⇒
  **all pins recomputed** with the old→new table recorded.
- **The F-7 honesty flip:** the `reporting.scheduled_reports` catalog row now
  points at the implementation, and the 037 DEFERRED decision record is annotated
  "implemented by PHASE-053" — the claim/implementation conformance the external
  evaluation measured is restored on this surface.
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: build a margin-by-warehouse report in the builder → pivot it →
  drill through to an invoice → save the view → pin it as a dashboard widget → set
  a threshold alert → schedule it weekly → open the BI feed with an API key → share
  a view-only expiring link.

## 7. Risks and Constraints

- **Query-load discipline:** builder queries execute against the same read paths as
   registry reports (no direct table-scans from user input); hot datasets get
   documented indexes, and heavy pivots are capped by a row limit with an honest
   "result truncated" state — the FD-05 server-pagination lesson applied.
- **§J integrity:** the strongest governance risk is builder definitions leaking
  into the report registry and inflating claimed platform surface — the §J negative
  test is the hard boundary, and the completion report records the count of
  platform registry reports as unchanged by this phase.
- **Delivery honesty:** scheduled WhatsApp/webhook deliveries ride 052's gated
  ports; the schedule log records a refused send as refused — never a fabricated
  "delivered" row. **Token scope on share links:** view-only, expiring, no API
  surface — a share link is a rendered artifact, never an auth bypass (guard
  tests assert).
- **KPI formula drift:** KPIs are formulas over dataset measures with recorded
  definitions — no magic numbers in code (the honesty rule extended to analytics).

## 8. Completion and Handoff

- Completion report `reports/PHASE-053-COMPLETION.md` with the verification table
  (suites, drift numbers, i18n count, browser evidence) + honest deferrals (R-07
  and R-13 exclusions restated with reasoning; PP-28 decision-gated; gated channels
  refused honestly).
- Handoff obligations: the dataset registry is the curated analytics surface later
  phases extend (new modules add datasets, not bespoke report screens); the F-7
  flip closes the last documented-claimed-but-unbuilt reporting item; BI feeds and
  052's OpenAPI surface together form the external consumption contract.
- Next eligible: **PHASE-056** (enterprise identity — the remaining W4 sibling) or
  the W5 polish wave per the owner's explicit order; the W4 gate "sellable in KSA;
  integrable; self-service analytics" is fully met once 051+052+053 have landed.
