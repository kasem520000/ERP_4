# PHASE-042 — Customer Lifecycle: RMA, Warranty, Dunning & Loyalty (دورة حياة العميل: المرتجعات والضمان والتحصيل والولاء)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W2, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §2 (H-12, H-13), §4 (S-08, S-09, S-14, S-15,
> S-16) + this register's AD-36-11 · **Execution:** begins on the owner's
> explicit phase order; delivery = `ERP_PLATFORM_PHASE042.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-042
- **Title:** Customer Lifecycle: RMA, Warranty, Dunning & Loyalty (دورة حياة
  العميل: المرتجعات والضمان والتحصيل والولاء)
- **Objective:** Close the **after-the-invoice half** of the customer
  relationship. Today a return is a bare credit note with no logistics
  process (H-12 — no `return_authorizations`, no inspection, no justified
  restock), warranty is a text blob (S-15), collections have no dunning
  cycle (H-13 — `dunningStep` exists for subscriptions only), and
  loyalty/gift cards are absent (S-08/S-09). This phase ships: **(1)** the
  RMA workflow — `return_authorizations` against invoice lines with the
  REQUESTED→APPROVED→RECEIVED→INSPECTED→DISPOSITIONED state machine and
  five dispositions (restock with condition grade / scrap / repair-refurb
  handing off to 044 / replace / refund via credit note) — including golden
  **G-34** for the restock-with-credit posting; **(2)** warranty terms +
  serial/batch-based registrations validated at RMA/service-order creation;
  **(3)** dunning rules + batch runs with an escalation ladder and printed
  letters (generation + print now; channel sending waits for 052); **(4)**
  loyalty programs with earn/burn and POS redemption; **(5)** gift cards
  with a liability-account balance; and **(6)** scheduled monthly
  statements (AD-36-11) into a delivery queue.
- **Business value:** returns, warranty, and collections are where
  margin leaks after the sale — an RMA with inspection stops "credit note
  for goods we never got back", and a dunning ladder with escalation is the
  difference between an aging report and recovered cash. Loyalty + gift
  cards open retail/POS retention programs on the same ledger (liability
  accounting included), with zero external dependencies.
- **Tier / effort:** P2 · ~4 weeks single-stream (two migrations + contracts
  + api suite + RMA/dunning/loyalty screens + two pg-boss jobs + G-34
  golden).
- **Source gaps closed:** H-12, H-13, S-08, S-09, S-14, S-15, S-16,
  AD-36-11.

## 2. Scope

In scope:

1. **RMA workflow (H-12/S-14):** `return_authorizations` (+ lines) against
   invoice lines; reason codes; the state machine
   REQUESTED → APPROVED → RECEIVED → INSPECTED → DISPOSITIONED; dispositions:
   **restock** (inventory receipt with condition grade), **scrap** (write-off
   path), **repair-refurb** (hands off to PHASE-044's rework orders),
   **replace** (new delivery note), **refund** (credit note through the
   existing posting path) — new golden **G-34** candidate for the
   restock-with-credit posting (one posting: stock back + credit note).
2. **Warranty management (S-15):** `warranty_terms` per item family +
   `warranty_registrations` (serial/batch-based, starting from the invoice
   line, with duration and coverage) + warranty validation at RMA and
   service-order creation (in-coverage vs out-of-coverage outcomes are
   explicit, never silent).
3. **Dunning & collections (H-13/S-16):** `dunning_rules` (aging buckets
   30/60/90; channels: statement / letter / email / WhatsApp-template —
   **sending waits for 052; generation + print ship now**) + `dunning_runs`
   (batch letters per bucket, escalation ladder, partner activity log) + the
   AR aging report gains a collection-status dimension (contract version
   bump, not a new ID).
4. **Loyalty (S-08):** `loyalty_programs` (points rules per sales channel /
   item family; earn and burn) + POS/web redemption — payment-method type
   LOYALTY_POINTS (a golden-candidate posting; POS integration via the
   existing cart line discount).
5. **Gift cards (S-09):** `gift_cards` (issue / top-up / redeem; the balance
   is a liability per a new CoA purpose — GIFT_CARD_LIABILITY candidate;
   expiry policy) + POS redemption.
6. **Scheduled statements (AD-36-11):** monthly statement-of-account
   generation + a delivery queue (channel adapters land in 052; the
   `partners.statements` API surface already exists — this phase adds the
   schedule, the queue, and template rendering via PHASE-038).

Out of scope (explicit):

- **Field service (PR-13)** — the PHASE-048 optional lane.
- **Marketing campaigns (S-02)** — shipped by PHASE-040.
- **Fraud detection** — the PHASE-058 proposal lane.
- **WhatsApp/email channel sending** — PHASE-052 (the no-fabrication rule:
  port + fake-adapter per PHASE-023; here we generate and print only).
- **Repair/refurb shop-floor execution** — PHASE-044 (the RMA disposition
  hands off; rework orders are 044's to run).

## 3. Prerequisites

- **PHASE-038 COMPLETE** — print/email templates: dunning letters,
  statements, and RMA documents render through the v2 engine (branding,
  watermarks, PDF export included).
- **PHASE-040 COMPLETE** — `partner_credit_scores` feed the dunning
  escalation ladder; the partner activity-log pattern the dunning runs
  write into.
- **PHASE-016** — the POS cart/payment-method surface loyalty and gift-card
  redemption plug into.
- **PHASE-012** (credit notes + invoice lines — the RMA refund path),
  **PHASE-010** (serials/batches — warranty registration and restock
  condition grades).
- **Binding decisions:** ADR-0002 (monorepo), ADR-0005 (tenant-owned RLS),
  ADR-0007 (centralized posting engine — every RMA/loyalty/gift-card
  posting goes through it), ADR-0008 (pg-boss — dunning runs, statement
  generation, warranty expiry alerts), ADR-0009 (money precision), ADR-0010
  (the CoA purpose mapping for GIFT_CARD_LIABILITY), the v3.0 register §O
  safeguards (frozen accounting core) + §3 rule 4 (no-fabrication — channel
  adapters wait for 052).
- Relevant docs: [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md),
  [ACCOUNTING_INVARIANTS.md](../../accounting/ACCOUNTING_INVARIANTS.md),
  [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [REPORT_CATALOG.md](../../reporting/REPORT_CATALOG.md),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md).

## 4. Design Impact

- **Database:** two additive migrations — `0057_customer_lifecycle.sql`
  (schema_version 57): `return_authorizations` + lines, `warranty_terms`,
  `warranty_registrations`, `dunning_rules`, `dunning_runs`,
  `loyalty_programs`, `gift_cards` — tenant-owned + RLS + UUIDv7; and
  `0058_loyalty_giftcard_ledgers.sql` (schema_version 58):
  `loyalty_transactions` + `gift_card_transactions` (append-only by grants)
  + the GIFT_CARD_LIABILITY CoA purpose mapping seed.
- **Goldens:** **G-34** candidate — RMA restock-with-credit (inventory
  receipt + credit note as one balanced posting through the centralized
  engine; JOURNAL_RULES row + ACCOUNTING_TESTS entry). Loyalty burn and
  gift-card issue/redeem are golden candidates numbered at execution
  (JOURNAL_RULES is the authority).
- **New invariant (INV-032 candidate):** *gift-card/loyalty liability
  reconciles* — the sum of card/program transaction balances must equal the
  GL liability account balance per tenant (a reconciliation test, the
  CC/INV battery pattern).
- **Feature keys (projection):** `sales.rma`, `sales.warranty`,
  `sales.dunning`, `sales.loyalty`, `sales.gift_cards`,
  `partners.collections`, `partners.scheduled_statements` — plan grants
  business + enterprise (tier-4 posture; FEATURE_DEPS rows + seed-drift
  convergence).
- **Permissions (projection):** `sales.rma.manage`, `sales.rma.approve`
  (RISKY — approval-separated from manage, SoD per the matrix §4),
  `sales.warranty.manage`, `sales.dunning.manage`, `sales.loyalty.manage`,
  `sales.gift_cards.manage` → 283 — drift re-pinned consciously, a named
  bump.
- **API:** additive only — the RMA lifecycle, warranty registration and
  validation, dunning rules/runs, loyalty programs + redemption endpoints,
  gift-card issue/top-up/redeem, and the statement schedule; the AR aging
  report contract version-bumps with the collection-status dimension.
- **Web:** the RMA workspace (state machine + disposition actions), the
  warranty registry, dunning rules + run screens with letter printing (038),
  loyalty/gift-card admin + the POS redemption UI, and the statement
  schedule settings; i18n +~200 keys (AR/EN parity from day one).
- **Docs:** FEATURE_CATALOG (+7 keys → 227), ENTITY_CATALOG (+8 entities →
  240), REPORT_CATALOG (aging contract version bump), JOURNAL_RULES (G-34 +
  the loyalty/gift-card rows), DATA_DICTIONARY (RMA states, dispositions,
  dunning buckets), NAVIGATION_MODEL, AUTHORIZATION_MATRIX (+6 → 283 — drift
  re-pinned), IMPLEMENTATION_STATUS / CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T42-A | Migration 0057: the 7 lifecycle tables + RLS + grants | `apps/api/migrations/0057_customer_lifecycle.sql`, `meta/_journal.json` | migrations.spec journal 58 entries (with T42-F); RLS battery picks up the new tables |
| T42-B | Contracts: RMA state machine DTOs, warranty, dunning, loyalty, gift cards + the INV-032 reconciliation test | `packages/contracts/src/sales/**` (+ index exports) | contracts suite; illegal RMA transitions rejected; reason-code enums |
| T42-C | RMA engine: authorization against invoice lines, receive, inspect, dispositions + G-34 golden | `apps/api/src/modules/sales/**`, accounting engine tests | G-34 golden green (stock back + credit note, balanced doc + base currency); each disposition path unit-tested |
| T42-D | Warranty: terms per item family + serial/batch registrations + validation hooks at RMA/service-order creation | `apps/api/src/modules/sales/**` | in-coverage/out-of-coverage outcomes explicit; registration starts from the invoice line |
| T42-E | Dunning: rules (buckets/channels) + batch runs + escalation ladder + partner activity log + letters/statements print via 038 | `apps/api/src/modules/{sales,partners}/**`, web run screens | run generates per-bucket letters; escalation order asserted; aging report shows the collection-status dimension |
| T42-F | Migration 0058: loyalty/gift-card transaction ledgers + the GIFT_CARD_LIABILITY purpose seed | `apps/api/migrations/0058_loyalty_giftcard_ledgers.sql`, CoA seed | purpose maps fail-closed like every PURPOSE row; ledgers append-only by grants |
| T42-G | Loyalty programs: earn/burn rules + POS/web redemption (payment method LOYALTY_POINTS, cart line discount) | `apps/api/src/modules/{sales,pos}/**` | earn/burn math tests; redemption golden-candidate posting balanced |
| T42-H | Gift cards: issue/top-up/redeem + expiry policy + POS redemption + INV-032 reconciliation | `apps/api/src/modules/{sales,pos}/**`, accounting tests | card balance = transactions sum = GL liability (INV-032); expired card redemption rejected |
| T42-I | Scheduled statements: monthly pg-boss generation + delivery queue (052 adapters later) + docs sync | `apps/api/src/modules/partners/**`, `docs/**` | queue rows created on schedule; nothing is "sent" (no fabrication); docs:validate green |

## 6. Verification

- Contracts suite green (RMA/warranty/dunning/loyalty/gift-card DTOs +
  INV-032).
- API unit suite green (the existing baseline grows with the new specs).
- `migrations.spec.ts`: journal 58 entries, manifest consistency.
- Permissions drift: 283 = 283 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- Accounting db suite: the **G-34** golden + the loyalty/gift-card golden
  candidates + the INV-032 liability reconciliation all green.
- No SETTINGS_REGISTRY key wave ships in this phase (buckets and expiry
  policies are per-tenant data rows — no golden re-pin required, noted for
  the record).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: run an RMA against an invoice line — approve → receive →
  inspect → **restock-with-credit** posts G-34 (stock back, credit note
  issued); scrap writes off; replace creates a delivery; a serial inside
  warranty validates while an expired one is rejected explicitly; a dunning
  run generates letters per bucket with the escalation ladder and prints
  them (038); loyalty points earned on an invoice burn at POS; a gift card
  issues → tops up → redeems at POS with the liability reconciling
  (INV-032); the monthly statement lands in the delivery queue.

## 7. Risks and Constraints

- **RMA posting touches inventory + AR together** — G-34's DR/CR design is
  reviewed against JOURNAL_RULES before implementation; corrections after
  disposition are counter-entry-only (the immutability discipline).
- **Loyalty/gift-card liability is regulated-adjacent accounting** — the
  CoA purpose mapping + the INV-032 reconciliation are the guard; expiry
  policy effects (breakage) stay configurable and explicit, never silent.
- **Dunning tone and legal wording vary by jurisdiction** — letters are
  data (038 templates, bilingual, editable per tenant); no wording is
  hard-coded in code.
- **Scope creep toward field service** — PR-13 stays PHASE-048; the RMA
  repair-refurb disposition hands off and no further.

## 8. Completion and Handoff

- Completion report `reports/PHASE-042-COMPLETION.md` with the verification
  table (suites, drift numbers, the G-34 + INV-032 evidence, i18n count,
  browser evidence) + honest deferrals if any.
- Handoff obligations: the delivery queues (statements, dunning channels)
  are documented for PHASE-052's channel adapters (they dequeue and send —
  no template change needed); the repair-refurb handoff is documented for
  PHASE-044; the collection-status dimension is documented for PHASE-053's
  BI layer.
- Next eligible: the W2 gate is checked here ("the trade cycle has no
  manual gaps") — then the register's **W3 operations wave** opens (043 →
  044 → 045 ‖ 046 → 047 → 048); the 050 treasury lane may run in parallel
  per the register's W2 parallel-mark.
