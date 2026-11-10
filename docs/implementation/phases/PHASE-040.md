# PHASE-040 — CRM & Sales Force Depth (تعميق إدارة العلاقات والمبيعات)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W2, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §4 (S-01…S-12, S-18) + this register's
> AD-36-08/09 · **Execution:** begins on the owner's explicit phase order;
> delivery = `ERP_PLATFORM_PHASE040.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-040
- **Title:** CRM & Sales Force Depth (تعميق إدارة العلاقات والمبيعات)
- **Objective:** Turn the sales chain from "complete but shallow" (the
  evaluation's 76% verdict) into a **managed discipline**. Today: leads but
  no opportunities with weighted forecast (S-01), no campaigns/ROI (S-02), no
  targets (S-03), territories (S-04), rebates (S-05), contract pricing with
  validity windows (S-06), formula pricing (S-07), channel registry (S-11 —
  `sales_invoices.channel` is free text), scheduled delivery (S-12), ATP
  read (S-10), credit-hold automation or recurring invoices (AD-36-08/09).
  This phase ships all of it: `crm_opportunities` (per-tenant pipeline +
  kanban + the lead → opportunity → quote → order conversion); campaigns
  with attributed ROI; targets with an attainment report contract;
  territories; rebate agreements settling through credit notes posted by the
  centralized engine (golden **G-33** candidate); price agreements with
  validity windows, min/max qty, and deterministic overlap resolution (S-18)
  plus formula price lists; a `sales_channels` registry replacing the
  free-text column; scheduled delivery + a fulfillment calendar; ATP-lite;
  configurable credit-hold + risk scoring; recurring invoice rules
  generating DRAFTs on pg-boss (the recurring_journals pattern).
- **Business value:** sales management becomes measurable — forecast,
  attainment, campaign ROI, and channel margin are the dashboards a sales
  director buys an ERP for. Credit-hold + risk tiers cut the AR bleed at
  order entry; recurring billing opens subscription-style customers without
  a billing system beside the ERP.
- **Tier / effort:** P2 · ~4 weeks single-stream (one migration + contracts +
  api suite + kanban/report screens + two pg-boss jobs + G-33 golden).
- **Source gaps closed:** S-01, S-02, S-03, S-04, S-05, S-06, S-07, S-10,
  S-11, S-12, S-18, AD-36-08, AD-36-09.

## 2. Scope

In scope:

1. **Opportunities (S-01):** `crm_opportunities` (per-tenant pipeline
   stages; value; probability; expected close; source campaign; weighted
   forecast = value × probability) + a kanban board (the existing crm
   pipeline board pattern generalized) + the conversion path lead →
   opportunity → quote → order.
2. **Campaigns (S-02):** `crm_campaigns` (channel, budget, responses) + ROI
   roll-up computed from attributed opportunities/invoices (source-campaign
   attribution carried on lead/opportunity).
3. **Sales targets (S-03):** `sales_targets` (period; salesperson / team /
   product-family scope; amount) + the attainment report — a new report
   contract (`sales.target-attainment`) per the Report Contract discipline.
4. **Territories (S-04):** `sales_territories` (geo hierarchy; assigned
   partner) + assignment rules applied on partner create.
5. **Rebates (S-05):** `rebate_agreements` (customer/group; volume ladder;
   period) + an accrual job (pg-boss) + a credit-note generation proposal
   that **posts through the existing engine** — new golden **G-33**
   candidate (JOURNAL_RULES row + ACCOUNTING_TESTS entry).
6. **Contract pricing (S-06) + formula pricing (S-07) + overlap priority
   (S-18):** `price_agreements` (customer + item; validity window; min/max
   qty; priority) with resolution order **agreement > customer list >
   general list**; S-18 overlap resolution — same customer+item windows may
   not tie (enforced; deterministic resolution tests); formula price lists
   (cost + margin % + rounding) as a computed list source.
7. **Channel management (S-11):** `sales_channels` registry
   (WEBSITE/POS/direct/…) replacing the free-text `sales_invoices.channel`
   (additive widening + lossless backfill) + per-channel pricing and a
   reporting dimension.
8. **Scheduled delivery (S-12):** `delivery_notes` gains scheduled_date +
   delivery window + a fulfillment calendar view.
9. **ATP-lite (S-10):** an available-to-promise read = on-hand − reservations
   + inbound POs due — a read surface, not MRP; full net-needs waits for
   PHASE-045.
10. **Credit-hold automation + risk scoring (AD-36-08):** configurable credit
    check at order confirm (mode block/warn via a SETTINGS_REGISTRY key —
    **pre-submit, never inside posting**, INV-030 candidate) +
    `partner_credit_scores` (payment-behavior derived: avg days late,
    disputed ratio) via a periodic job + a risk tier on the partner card.
11. **Recurring sales invoices (AD-36-09):** `recurring_invoice_rules`
    (customer; lines template; frequency; next date) + pg-boss generation →
    DRAFT invoices (the recurring_journals pattern reused; drafts then ride
    the normal approval flow — never auto-posted).

Out of scope (explicit):

- **Dunning/collections, loyalty, gift cards (S-08/S-09/S-16)** — PHASE-042.
- **Drop-ship (S-21)** — a PHASE-049 candidate, decision-gated.
- **FX hedging (S-19)** — a PHASE-050 decision record (treasury lane).
- **Customer portal (S-20)** — standing deferral (evaluation F-8's honest
  DEFERRED classification stands).
- **Full ATP/MRP (H-03)** — PHASE-045 (this phase's read is deliberately
  "lite").
- **Predictive sales analytics (S-17)** — the 053/058 lanes.

## 3. Prerequisites

- **PHASE-036 COMPLETE** — custom fields on the new entities; saved views +
  bulk actions on the new lists; the record timeline on opportunity/campaign
  cards.
- **PHASE-039 COMPLETE** — the workflow engine is the mandated approval
  substrate (rebate credit-note proposals, recurring-batch releases, and
  target changes can be chained).
- **PHASE-019** — the crm leads/tasks/contracts model, the pipeline board
  pattern, and the conversion surface item 1 extends.
- **PHASE-012** — sales orders/invoices/deliveries, the reservations policy,
  and price lists the agreement resolution layers over.
- **Binding decisions:** ADR-0002 (monorepo), ADR-0005 (tenant-owned RLS),
  ADR-0006 (identifiers), ADR-0007 (centralized posting engine — the rebate
  credit note posts through it, no side-channels), ADR-0008 (pg-boss —
  accrual, credit-score, and recurring-generation jobs), ADR-0009 (money
  precision — every amount NUMERIC(19,4)), the v3.0 register §O safeguards
  (frozen accounting core).
- Relevant docs: [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) (the
  G-33 row), [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [REPORT_CATALOG.md](../../reporting/REPORT_CATALOG.md) (the new contract),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md).

## 4. Design Impact

- **Database:** one additive migration `0055_crm_sales_depth.sql`
  (schema_version 55): 9 tables — `crm_opportunities`, `crm_campaigns`,
  `sales_targets`, `sales_territories`, `rebate_agreements`,
  `price_agreements`, `sales_channels`, `partner_credit_scores`,
  `recurring_invoice_rules` — tenant-owned + RLS + UUIDv7 + hot indexes;
  widenings: `delivery_notes.scheduled_date` + window,
  `sales_invoices.channel` → registry FK with a lossless backfill; the
  credit-check mode SETTINGS seed (a SETTINGS wave ⇒ golden effective-configs
  re-pin, see §6).
- **Golden G-33 (candidate):** rebate settlement credit note — the accrual
  model's DR/CR reviewed against JOURNAL_RULES before implementation; posts
  through the centralized engine with a JOURNAL_RULES row and an
  ACCOUNTING_TESTS table entry.
- **New invariant (INV-030 candidate):** *credit-hold blocks pre-submit only*
  — the posting engine never consults credit state (frozen-core discipline;
  machine-checked like INV-027).
- **Feature keys (projection):** `crm.opportunities`, `crm.campaigns`,
  `sales.targets`, `sales.territories`, `sales.rebates`,
  `sales.price_agreements`, `sales.channels`, `sales.credit_control`,
  `sales.recurring_invoices`, `sales.atp` — plan grants business + enterprise
  (tier-4 posture; FEATURE_DEPS rows + seed-drift convergence).
- **Permissions (projection):** `crm.opportunities.manage`,
  `crm.campaigns.manage`, `sales.targets.manage`, `sales.rebates.manage`,
  `sales.price_agreements.manage`, `sales.channels.manage`,
  `partners.credit_scores.read`, `sales.recurring_invoices.manage` → 270 —
  drift re-pinned consciously, a named bump; territories ride the existing
  partner-scope permissions (no widening).
- **API:** additive CRUD/report endpoints + the attainment report contract +
  the ATP read endpoint + the channel backfill migration; report registry
  86 → 87 contracts.
- **Web:** the opportunity kanban + card, the campaign ROI page, targets +
  attainment, territories admin, rebate agreement screens + the accrual run,
  a price-agreement picker with resolution preview inside sales document
  lines, the channel registry, the fulfillment calendar, the recurring-rules
  manager, and the risk tier on the partner card; i18n +~230 keys (AR/EN
  parity from day one).
- **Docs:** FEATURE_CATALOG (+10 keys → 213), ENTITY_CATALOG (+9 entities →
  226), REPORT_CATALOG (+1 → 87), DATA_DICTIONARY, JOURNAL_RULES (G-33),
  NAVIGATION_MODEL, AUTHORIZATION_MATRIX (+8 → 270 — drift re-pinned),
  IMPLEMENTATION_STATUS / CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T40-A | Migration 0055: the 9 tables + widenings + channel backfill + credit-mode SETTINGS seed | `apps/api/migrations/0055_crm_sales_depth.sql`, `meta/_journal.json` | migrations.spec journal 55 entries; backfill lossless (every legacy value mapped); RLS battery |
| T40-B | Contracts: opportunity/campaign/target/territory/rebate/price-agreement/channel/recurring DTOs + resolution-order schema + the INV-030 forbidden-surface test | `packages/contracts/src/{crm,sales}/**` | contracts suite; overlap-tie rejected; weighted-forecast invariants |
| T40-C | Opportunities + kanban + the lead→opportunity→quote→order conversion path | `apps/api/src/modules/crm/**`, `apps/web/src/app/**/crm/**` | conversion idempotency; stage-order transitions; board snapshot |
| T40-D | Campaigns + source attribution + ROI roll-up | `apps/api/src/modules/crm/**`, web campaign page | attribution math tests (budget vs attributed invoice value) |
| T40-E | Targets + territories + the `sales.target-attainment` report contract | `apps/api/src/modules/sales/**`, `apps/web/**` | report-contract suite; attainment reconciles to invoiced amounts |
| T40-F | Rebates: agreements + accrual job + credit-note proposal + G-33 golden | `apps/api/src/modules/sales/**`, accounting engine tests | G-33 golden green in the accounting db suite; accrual→settlement completeness |
| T40-G | Price agreements + formula lists + S-18 overlap resolution + the line-picker resolution preview | `apps/api/src/modules/{sales,items}/**`, web document lines | resolution-order tests: agreement > customer list > general list; no-agreement ⇒ today's behavior byte-identical |
| T40-H | Channel registry + backfill; scheduled delivery + fulfillment calendar; ATP-lite read | `apps/api/src/modules/sales/**`, web calendar | channel FK integrity; ATP = on-hand − reservations + POs-due asserted against fixtures |
| T40-I | Credit-hold (block/warn modes) + credit-score job + risk tier + recurring invoice generation + docs sync | `apps/api/src/modules/{sales,partners}/**`, `docs/**` | INV-030 test (posting never consults credit); recurring generation on the test clock produces DRAFTs only |

## 6. Verification

- Contracts suite green (the new DTOs + resolution-order + INV-030
  forbidden-surface test).
- API unit suite green (the existing baseline grows with the new specs).
- `migrations.spec.ts`: journal 55 entries, manifest consistency.
- Permissions drift: 270 = 270 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the credit-check mode SETTINGS key wave ⇒ **all
  pins recomputed** with the old→new table recorded in agent-ctx.
- Accounting db suite: the **G-33** golden (rebate settlement credit note)
  green with balanced doc + base currency (INV-001/002 discipline).
- `docs:validate` green; feature-catalog and report-catalog count statements
  updated (176→…→213 keys; 86→87 contracts).
- Browser smoke: convert a lead → opportunity → quote → order; a campaign
  shows attributed ROI; run the attainment report; create a rebate
  agreement, run the accrual, post the credit-note proposal (G-33); a price
  agreement wins over the list price while an overlapping tie is rejected;
  the ATP panel shows on-hand − reservations + POs due; order confirm
  blocks/warns per credit-hold mode; a recurring rule generates the next
  DRAFT invoice on the test clock; the partner card shows the risk tier.

## 7. Risks and Constraints

- **Price-resolution order touches every sales line** — agreements win only
  when strictly valid (window + quantity); otherwise today's resolution must
  be byte-identical on the golden pricing scenarios.
- **Rebate accounting is accounting-core-adjacent** — G-33 goes through the
  centralized engine with a JOURNAL_RULES row and an explicit DR/CR review;
  no new posting side-channels (frozen-core discipline).
- **The channel FK backfill must be lossless** — a registry row for
  "direct/OTHER" + a mapping of legacy values; one additive, reversible
  migration with a verification count in the completion report.
- **Credit scores are only as good as payment history** — scores carry a
  computed-at timestamp and are advisory metadata; the block mode is
  per-tenant opt-in (never a silent global block).

## 8. Completion and Handoff

- Completion report `reports/PHASE-040-COMPLETION.md` with the verification
  table (suites, drift numbers, the golden re-pin table, the G-33 evidence,
  i18n count, browser evidence) + honest deferrals if any.
- Handoff obligations: `partner_credit_scores` documented as PHASE-042's
  dunning escalation input; the approval-chain integrations documented for
  041; the campaign attribution model documented for 053's BI layer.
- Next eligible: **PHASE-041** per the register's W2 wave; 042's dependency
  pair (038 + 040) is satisfied but the wave order runs 041 first (042
  completes W2 and its gate: "the trade cycle has no manual gaps").
