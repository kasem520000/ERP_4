# PHASE-043 — Warehouse Management (WMS): Locations, Directed Work & Accountability (إدارة المستودعات بالمواقع والرفوف)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W3, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §6 (I-01…I-09, I-12, I-14, I-20, I-22, I-24) + §2 (H-07)
> + §29 (DF-12) · **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE043.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-043
- **Title:** Warehouse Management (WMS) — Locations, Directed Work & Accountability
  (إدارة المستودعات بالمواقع والرفوف)
- **Objective:** Give the inventory module a **physical geography**: today a warehouse
  is one flat bucket (`item_stock = {itemId, warehouseId, qty, avgCost}`, no bin —
  H-07) and a 5,000-SKU / 500-location warehouse is manual management. This phase
  delivers the location hierarchy (zone → aisle → rack → bin) with bin-level stock
  rows; directed putaway and picking (strategy-configured, scan-optional); LPN/pallet
  tracking; scheduled cycle counting over ABC classes; quarantine/hold status; an
  automatic reservation policy; and in-transit accountability with reconciliation —
  wave picking and cross-docking ride as decision-gated optional tasks, recorded
  honestly if deferred.
- **Business value:** the W3 gate's "a factory and a 100-employee company can run on
  it" starts in the warehouse: pickers walk a directed route instead of hunting;
  counting becomes a scheduled routine instead of an annual shock; damaged goods sit
  in QUARANTINE instead of being sold; and missing-in-transit becomes a disposition
  with an audit row instead of a shrug. DF-12's "multi-branch mini-warehouse, exists
  without locations" caveat is retired.
- **Tier / effort:** P2 · ~6 weeks single-stream (2 migrations + contracts + api unit
  suite + web work screens + docs).
- **Source gaps closed:** H-07, I-01…I-09, I-12, I-14, I-20, I-24, DF-12 — the
  register §1 row — plus **I-22** (in-transit reconciliation, §2 item 9), which the
  register's §4 traceability otherwise leaves unassigned and which this doc records
  here for precision. I-10/I-11/I-13/I-15/I-17/I-19/I-21/I-23/I-25 are **not**
  claimed by this phase (out of scope, §2).

## 2. Scope

In scope:

1. **Location hierarchy (H-07/I-01/I-02):** migration ships `warehouse_zones` →
   `warehouse_aisles` → `warehouse_racks` → `warehouse_bins` (tenant-owned,
   parent-scoped, code + name/name_ar; bin carries capacity, mixed-SKU flag,
   `pick_sequence`). `item_stock` (on-hand read model, physical `ln`) gains
   **bin-level rows** via additive NULLable `bin_id` — warehouse rows remain the
   rollup and stay authoritative for valuation (INV-010 untouched at bin
   granularity); `stock_moves` gains `source_bin_id`/`target_bin_id` so every move
   says from-which-bin-to-which-bin (golden G-33, §4, asserts rollup = Σ bins).
2. **Directed putaway (I-03):** `putaway_rules` (item family / velocity class /
   temperature band → zone/bin strategy, priority-ordered, tenant-owned) +
   suggested-putaway on goods-receipt lines + a directed confirmation screen
   (scan-optional — a barcode input field, not a device dependency).
3. **Directed picking (I-04 + I-06):** pick-strategy configuration as tenant config —
   FIFO/FEFO/LIFO/closest/pick-sequence (the FEFO selection already coded for
   healthcare dispensing generalizes into the strategy registry); pick lists with
   bin-ordered lines and confirm-by-scan; pick lists feed issue postings through the
   existing document chain (no new posting semantics — only *which bin*).
4. **LPN / pallets (I-05):** `license_plate_numbers` container tracking —
   container packing at receipt (LPN holds N item/batch rows), unpack-on-pick; LPN
   moves carry the same source/target bin columns as loose units.
5. **Cycle counting (I-08/I-20/I-09):** `cycle_count_schedules` (frequency per ABC
   class — an ABC analysis job classifies items by usage value from `stock_moves`)
   generating scheduled count documents in the existing `stock_counts` workspace;
   variance approval rides the **039 approval chains**; recount policy (threshold →
   auto-recount task) is a tenant setting.
6. **Quarantine / hold (I-24):** bin status + item-stock row status ∈
   AVAILABLE/QUARANTINE/HOLD; receipt-inspection-fail routes stock to a quarantine
   bin; release workflow (approval-chain) returns it to AVAILABLE. Quality depth
   (NCR/CAPA) is 054 — this phase only ships the **status + routing hook**.
7. **Automatic reservation policy (I-14):** per-warehouse / item-family policy that
   reserves on sales-order confirmation, extending the existing
   `stock_reservations` table — no new reservation semantics, an auto-policy on top.
8. **Wave picking (I-07) + cross-docking (I-12):** ADVANCED OPTIONAL tasks,
   decision-gated **inside** the phase — if the load is high the phase ships
   wave-1 without them and records the deferral honestly in the completion report;
   the feature keys ship disabled-by-default either way.
9. **Transit accountability (I-22):** `stock_transfers` gains an explicit in-transit
   state with reconciliation on the receiving leg — missing/damaged quantities
   dispose through the existing adjustment canon (G-13/G-14) with reason codes,
   never silent drift.
10. **Web:** warehouse map (zone/aisle/rack/bin tree browser with per-bin stock),
    bin-level stock inquiry, pick/putaway work screens (touch-friendly, the mobile
    web pattern), cycle-count app screen (count entry with blind-count option).

Out of scope (explicit):

- **Consignment (I-10), VMI (I-11), kitting (I-13), UOM auto-conversion in-move
  (I-15), owner tracking (I-19), transfer pricing (I-23), rotation automation
  (I-25), shelf-life alert jobs (I-17/I-21)** — unassigned by the register and not
  claimed here; a decision record schedules them if the owner orders it.
- **Serial/batch depth (I-16/I-18)** — PHASE-037 owns them (bins must co-exist
  with 037's serial movements, not replace them).
- **Hardware device integration** — scanners are input fields; label printers,
  RF terminals and scale integrations ride PHASE-052 (N-18/N-19). No device
  fabrication (the register §3.4 no-fabrication rule).
- **Any posting-engine or valuation change** — the frozen-core rule; bin moves
  inside one warehouse never post a journal (the G-15 same-account policy-none
  case, extended), valuation stays warehouse-level.

## 3. Prerequisites

- **PHASE-036 COMPLETE** — the extensibility slots (custom fields render on the new
  entities), saved views, and bulk conventions the new lists adopt.
- **PHASE-037 COMPLETE** — master-data depth: variant/serial/batch tracking depth
  (I-16/I-18) that bin rows must respect; item family attributes the putaway rules
  key on.
- **PHASE-039** (W1, ships before W3 by the register's wave order — an ordering
  assumption, not a graph edge; this phase's register dependency is 036+037) —
  approval chains for count-variance approval and quarantine release.
- **PHASE-013/015 patterns** — the report/export substrate and the
  SETTINGS_REGISTRY wave convention for pick-strategy, reservation and recount
  keys (a SETTINGS wave ⇒ golden effective-configs re-pin, §6).
- **Binding decisions:** ADR-0002 (monorepo), ADR-0006 (UUIDv7 ids), ADR-0007
  (posting engine — G-33 extends the G-15 policy-none case; no new journal shapes),
  ADR-0009 (quantities/money as NUMERIC(19,4)/(19,6) decimal strings, never
  float), the v3.0 register §O safeguards (frozen accounting core).
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) (new
  `inventory.*` family rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md) (new enums:
  stock status, pick strategy), [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md)
  (group 4 المخزون items), [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) §7 (G-33 candidate row).

## 4. Design Impact

- **Database:** two additive migrations — `0059_wms_locations.sql`
  (schema_version 59: the 4 hierarchy tables, `license_plate_numbers` +
  contents, `putaway_rules`, pick-strategy SETTINGS seeds, additive
  `bin_id`/`source_bin_id`/`target_bin_id` columns) and
  `0060_wms_operations.sql` (60: `cycle_count_schedules` + count-doc linkage,
  quarantine status columns + release workflow rows, reservation-policy rows,
  transfer in-transit state, wave/cross-dock tables behind their feature keys) —
  all tenant-owned + RLS macro + UUIDv7 + append-only grants per convention; hot
  index `(tenant, warehouse, bin, item)` on bin stock.
- **New golden (G-33 candidate):** *WMS transfer-at-location* — every bin-level
  move writes ledger rows carrying the bin on **both** sides, warehouse-level
  rollup = Σ bins after every operation (machine-checked with INV-010 at bin
  granularity), and same-warehouse bin moves post **no journal** (the G-15
  policy-none extension). Failure pack: bin/rollup drift seeded → reconciliation
  BROKEN.
- **Feature keys (projection):** ten `inventory.*` keys — `inventory.locations`,
  `inventory.putaway`, `inventory.picking`, `inventory.lpn`,
  `inventory.cycle_counting`, `inventory.quarantine`,
  `inventory.reservation_policy`, `inventory.transit`, plus decision-gated
  `inventory.wave_picking` / `inventory.cross_docking`. Catalog: 182 after 036 +
  W1/W2 deltas (037–042, +4–12 each per their docs) ≈ 228 entering W3; this phase
  +10 → **≈238** (re-pinned by the drift battery at execution).
- **Permissions (projection):** `inventory.locations.manage`,
  `inventory.putaway.execute`, `inventory.picking.manage`, `inventory.picking.confirm`,
  `inventory.lpn.manage`, `inventory.counts.schedule`,
  `inventory.quarantine.release` (approval-separated — audited),
  `inventory.transit.reconcile`, and gated `inventory.waves.manage` /
  `inventory.cross_dock.manage`. Matrix: 248 after 036 + W1/W2 deltas ≈ 285
  entering W3; +10 here → **≈295** — re-pinned consciously, a named bump recorded
  in the phase report.
- **API:** additive routes only (locations CRUD, putaway suggestions, pick-list
  lifecycle, LPN pack/unpack, count schedules, quarantine release, transfer
  reconciliation); existing stock payloads gain optional `bin` fields — old clients
  unaffected (API_CONVENTIONS compatibility rule).
- **Web:** @erp/ui tree + register archetypes; i18n +~150 keys (AR/EN parity from
  day one, the triple-parity rule).
- **Docs:** FEATURE_CATALOG (+10 keys), ENTITY_CATALOG (+~14 entities — re-pinned),
  DATA_DICTIONARY (enums), NAVIGATION_MODEL (group 4 additions),
  AUTHORIZATION_MATRIX (+10 — drift check re-pinned), JOURNAL_RULES §7 (G-33),
  IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T43-A | Migration 0059: hierarchy + LPN + putaway rules + additive bin columns + strategy SETTINGS seeds | `apps/api/migrations/0059_wms_locations.sql`, `meta/_journal.json` | journal 60 entries; RLS battery picks up new tables |
| T43-B | Migration 0060: cycle counting, quarantine, reservation policy, in-transit state, gated wave/cross-dock | `apps/api/migrations/0060_wms_operations.sql` | journal consistency; isolation A-tests registered |
| T43-C | Contracts: location/LPN/pick-list/count DTOs + the G-33 forbidden-surface test (bin moves never journal) | `packages/contracts/src/inventory/wms.ts` | contracts suite |
| T43-D | Locations service + putaway suggestion engine (rule match → bin) + GRN hook | `apps/api/src/modules/inventory/**` | unit: rule precedence, capacity + mixed-SKU guard |
| T43-E | Directed picking: strategy registry (FIFO/FEFO/LIFO/closest/pick-seq), pick lists bin-ordered, confirm-by-scan, issue posting via existing chain | `apps/api/src/modules/inventory/**` | unit: FEFO picks earliest expiry first; ledger rows carry both bins |
| T43-F | Cycle counting: ABC job (pg-boss), schedule → count docs, variance chain (039), recount policy | `apps/api/src/modules/inventory/**` | unit: ABC classes from usage value; variance approval blocks posting |
| T43-G | Quarantine status + release workflow; reservation auto-policy on order confirm | `apps/api/src/modules/inventory/**` + `apps/api/src/modules/sales/**` (hook only) | unit: quarantined qty un-pickable; reservation created on confirm |
| T43-H | Transit accountability: in-transit leg, reconciliation, missing/damaged disposition via G-13/G-14 adjustments | `apps/api/src/modules/inventory/**` | unit: in-transit never silently drops qty; adjustment audit rows |
| T43-I | Web: warehouse map, bin inquiry, pick/putaway work screens, cycle-count screen, LPN pack/unpack | `apps/web/**` | web typecheck; browser smoke (§6) |
| T43-J | Docs sync: catalogs, matrix, dictionary, nav, JOURNAL_RULES G-33, status, changelog | `docs/**` | `docs:validate` (validator v3.0 ranges 001–058) |

## 6. Verification

- Contracts suite green (new DTOs + G-33 forbidden-surface test).
- API unit suite green (baseline grows with the WMS module's specs).
- `migrations.spec.ts`: journal **60** entries, manifest consistency.
- Permissions drift: ≈295 = ≈295 (re-pinned consciously — a named bump, recorded).
- i18n parity ar=en (triple parity: TS types + runtime + CI script).
- Golden effective-configs: this phase ships a SETTINGS wave (pick strategy,
  reservation, recount keys) ⇒ **all pins recomputed** via the
  composeTenantStaticConfig resolution pattern, old→new table recorded in
  agent-ctx (the §18 lesson-5 relay).
- **G-33 golden re-pin discipline:** new posting goldens land in JOURNAL_RULES §7
  + ACCOUNTING_TESTS §3 with mandatory failure packs, and the golden
  effective-configs regenerate when the new policy defaults land (the
  composeTenantStaticConfig script pattern).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: build a zone→aisle→rack→bin tree, receive a GRN with suggested
  putaway and confirm it, pick from a bin-ordered list confirming by scan, pack and
  unpack an LPN, run a scheduled count whose variance walks the approval chain,
  quarantine a failed lot and release it, and transfer between branches with one
  damaged unit reconciled through an adjustment.

## 7. Risks and Constraints

- **Bin-row fan-out:** `item_stock` grows ×bins; the rollup discipline (warehouse
  rows authoritative for valuation, bin rows for quantity geography) plus hot
  composite indexes are the guard; tenants with flat warehouses simply run
  one bin per warehouse (degenerate but valid).
- **Backfill:** existing stock rows get NULL bin = an auto-created "UNASSIGNED"
  bin per warehouse; the Σ-bins invariant holds from migration day one.
- **Scan expectations:** browsers + plain input fields only — no RF terminal or
  device claims (052 owns the fabric); over-promising here would be fabrication.
- **Optional tasks honesty:** wave picking / cross-docking may slip; the
  completion report must say so explicitly rather than quietly narrowing scope.
- **Strategy misconfiguration:** FEFO without batch/expiry tracking must fail
  validation at rule save (fail-closed config, never a silent runtime guess).

## 8. Completion and Handoff

- Completion report `reports/PHASE-043-COMPLETION.md` with the verification table
  (suites, drift numbers, G-33 golden + failure pack evidence, golden-config
  re-pin table, i18n count, browser evidence) + honest deferrals (wave/cross-dock
  gate outcome recorded either way).
- Handoff obligations: the bin columns and work-screen patterns are documented for
  044/045 (manufacturing consumes putaway/pick for materials and FG), 054 (quality
  holds ride bin status), and 052 (device adapters bind to the scan fields).
- Next eligible: **PHASE-044** (routing, work centers, shop floor — the register's
  W3 order); the parallel W3 stream (046→047→048) may also be ordered once 039 is
  complete.
