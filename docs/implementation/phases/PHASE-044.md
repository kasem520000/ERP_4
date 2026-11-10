# PHASE-044 — Manufacturing I: Routing, Work Centers & Shop Floor (التصنيع ١: مسارات التشغيل ومراكز العمل)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W3, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §7 (M-02…M-04, M-13, M-15…M-19, M-23, M-25) + §2 (H-04)
> · **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE044.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-044
- **Title:** Manufacturing I — Routing, Work Centers & Shop Floor
  (التصنيع ١: مسارات التشغيل ومراكز العمل)
- **Objective:** Turn the production order from *"consume materials → emit finished
  goods"* (the external report's H-04 verdict on `production_orders`) into a
  **staged, timed, costed process**. This phase delivers **(1)** versioned routings
  with operations (setup/run/queue/move times) attached to items/BOMs; **(2)** work
  centers with capacity, calendars and labor/machine/overhead rates linked to cost
  centers for absorption; **(3)** finite-capacity scheduling *lite* with a Gantt-style
  board; **(4)** shop-floor control — the operation ticket lifecycle with operator
  identification, scan station input, quantity/scrap/downtime capture; **(5)** actual
  operation costing rolled into production-order WIP; **(6)** standard costs +
  variance reporting (PPV, labor efficiency, overhead absorption); **(7)** yield
  variance, downtime and OEE metrics; **(8)** quality gates on routing operations;
  **(9)** the bill-of-resources composite read that 045's MRP consumes.
- **Business value:** the manufacturing axis — scored 38%, the weakest core module —
  gains the minimum a real factory runs on: know the route, book the time, cost the
  hour, see the board, catch the variance. Without it MRP (045) has no lead times
  and QMS (054) has no gates.
- **Tier / effort:** P2 · ~6 weeks single-stream (2 migrations + contracts + api unit
  suite + web screens + docs).
- **Source gaps closed:** H-04, M-02, M-03, M-04, M-13, M-15, M-16, M-17, M-18,
  M-19, M-23, M-25 (the register §1 row exactly). M-01/M-05…M-11/M-14/M-21/M-22/M-24
  belong to **PHASE-045**; M-12 (statistical scrap) and M-20 (landed cost in
  manufacturing) stay unclaimed — recorded honestly.

## 2. Scope

In scope:

1. **Routing (H-04/M-02):** `routings` + `routing_operations` (sequence, operation
   name AR/EN, work-center ref, setup time, run time per unit, queue/move times) —
   **versioned** (draft → active → retired, the BOM versioning precedent), attached
   to items/BOMs; a production order snapshots the routing version it executes
   (never re-resolves mid-flight).
2. **Work centers (M-03):** `work_centers` (code/name AR-EN, cost-center link for
   absorption, capacity per shift, hourly rates labor/machine/overhead as
   NUMERIC(19,4), utilization target, ACTIVE status). Asset linkage (which machine)
   lands with **055 CMMS** — here only a nullable asset ref hook.
3. **Finite-capacity scheduling lite (M-04):** forward scheduling of production
   orders across operations against work-center calendars + shift patterns —
   **from 046's roster if shipped, else static per-work-center calendars** (the
   phase's own fallback, recorded honestly; the register dependency remains
   043 only). A Gantt-style **schedule board read-model** (drag-rescheduling
   optional; if it slips, the board is read-only and says so).
4. **Shop-floor control (M-17):** operation ticket lifecycle
   QUEUED→STARTED→PAUSED→COMPLETED with operator identification (employee ref),
   barcode station input (scan the job card — an input field, no device claim),
   quantity good/scrap + downtime reason per ticket. Tickets drive
   `production_consumptions` timing, not their amounts.
5. **Actual operation costing (M-18):** labor/machine hours captured per ticket ×
   work-center rates → actual operation cost rolled into the production order's WIP
   (the existing G-17 completion posting extended with an operation-cost line).
   **Golden candidate G-34:** actual-vs-standard operation variance posting (§4).
6. **Standard costs & variances (M-19):** `standard_costs` per item (material/
   labor/overhead components, effective-dated) + variance reports — PPV, labor
   efficiency, overhead absorption — as **new report contracts** in the 013
   registry. Standard costs are a parallel planning layer: the ledger keeps
   WAC/FIFO truth (INV-017); variances post to variance accounts only.
7. **Yield variance (M-13) + downtime (M-15) + OEE (M-16):** downtime events per
   work center with reason codes → OEE metrics (availability × performance ×
   quality) on a dashboard read-model; yield variance = planned-vs-actual output
   per operation feeding the variance reports above.
8. **Quality gates (M-23):** inspection checkpoints attached to routing operations —
   pass/fail **blocks operation completion** (fail routes to scrap/rework decision).
   Full QMS (NCR/CAPA/SPC…) is **054**; here only the gate hook on the existing
   `inspections` pass/fail.
9. **Bill of resources (M-25):** the routing + BOM composite read (operations ×
   materials × rates with lead-time offsets) consumed by 045's MRP — a read-model
   contract, not a new table.
10. **Web:** routings manager, work centers manager, schedule board, shop-floor
    station screen (touch, the 043 work-screen pattern), costing variance reports.

Out of scope (explicit):

- **MRP/MPS/ATP and planning** (M-01, M-05…M-11, M-14, M-21, M-22, M-24) —
  PHASE-045, per the register.
- **Full QMS** (Q-01…Q-12) — PHASE-054; this phase ships only the operation gate.
- **Asset/maintenance linkage** — PHASE-055 CMMS (F-01…F-15).
- **Statistical scrap treatment (M-12) and manufacturing landed cost (M-20)** —
  unclaimed by the register; decision-gated follow-ups, recorded honestly.
- **Any posting-engine rewrite** — G-34 extends the production canon (G-17/G-18)
  through the engine with new fail-closed purpose maps; the frozen-core rule and
  ADR-0007 hold.

## 3. Prerequisites

- **PHASE-043 COMPLETE** — bin-level putaway/pick for materials and FG; the
  touch work-screen pattern the station screen reuses; the scan-input-field
  convention (no device fabrication).
- **PHASE-018 base** (shipped) — `bills_of_materials`/`bom_lines`,
  `production_orders`, WIP (G-17/G-18), `production_consumptions`,
  `production_scraps`, `inspections`: this phase **extends** that canon, it does
  not replace it.
- **PHASE-039** (W1) — approval chains for variance/scrap thresholds where tenants
  configure them; the rules engine is not required here.
- **PHASE-046 soft** — shift patterns/rosters for the scheduler; absent 046, static
  work-center calendars ship (the fallback above).
- **Binding decisions:** ADR-0002 (monorepo), ADR-0007 (posting engine — every new
  posting goes through registered purposes, fail-closed `PURPOSE_NOT_MAPPED`),
  ADR-0009 (rates/hours NUMERIC(19,4), decimal.js math, never float), ADR-0011
  (report contracts for the variance reports).
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) §14
  (manufacturing module rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) §7 (G-34 candidate),
  [REPORT_CATALOG.md](../../reporting/REPORT_CATALOG.md) (variance contracts),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) (manufacturing items),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md).

## 4. Design Impact

- **Database:** two additive migrations — `0061_manufacturing_routing.sql`
  (schema_version 61: `routings`, `routing_operations`, `work_centers`,
  `work_center_calendars`, `standard_costs`) and `0062_shop_floor.sql` (62:
  `operation_tickets`, `downtime_events` + reason codes, quality-gate columns on
  routing_operations, the schedule-board and OEE read-models) — tenant-owned +
  RLS macro + UUIDv7 per convention; production orders gain additive
  `routing_id`/routing-version snapshot columns.
- **New golden (G-34 candidate):** *actual operation cost & variance* — ticket
  hours × rates roll into WIP through the engine; on completion, actual-vs-standard
  operation variance posts to `LABOR_EFFICIENCY_VAR`/`OVERHEAD_ABSORPTION_VAR`
  purposes (fail-closed maps per CHART_OF_ACCOUNTS §2) while G-17's material
  shape is unchanged. Failure pack: hours captured without a rate → run refuses
  (never a zero-cost guess).
- **Feature keys (projection):** ten `manufacturing.*` keys —
  `manufacturing.routings`, `manufacturing.work_centers`,
  `manufacturing.scheduling`, `manufacturing.shop_floor`,
  `manufacturing.operation_costing`, `manufacturing.standard_costs`,
  `manufacturing.variance_reports`, `manufacturing.oee`,
  `manufacturing.quality_gates`, `manufacturing.bill_of_resources`. Catalog
  ≈238 after 043; +10 here → **≈248** (re-pinned at execution).
- **Permissions (projection):** `manufacturing.routings.manage`,
  `manufacturing.work_centers.manage`, `manufacturing.schedule.manage`,
  `manufacturing.shopfloor.execute`, `manufacturing.tickets.post`,
  `manufacturing.downtime.record`, `manufacturing.costing.read` (exists — extended),
  `manufacturing.variance_reports.view`, `manufacturing.oee.view`,
  `manufacturing.quality_gates.manage`. Matrix ≈295 after 043; +10 here →
  **≈305** — re-pinned consciously, a named bump.
- **API:** additive routes (routings/work-centers CRUD, schedule board read,
  ticket lifecycle station endpoints, OEE reads); existing production payloads
  gain optional routing/ticket fields.
- **Web:** new archetypes reuse (manager lists, board, station screen); i18n
  +~140 keys (AR/EN parity from day one).
- **Docs:** FEATURE_CATALOG (+10), ENTITY_CATALOG (+~9 entities — re-pinned),
  DATA_DICTIONARY (ticket/downtime enums), NAVIGATION_MODEL (التصنيع items in the
  inventory group surface), AUTHORIZATION_MATRIX (+10 — drift re-pinned),
  JOURNAL_RULES §7 (G-34), REPORT_CATALOG (+3 variance/OEE contracts),
  IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T44-A | Migration 0061: routings, routing_operations, work centers, calendars, standard costs | `apps/api/migrations/0061_manufacturing_routing.sql`, `meta/_journal.json` | journal 62 entries; RLS battery |
| T44-B | Migration 0062: tickets, downtime events, quality-gate columns, schedule/OEE read-models | `apps/api/migrations/0062_shop_floor.sql` | journal consistency; isolation A-tests |
| T44-C | Contracts: routing/work-center/ticket/downtime DTOs + G-34 shape tests | `packages/contracts/src/manufacturing/shop-floor.ts` | contracts suite |
| T44-D | Routing + work-center services (versioning, cost-center link, rate validation) | `apps/api/src/modules/manufacturing/**` | unit: version snapshot on order; rate NUMERIC discipline |
| T44-E | Scheduler: forward finite-capacity (calendars/shift fallback), schedule-board read-model | `apps/api/src/modules/manufacturing/**` | unit: no double-booking beyond capacity; deterministic ordering |
| T44-F | Shop-floor station API: ticket lifecycle, operator id, scan input, qty/scrap/downtime capture | `apps/api/src/modules/manufacturing/**` | unit: lifecycle guards; downtime reason mandatory |
| T44-G | Actual operation costing + G-34 golden (variance purposes) + failure pack | `apps/api/src/modules/manufacturing/**`, `apps/api/src/__db__/manufacturing/**` | g34 golden + failure packs; INV-010 intact |
| T44-H | Standard costs + variance report contracts (PPV/labor efficiency/overhead absorption) | `apps/api/src/modules/reporting/**` | contract registry boot validation; §11 assertion set |
| T44-I | OEE + yield variance dashboard reads; quality-gate block on operation completion; bill-of-resources composite read | `apps/api/src/modules/manufacturing/**` | unit: gate blocks completion on FAIL; OEE math decimal |
| T44-J | Web: routings/work-centers managers, schedule board, station screen, variance reports + docs sync | `apps/web/**`, `docs/**` | web typecheck; browser smoke (§6); `docs:validate` |

## 6. Verification

- Contracts suite green (new DTOs + G-34 shape tests).
- API unit suite green (manufacturing module specs grow accordingly).
- `migrations.spec.ts`: journal **62** entries, manifest consistency.
- Permissions drift: ≈305 = ≈305 (re-pinned consciously — a named bump, recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the scheduler/OEE threshold SETTINGS wave ⇒ pins
  recomputed via the composeTenantStaticConfig pattern, old→new table in
  agent-ctx.
- **G-34 golden re-pin discipline:** JOURNAL_RULES §7 + ACCOUNTING_TESTS §3 rows
  with mandatory failure packs; golden effective-configs regenerate when the new
  policy defaults land (the composeTenantStaticConfig script pattern).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: create a routing with three operations on two work centers,
  release a production order against it, open the schedule board and see the
  order placed, run a station session (scan job card → start → record 8 good +
  1 scrap + a downtime reason → complete), watch the gate block completion until
  the inspection passes, then open the variance report showing labor efficiency
  variance and the OEE tile.

## 7. Risks and Constraints

- **Scheduler honesty:** finite-capacity scheduling is genuinely hard; the phase
  ships *lite* (greedy forward scheduling, no optimization claims) — drag-
  rescheduling and load-leveling heuristics may be cut, recorded in the report.
- **Time-capture fidelity:** without physical terminals, operator hours rely on
  manual station entry; the data is honestly labeled operator-declared, not
  machine-measured.
- **Standard-cost discipline:** standard costs never touch ledger valuation
  (INV-017); a contracts test forbids standard-cost fields in posting payloads
  (the INV-027 forbidden-surface pattern).
- **OEE data quality:** availability/performance/quality need clean downtime
  reasons — mandatory reason codes (fail-closed) are the guard.
- **Rate effective-dating:** work-center rates change; runs snapshot the rate at
  ticket time so history never re-computes (the INV-017 spirit, applied to rates).

## 8. Completion and Handoff

- Completion report `reports/PHASE-044-COMPLETION.md` with the verification table
  (suites, drift numbers, G-34 golden + failure packs, re-pin tables, i18n count,
  browser evidence) + honest deferrals (drag-rescheduling, shift-pattern source).
- Handoff obligations: the bill-of-resources read contract is documented as
  045-MRP's input; the quality-gate hook is documented for 054-QMS; the work-center
  asset hook is documented for 055-CMMS.
- Next eligible: **PHASE-045** (MRP & planning — the register's W3 order) and
  **PHASE-054** (QMS, whose register dependency is this phase); the parallel W3
  stream (046→047→048) may also be ordered.
