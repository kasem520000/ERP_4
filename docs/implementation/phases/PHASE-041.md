# PHASE-041 — Procurement & Sourcing (المشتريات والمنافسة بين الموردين)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W2, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §2 (H-11), §5 (P-01…P-10, P-12, P-13, P-15),
> §3 (A-11) · **Execution:** begins on the owner's explicit phase order;
> delivery = `ERP_PLATFORM_PHASE041.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-041
- **Title:** Procurement & Sourcing (المشتريات والمنافسة بين الموردين)
- **Objective:** Insert the **negotiation layer** the purchasing chain skips
  today. The evaluation found `rfq = 0` across the codebase (H-11): the
  cycle runs purchase request → purchase order directly — no RFQ, no
  supplier quotes, no comparison matrix, no awarding ("no organized
  negotiation with suppliers = direct financial loss"). This phase ships:
  **(1)** `rfqs` + `rfq_lines` with issue-to-suppliers (PDF via the
  PHASE-038 templates), response deadlines, and the
  DRAFT→ISSUED→CLOSED→AWARDED states; **(2)** `supplier_quotes` + the
  line-by-line comparison matrix (cheapest highlighted, deviation %) with an
  award action that generates the PO; **(3)** blanket orders with release
  tracking (P-03); **(4)** supplier scorecards + a periodic ratings job
  (P-04); **(5)** contract-based POs with price enforcement (P-06); **(6)**
  supplier catalog imports into PHASE-037's `item_cross_refs` + price lists
  (P-09); **(7)** the 3-bid rule as policy (P-08); **(8)** supplier advances
  with settlement on invoice (P-12); **(9)** early-payment discounts (P-13);
  **(10)** CAPEX requests on the 039 chains into fixed assets (P-10); and
  **(11)** the budget pre-check hard mode (A-11/P-15) — WARN→BLOCK per
  tenant, always pre-submit.
- **Business value:** sourcing discipline is where purchasing departments
  prove their savings — RFQ comparison + blanket terms + discount capture
  are quantifiable money, not polish. The 3-bid rule and CAPEX chains answer
  the governance question enterprise buyers ask first; supplier scorecards
  turn "vendor management" into a periodic, computed artifact.
- **Tier / effort:** P2 · ~4 weeks single-stream (one migration + contracts +
  api suite + comparison/award screens + ratings job + a golden-candidate
  posting).
- **Source gaps closed:** H-11, P-01, P-02, P-03, P-04, P-05 (scorecard
  half; the portal half stays 056-gated), P-06, P-08, P-09, P-10, P-12,
  P-13, P-15, A-11.

## 2. Scope

In scope:

1. **RFQ (P-01/H-11):** `rfqs` + `rfq_lines` (raised from purchase requests
   or direct), issue-to-suppliers (PDF via the PHASE-038 template engine),
   response deadline, states DRAFT → ISSUED → CLOSED → AWARDED.
2. **Supplier quotes + comparison (P-02):** `supplier_quotes` (per rfq line ×
   supplier: price, lead time, validity) + the **comparison matrix screen**
   (line-by-line, cheapest highlighted, deviation %) + award → PO generation
   (lines carry their winning quote references).
3. **Blanket orders (P-03):** `blanket_orders` (long-term agreements) +
   release tracking — releases are POs referencing the blanket with
   remaining-quantity enforcement.
4. **Supplier evaluation (P-04):** scorecards — on-time %, price variance,
   and a quality-rejects column whose data arrives with PHASE-054 — computed
   by a periodic `supplier_ratings` job (advisory, computed-at stamped).
5. **Contract-based PO (P-06):** `purchase_orders.contract_id` link +
   contract-price enforcement at line entry.
6. **Supplier catalog (P-09):** imported supplier price files (CSV/XLSX — the
   import wizard pattern) writing into PHASE-037's `item_cross_refs` + price
   list updates, with dry-run + row-level error reports.
7. **3-bid rule (P-08):** policy enforcement — a PO above a configurable
   threshold requires ≥ 3 linked quotes (threshold + on/off via
   SETTINGS_REGISTRY; pre-submit gate, INV-031 candidate).
8. **Supplier advances (P-12):** advance payments against POs with
   settlement on invoice — the treasury allocation pattern (on-account
   credit → allocation at match); no new posting side-channels.
9. **Early-payment discounts (P-13):** payment terms with cash-discount
   windows (2/10 net 30) + automatic discount capture at payment creation —
   a **golden-candidate posting** through the centralized engine (number at
   execution; JOURNAL_RULES is the authority — G-33 is PHASE-040's).
10. **CAPEX requests (P-10):** capex requisitions on the PHASE-039 approval
    chains (request → approval ladder) wired into the PHASE-026 fixed-assets
    purchase integration.
11. **Budget pre-check hard mode (A-11/P-15):** requisition/PO budget check
    mode WARN → BLOCK per SETTINGS key — **BR-051 stays advisory by
    default**; hard mode is opt-in per tenant, pre-submit only, never inside
    posting (INV-safe).

Out of scope (explicit):

- **Tender management (P-14)** — decision-gated (government vertical); a
  decision record must order it before any phase claims it.
- **Supplier portal (P-05)** — a PHASE-056 candidate; this phase ships the
  scorecard half of P-04 only.
- **Supplier quality records** — PHASE-054 (the scorecard's quality column
  lands then, computed from 054's inspection records).
- **Automatic safety stock (P-07)** — lands with PHASE-045's MRP (it is a
  planning input, not a purchasing rule).
- **Advanced 3-way-match tolerance configuration (P-11)** — the existing
  `matchStatus` surface is untouched; scheduling it requires a decision
  record (it is outside this register row).

## 3. Prerequisites

- **PHASE-039 COMPLETE** — approval chains: this phase's dependency is **039
  only** (the register's §1 row carries the self-referencing "041³" typo its
  footnote ³ corrects — fixed here as the footnote orders: 039 is the sole
  dependency).
- **PHASE-037 COMPLETE** — `item_cross_refs` (the supplier-catalog target)
  and the extended import-kinds pattern item 6 reuses.
- **PHASE-038 COMPLETE** — RFQ issue-to-supplier PDFs + the email-template
  purpose keys (channel adapters remain 052's; the artifact generation is
  ours).
- **PHASE-011** (purchase requests/orders/GRN + the matching surface),
  **PHASE-008** (treasury allocations for advances), **PHASE-026**
  (fixed assets for CAPEX), **PHASE-028** (budgets — BR-051's advisory
  check).
- **Binding decisions:** ADR-0002 (monorepo), ADR-0005 (tenant-owned RLS),
  ADR-0006 (identifiers), ADR-0007 (centralized posting engine — the
  discount-capture posting goes through it), ADR-0008 (pg-boss — ratings
  job), ADR-0009 (money precision — quote prices NUMERIC(19,4)), the v3.0
  register §O safeguards (frozen accounting core) + the INV-safe pre-submit
  rule (BR-051 default-advisory).
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md),
  [BUSINESS_RULES.md](../../product/BUSINESS_RULES.md) (BR-051),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md).

## 4. Design Impact

- **Database:** one additive migration `0056_procurement_sourcing.sql`
  (schema_version 56): 6 tables — `rfqs`, `rfq_lines`, `supplier_quotes`,
  `blanket_orders`, `supplier_ratings`, `capex_requests` — tenant-owned +
  RLS + UUIDv7 + hot indexes; widenings: `purchase_orders.contract_id` +
  winning-quote references on PO lines; two SETTINGS seeds (the 3-bid
  threshold + the budget-check mode — a SETTINGS wave ⇒ golden
  effective-configs re-pin, see §6).
- **Golden (candidate):** early-payment discount capture at payment creation
  — posted through the centralized engine; number assigned at execution
  (JOURNAL_RULES is the authority; G-33 belongs to PHASE-040).
- **New invariant (INV-031 candidate):** *policy blocks (3-bid, budget hard
  mode) are pre-submit gates* — never inside posting; machine-checked like
  INV-030.
- **Feature keys (projection):** `purchasing.rfq`,
  `purchasing.blanket_orders`, `purchasing.supplier_evaluations`,
  `purchasing.supplier_catalog`, `purchasing.capex_requests`,
  `purchasing.supplier_advances`, `purchasing.early_payment_discounts` —
  plan grants business + enterprise (tier-4 posture; FEATURE_DEPS rows +
  seed-drift convergence). Contract-PO and the 3-bid rule ride
  `purchasing.orders` + the policy keys.
- **Permissions (projection):** `purchasing.rfq.manage`,
  `purchasing.quotes.manage`, `purchasing.blanket_orders.manage`,
  `purchasing.supplier_ratings.read`, `purchasing.capex.manage`,
  `purchasing.advances.manage`, `purchasing.catalogs.import` → 277 — drift
  re-pinned consciously, a named bump.
- **API:** additive only — the RFQ lifecycle, quote entry, the comparison
  read model, award → PO generation, blanket releases, ratings, the CAPEX
  chain, and the catalog import kind.
- **Web:** the RFQ workspace (lines + suppliers + issue), the comparison
  matrix, the award flow, blanket release tracking, supplier scorecards,
  the CAPEX request screen, and the catalog import surface; i18n +~210 keys
  (AR/EN parity from day one).
- **Docs:** FEATURE_CATALOG (+7 keys → 220), ENTITY_CATALOG (+6 entities →
  232), JOURNAL_RULES (the discount-capture golden row), DATA_DICTIONARY,
  NAVIGATION_MODEL, AUTHORIZATION_MATRIX (+7 → 277 — drift re-pinned),
  IMPLEMENTATION_STATUS / CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T41-A | Migration 0056: the 6 tables + widenings + the two SETTINGS seeds | `apps/api/migrations/0056_procurement_sourcing.sql`, `meta/_journal.json` | migrations.spec journal 56 entries; RLS battery picks up the new tables |
| T41-B | Contracts: rfq/quote/blanket/rating/capex DTOs + comparison read model + the INV-031 forbidden-surface test | `packages/contracts/src/purchasing/**` | contracts suite; state-machine transitions; quote currency/validity invariants |
| T41-C | RFQ lifecycle: raise (from purchase request or direct), issue-to-suppliers (PDF via 038), deadline, close | `apps/api/src/modules/purchasing/**` | issue idempotency; late quote rejection after deadline; PDF artifact existence |
| T41-D | Supplier quotes + the comparison matrix + award → PO generation | `apps/api/src/modules/purchasing/**`, web comparison screen | deviation-% math tests; award produces a DRAFT PO carrying quote refs — never auto-posted |
| T41-E | Blanket orders + release tracking + remaining-quantity enforcement | `apps/api/src/modules/purchasing/**` | over-release rejected; release → PO linkage asserted |
| T41-F | Supplier evaluation scorecards + the periodic ratings job | `apps/api/src/modules/purchasing/**` (pg-boss job) | on-time % and price-variance math against fixtures; quality column null-until-054 documented |
| T41-G | Contract-based PO + supplier catalog import (cross-refs + price lists) | `apps/api/src/modules/purchasing/**` | contract-price enforcement at line entry; import dry-run + row-error tests |
| T41-H | Supplier advances (treasury allocation pattern) + early-payment discounts (terms + capture option + golden posting) | `apps/api/src/modules/{purchasing,treasury}/**`, accounting tests | advance settled at invoice match; 2/10 net 30 captures the discount; golden posting balanced (INV-001/002) |
| T41-I | CAPEX request chain (039) → fixed-asset purchase integration + the budget hard mode + docs sync | `apps/api/src/modules/{purchasing,fixed_assets,budgeting}/**`, `docs/**` | chain completes only through approvals; BLOCK mode rejects pre-submit; WARN default unchanged; docs:validate green |

## 6. Verification

- Contracts suite green (the new DTOs + INV-031 forbidden-surface test).
- API unit suite green (the existing baseline grows with the new specs).
- `migrations.spec.ts`: journal 56 entries, manifest consistency.
- Permissions drift: 277 = 277 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the two SETTINGS keys (3-bid threshold +
  budget-check mode) ⇒ **all pins recomputed** with the old→new table
  recorded in agent-ctx.
- Accounting db suite: the early-payment discount golden green (balanced doc
  + base currency).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: create an RFQ from a purchase request, issue to three
  suppliers (PDF via 038), enter quotes, see the comparison matrix highlight
  the cheapest with deviation %, award → a DRAFT PO with quote references; a
  blanket order releases twice then rejects the over-release; the ratings
  job computes on-time %; a supplier price file imports into cross-refs + a
  price list; an advance settles at invoice match; a 2/10 net 30 term
  captures the discount at payment creation; a CAPEX request walks the 039
  chain into a fixed-asset purchase; budget hard mode blocks an
  over-budget requisition pre-submit (WARN default unchanged).

## 7. Risks and Constraints

- **Comparison matrix correctness** — quotes may arrive in different
  currencies; normalization uses the dated-FX discipline (never silently
  converted for awarding without a visible rate); rounding per ADR-0009.
- **Award → PO must not bypass approval chains** — the generated PO is a
  DRAFT entering the 039 engine; auto-posting is a defect, not a shortcut.
- **Supplier ratings are only advisory** — computed-at timestamps, no
  gating; the quality column stays honestly empty until 054's records
  exist.
- **Advances touch treasury allocations** — the existing allocation service
  is reused; any new posting path is a frozen-core violation and a defect.

## 8. Completion and Handoff

- Completion report `reports/PHASE-041-COMPLETION.md` with the verification
  table (suites, drift numbers, the golden re-pin table, i18n count, browser
  evidence) + honest deferrals if any.
- Handoff obligations: the scorecard's quality column documented for
  PHASE-054; the supplier catalog + RFQ issue surfaces documented for
  PHASE-049 (its 038+041 dependencies are satisfied); the 3-bid and
  budget-block policy keys documented in the configuration runbook.
- Next eligible: **PHASE-042** per the register's W2 wave — completing W2
  and its gate ("the trade cycle has no manual gaps"); after W2, the W3
  operations wave opens (043 → 044 → 045 ‖ 046 → 047 → 048).
