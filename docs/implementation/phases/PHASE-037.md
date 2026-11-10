# PHASE-037 — Master-Data Depth & Activation Residue (تعميق البيانات الأساسية وسدّ بقايا التفعيل)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W1, tier P1) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §2 (H-17), §6 (I-16, I-18), §25.2 (AD-36-02/03/04)
> + evaluation findings F-1…F-9 with doc-drift items §9c-9/10/14
> (`PROJECT_EVALUATION_2026-11-10.md`) · **Execution:** begins on the owner's
> explicit phase order; delivery = `ERP_PLATFORM_PHASE037.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-037
- **Title:** Master-Data Depth & Activation Residue
  (تعميق البيانات الأساسية وسدّ بقايا التفعيل)
- **Objective:** Close the W1 wave's **activation residue** — the evaluation's
  "silent gaps" where working code is invisible to tenants or documented claims
  have no code — and then deepen the item master to market standard. Concretely:
  **(1)** the one-line `items.import_export` plan-grant fix that restores the
  `/inventory/import` screen to sidebar visibility (F-5/H-18, the register's
  footnote-¹ row, task T37-A); **(2)** the `reports.consolidated` NAV_ITEMS
  registration so القوائم الموحدة appears for every entitled tenant, not only
  template tenants (F-3); **(3)** the documented-but-missing 86th report
  `tax.e-invoicing-log` (F-6); **(4)** honest DEFERRED decision records for
  F-7 (`reporting.scheduled_reports` → implementation in PHASE-053) and F-9
  (`platform.payouts` → payout reconciliation surface in PHASE-052), replacing
  silent shipped-claims; **(5)** the batch/serial/expiry screens the API has
  always deserved (F-1) and a standalone adjustments screen (F-2); **(6)** the
  import wizard extended from 3 kinds to 9 (H-17); and **(7)** item variants,
  image galleries, and partner item cross-references (AD-36-02/03/04); plus
  REPORT_CATALOG sync with the live registry (§9c-9/10) and the
  generated-outputs cleanup (§9c-14).
- **Business value:** the register's W1 honesty gate — "every claimed feature
  real" — becomes checkable; onboarding collapses from months of manual entry
  (H-17's "إدخال يدوي بالملايين") to hours of guided import; the item master
  becomes sellable to retail/distribution tenants (matrices, photos, supplier
  part codes). 041's supplier catalog writes into `item_cross_refs`; 043's
  WMS and 045's MRP resolve stock per variant.
- **Tier / effort:** P1 · ~3 weeks single-stream (two migrations + contracts +
  api suite + five screens + catalog/decision-record docs).
- **Source gaps closed:** F-1, F-2, F-3 (activation), F-5, F-6, F-7 (decision
  record — implementation in 053), F-9 (decision record — payout surface in
  052), EVAL §9c-9/10/14, H-17, H-18 (the footnote-¹ one-liner, T37-A), I-16,
  I-17/I-21 (expiry dashboard + daily alert job), I-18, AD-36-02/03/04.

## 2. Scope

In scope:

1. **Activation fixes — the silent gaps:**
   - `items.import_export` plan-grant migration (T37-A): one grant statement,
     business + enterprise — the screen, API, and `items.import.run` guard
     already work; only the grant row is missing (F-5/H-18).
   - `reports.consolidated` NAV_ITEMS registration in group 7 التقارير: the
     five consolidation surfaces render only when an industry template
     re-declares them; the registry row ships so every entitled tenant sees
     القوائم الموحدة (F-3 — the key and `consolidation.reports.view`
     permission already exist; registration, not a new entitlement).
   - `tax.e-invoicing-log` report contract (F-6): the documented 86th report —
     a read over `e_invoicing_submissions` (period, adapter, funnel state,
     retry chains, dead-letter), Report Contract shape, XLSX/CSV export; the
     catalogued permission `reports.tax.einvoice-log.read` becomes enforced.
   - Honest decision records replacing the silent claims: F-7
     `reporting.scheduled_reports` → DEFERRED-with-pointer to PHASE-053; F-9
     `platform.payouts` → DEFERRED-with-pointer to PHASE-052; the catalog
     status lines corrected in the same phase (a documented INCOMPLETE beats
     a fabricated pass).
2. **REPORT_CATALOG sync (EVAL §9c-9/10):** catalog rows for the 7 undocumented
   live contracts (`manufacturing.*` ×3, `services.*` ×2,
   `inventory.reorder-alerts`, `sales.daily-revenue`); count corrections —
   the registry goes 85 → 86 with the e-invoicing-log contract, the stale
   "80" header is fixed, and the catalog ↔ registry drift check goes green.
3. **Batch / serial / expiry screens (F-1) + adjustments screen (F-2):**
   - `/inventory/batches` — list + create + void over `item_batches` (the
     existing `inventory.batches.manage` permission).
   - `/inventory/serials` — the serial registry + per-serial movement history
     over a new `serial_movements` table (I-18 — `item_serials` today carries
     only status/sold_at, no movement log).
   - Expiry/shelf-life dashboard (I-17) + a **daily pg-boss alert job**
     (I-21 — the report exists, the automation does not) with a configurable
     lead-days SETTINGS_REGISTRY key (the 028/029 wave pattern).
   - `/inventory/adjustments` — the standalone screen (F-2) wrapping the
     existing count-variance posting path (BR-015).
4. **Extended import kinds (H-17):** the wizard/import-service pattern (the
   evaluation's verdict: "موجود ممتاز — 3 أنواع فقط") extended beyond
   PARTNERS/ITEMS/OPENING_BALANCES to: chart of accounts, account opening
   balances, fixed assets, employees, price lists, budgets — each kind keeps
   dry-run validation, row-level errors, and the Idempotency-Key discipline;
   per-kind authorization = the target module's existing manage permission.
5. **Master-data depth (AD-36-02/03/04):**
   - Item variants: `item_variants` (tenant; item; size/color axis values;
     variant-level unique SKU, barcode, price, ACTIVE) + variant-aware
     stock/price resolution — additive fallback: non-variant items resolve
     byte-identically to today.
   - Item image galleries: `item_images` (multi-image, sort,
     first-is-primary, stored via the existing `file_objects`).
   - Customer/supplier item cross-references: `item_cross_refs` (tenant;
     partner; item; their part code + barcode) — the substrate PHASE-041's
     supplier-catalog import writes into.
6. **Repo hygiene (EVAL §9c-14):** `.gitignore` entries for generated outputs
   (`packages/ui/dist-storybook`, `__image_snapshots__`,
   `.playwright-artifacts`) plus the one-time removal of the tracked copies —
   the "no generated outputs in the registry" convention restored.

Out of scope (explicit):

- **Custom fields (FD-18)** — PHASE-036 ships the engine; new screens only
  consume its archetype slots.
- **Print/label templates, watermarks, white-label (FD-21…FD-30)** —
  PHASE-038.
- **WMS bins/locations (I-01…I-09)** — PHASE-043 (consumes this phase's
  variant-aware stock).
- **MRP / net-needs / full ATP (H-03)** — PHASE-045.
- **Consignment/owner tracking (I-19), cycle-count scheduling (I-20)** —
  later waves.

## 3. Prerequisites

- **PHASE-036 COMPLETE** — the custom-fields/saved-views/bulk conventions the
  new screens adopt; migration 0049 landed, so this phase projects 0050/0051.
- **PHASE-006** — items/partners master data + the import wizard surface
  (`items.import_export`, permission `items.import`) the kinds extend.
- **PHASE-010** — `item_batches` / `item_serials` / `stock_moves` (the API
  the F-1 screens surface; the batch/serial keys are already granted).
- **PHASE-023** — `e_invoicing_submissions` (the 86th report's source).
- **PHASE-034** — the consolidation surfaces the nav row registers.
- **Binding decisions:** ADR-0002 (monorepo), ADR-0005 (tenant-owned RLS),
  ADR-0006 (identifiers), ADR-0008 (pg-boss — the expiry alert job),
  ADR-0009 (money precision — variant prices NUMERIC(19,4)), ADR-0011 (the
  Report Contract); the v3.0 register §O safeguards — nothing here posts.
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [REPORT_CATALOG.md](../../reporting/REPORT_CATALOG.md),
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) §1/§9,
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md) §9,
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md).

## 4. Design Impact

- **Database:** two additive migrations — `0050_master_data_depth.sql`
  (schema_version 50): the `items.import_export` plan-grant fix +
  `item_variants` + `item_images` + `item_cross_refs` (tenant-owned + RLS +
  UUIDv7 + hot indexes `(tenant, item)`, `(tenant, partner, item)`); and
  `0051_serial_tracking.sql` (schema_version 51): `serial_movements`
  (append-only by grants) + the expiry-alert lead-days SETTINGS seed (a
  SETTINGS wave ⇒ golden re-pin, see §6).
- **Feature keys (projection):** `items.variants`, `items.image_galleries`,
  `items.cross_references`, `inventory.serial_history`,
  `inventory.expiry_alerts`, `inventory.adjustments` — plan grants business +
  enterprise (tier-4 posture; FEATURE_DEPS + seed-drift convergence); the
  batch/serial screens activate already-granted keys.
- **Permissions (projection):** `items.variants.manage`,
  `items.galleries.manage`, `items.cross_refs.manage`,
  `inventory.adjustments.manage` (SoD-separated from counts) → 252 — drift
  re-pinned consciously, a named bump; `reports.tax.einvoice-log.read` moves
  from catalogued-but-unenforced to enforced.
- **API:** additive routes only — variants/galleries/cross-refs CRUD, serial
  movement history, batch void, adjustments, the report registration, and
  the import `kind` enum widening (old clients unaffected, the
  API_CONVENTIONS compatibility rule).
- **Web:** five screens (batches, serials + history, expiry dashboard,
  adjustments, variant/gallery/cross-ref tabs on the item card) + a nav item
  under group 4 المخزون; i18n +~150 keys (AR/EN parity, triple-parity rule).
- **Docs:** FEATURE_CATALOG (+6 keys → 188), ENTITY_CATALOG (+4 entities →
  208), REPORT_CATALOG (7 rows + 85→86 + header fix), NAVIGATION_MODEL,
  AUTHORIZATION_MATRIX (+4 → 252 — drift re-pinned), IMPLEMENTATION_STATUS /
  CHANGELOG, and the two decision records (F-7, F-9) under
  [../decisions/](../../decisions/README.md).

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T37-A | The one-line plan-grant migration: `items.import_export` → business + enterprise (H-18/F-5, the register footnote-¹ fix) | `apps/api/migrations/0050_master_data_depth.sql`, `meta/_journal.json` | migrations.spec journal 51 entries (with T37-F); seed-union drift test; nav resolution shows `/inventory/import` for a business tenant |
| T37-B | NAV_ITEMS registration for `reports.consolidated` (group 7 التقارير) + NAVIGATION_MODEL note | `apps/web/src/**/navigation.ts`, `docs/ui/NAVIGATION_MODEL.md` | nav snapshot + route-permissions row; non-template tenant sees القوائم الموحدة |
| T37-C | REPORT_CATALOG sync: 7 missing rows + count corrections 85→86 (§9c-9/10) | `docs/reporting/REPORT_CATALOG.md` | docs:validate; catalog ↔ registry drift check green |
| T37-D | `tax.e-invoicing-log` report contract (F-6) | `apps/api/src/modules/tax/reports/**`, `packages/contracts/src/tax/**` | report-contract suite; permission-enforced read; export byte-shape assertions |
| T37-E | Decision records F-7/F-9 (DEFERRED-with-pointer) + catalog status corrections | `docs/decisions/**`, catalog edits | docs:validate; the documented-claim ↔ code honesty sweep |
| T37-F | Batch/serial/expiry screens + `serial_movements` migration + daily expiry pg-boss job + adjustments screen | `apps/api/migrations/0051_serial_tracking.sql`, `apps/api/src/modules/inventory/**`, `apps/web/src/app/**/inventory/{batches,serials,expiry,adjustments}/**` | unit: a movement row appended per serial-bound stock_move; job fires inside lead-days; RLS battery picks up the new table |
| T37-G | Extended import kinds (COA, account opening balances, fixed assets, employees, price lists, budgets) | `apps/api/src/modules/{accounting,fixed_assets,payroll,items,budgeting}/**` import services | per-kind dry-run + row-error + idempotency tests |
| T37-H | Master-data depth: variants + galleries + cross-refs + variant-aware stock/price resolution | `apps/api/src/modules/items/**`, web item-card tabs | resolution-order tests (non-variant fallback byte-identical); unique SKU/barcode constraints |
| T37-I | Repo hygiene (.gitignore + tracked-output removal) + docs sync (catalogs, matrix, dictionary, nav, status, changelog) | `.gitignore`, `docs/**` | docs:validate green; CI visual baselines unaffected |

## 6. Verification

- Contracts suite green (variant/gallery/cross-ref/serial-movement DTOs + the
  e-invoicing-log report contract).
- API unit suite green (the existing baseline grows with the new specs).
- `migrations.spec.ts`: journal 51 entries, manifest consistency.
- Permissions drift: 252 = 252 (re-pinned consciously — a named bump).
- i18n parity ar=en (triple parity: TS types + runtime + CI script).
- Golden effective-configs: the expiry-alert lead-days SETTINGS key wave ⇒
  **all pins recomputed** with the old→new table recorded in agent-ctx.
- `docs:validate` green; REPORT_CATALOG counts updated (85→86, header
  corrected); no SHIPPED claim without code remains (F-7/F-9 filed).
- Browser smoke: a business tenant sees /inventory/import in the sidebar and
  imports a chart of accounts (dry-run → row errors → commit); القوائم
  الموحدة appears without a template; the e-invoicing log report renders
  with export; create → void a batch; open a serial's movement history; the
  expiry dashboard + alert job fire inside lead-days; run an adjustment;
  create a variant + cross-ref; the item card shows the gallery
  (first-is-primary).

## 7. Risks and Constraints

- **Variant-aware resolution touches pricing/stock hot paths** — the guard:
  non-variant items must resolve byte-identically (the golden pricing
  scenarios re-run unchanged); any order change is a defect, not a feature.
- **Serial history starts at cutover** — existing serials get one synthetic
  opening movement; documented honestly, never back-fabricated.
- **Import kinds carry data-quality risk into accounting** (COA, opening
  balances) — dry-run + per-row errors + an explicit commit step; opening
  balances respect period locks and the BR rules; nothing imports silently.
- **The .gitignore cleanup moves tracked artifacts** — one-time hygiene commit
  coordinated with CI caches and the visual-snapshot baselines.

## 8. Completion and Handoff

- Completion report `reports/PHASE-037-COMPLETION.md` with the verification
  table (suites, drift numbers, golden re-pin table, i18n count, browser
  evidence) + honest deferrals if any.
- Handoff obligations: `item_cross_refs` documented as PHASE-041's
  supplier-catalog target; variant-aware stock documented for 043/045; the
  activation ledger (F-1…F-9) recorded as closed or decision-recorded; the
  import kinds documented for onboarding runbooks.
- Next eligible: **PHASE-038** per the register's W1 wave (038 → 039 close
  the wave); 043's dependency pair (036 + 037) is satisfied but W3 waits on
  the wave order.
