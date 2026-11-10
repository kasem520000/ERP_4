# PHASE-050 — Treasury & Cash Intelligence (الخزينة وذكاء التدفق النقدي)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W2 — the parallel ‖ track, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §12 (T-01…T-13) + §3 (A-03, A-08…A-10, A-14) + §28
> (PP-09) + this register's AD-36-05/AD-36-12 ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE050.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-050
- **Title:** Treasury & Cash Intelligence (الخزينة وذكاء التدفق النقدي)
- **Objective:** lift the treasury axis (scored 72% — "ممتاز في الأساسيات، صفر في
  الذكاء") from bookkeeping to intelligence: **(1)** bank account data (T-04 — the
  substrate for statement-matching quality and the LC/wire metadata 049 reads);
  **(2)** the cash-flow forecast engine (T-01/A-08) with a what-if scenario overlay;
  **(3)** the daily cash position + intraday feed (T-02); **(4)** bank guarantees with
  an expiry ladder (T-03); **(5)** inter-account + partner AR/AP netting (T-06/A-09 —
  the evaluation's exact both-customer-and-supplier scenario); **(6)** intercompany
  booking pairs (A-10) tied to the 034 consolidation reader; **(7)** full FX
  revaluation (A-03, default-OFF preserved); **(8)** card settlement + gateway
  reconciliation (T-09/T-10); **(9)** multi-currency boxes + split payments
  (T-08/T-13); **(10)** allocation cycles (AD-36-05); **(11)** the period-close
  checklist (PP-09/AD-36-12); and **(12)** scenario budgeting (A-15).
- **Business value:** the finance team stops discovering cash positions by exporting
  spreadsheets — net-position forecasting, guarantee expiries, and a gated close
  checklist become daily surfaces; the "العمليات اليومية للخزينة" gap closes with
  postings that still flow through the one posting engine.
- **Tier / effort:** P2 · ~4 weeks single-stream. No phase dependencies (the register
  lists none — it runs as the W2 parallel track alongside 040–042, and its bank-field
  columns are the prerequisite-lite 049 consumes if 050 ships first).
- **Source gaps closed:** T-01…T-04, T-06, T-08…T-10, T-13, A-03, A-08, A-09, A-10,
  A-14, PP-09, AD-36-05, AD-36-12 — plus **A-15** (scenario budgeting), which the
  register's §1 table leaves unassigned and this phase absorbs (a register errata
  line at delivery, not a silent claim). Cross-references: A-12 is 048's row (this
  phase ships only the split-payment mechanics); T-05/T-07/T-11 (047's row)/T-12
  stay open or out — see §2.

## 2. Scope

In scope:

1. **Bank account data (T-04):** treasury accounts gain additive
   `bank_name`/`iban`/`swift`/`account_no`/`branch` columns — matching-quality
   substrate for bank statements and the LC/wire metadata 049 reads (the column set
   lands exactly once; the 049 adjacency is documented in both docs).
2. **Cash-flow forecast engine (T-01/A-08):** a projection service computing
   scheduled inflows/outflows over a horizon — recurring journals, installment due
   dates, note maturities, PO payment terms, payroll next-run estimate, subscription
   billing — into a daily/weekly **net position per account + currency**
   (NUMERIC(19,4) per ADR-0009; read-model, never a posting). **What-if overlay
   (A-15 partial):** ±% adjustments stored as `forecast_scenarios` rows.
3. **Daily cash position (T-02):** today-view by account/currency/branch + an
   intraday movement feed (today's posted movements on treasury accounts, refresh
   riding 052's SSE when it ships — degrades to manual refresh until then).
4. **Bank guarantees (T-03):** `bank_guarantees` register — issued/received,
   beneficiary/principal, amount, margin/lien linkage to treasury accounts, expiry
   ladder alerts at 30/14/7 days, release workflow (status machine; release posts
   only through the engine).
5. **Netting (T-06/A-09):** inter-account netting proposals + **partner netting** for
   partner-is-both: a proposal surface that generates contra entries through the
   posting engine — both subledgers stay integral (AR and AP open items are cleared
   against each other by matched amounts, never extinguished unilaterally) — golden
   **G-37** candidate (INV-016-style subledger integrity).
6. **Intercompany (A-10):** IC invoice/booking pair generation between two tenants of
   one consolidation group (reads the 034 consolidation groups); posts matched AR/AP
   + elimination-tagged entries so the existing consolidation reader eliminates them
   by tag — golden **G-38** candidate. Scope is the booking pair + tag; transfer
   pricing (X-13) is 051's candidate, not here.
7. **FX revaluation full (A-03):** periodic revaluation job over monetary accounts +
   open AR/AP at the closing rate, with reversal-on-next-run option — extends the
   minimal G-19 path; **default stays OFF** per the existing policy (a SETTINGS key,
   re-pinned wave discipline) — golden **G-39** candidate (revaluation posting +
   paired reversal).
8. **Card settlement + gateway reconciliation (T-09/T-10):** card-batch settlement
   matching (POS terminal day-close/Z-report → treasury receipt) + a payout
   reconciliation **report** over the existing payout tables (the F-9 accounting
   half — the F-9 console lands with 052 per the register footnote, repeated here as
   the named cross-reference).
9. **Multi-currency cash + split payments (T-08/T-13):** per-currency cash-box
   balances (valuation at spot for reporting), payment/receipt split across accounts
   and methods with per-leg allocation integrity (Σ legs = document total exactly).
10. **Allocation cycles (AD-36-05):** cost-center allocation rules (source pool →
    targets by %/quantity/equal) + periodic cycle run → allocation journal through
    the posting engine — golden **G-40** candidate (allocation posting).
11. **Period-close checklist (PP-09/AD-36-12):** close-period workspace — task
    checklist (the 8 reconciliations, subledger ties, revaluation, allocation,
    approval-backlog-zero) with statuses; the close action is gated on checklist
    completion **advisory per BR** — configurable hard/soft gates, never a silent
    block.
12. **Scenario budgeting (A-15 full):** budget versions what-if copy + compare
    (baseline vs scenario variance on the existing budget report contracts).

Out of scope (explicit):

- **Open banking / bank feeds (T-05)** — external-credential territory: port shape
  only, behind the no-fabrication gates (a statement-import API stays manual CSV as
  today).
- **Vault/safe management (T-07)** and **cheque-booklet serial management (T-12
  beyond the existing notes cycle)** — recorded as candidates, not scheduled.
- **Payroll advances from treasury (T-11)** — 047's row.
- **ZATCA/authority submissions of any kind** — none; tax returns are 051.
- **Any direct journal writes** — netting, IC, revaluation, allocation all post
  through the one engine (frozen core; INV-030/031 below).

## 3. Prerequisites

- **No phase dependency** (register §1 row: "—"); the surfaces reuse existing
  substrate: `recurring_journals`, installments, notes, payroll runs, subscription
  billing, POS Z-reports, the 034 consolidation reader + groups (for the
  intercompany pair tags), the minimal G-19 FX path, and the posting engine.
- **Binding decisions:** ADR-0009 (money precision), the frozen accounting core
  (register §O), the BR-051 advisory-gate posture for close gating, register §3.3
  (every new golden lands in the same phase's docs).
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) (new
  `treasury.*`/`accounting.*` rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) (G-37…G-40),
  [ACCOUNTING_INVARIANTS.md](../../accounting/ACCOUNTING_INVARIANTS.md) (INV-030/031),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md).

## 4. Design Impact

- **Database:** two additive migrations — `0069_treasury_intelligence.sql`
  (bank-field columns on treasury accounts; `bank_guarantees`;
  `forecast_scenarios`; netting/IC/revaluation run tables; card settlement batches;
  per-currency box support) and `0070_treasury_cycles.sql` (`allocation_rules` +
  `allocation_cycles`; `period_close_checklists` + tasks; budget version/scenario
  copy support) — all tenant-owned + RLS macro + UUIDv7 + append-only grants.
  Journal → **70 entries**.
- **New invariants (INV-030, INV-031 candidates — re-pinned if earlier waves
  consumed the numbers):** *INV-030* netting/IC postings preserve both subledgers'
  integrity — contra clearing is matched-amount only, and AR/AP open-item sums are
  unchanged by the operation except by the cleared amounts (INV-016-style property
  suite). *INV-031* every revaluation run pairs with its reversal leg and posted
  entries are never mutated; the feature default is OFF and no template or
  entitlement can force it ON (the INV-022 principle).
- **Goldens (G-37…G-40 candidates, continuing the program sequence from G-32;
  numbers re-pinned at execution):** G-37 partner netting contra posting · G-38
  intercompany matched pair with elimination tag · G-39 FX revaluation posting (+
  paired reversal) · G-40 allocation-cycle journal.
- **Feature keys (projection):** `treasury.forecasting`,
  `treasury.cash_position`, `treasury.bank_guarantees`, `treasury.netting`,
  `treasury.intercompany`, `treasury.fx_revaluation`, `treasury.card_settlement`,
  `treasury.split_payments`, `treasury.multi_currency_cash`,
  `accounting.allocation_cycles`, `accounting.period_close`,
  `accounting.budget_scenarios` — +12 keys (projection ≈289 program total; the delta
  is the binding figure, the total is re-pinned at execution). Plan grants: business
  + enterprise (tier-4 posture).
- **Permissions (projection):** `treasury.forecast.view/manage`,
  `treasury.position.view`, `treasury.guarantees.manage`, `treasury.netting.manage`,
  `treasury.intercompany.manage`, `treasury.revaluation.run`,
  `treasury.card_settlement.manage`, `accounting.allocation.manage`,
  `accounting.period_close.manage` — +10 keys, a named bump (projection ≈341;
  re-pinned consciously at delivery).
- **API:** extensions to the `treasury`, `accounting`, and `budgeting` modules —
  additive routes only; every money-bearing surface transports strings over the
  wire (ADR-0009); Idempotency-Key on all run/execute endpoints (forecast runs,
  netting execution, revaluation, allocation cycles, close action).
- **Web:** forecast dashboard, daily-position screen, guarantees register with the
  expiry ladder, allocation-rules editor, close-checklist workspace, card-settlement
  matching screen — on the @erp/ui archetypes; i18n +~180 keys (AR/EN parity from
  day one).
- **Docs:** FEATURE_CATALOG (+12), ENTITY_CATALOG (+12 entities — re-pinned),
  DATA_DICTIONARY, NAVIGATION_MODEL, AUTHORIZATION_MATRIX (+10),
  JOURNAL_RULES (+4 goldens), IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T50-A | Migration 0069: bank fields, guarantees, forecast scenarios, netting/IC/revaluation runs, card batches, currency boxes | `apps/api/migrations/0069_treasury_intelligence.sql`, `meta/_journal.json` | migrations.spec journal 69 entries; RLS battery |
| T50-B | Migration 0070: allocation rules/cycles, close checklist, budget scenario versions | `apps/api/migrations/0070_treasury_cycles.sql`, `meta/_journal.json` | journal 70 entries; manifest consistency |
| T50-C | Contracts: forecast/guarantee/netting/IC/revaluation/allocation/close DTOs + INV-030/INV-031 property tests | `packages/contracts/src/treasury/**` (+ index exports) | contracts suite green (baseline grows; re-pinned) |
| T50-D | Forecast engine: scheduled-item collectors → daily/weekly net position per account+currency + scenario overlay + daily position today-view + intraday feed | `apps/api/src/modules/treasury/**` | unit: collectors over each source (recurring journals, installments, notes, PO terms, payroll estimate, subscriptions); scenario ±% algebra exact |
| T50-E | Guarantees register: issued/received, margin/lien linkage, 30/14/7 expiry ladder alerts, release workflow | `apps/api/src/modules/treasury/**` | unit: ladder alerts fire at 30/14/7; release posts only via engine |
| T50-F | Netting (inter-account + partner AR/AP contra) golden G-37 + intercompany booking pairs golden G-38 (elimination-tagged, 034 reader compatible) | `apps/api/src/modules/treasury/**`, `apps/api/src/modules/consolidation/**` | golden runs; INV-030 property suite (both subledgers integral); consolidation reader eliminates the tagged pairs |
| T50-G | FX revaluation full: periodic job over monetary accounts + open AR/AP at closing rate, reversal-on-next-run, default OFF | `apps/api/src/modules/treasury/**` | golden G-39; INV-031 suite (pairing + default-off + no mutation) |
| T50-H | Payment mechanics: multi-currency boxes (spot valuation), split payments/receipts (Σ legs = total exactly), card-batch settlement matching (Z-report → treasury receipt), payout reconciliation report over existing payout tables | `apps/api/src/modules/treasury/**`, `apps/api/src/modules/pos/**` | unit: split-leg algebra; card-batch match golden; payout report ties to `billing_payouts` read-only |
| T50-I | Allocation cycles (G-40) + period-close checklist (advisory-gated close per BR) + scenario budgeting (A-15: what-if copy + compare) | `apps/api/src/modules/accounting/**`, `apps/api/src/modules/budgeting/**` | golden G-40; close blocked-soft/hard per config; budget variance compare exact |
| T50-J | Web: forecast dashboard, position screen, guarantees register, allocation rules, close checklist, card matching + i18n | `apps/web/**`, `packages/ui/**` | web typecheck; browser smoke of the treasury workspace |

## 6. Verification

- Contracts suite green (new DTOs + INV-030/INV-031 property tests); API unit suite
  green (the 479-test baseline grows with the treasury specs; re-pinned at delivery).
- `migrations.spec.ts`: journal 70 entries (0069 + 0070), manifest consistency.
- Permissions drift: projected 341 = 341 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the SETTINGS keys (revaluation default, close-gate
  posture) ⇒ **all pins recomputed** with the old→new table recorded; goldens
  G-37…G-40 land in JOURNAL_RULES and INV-030/031 in ACCOUNTING_INVARIANTS.
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: forecast dashboard (installments + recurring journal visible) →
  −10% scenario → today's position by account/currency → guarantee 30/14/7 ladder →
  partner netting with both subledgers inspected → IC pair eliminated by the
  consolidation reader → revaluation with default-OFF honored → checklist-gated close.

## 7. Risks and Constraints

- **Forecast honesty:** the engine projects from recorded schedules — it is a
  read-model, never a posting, and never presented as a prediction guarantee; the
  payroll "next-run estimate" is labeled an estimate in both languages.
- **Netting correctness (the A-09 trap):** contra clearing done wrong silently
  corrupts AR/AP control totals — the INV-030 property suite and G-37 golden are the
  guard; unmatched residual amounts stay open, never rounded away.
- **Revaluation policy:** default OFF is a standing policy — flipping it is a tenant
  decision with an audit row, and every run is reversible by design.
- **Adjacencies + errata:** the bank-field columns and the intraday SSE feed each
  land exactly once (documented in both owners' docs); the A-15 absorption and F-9
  split are recorded as explicit notes at delivery — register §1 stays the source of
  truth, annotated, never silently diverged from.

## 8. Completion and Handoff

- Completion report `reports/PHASE-050-COMPLETION.md` with the verification table
  (suites, drift numbers, golden re-pin table, i18n count, browser evidence) + honest
  deferrals (T-05/T-07/T-12 candidates, A-15 errata note, F-9 split note).
- Handoff obligations: the forecast collectors are extensible (053's scheduled
  reporting reads the same scheduled-item surface); the close checklist is the
  mandated close surface for 051's return-calendar cross-links; netting/IC document
  the only sanctioned AR/AP clearing across partners/entities.
- Next eligible: continues the **W2 parallel track** (040 → 041 → 042 ‖ 050) toward
  "the trade cycle has no manual gaps"; 049 unblocks once 041+038 land (its LC
  metadata reads this phase's bank columns if shipped first).
