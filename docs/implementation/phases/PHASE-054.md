# PHASE-054 — Quality Management System (نظام إدارة الجودة QMS)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W5, tier P3) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §8 (Q-01…Q-12) ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE054.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-054
- **Title:** Quality Management System (نظام إدارة الجودة QMS)
- **Objective:** lift the quality axis from **30%** — the second-weakest score in
  the whole evaluation — to a working QMS loop. Today `inspections` is a simple
  table with no linkage to production stages (M-23's finding) and nothing else
  exists: `quality_hold: 0`, no NCR, no CAPA, no calibration, no COA/COC. This
  phase delivers **(1)** quality specs per item family with attribute tests,
  tolerances, and sampling plans (Q-05); **(2)** nonconformance reports with
  severity, containment, and disposition tied to RMA (Q-01, workflow via 039);
  **(3)** CAPA — the QMS closure loop with root cause, owners, due dates, and
  effectiveness checks (Q-02); **(4)** calibration records for measuring equipment
  with next-due ladders (Q-03); **(5)** supplier quality — incoming-inspection
  results per lot → PPM/defect-rate scorecards feeding 041's supplier evaluation
  (Q-06, the P-04 hook); **(6)** certificate-of-analysis/conformity generation per
  batch from inspection results (Q-07); **(7)** the customer-complaints registry
  with triage and links to RMA/warranty (Q-08); **(8)** recall simulation over the
  existing QC genealogy read + recall letters (Q-09); **(9)** batch-level
  quality hold/release integrated with 043's quarantine bins (Q-12); and **(10)**
  the management-review dashboard (Q-10). SPC control charts (Q-04) and HACCP/ISO
  risk analysis (Q-11) are recorded as decision-gated candidates — honestly, not
  auto-scheduled.
- **Business value:** food-manufacturing and healthcare tenants (two of the 13
  vertical templates) get the compliance evidence chain — spec → inspection → COA →
  traceable recall — that regulated buyers and auditors demand; supplier PPM turns
  the 041 evaluation from opinion into measurement.
- **Tier / effort:** P3 · ~4 weeks single-stream (migration + contracts + api unit
  suite + web screens + docs + completion report).
- **Source gaps closed:** Q-01, Q-02, Q-03, Q-05, Q-06, Q-07, Q-08, Q-09, Q-10,
  Q-12. **Q-04 (SPC) and Q-11 (HACCP/ISO risk analysis) stay decision-gated**
  (§2 item 11) — the register's §2 discipline: a documented candidate beats a
  fabricated half-feature.

## 2. Scope

In scope:

1. **Quality specs (Q-05):** `quality_specs` per item family — attribute tests with
   UOM, target, tolerance (min/max), pass/fail or measured result type, sampling
   plan references — attached to **inspection templates** that incoming, in-process
   (044's production stages), and final inspections instantiate.
2. **NCR (Q-01):** `nonconformance_reports` — source (production ticket,
   inspection, supplier receipt, customer complaint), severity, containment actions,
   and disposition that ties RMA from 042 (return/credit paths reuse 042's
   machinery, never a new financial path). Workflow runs on **039 chains**
   (raise → contain → disposition → verify), with the approval timeline visible.
3. **CAPA (Q-02):** `capa_records` — root-cause analysis, corrective and preventive
   actions with owners + due dates, and an **effectiveness check** step that closes
   the loop (a CAPA cannot close without a recorded effectiveness verdict). NCR →
   CAPA chaining is a one-click promotion with lineage preserved.
4. **Calibration (Q-03):** `calibration_records` for measuring equipment —
   asset-linked (ties 055's asset registry via an additive nullable FK: the column
   lands here if 055 hasn't shipped, and 055 adopts it; documented both ways),
   calibration interval + next-due ladder alerts (30/14/7 — the same ladder pattern
   as 050's guarantees).
5. **Supplier quality (Q-06):** incoming-inspection results per supplier lot →
   **PPM / defect-rate scorecards** that feed 041's supplier evaluation as a
   measured criterion (the P-04 hook: evaluation scores gain a quality dimension
   computed from data, not opinion).
6. **COA/COC (Q-07):** certificate-of-analysis and certificate-of-conformity
   generation **per batch from inspection results** — printed via 038; the
   `food_manufacturing` and `healthcare` industry templates gain the surface
   (template pack rows, the 13-template data discipline).
7. **Complaints (Q-08):** `customer_complaints` registry — channel, date, product,
   lot/serial, triage workflow (039), links to RMA/warranty from 042, and closure
   with root-cause reference (typically promoting to an NCR/CAPA).
8. **Recall & trace (Q-09):** a **recall simulation report** — given a lot or
   serial, the full genealogy **up and down** (which batches/POs consumed it,
   which customers received it) — building on the existing QC genealogy read, not
   replacing it — plus recall letter generation (038 templates, batch printing).
9. **Quality hold (Q-12):** batch-level hold/release workflow **integrated with
   043's quarantine bins** — a hold moves stock into quarantine per 043's rules;
   release moves it back; both are audited state machines over existing stock, and
   the accounting effect (if any) flows through the existing adjustment engine
   (never a new posting path).
10. **Management review (Q-10):** the quality-metrics dashboard — NCR aging, CAPA
    closure rate, PPM trend, and **cost-of-poor-quality computed from existing
    scrap/rework postings** (044's manufacturing wave records them; CoPQ is a
    read-model over posted reality, not a parallel ledger) — delivered as report
    contracts on the existing engine.
11. **Decision-gated candidates (recorded, not scheduled):** **SPC control charts
    (Q-04)** — requires sampled-measurement history volume and a statistical
    posture decision (which rules, which charts); **HACCP/ISO risk analysis
    (Q-11)** — a vertical-specific methodology choice. Both are filed as candidates
    with their data prerequisites shipped (measured results + CCP-style inspection
    points are recordable now); implementation requires a decision record.

Out of scope (explicit):

- **SPC and HACCP implementations** — decision-gated (§2 item 11).
- **Any new posting path** — dispositions, holds, and CoPQ ride existing engines
  and reads (INV-035, §4); the frozen accounting core is untouched.
- **Supplier portal / customer portal collaboration surfaces** (P-05/S-20 rows) —
  complaints arrive through existing channels; no external portal is fabricated.
- **ISO certification claims** — the system records evidence; it never claims
  certification for a tenant (an honesty boundary mirrored in the docs).

## 3. Prerequisites

- **PHASE-044** (manufacturing I) — production stages/tickets that in-process
  inspections and scrap/rework postings hang off; the register lists 044 as this
  phase's dependency.
- **PHASE-042** (RMA/warranty) — disposition and complaint closure links.
- **PHASE-043** (WMS quarantine bins) — the quality-hold target state.
- **PHASE-039** — the workflow chains NCR/CAPA/complaint triage run on.
- **PHASE-038** — COA/COC and recall-letter printing.
- **041** (supplier evaluation) — the scorecard hook; **055 adjacency** for asset
  linkage (additive nullable FK, documented both ways).
- **Binding decisions:** ADR-0009 (money precision on CoPQ figures), the frozen
  accounting core (register §O), the register §3.3 drift rule (new report contracts
  land in REPORT_CATALOG in the same phase), register §2 (decision-gating for
  Q-04/Q-11).
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) (new
  `quality.*` family rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [REPORT_CATALOG.md](../../reporting/REPORT_CATALOG.md).

## 4. Design Impact

- **Database:** one additive migration `0074_quality_management.sql`
  (schema_version 74): `quality_specs` (+ tests), `inspection_templates`,
  `nonconformance_reports`, `capa_records` (+ actions), `calibration_records`,
  `supplier_lot_inspections`, `customer_complaints`, `quality_holds` (or the batch
  hold status machine over existing lot tables, plus the audit transitions). All
  tenant-owned + RLS macro + UUIDv7 + append-only grants; additive nullable
  `asset_id` FK for calibration. Journal → **74 entries**.
- **New invariant (INV-035 candidate — re-pinned if earlier waves consumed the
  numbers):** *quality flows through existing engines* — a hold/release changes
  stock state per 043's quarantine rules; a disposition's financial effect (if
  any) posts through the existing adjustment/RMA engines; CoPQ is a read-model over
  posted scrap/rework, never a parallel ledger. Machine-checked by a
  forbidden-surface contracts test (no new posting DTO gains a quality origin) +
  a CoPQ reconciliation test (dashboard total = Σ posted scrap/rework amounts).
- **No new goldens** — this phase posts nothing new; that is a stated design
  property, not an omission (the completion report records the negative ledger
  proof, the INV-022-style discipline).
- **Feature keys (projection):** `quality.specs`, `quality.inspections`,
  `quality.ncr`, `quality.capa`, `quality.calibration`,
  `quality.supplier_scorecards`, `quality.certificates`, `quality.complaints`,
  `quality.recall_trace`, `quality.holds` — +10 keys (projection ≈325 program
  total; the delta is the binding figure, the total re-pinned at execution). Plan
  grants: business + enterprise (regulated-vertical posture).
- **Permissions (projection):** `quality.specs.manage`,
  `quality.inspections.manage`, `quality.ncr.manage`, `quality.capa.manage`,
  `quality.calibration.manage`, `quality.complaints.manage`,
  `quality.holds.manage`, `quality.reports.view` — +8 keys, a named bump
  (projection ≈368; re-pinned consciously at delivery).
- **API:** a new `apps/api/src/modules/quality/**` module — additive routes only;
  workflows call the 039 engine; scorecard reads call 041's evaluation surface;
  recall simulation reads the existing genealogy service (extended, not replaced);
  Idempotency-Key on state transitions per API_CONVENTIONS §6.
- **Web:** quality workspace (spec manager, inspection capture, NCR/CAPA boards on
  the 039 timeline pattern, complaints triage), calibration register with the
  next-due ladder, COA/COC print dialogs, recall simulator, management-review
  dashboard — on the @erp/ui archetypes; i18n +~190 keys (AR/EN parity from day
  one; QMS terminology reviewed for standard Arabic ISO phrasing).
- **Docs:** FEATURE_CATALOG (+10), ENTITY_CATALOG (+8 entities — re-pinned),
  DATA_DICTIONARY (types/enums), NAVIGATION_MODEL (quality group),
  AUTHORIZATION_MATRIX (+8), REPORT_CATALOG (recall simulation + scorecards + the
  management-review dashboard contracts), IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T54-A | Migration 0074: the 8 quality tables + quarantine/hold transitions + calibration asset FK | `apps/api/migrations/0074_quality_management.sql`, `meta/_journal.json` | migrations.spec journal 74 entries; RLS battery |
| T54-B | Contracts: spec/inspection/NCR/CAPA/calibration/complaint/hold DTOs + INV-035 forbidden-surface test | `packages/contracts/src/quality/**` (+ index exports) | contracts suite green (baseline grows; re-pinned) |
| T54-C | Quality specs + inspection templates + incoming/in-process/final inspection capture (instantiating templates) | `apps/api/src/modules/quality/**` | unit: template instantiation produces the exact test set; measured results validated against tolerance |
| T54-D | NCR + CAPA on 039 workflow chains: raise → contain → disposition (RMA tie) → verify; CAPA effectiveness-check closure; NCR→CAPA promotion with lineage | `apps/api/src/modules/quality/**`, 039 engine calls | unit: state machines legal transitions only; CAPA cannot close without effectiveness verdict; RMA link reuses 042 paths |
| T54-E | Calibration records: interval + next-due ladder (30/14/7) + asset linkage (additive nullable FK) | `apps/api/src/modules/quality/**` | unit: ladder alerts; overdue blocks spec usage (configurable advisory per BR posture) |
| T54-F | Supplier quality: lot inspection aggregation → PPM/defect scorecards → 041 evaluation criterion (the P-04 hook) | `apps/api/src/modules/quality/**`, `apps/api/src/modules/purchasing/**` | unit: PPM algebra exact; evaluation criterion reads measured data |
| T54-G | COA/COC generation per batch from inspection results + 038 printing + template rows for food_manufacturing/healthcare | `apps/api/src/modules/quality/**`, template payloads | print payload shape assertions; certificate ties to the exact inspection rows |
| T54-H | Complaints registry + triage + recall simulation (genealogy up/down from a lot/serial) + recall letter batch printing | `apps/api/src/modules/quality/**`, genealogy read extension | unit: genealogy closure both directions (consumers + recipients); letter payload |
| T54-I | Quality hold/release integrated with 043 quarantine bins + audited transitions | `apps/api/src/modules/quality/**`, `apps/api/src/modules/inventory/**` | unit: hold moves stock per 043 rules; release restores; every transition audited; INV-035 surface test |
| T54-J | Management-review dashboard (NCR aging, CAPA closure, PPM trend, CoPQ from existing scrap/rework postings) + web surfaces + docs sync | `apps/api/src/modules/reporting/**`, `apps/web/**`, `packages/ui/**`, `docs/**` | CoPQ reconciliation test; `docs:validate` green; browser smoke |

## 6. Verification

- Contracts suite green (new DTOs + INV-035 forbidden-surface test).
- API unit suite green (the 479-test baseline grows with the quality specs;
  re-pinned at delivery).
- `migrations.spec.ts`: journal 74 entries, manifest consistency.
- Permissions drift: projected 368 = 368 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: this phase seeds SETTINGS keys (ladder thresholds,
  advisory posture) ⇒ **all pins recomputed** with the old→new table recorded.
- **Negative ledger proof:** no new journal keys/goldens/posting paths — recorded
  explicitly (the INV-022 discipline).
- CoPQ reconciliation: the dashboard's cost-of-poor-quality equals the Σ of posted
  scrap/rework amounts for the period (a report-vs-gl tie, the RC discipline).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: define a spec with tolerance tests → record an incoming
  inspection (one attribute out of tolerance) → raise an NCR → promote to CAPA with
  an owner and due date → hold the lot (stock moves to quarantine) → inspect the
  PPM scorecard on the supplier → generate and print the COA for a passing batch →
  simulate a recall from a lot and see customers + consuming batches both ways →
  open the management-review dashboard.

## 7. Risks and Constraints

- **Workflow sprawl:** NCR/CAPA/complaint workflows must be 039 chains, not bespoke
  state machines — the guard is that this phase defines zero new approval logic
  (a contracts sweep asserts no ad-hoc approver fields).
- **Quarantine coupling:** quality hold touching stock must go through 043's
  quarantine rules; a parallel hold status would fork inventory truth — the INV-035
  test plus an inventory-suite assertion pin this.
- **Traceability honesty:** the recall simulator is only as good as the lot/serial
  discipline tenants actually maintain — the report states coverage gaps honestly
  (untracked components listed as untracked, never assumed).
- **Decision-gated restraint:** Q-04/Q-11 pressure from auditors is expected; the
  honest answer is a filed candidate with data prerequisites shipped — not a
  half-built SPC chart that misleads.
- **055 FK adjacency:** the calibration `asset_id` column lands exactly once
  (whichever phase executes first carries it; the other adopts) — documented in
  both phase docs, the 049/050 column pattern repeated.

## 8. Completion and Handoff

- Completion report `reports/PHASE-054-COMPLETION.md` with the verification table
  (suites, drift numbers, i18n count, browser evidence, CoPQ reconciliation,
  negative-ledger proof) + honest deferrals (Q-04/Q-11 decision records filed with
  their prerequisites).
- Handoff obligations: inspection templates are the mandated capture surface for
  any future quality-adjacent phase; the genealogy extension is the substrate for
  055's asset/serial trace; supplier scorecards document the measured criterion 041
  reads; the COA/COC pattern extends 038's certificate family for any regulated
  vertical.
- Next eligible: the register's W5 siblings — **PHASE-055** (Asset Lifecycle &
  Maintenance/CMMS, no listed dependency; the calibration FK adjacency resolves at
  execution order) and **PHASE-057** (UX polish, after 052+053) — per the owner's
  explicit order, toward the W5 gate "differentiated, not just complete".
