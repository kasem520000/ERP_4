# PHASE-058 — AI Assistants & Document Intelligence (المساعدات الذكية وذكاء المستندات)

> **Status:** PROPOSED — DECISION-GATED · not scheduled until an ADR formally revisits
> SCOPE_AND_NON_GOALS non-goal #9 (AI/assistant) · **Documented:** 2026-11-10 ·
> **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W5, tier P4) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §29.3 (DF-25…DF-35) + §20 (UX-19/20) ·
> **Execution:** requires the owner's decision record FIRST; then per-phase order
> (delivery = `ERP_PLATFORM_PHASE058.zip` only if ordered)

## 1. Phase Overview

- **Phase ID:** PHASE-058
- **Title:** AI Assistants & Document Intelligence (المساعدات الذكية وذكاء المستندات)
- **Objective:** This is a **proposal, not a plan**. The platform's own scope
  document lists "AI copilots and chat interfaces" as **explicit non-goal #9**
  ("not part of the core platform promise; may be revisited post-GA"), and the
  external evaluation itself flags the tension (DF-25: "غير هدف معلن (رقم 9) — يجب
  إعادة النظر"). This document keeps the register's promise that every candidate
  has a *named, code-anchored* home: if — and only if — the owner writes an ADR
  that formally revisits non-goal #9, this is where the §29.3 differentiator
  family (DF-25…DF-35), the last UX candidates (UX-19/20), and G-07 fraud
  detection land. The proposal covers: **(1)** document intelligence — OCR
  supplier-invoice capture with confidence-scored human review (DF-26/DF-31);
  **(2)** a read-only, curated-tool **copilot** (DF-25); **(3)** anomaly/fraud
  detection on journals feeding a review queue (DF-28/DF-35/G-07); **(4)** the
  suggestion-only assists — smart reorder (DF-30), fuzzy bank match (DF-34), CoA
  classification (DF-27), cash-flow prediction overlay (DF-29); **(5)** Arabic
  report summaries with an explicit AI label (DF-32); **(6)** the lowest-priority
  voice-entry candidate (DF-33); **(7)** e-signature (UX-19) — not AI, but grouped
  here as the terminal UX candidate. Every item is **individually gated**: the
  parent ADR opens the family; each item still needs its own decision record.
- **Business value (if ordered):** the evaluation calls OCR "أكبر توفير وقت ممكن"
  (the single biggest time saver on offer) and the §29.3 family a real
  price-justification opportunity; anomaly detection converts the 056 audit
  workspace from curated queries into statistical coverage. None of this is
  claimed today — see the honest boundaries in §2.
- **Tier / effort:** P4 · ~6 weeks single-stream **if ordered in full** (per-item
  DRs may order subsets; estimates re-cut per item at decision time).
- **Source gaps closed (if ordered):** DF-25, DF-26, DF-27, DF-28, DF-29, DF-30,
  DF-31, DF-32, DF-33, DF-34, DF-35, UX-19, UX-20, G-07.

## 2. Scope

Proposed scope — **each item individually gated by its own decision record** (the
parent ADR revisiting non-goal #9 is the family's prerequisite, not a blanket
approval):

1. **OCR supplier invoices (DF-26 / DF-31 / UX-20):** a document-intelligence
   **port (VisionPort) + fake adapter + named gate** — the capture wizard:
   upload → extracted fields (supplier, number, date, lines, totals) →
   **confidence-scored review** → draft supplier invoice. **Never auto-posted** —
   human confirmation is mandatory on every document; extraction, scores, and
   confirmation are audit-trailed.
2. **Copilot (DF-25):** an LLM-backed assistant over a **curated tool surface** —
   query reports, explain a journal entry (the PP-08 human-readable narrative
   family), draft an email. **Read-only tools + explicit user confirmation for any
   write**; the privacy boundary is absolute (no cross-tenant data in prompts;
   per-tenant context only); **cost metering** per tenant per call; the LlmPort
   ships as **port + fake for tests — no cloud key in the repo** (the
   no-fabrication rule).
3. **Anomaly detection (DF-35 / G-07):** rules + statistical outliers on journals
   — weekend postings, round-amount spikes, duplicate patterns, unusual account
   pairs — feeding a **review queue** (curated, read-only; the PHASE-056
   internal-audit queries gain statistical checks on top of their curated set).
   Detection flags review items; it never blocks, reverses, or posts anything.
4. **Smart reorder (DF-30):** demand-history-aware reorder **suggestions** (moving
   average + seasonality-lite). **Recommendation-only — MRP stays deterministic**
   (the PHASE-045 engine is untouched; suggestions are a side panel the planner
   never consumes silently).
5. **Fuzzy bank match (DF-34):** bank-statement auto-match v2 — fuzzy reference/
   amount/date scoring with a configurable threshold; **suggest-only until
   confirmed** (the confirm action writes the same reconciliation the manual flow
   writes today).
6. **Account classification assist (DF-27):** ML-assisted CoA category suggestion
   on the PHASE-037 COA import — **suggestion-only** (the importer's human review
   step is unchanged and remains mandatory).
7. **Cash-flow prediction (DF-29):** a forecast **overlay** — an ML curve on top
   of the PHASE-050 deterministic forecast, **labeled clearly as an estimate**
   (the deterministic numbers stay authoritative; the overlay is a visibly
   separate, explicitly-labeled layer).
8. **Arabic report summaries (DF-32):** report → Arabic executive summary
   generation via the LlmPort with an **explicit "AI-generated" label** on every
   rendered summary (never presented as accountant output).
9. **Voice entry (DF-33) — candidate only:** speech-to-text on mobile notes — the
   family's lowest priority; gated separately and expected to stay deferred even
   if the family is ordered.
10. **E-signature (UX-19):** document e-signature — draw/type/cloud-signature
    surfaces on print documents + a verification hash. **Not AI** — grouped here
    only as the last UX candidate; the most orderable item in the family (pure
    product code, no external model dependency).

**Honest boundaries (mandatory for this proposal):**

- **The scope non-goal:** [SCOPE_AND_NON_GOALS.md](../../SCOPE_AND_NON_GOALS.md)
  non-goal #9 stands until an ADR formally revisits it — nothing below may start,
  and no marketing sentence may reference it, before that ADR exists.
- **CD-05 (anti-fabrication marketing rule):** no AI/OCR/ML capability may appear
  in any marketing surface, pricing copy, or trust-center claim until it is live
  and verified — the compliance-matrix ladder governs every public sentence.
- **No fabrication:** every external-dependency surface (VisionPort, LlmPort,
  SpeechPort) ships as **port + fake adapter + named verification gate** exactly
  like the PHASE-023 pattern; **no cloud credentials in the repo**, ever; the live
  cutover is a named waiver per tenant.
- **Data privacy:** tenant data never leaves the platform without an **explicit
  per-tenant opt-in + a signed DPA** — per-tenant context isolation is a contract
  test (no cross-tenant prompt content, ever), and the opt-in gates the feature
  key per tenant rather than per plan.

Out of scope (explicit):

- **Any auto-posting, auto-approval, or auto-reversal** driven by a model — the
  frozen-core and human-confirmation disciplines are absolute.
- **Marketplace/plugin AI agents, autonomous workflows** — non-goal #2 adjacent;
  not proposed.
- **Model training on tenant data** — never proposed; inference-only under the
  privacy boundary above.

## 3. Prerequisites

- **The parent ADR FIRST** — an owner decision record that formally revisits
  SCOPE_AND_NON_GOALS non-goal #9 and defines the family's guardrails (orderable
  items, privacy posture, cost ceiling). Without it this document remains a
  proposal and nothing here is scheduled.
- **PHASE-052 COMPLETE** (register dependency): the integration-fabric ports/
  adapters + metering + usage counters every AI surface rides (cost metering; the
  057 adoption events).
- **PHASE-053 COMPLETE** (register dependency): the report surfaces the copilot
  queries and the summarizer consumes.
- **Soft prerequisites per item:** PHASE-037 (CoA import, DF-27), PHASE-045 (MRP
  determinism boundary, DF-30), PHASE-050 (deterministic forecast, DF-29),
  PHASE-056 (the audit-query substrate DF-28/DF-35 extends).
- **Binding decisions (if ordered):** the no-fabrication rule (register §3.4),
  CD-05, the frozen accounting core + posting-engine monopoly (INV-013 — no model
  output ever reaches the engine without a human-confirmed document), ADR-0009
  (money precision on every scoring/metering surface).

## 4. Design Impact

- **Database:** **n/a — decision-gated, no migration projection.** If items are
  ordered, each lands its own additive migration (numbered at execution against
  the then-current journal; the 057 projection ends at 0078). Candidate tables:
  `document_extractions` (fields + confidence + confirmation audit),
  `ai_cost_metering` (tenant; port; calls/tokens; period), `anomaly_review_items`
  (rule + statistics + disposition), `smart_reorder_suggestions`,
  `bank_match_suggestions`, `coa_classification_suggestions`,
  `cashflow_prediction_overlays`, `report_summaries` (AI label persisted),
  `document_signatures` (hash + verification) — all tenant-owned + RLS macro +
  UUIDv7 per the repo convention.
- **Feature keys:** **no keys projected** — the family is ungated until the ADR +
  per-item DRs land; the candidate list (one key per ordered item, e.g.
  `ai.ocr_capture`, `ai.copilot`, `ai.anomaly_detection`, `ai.report_summaries`,
  `documents.e_signature`) is recorded in each item's DR. The entitlement posture
  (per-tenant opt-in + DPA before activation) is part of the parent ADR.
- **Permissions:** candidates only (`ai.extractions.review`,
  `ai.anomalies.review`, `documents.esign.manage`) — numbered and seeded only when
  an item is ordered; the drift battery arbitrates at execution.
- **Ports (the no-fabrication core):** `VisionPort` (OCR), `LlmPort` (copilot /
  summaries / classification / prediction), `SpeechPort` (voice candidate) — each
  a port interface + **fake adapter** (deterministic fixtures: known invoice
  images, canned completions, canned transcripts) + a **named live-verification
  gate** (owner-supplied credentials at cutover, never in repo).
- **API:** additive routes only, per ordered item; every write-capable surface
  (capture confirm, suggestion accept) reuses the existing document lifecycles —
  no new posting paths.
- **Web:** the capture wizard (upload → fields → confidence review → draft
  invoice), the copilot panel (curated tools + confirmation step + cost badge),
  the anomaly review queue, suggestion side-panels (reorder/bank-match/
  classification), the prediction overlay toggle (explicitly labeled), the
  AI-labeled Arabic summaries, the e-signature surfaces. i18n: AR/EN parity from
  day one for every ordered surface — **including the "AI-generated" label
  itself**.
- **Docs:** per ordered item — FEATURE_CATALOG/ENTITY_CATALOG/AUTHORIZATION_MATRIX/
  DATA_DICTIONARY/NAVIGATION_MODEL/IMPLEMENTATION_STATUS/CHANGELOG updates in the
  same delivery (register §3.3); the parent ADR + per-item DRs land in the
  decision register first.

## 5. Implementation Plan

Contingent tasks — **executed only for ordered items**, in decision order:

| # | Task (if ordered) | Expected files | Test hook |
|---|------|-----------------|-----------|
| T58-A | The parent ADR (non-goal #9 revisit) + per-item decision records + the privacy/cost guardrails contract | `docs/architecture/ADR/**`, decision register | ADR registered; DRs per ordered item; **no item starts without its DR** (docs battery verifies) |
| T58-B | Ports: VisionPort + LlmPort (+ SpeechPort candidate) with fake adapters + cost metering + per-tenant opt-in gates | `apps/api/src/ports/**`, `apps/api/src/modules/platform/**` | fake-adapter contract suites; **no cloud key in repo** assertion; metering rows per call; opt-in blocks unconsented tenants |
| T58-C | OCR capture wizard: upload → extraction → confidence-scored review → draft supplier invoice (never auto-posted) | `apps/api/src/modules/purchasing/**`, `apps/web/**` | golden capture flow on the fake VisionPort: confirmation mandatory (no-confirm → no invoice); extraction + confirmation audit-trailed |
| T58-D | Copilot: curated read-only tool surface + explicit write-confirmation + PP-08-style narratives + cost badge | `apps/api/src/modules/{reporting,accounting}/**`, `apps/web/**` | tool allowlist contract (unknown tool rejected); **no cross-tenant data in prompts** (isolation test); writes require confirmation |
| T58-E | Anomaly detection: rules + statistical outliers → read-only review queue (extends 056's curated checks) | `apps/api/src/modules/{audit,accounting}/**`, `apps/web/**` | seeded-anomaly fixtures fire (weekend/round/duplicate/pair rules); queue provably read-only; zero posting/blocking side effects |
| T58-F | Suggestion-only assists: smart reorder + fuzzy bank match + CoA classification (configurable thresholds; human confirm mandatory) | `apps/api/src/modules/{inventory,treasury,configuration}/**`, `apps/web/**` | suggestions never write without confirmation; MRP determinism untouched (045 fixtures re-run green); importer review step unchanged |
| T58-G | Cash-flow prediction overlay + Arabic report summaries (both explicitly labeled; authoritative surfaces unchanged) | `apps/api/src/modules/{treasury,reporting}/**`, `apps/web/**` | overlay renders as estimate-labeled layer (050 fixtures unchanged); every summary carries the persisted AI-generated label |
| T58-H | E-signature (UX-19): draw/type/cloud-signature on print documents + verification hash; voice-entry candidate (DF-33, gated lowest priority); docs sync per ordered item | `apps/api/src/modules/files/**`, `apps/**`, `docs/**` | signature hash round-trip + verification page; print render carries the signature block; SpeechPort fake transcript test; `docs:validate` green; drift battery green |

## 6. Verification

- **At decision time (before anything else):** the parent ADR exists and formally
  revisits non-goal #9; each ordered item has its own DR; no marketing/pricing/
  trust copy references any AI capability (CD-05 sweep); no cloud credentials
  anywhere in the repo (secret-scan).
- **At execution (per ordered item):** contracts suite green (port contracts +
  fake adapters + the privacy/allowlist/confirmation gates as *contract* tests);
  api unit suite green; migrations journal consistent (additive-only, numbered at
  execution — no projection claimed here); permissions drift re-pinned
  consciously per ordered key (a named bump, recorded); i18n parity ar=en
  (including the AI-generated label); golden effective-configs **re-pinned if any
  SETTINGS wave ships** (thresholds, cost ceilings — old→new table recorded in
  agent-ctx, the §18 lesson-5 relay); `docs:validate` green.
- **Frozen-core proof:** the full existing golden pack re-runs green — no model
  output posts, blocks, or reverses anything without a human-confirmed document;
  the 045 MRP and 050 forecast fixtures re-run byte-identical (the deterministic
  surfaces are untouched).
- **Browser smoke (per ordered item):** capture an invoice image through the fake
  VisionPort, review confidence scores, confirm → draft invoice (attempted
  auto-post rejected); ask the copilot to explain a journal entry and draft an
  email (cost badge visible; write requires confirmation); open the anomaly queue
  on seeded outliers; accept a reorder/bank-match/classification suggestion and
  watch the human-confirm step; toggle the prediction overlay (estimate-labeled);
  generate an Arabic summary (AI label rendered); sign a document and verify its
  hash.

## 7. Risks and Constraints

- **The governance risk is the feature:** an ERP copilot that hallucinates a
  number an accountant then trusts is worse than no copilot — hence read-only
  curated tools, mandatory human confirmation, confidence scoring, AI labels on
  every generated surface, and the deterministic engines remaining authoritative.
- **Privacy/cost blast radius:** cross-tenant prompt leakage and unbounded token
  spend are the two failure modes the contract tests target first; per-tenant
  opt-in + DPA + metering + ceilings are gates, not settings.
- **Scope creep across ten items:** the family is deliberately over-included (the
  external report lists eleven) and under-committed (every item separately gated)
  — the realistic first order is 2–4 items (OCR + anomaly + e-signature are the
  most self-contained); the DRs cut the real scope.
- **Marketing discipline:** the moment any item ships, the pressure to claim
  "AI-powered ERP" in copy will be real — CD-05 governs: claims only for live,
  verified capabilities, per the compliance-matrix ladder.

## 8. Completion and Handoff

- **Completion (only if ordered):** `reports/PHASE-058-COMPLETION.md` with the
  verification table (suites, drift, golden re-pin, i18n, browser evidence) + the
  honest ledger: live-verification gates still open per port (waiver pattern),
  unordered candidates carried forward with their DR status, the cost/privacy
  telemetry summary.
- **Handoff obligations:** the port/fake/gate pattern documentation for any
  future model vendor; the metering schema (shared with 057 adoption events) as
  the platform's standing AI-cost surface; the DR trail as the precedent for any
  later non-goal revisit.
- **Next eligible: none — this is the program's terminal proposal.** The
  register's scheduled waves end at 057; ordering 058 (or any subset) is an owner
  decision that starts with the ADR, and the completion criterion of the whole
  program (register §3.5 — the weighted matrix re-score, accounting ≥ 94%, no
  axis < 60%) does not depend on it.
