# PHASE-045 — Manufacturing II: MRP & Planning (التصنيع ٢: تخطيط احتياجات المواد)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W3, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §7 (M-01, M-05…M-11, M-14, M-21, M-22, M-24) + §2 (H-03)
> + §4 (S-10) · **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE045.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-045
- **Title:** Manufacturing II — MRP & Planning (التصنيع ٢: تخطيط احتياجات المواد)
- **Objective:** Close the single gap the external report says "alone ejects the
  system from manufacturing-ERP standing" (H-03). Today `reorder-service.ts` emits
  an under-minimum alert — no net-requirements computation, no BOM explosion, no
  order generation, no horizon. This phase delivers the **MRP engine** (net
  requirements exploded through multi-level BOMs with low-level coding, lead-time
  offsetting, expiry-aware netting); **planned orders** (purchase/production/
  transfer) convertible to real documents in one action; **MPS** with time-fenced
  zones; **full ATP** with capable-to-promise-lite (closing S-10); **phantom BOMs**,
  **alternative materials**, **by/co-products**, **rework orders**, the **MTO
  link**, **contract manufacturing**, and **min/max + reorder-point replenishment**
  feeding planned POs.
- **Business value:** the planner stops maintaining Excel: demand, supply, safety
  stock and reservations net into one bucket grid with exception messages; buyers
  and production get convertible orders instead of emails. ATP at order entry
  (S-10) stops sales from promising what the factory cannot ship.
- **Tier / effort:** P2 · ~6 weeks single-stream (1 migration + contracts + api unit
  suite + planning web screens + docs).
- **Source gaps closed:** H-03, M-01, M-05, M-06, M-07, M-08, M-09, M-10, M-11,
  M-14, M-21, M-22, M-24, S-10 (the register §1 row exactly). M-12 and M-20 remain
  unclaimed (recorded under 044's out-of-scope); nothing here duplicates 044's
  closures.

## 2. Scope

In scope:

1. **MRP engine (H-03/M-01):** net requirements = gross demand (sales orders +
   forecasts + MPS) + safety stock − on-hand − on-order (open POs + WIP) −
   reservations, exploded through **multi-level BOMs** (M-07) using low-level
   coding, level-by-level netting with lead-time offsetting (044's bill of
   resources supplies routing lead times). Planning buckets (day/week) + horizon as
   tenant config; expiry-aware netting (M-10) — supply past its expiry date
   (`has_expiry`/`shelf_life_days`) never nets as available. Runs execute as
   pg-boss jobs over an immutable **run snapshot** — plans are reproducible, never
   live-mutated.
2. **Planned orders:** output = planned purchase orders + planned production
   orders + planned transfers, each with due/launch dates from offsetting;
   **convertible to real documents in one action** through the existing
   document chains (with 039 approval routing — a planned order never bypasses
   approvals by virtue of being planned).
3. **MPS (M-05):** master production schedule — forecast + actual demand merge,
   time-fenced zones (frozen / slushy / open) with fence violations surfaced as
   exceptions, not silently absorbed.
4. **Full ATP (M-06/S-10):** ATP = on-hand + supply side (PO due dates, planned
   orders, production WIP) − demand side (SO lines, reservations), exposed at
   sales-order entry; capable-to-promise-lite uses 044's routing lead time —
   honestly labeled *lite* (no full finite-capacity promise; the 044 scheduler
   remains the binding capacity view).
5. **Phantom BOM (M-08):** phantom flag on BOM lines → explode-through in MRP and
   picking; phantom items never carry stock (a contracts check enforces zero
   on-hand for phantoms).
6. **Alternative materials (M-09):** alternative components with priority +
   substitution in shortage — MRP falls back when the primary is short, and the
   substitution chosen is **recorded on the planned/production order** (audited,
   never silent).
7. **By-products / co-products (M-11):** co/by-product BOM lines (negative qty /
   revenue share) → receipt of by-products into stock with cost allocation.
   **Golden candidate** (see §4 — numbering pinned at delivery).
8. **Rework orders (M-14):** a rework production-order type consuming 042's RMA
   disposition output (returned goods → rework routing → back to stock or scrap).
9. **MTO link (M-22):** production order ← sales-order-line linkage
   (make-to-order) with reservation of the produced qty against that line.
10. **Contract manufacturing (M-21):** subcontracted routing operations →
    PO to the subcontractor + service receipt against it; subcontract cost
    absorbs into the production order's WIP. **Golden candidate** (§4).
11. **Replenishment (M-24):** min/max + reorder-point methods for non-BOM items
    feeding planned POs — the existing reorder alerts generalize into MRP
    exception lines (the alert stays as a notification, the *order suggestion*
    becomes a planned order).
12. **Web:** MRP run screen (bucket grid + exception messages), planned-orders
    workbench (convert / dispose with reasons), MPS editor, ATP inquiry (embedded
    at order entry too).

Out of scope (explicit):

- **Any new GL posting from planning itself** — planned orders, MPS entries,
  forecasts and ATP inquiries post nothing (the budgeting precedent,
  JOURNAL_RULES §7 note 1). Only the two named golden candidates (by/co-product
  receipt, subcontract absorption) touch the engine; INV discipline intact.
- **Full finite-capacity CTP** — 044's scheduler is the capacity truth;
  CTP-lite is lead-time math, labeled as such.
- **Forecasting ML (DF-29/DF-30)** — forecasts are operator-entered records
  here; statistical forecasting is a decision-gated candidate for a later wave.
- **Frozen-core rule** — no valuation, tax or posting-shape changes; conversions
  create ordinary documents that walk the ordinary approve/post chains.

## 3. Prerequisites

- **PHASE-044 COMPLETE** — routings/operations supply lead times and the
  bill-of-resources composite read; work centers + tickets supply WIP supply-side
  data; the quality-gate hook blocks completions MRP counts as supply only after
  gate pass.
- **PHASE-043 COMPLETE** — bin/warehouse on-hand truth, `stock_reservations`
  (extended by 043's auto-policy) as the demand-side input, in-transit supply.
- **PHASE-039** (W1) — approval routing for converted documents.
- **PHASE-042** (W2, ordering assumption) — RMA disposition output that rework
  orders consume; if 042 has not executed, rework lands behind its feature key
  disabled and the report says so.
- **PHASE-013 patterns** — the pg-boss job path and report-contract registry the
  run screens reuse.
- **Binding decisions:** ADR-0002 (monorepo), ADR-0007 (posting engine — the two
  golden candidates go through registered purposes only), ADR-0009 (quantities
  NUMERIC(19,6)/decimal.js — netting math is decimal end-to-end, never float),
  ADR-0008 (jobs), the register §O safeguards.
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) §14,
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) §7 (candidates + note 1
  precedent), [REPORT_CATALOG.md](../../reporting/REPORT_CATALOG.md) (exception/
  ATP contracts), [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md).

## 4. Design Impact

- **Database:** one additive migration `0063_mrp_planning.sql`
  (schema_version 63): `demand_forecasts`, `mps_entries` (time-fence config),
  `planned_orders` (+ dispose reasons), `mrp_runs` (immutable snapshot +
  exception log), ATP read-model, additive BOM-line columns (phantom flag,
  alternative group + priority, co/by-product markers with negative qty), and
  replenishment policy rows (min/max/reorder-point per item × warehouse) —
  tenant-owned + RLS macro + UUIDv7 per convention.
- **Goldens — an honest ledger:** MRP itself introduces **no golden** (planning
  never posts — the budgeting precedent, JOURNAL_RULES §7 note 1). Two posting
  candidates are recorded: **by/co-product receipt with cost allocation** and
  **subcontract absorption**. The wave reserves G-35 (047 statutory accrual) and
  G-36 (048 project WIP) per the register's parallel-stream plan, so these two
  candidates take the next free numbers at delivery — G-37/G-38 if gated into
  this phase as decision records order; JOURNAL_RULES §7 stays the single binding
  registry and re-pins.
- **Feature keys (projection):** eight `manufacturing.*` keys —
  `manufacturing.mrp`, `manufacturing.planned_orders`, `manufacturing.mps`,
  `manufacturing.atp`, `manufacturing.coproducts`, `manufacturing.rework`,
  `manufacturing.subcontracting`, `manufacturing.replenishment`. Catalog ≈248
  after 044; +8 here → **≈256** (re-pinned at execution).
- **Permissions (projection):** `manufacturing.mrp.run`,
  `manufacturing.planned_orders.convert`, `manufacturing.mps.manage`,
  `manufacturing.atp.view`, `manufacturing.subcontracting.manage`,
  `manufacturing.coproducts.manage` (+6). Matrix ≈305 after 044 → **≈311** —
  re-pinned consciously, a named bump.
- **API:** additive routes (run/inspect/dispose, planned-order convert, MPS CRUD,
  ATP inquiry); the sales-order entry payload gains an optional ATP block.
- **Web:** planning workbench screens; i18n +~120 keys (AR/EN parity from day
  one).
- **Docs:** FEATURE_CATALOG (+8), ENTITY_CATALOG (+~7 entities — re-pinned),
  DATA_DICTIONARY (planning enums), NAVIGATION_MODEL (planning items),
  AUTHORIZATION_MATRIX (+6 — drift re-pinned), JOURNAL_RULES §7 (candidate rows
  only if decision-gated in), REPORT_CATALOG (+2 contracts),
  IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T45-A | Migration 0063: forecasts, MPS, planned orders, run snapshots, BOM additive columns, replenishment policies | `apps/api/migrations/0063_mrp_planning.sql`, `meta/_journal.json` | journal 63 entries; RLS battery |
| T45-B | Contracts: run/planned-order/MPS/ATP DTOs + phantom zero-stock check + no-posting forbidden-surface test | `packages/contracts/src/manufacturing/planning.ts` | contracts suite |
| T45-C | Low-level coding + BOM explosion service (multi-level, cycle-detection) | `apps/api/src/modules/manufacturing/**` | unit: cycle fails closed; levels computed correctly |
| T45-D | MRP netting engine (buckets, offsetting, expiry-aware, reservations) + pg-boss run + snapshot | `apps/api/src/modules/manufacturing/**` | unit: net math decimal; snapshot immutable; exceptions emitted |
| T45-E | Planned orders: generation, workbench dispose reasons, one-action conversion via existing chains (039 routing) | `apps/api/src/modules/manufacturing/**` + `{purchasing,inventory}/**` hooks | unit: conversion creates DRAFT docs; approvals respected |
| T45-F | MPS editor + time fences; ATP inquiry + CTP-lite (routing lead time) + order-entry embedding | `apps/api/src/modules/manufacturing/**` + `apps/api/src/modules/sales/**` (read hook) | unit: fence violations become exceptions; ATP = supply − demand |
| T45-G | Phantom explosion + alternative substitution (audited) + by/co-product BOM semantics | `apps/api/src/modules/manufacturing/**` | unit: phantom never stocks; substitution recorded on order |
| T45-H | Rework order type (042 disposition consume) + MTO linkage + replenishment methods | `apps/api/src/modules/manufacturing/**` | unit: rework consumes RMA lot; MTO reserves produced qty |
| T45-I | Contract manufacturing: subcontract operation → PO + service receipt + WIP absorption (golden candidate if gated) | `apps/api/src/modules/manufacturing/**` + `apps/api/src/modules/purchasing/**` | unit: subcontract cost lands in WIP; engine purposes only |
| T45-J | Web: MRP run screen, planned-orders workbench, MPS editor, ATP inquiry + docs sync | `apps/web/**`, `docs/**` | web typecheck; browser smoke (§6); `docs:validate` |

## 6. Verification

- Contracts suite green (new DTOs + the planning-never-posts forbidden-surface
  test — planned orders/MPS/forecasts cannot appear in posting payloads).
- API unit suite green (the MRP engine's specs are the phase's center of mass).
- `migrations.spec.ts`: journal **63** entries, manifest consistency.
- Permissions drift: ≈311 = ≈311 (re-pinned consciously — a named bump, recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the planning-horizon/bucket SETTINGS wave ⇒ pins
  recomputed via the composeTenantStaticConfig pattern, old→new table in
  agent-ctx.
- **Golden postings re-pin discipline:** if the by/co-product and subcontract
  candidates are decision-gated in, they land in JOURNAL_RULES §7 +
  ACCOUNTING_TESTS §3 with mandatory failure packs and the golden
  effective-configs regenerate (the composeTenantStaticConfig script pattern);
  if gated out, the deferral is recorded in the completion report — either way
  the ledger of candidates stays honest.
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: enter a forecast + an open sales order, run MRP over a two-level
  BOM, see netted bucket rows and exception messages, convert a planned PO and a
  planned production order through their approval chains, query ATP for an item
  short on-hand and watch CTP-lite quote a routing-lead-time date, explode a
  phantom line through picking, and substitute a short component with the
  substitution recorded on the order.

## 7. Risks and Constraints

- **Explosion performance:** multi-level netting over wide BOMs is the hot path —
  low-level coding + snapshot runs + pg-boss (never in-request) are the guard;
  tenants with cyclic BOM data get a fail-closed validation, not a hang.
- **Data quality honesty:** MRP amplifies bad BOM/lead-time data into confident-
  looking nonsense; exception messages (BOM missing, no lead time, expired
  supply) are first-class output, never swallowed.
- **Planning/ledger boundary:** the no-posting rule is machine-checked (§6);
  any future "planned orders should reserve GL" idea requires a decision record.
- **CTP over-promise:** CTP-lite is lead-time math without capacity checks — the
  UI labels it as an estimate and links the 044 schedule board for the truth.
- **Substitution audit:** choosing alternatives changes cost; the recorded
  substitution on the order is the audit trail (never a silent swap).

## 8. Completion and Handoff

- Completion report `reports/PHASE-045-COMPLETION.md` with the verification table
  (suites, drift numbers, snapshot/immutability evidence, i18n count, browser
  evidence) + the golden-candidates ledger (gated in with numbers, or deferred
  with the decision record).
- Handoff obligations: the ATP read contract is documented for sales (040-family
  surfaces embed it); the planned-order conversion contract for purchasing; the
  run-snapshot format for 053 BI consumption; rework linkage documented against
  042's disposition.
- Next eligible: no later phase hard-depends on 045 (register §1) — the owner
  may order the parallel W3 stream (**046 → 047 → 048**) or W4 phases whose
  dependencies are met (051 after 038; 052 after 039); the W3 gate re-score
  ("a factory and a 100-employee company can run on it") becomes checkable once
  the 046–048 stream also lands.
