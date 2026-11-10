# PHASE-055 — Asset Lifecycle & Maintenance: CMMS (دورة حياة الأصول والصيانة الوقائية)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W5, tier P3) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §9 (F-01…F-15) + §2 (H-15) ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE055.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-055
- **Title:** Asset Lifecycle & Maintenance: CMMS (دورة حياة الأصول والصيانة الوقائية)
- **Objective:** Close the **maintenance half of the fixed-assets story**. The
  external evaluation scored fixed assets 58% — strong on
  capitalization/depreciation/disposal (PHASE-026: goldens G-21…G-23, INV-023) but
  with the *care* layer entirely absent (H-15: "لا CMMS — صيانة الأصول غائبة").
  This phase delivers the **CMMS** on the existing register: **(1)** preventive
  maintenance plans (TIME/METER/USAGE triggers) generating work orders via pg-boss;
  **(2)** the work-order lifecycle with technicians, labor hours, and spare-parts
  consumption posted through the engine; **(3)** the asset-care registries —
  meters, tags/QR, transfers, insurance/license expiry ladders, parent/child
  components; **(4)** parallel tax-depreciation books (F-10); **(5)** partial
  disposal with proportional gain/loss. IFRS 16 (F-15) is **in scope only after
  its decision record** — otherwise a named candidate.
- **Business value:** fleet/equipment tenants (rental & logistics, manufacturing,
  healthcare) become runnable — the H-15 verdict "إدارة أسطول/معدات = غير مدعومة"
  is lifted; maintenance becomes a costed, scheduled, auditable operation; and tax
  depreciation removes the accountant's manual dual-book spreadsheet.
- **Tier / effort:** P3 · ~4 weeks single-stream (migration + contracts + api unit
  suite + web screens + docs + completion report).
- **Source gaps closed:** H-15, FULL §9 F-01…F-15 (the asset/care section —
  distinct from the *evaluation* file's screen-gap F-xx; cited as "FULL §9 F-xx").
  F-15 closes only if its decision record is written first; F-12 lands as
  query/grouping dimensions.

## 2. Scope

In scope:

1. **Maintenance plans (FULL §9 F-03 / H-15):** `maintenance_plans` — asset or
   asset-class scoped; trigger ∈ TIME (calendar) / METER (reading interval) / USAGE
   (hours); task template (AR/EN), priority, lead days, ACTIVE. A pg-boss job per
   plan computes next-due and generates the **maintenance work order** (an
   `asset_work_orders` row, origin PREVENTIVE).
2. **Work orders (F-02):** `asset_work_orders` — origin ∈ PREVENTIVE / CORRECTIVE /
   REQUEST; status machine REPORTED → PLANNED → IN_PROGRESS → DONE (+ CANCELLED,
   append-only events); assigned technician (tenant user now, enriched to
   PHASE-046 positions when HRIS ships — soft); `asset_work_order_lines` (LABOR
   hours · PART item+qty). **Spare-parts consumption posts through the posting
   engine** (inventory issue at moving-average cost) — golden **G-42 candidate**:
   DR `MAINTENANCE_EXPENSE` · CR `INVENTORY` per purpose map (fail-closed
   `PURPOSE_NOT_MAPPED`); labor is tracked, never auto-posted. Downtime linkage to
   PHASE-044 shop-floor events (soft — the field lands now, 044 fills it later).
3. **Spare parts & asset BOM (F-04 / F-13):** `asset_components` — parent/child
   asset tracking (a component may itself be a capitalized asset or item-backed
   spare); spare-parts linkage + min-stock alerts feeding the PHASE-045 MRP
   reorder inputs when it ships (no hard dependency).
4. **Meters (F-05):** `asset_meter_readings` — kind ∈ ODOMETER / HOURS / KWH /
   PRODUCTION_COUNT; value + read_at + source; per-meter monotonicity CHECK;
   interval deltas drive METER/USAGE plan generation.
5. **Tags (F-06):** additive `assets.asset_tag` (unique per tenant) + barcode/QR
   label print via the **PHASE-038 label-template engine** (falls back to the base
   print pipeline if 038 has not shipped) + scan-to-asset lookup
   (`GET /api/v1/fixed-assets/lookup?code=…`).
6. **Transfers (F-07):** `asset_transfers` between branches/cost centers with the
   accounting relocation posting when cross-branch books require it — golden
   **G-43 candidate** — under the **depreciation-continuity invariant**: a transfer
   never restarts, gaps, or alters depreciation; accumulated and NBV carry
   unchanged, the next run dimensions the new cost center.
7. **Insurance/license/warranty registry (F-08 / F-09):** `asset_compliance_docs`
   (kind, number, issuer, issued/expiry, attachments) + expiry-ladder alerts on
   the **30/14/7** day pattern (the repo's ladder convention).
8. **Tax depreciation (F-10):** parallel books — `asset_tax_books` (jurisdiction,
   method, rate, life, basis; the PHASE-047 statutory-rule registry pattern,
   additive either way) computed by its own period job into
   `asset_tax_depreciation_entries`, **reported alongside book depreciation but
   never auto-posted** (reports both; any book/tax delta journal is a named
   candidate behind a decision record — the frozen-core discipline).
9. **History & grouping (F-11 / F-12):** the full asset event timeline (work
   orders, readings, transfers, compliance docs, runs, disposals — the PHASE-036
   record-timeline over `audit_events`; degrades to the raw audit feed if 036 is
   re-ordered) + grouping by class/location/cost center (query + report dimensions
   + tenant-defined `asset_groups`).
10. **Partial disposal (F-14):** additive disposal-fraction support — proportional
    cost/accumulated split (cost × f, accumulated × f), proportional gain/loss,
    residual asset continues depreciating (residual NBV = NBV × (1−f) exactly).
    Golden **G-44 candidate** (extends the G-23 loss-mirror discipline).
11. **IFRS 16 leases (F-15) — decision-gated:** lease accounting (ROU asset +
    lease-liability schedules) is new accounting surface — **in scope only after
    its decision record**; until then a named candidate. Nothing in 1–10 depends
    on it.
- **Web:** a maintenance console (plans board + work-orders kanban by
  technician/asset/status) and an **asset 360 workspace** (timeline · meters ·
  components · compliance docs · full cost history).

Out of scope (explicit):

- **IFRS 16 implementation** — candidate behind its decision record (item 11).
- **Condition-based/predictive maintenance (ML)** — the PHASE-058 proposal family
  (DF-30 adjacency), decision-gated with it.
- **Any change to the *book* side** — book depreciation (G-22) and disposal (G-23)
  shapes are frozen; partial disposal is additive and extends, never rewrites.
- **Calibration/QMS integration (054)** — soft reference only.

## 3. Prerequisites

- **PHASE-026 COMPLETE** (fixed assets: register, categories, runs, disposal,
  INV-023, goldens G-21…G-23, BR-041…043). **No program-phase dependencies**
  (register §1: deps —): 055 may execute in any wave order. **pg-boss** (shipped)
  is the preventive-generation scheduler.
- **Soft forward references (no hard deps):** 036 record-timeline, 038 label
  templates, 044 downtime events, 045 MRP, 046 positions, 047 statutory-rule
  pattern — each degrades gracefully and converges when its phase ships.
- **Binding decisions:** ADR-0009 (money precision — meter/hour values NUMERIC,
  maintenance expense NUMERIC(19,4)), the frozen-core + additive-only rules (the
  v2.0 register §O safeguards, restated by the v3.0 register §3), the
  posting-engine monopoly (INV-013; manual maintenance journals rejected).
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) (§7 extension pattern),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) §9,
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md).

## 4. Design Impact

- **Database:** one additive migration `0075_asset_cmms.sql` (schema_version 75 —
  the sequential program projection; journal re-anchored at execution):
  `maintenance_plans`, `asset_work_orders`, `asset_work_order_lines`,
  `asset_components`, `asset_meter_readings`, `asset_transfers`,
  `asset_compliance_docs`, `asset_tax_books`, `asset_tax_depreciation_entries`,
  `asset_groups` (+ `assets.asset_tag`, `assets.asset_group_id` additive columns)
  — tenant-owned + RLS macro + UUIDv7 + append-only grants; CHECK invariants
  (meter monotonicity per (asset, kind); status transitions; fraction ∈ (0,1)).
- **New invariants (candidates, numbered at execution past INV-027):** depreciation
  continuity (extends INV-023), proportional partial-disposal math (Σ fractions ≤
  1; residual NBV = NBV × (1−f) exactly), meter monotonicity.
- **Goldens:** the program continues the **G-33+ sequence** (G-01…G-32 exist
  through PHASE-034; the 036–054 waves project G-33…G-41). **055 projects G-42**
  (maintenance work-order completion posting) **if it posts**, plus G-43
  (relocation posting) and G-44 (partial disposal) as candidates — numbers pinned
  at execution against the JOURNAL_RULES ledger + ACCOUNTING_TESTS mirror with
  mandatory failure packs.
- **Feature keys (projection):** `fixed_assets.maintenance`,
  `fixed_assets.work_orders`, `fixed_assets.meters`, `fixed_assets.transfers`,
  `fixed_assets.compliance_registry`, `fixed_assets.tax_depreciation`,
  `fixed_assets.tagging` — **+7 keys** (the program projects +4–12/phase; 176 keys
  today, 182 after 036, running total re-anchored at execution per the drift
  battery). Plan grants: business + enterprise (tier-4 posture).
- **Permissions (projection):** `fixed_assets.maintenance.manage`,
  `fixed_assets.workorders.manage`, `fixed_assets.meters.record`,
  `fixed_assets.transfers.execute` (risky — relocation posting),
  `fixed_assets.compliance.manage`, `fixed_assets.taxbooks.manage` — **+6 keys**
  (band +4–10/phase; baseline 245 today, 248 after 036, running total re-anchored
  at execution) → the drift check is **re-pinned consciously — a named bump**,
  recorded in the completion report.
- **API:** additive routes only (plans, work orders + transitions, readings,
  transfers, compliance docs, tax books + dual report, lookup, the 360 aggregate
  read); the asset detail payload gains an optional-additive `maintenance`
  summary block (API_CONVENTIONS compatibility rule).
- **Web:** maintenance console + asset 360 workspace + transfer/compliance/tax-book
  screens; i18n +~150 keys (AR/EN parity from day one, the triple-parity rule).
- **Docs:** FEATURE_CATALOG (+7), ENTITY_CATALOG (+~10 entities), DATA_DICTIONARY
  (trigger/meter/origin enums), JOURNAL_RULES (G-42…G-44 rows), REPORT_CATALOG
  (maintenance cost by asset; dual book/tax report), NAVIGATION_MODEL §9,
  AUTHORIZATION_MATRIX (+6), IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T55-A | Migration 0075: 10 tables + additive asset columns + RLS + grants + CHECK invariants | `apps/api/migrations/0075_asset_cmms.sql`, `meta/_journal.json` | migrations.spec journal 75 entries (projection); RLS battery picks up the new tables |
| T55-B | Contracts: plan/work-order/reading/transfer/compliance/tax-book DTOs + status machine + fraction/monotonicity validation | `packages/contracts/src/fixed-assets/maintenance.ts` (+ index exports) | contracts suite (57+ baseline grows) |
| T55-C | Plans service + pg-boss generator (TIME/METER/USAGE triggers; next-due; idempotent generation) | `apps/api/src/modules/fixed_assets/**` | unit: meter-delta + calendar triggers; no duplicate generation on re-run |
| T55-D | Work-order lifecycle + labor/parts lines + spare-parts posting through the engine (G-42) + downtime-link field | `apps/api/src/modules/fixed_assets/**` + engine registration | golden G-42 (expected lines + inventory leg at moving-average cost); manual-journal rejection |
| T55-E | Meters, tags/lookup, components, compliance docs + 30/14/7 ladder, transfers + relocation posting (G-43) + continuity guard | `apps/api/src/modules/fixed_assets/**` | unit: regressed readings rejected; transfer leaves NBV byte-identical; ladder fires 30/14/7 |
| T55-F | Tax books + period job + dual report; partial disposal (proportional split + G-44 fixture) | `apps/api/src/modules/fixed_assets/**`, reporting | unit: book side untouched (G-22/G-23 re-run green); proportional math property test |
| T55-G | Web: maintenance console + asset 360 workspace + transfer/compliance/tax-book screens + tag print dialog | `apps/web/**`, `packages/ui/**` | web typecheck; browser smoke of the full loop |
| T55-H | Docs sync: catalogs, matrix, dictionary, journal rules, report catalog, nav, status, changelog | `docs/**` | `docs:validate` green (validator v3.0 ranges 001–058) |

## 6. Verification

- Contracts suite green (new DTOs + status machine + fraction/monotonicity checks).
- API unit suite green (the 479+ baseline grows with the maintenance specs).
- `migrations.spec.ts`: journal 75 entries (the sequential program projection,
  re-anchored at execution), manifest consistency.
- Permissions drift: N = N after **+6 keys — re-pinned consciously, a named bump**
  (recorded; program band +4–10/phase).
- i18n parity ar=en (triple parity: TS types + runtime + CI script).
- **Goldens:** G-42 + G-43 + G-44 land in JOURNAL_RULES/ACCOUNTING_TESTS with
  failure packs; the frozen book side proven unchanged (G-21…G-23 fixtures re-run
  green — additive-only evidence).
- Golden effective-configs: this phase ships **SETTINGS keys** (maintenance
  policy: tolerances, ladder days, open-WO digest) ⇒ **all pins recomputed** with
  the old→new table recorded in agent-ctx (the §18 lesson-5 relay).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: create a meter-triggered plan on a vehicle asset; record readings
  until the delta fires a preventive work order; assign a technician; log labor +
  consume a spare part; complete → see the G-42 journal + 360 timeline entry;
  transfer the asset between branches and confirm depreciation continues
  unbroken; register an insurance doc and see the 30/14/7 ladder; run the dual
  book/tax report; dispose 25% of an asset and check the proportional gain/loss +
  residual NBV; print a QR tag and scan-lookup the asset.

## 7. Risks and Constraints

- **Posting-surface discipline:** maintenance is the first *operational* module
  that consumes inventory through the engine — the G-42 golden + INV-013
  idempotency gate are the guard; no bypass path ships.
- **Trigger correctness:** generators must be idempotent (re-run safe) and never
  back-date work orders into closed periods — the period-close guard (PC-04
  pattern) applies.
- **Tax books vs frozen core:** the parallel computation never touches book
  journals; the dual report is the honest surface (the delta-journal candidate is
  recorded, not built).
- **Soft-dependency fan-in:** six forward references (036/038/044/045/046/047) are
  field/render references, never schema dependencies; the completion report lists
  which had shipped at execution time.

## 8. Completion and Handoff

- Completion report `reports/PHASE-055-COMPLETION.md` with the verification table
  (suites, drift numbers, golden table G-42…G-44, SETTINGS re-pin table, i18n
  count, browser evidence, honest deferrals — IFRS 16 remains a candidate unless
  its DR was written and ordered).
- Handoff obligations: the work-order pattern (status machine + engine-consumed
  parts) is documented as the mandated pattern for later operational modules;
  meter readings feed the PHASE-045 MRP reorder inputs (interface contract
  recorded); the 360 timeline contract is documented for reuse.
- Next eligible: the W5 remainder per the register's wave table (049/054 if not
  yet shipped, then 057 after 052+053); **058 stays decision-gated** — it requires
  its ADR first and is never auto-scheduled.
