# PHASE-039 — Workflow Engine & Approval Orchestration (محرك سير العمل والموافقات متعددة المستويات)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W1, tier P1) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §2 (H-14), §16 (W-01…W-12), §28.2 (PP-17) ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE039.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-039
- **Title:** Workflow Engine & Approval Orchestration (محرك سير العمل
  والموافقات متعددة المستويات)
- **Objective:** Give the platform a **general workflow engine**. Today
  approvals are a single jsonb policy + one `approval_step` integer (H-14):
  no chains (manager → finance → CEO), no amount ladders, no delegation, no
  escalation, no approve-by-email, no step history, no document tasks
  (W-01…W-08). This phase ships the engine as tenant-owned, versioned data —
  `workflow_definitions` + `workflow_steps` (conditional rules jsonb:
  amount ranges, cost centers, custom-field predicates consuming PHASE-036)
  + `workflow_instances` + `workflow_instance_steps` (full history, W-07) —
  as the **v2 engine behind the existing `approval_policies` surface**: the
  single-step policy becomes the one-step special case, and a carrying-
  forward migration translates every live policy with zero behavior change.
  On top: delegation (W-03), SLA reminders + escalation (W-05/W-06), signed
  approve-by-email links (W-04 partial), document tasks + a unified inbox
  (W-08), the visual approval timeline (PP-17), smart alerts (W-11), and
  the webhook event contracts + audit stub (W-12 — emission lands in 052).
- **Business value:** any company above ~30 people runs on approval matrices
  (H-14's verdict); multi-level conditional approval is the substrate later
  phases hard-wire onto — 041's 3-bid/CAPEX chains, 046's HR approvals,
  048's project approvals. Delegation + escalation remove the stuck-invoice
  failure mode ERP buyers test for.
- **Tier / effort:** P1 · ~4 weeks single-stream (two migrations + contracts
  + engine service + carry-forward + five screens + jobs).
- **Source gaps closed:** H-14, W-01, W-02, W-03, W-04 (partial — the email
  action; channel adapters wait for 052), W-05, W-06, W-07, W-08, W-11, W-12
  (contracts + audit stub; emission in 052), PP-17. W-09 (form builder) and
  W-10 (custom actions) are explicitly decision-gated/rejected — see §2.

## 2. Scope

In scope:

1. **General workflow engine (W-01):** `workflow_definitions` (tenant; entity
   kind; trigger events — SUBMIT, AMOUNT_THRESHOLD, …; **versioned**: an edit
   is a new version, running instances keep their pinned version) +
   `workflow_steps` (ordered; conditional rules jsonb — amount ranges, cost
   centers, custom-field predicates consuming 036's definitions; assignee
   resolver ∈ role / user / owner-manager) + `workflow_instances` +
   `workflow_instance_steps` (full history W-07: state, assignee, decided_at,
   duration, comments) — all tenant-owned + RLS + UUIDv7.
2. **Multi-level conditional approvals (H-14/W-02):** chains (manager →
   finance → CEO), amount ladders, department/cost-center routing; migration
   0054 carries every live `approval_policies` row forward as the one-step
   special case (same documents, approvers, thresholds — equivalence-tested).
3. **Delegation (W-03):** `approval_delegations` (from-user, to-user, window,
   scope: all / entity-kind / definition) resolved **at assignment time**;
   an OUT_OF_OFFICE indicator on the user. Security assertion: delegation
   routes **work, never privileges** — the delegate must already hold the
   step's permission (a contracts test).
4. **Escalation + reminders (W-05/W-06):** step SLA hours → reminder, then
   escalation assignee; pg-boss jobs (ADR-0008); delivery via in-app + inbox
   notifications (the existing notifications center) — the email channel
   waits for PHASE-052.
5. **Approve-by-email (W-04 partial):** signed action links — one-time,
   expiring tokens bound to (instance, step, user) — in notification emails;
   approve/reject from email without login; every action audited (token id,
   timestamp, IP, user-agent).
6. **Document tasks (W-08):** tasks attached to documents — a workflow step
   can spawn a task; the `crm_tasks` model generalized with an
   entity-kind/id target; a unified **task inbox** screen.
7. **Approval timeline UI (PP-17):** a visual step timeline on every
   workflow-enabled document (state, assignee, duration, comments) — the
   "سلسلة موافقة مرئية" polish item.
8. **Rules-engine smart alerts (W-11):** the workflow condition evaluator
   doubles as the smart-alert substrate — `smart_alert_definitions`
   (event/predicate/recipients) + an evaluation job (e.g. notify the owner
   when an invoice is overdue > X days).
9. **Webhook event stub (W-12):** event types + payload shapes defined in
   contracts and recorded as audit_events — **emission to external endpoints
   lands in PHASE-052** (the no-fabrication rule); here the contracts and the
   audit trail exist.

Out of scope (explicit):

- **Form builder (W-09)** — decision-gated; a PHASE-057 candidate (needs
  036's substrate plus an ADR before any implementation).
- **Custom actions scripting (W-10)** — **rejected**: no tenant code
  execution (standing security rule); a decision record documents the
  rejection so the gap is closed honestly as NOT-GOING-TO-SHIP.
- **BPMN diagram editor** — the timeline UI is the visualization; BPMN is
  ceremony without value here.
- **Email/SMS delivery channels** — PHASE-052 (port + fake-adapter pattern
  per PHASE-023).
- **Any posting-engine change** — the engine routes approvals; posting stays
  inside the document lifecycle services (frozen-core rule).

## 3. Prerequisites

- **PHASE-036 COMPLETE** — custom-field predicates inside step rules; the
  record timeline/comments pattern the step history reuses; migration 0049
  landed (this phase projects 0053/0054 after 037's 0050/0051 and 038's
  0052 per the W1 wave order).
- **The existing approval surface** — `approval_policies` (the
  `accounting.approvals` feature: none/single/two-step/amount-threshold,
  PHASE-007) + the approval-gated documents (expenses BR-023, budgets,
  payroll runs) the carry-forward must reproduce exactly.
- **PHASE-019** — the `crm_tasks` model W-08 generalizes.
- **Binding decisions:** ADR-0002 (monorepo), ADR-0005 (tenant-owned RLS),
  ADR-0006 (identifiers), ADR-0008 (pg-boss — SLA/escalation/alert jobs,
  tenant-scoped executors), ADR-0015 (authentication — the signed action-link
  tokens extend the existing token discipline), the v3.0 register §O
  safeguards (frozen accounting core).
- Relevant docs: [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md)
  §4 (SoD + approval limits — gains the delegation rule),
  [BUSINESS_RULES.md](../../product/BUSINESS_RULES.md) (approval-gated
  rules), [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md),
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md).

## 4. Design Impact

- **Database:** two additive migrations — `0053_workflow_engine.sql`
  (schema_version 53): `workflow_definitions`, `workflow_steps`,
  `workflow_instances`, `workflow_instance_steps` (append-only by grants),
  `approval_delegations`, `smart_alert_definitions` — tenant-owned + RLS +
  UUIDv7; and `0054_approval_policy_carryforward.sql` (schema_version 54):
  translates every live `approval_policies` row into a one-step definition
  (the policies table stays read-compatible — the existing surface keeps
  working).
- **New invariants (candidates):** **INV-028** — *the workflow engine never
  posts* (no workflow table or service writes journal lines; machine-checked
  by a contracts test over the posting-engine DTO surface, the INV-027
  forbidden-surface pattern); **INV-029** — *delegation resolves work, never
  privilege* (the delegate's permission set is asserted at action time).
- **Feature keys (projection):** `workflow.engine`, `workflow.delegation`,
  `workflow.escalation`, `workflow.email_approval`, `workflow.tasks`,
  `workflow.smart_alerts` — plan grants business + enterprise (tier-4
  posture; FEATURE_DEPS rows + seed-drift convergence).
- **Permissions (projection):** `workflow.definitions.manage`,
  `workflow.instances.read`, `workflow.delegations.manage`,
  `workflow.tasks.manage`, `workflow.alerts.manage` → 262 — drift re-pinned
  consciously, a named bump. Approve/reject actions reuse each entity's
  existing approve permission (no widening — a contracts assertion).
- **API:** additive routes (definitions CRUD + versioning, instances
  read/act, delegations, task inbox, alerts); the existing per-entity
  submit/approve endpoints invoke the engine internally — no breaking shape
  change (API_CONVENTIONS compatibility rule).
- **Web:** the workflow designer (Settings group), the unified task inbox,
  the approval-timeline component mounted on every workflow-enabled document,
  the delegation panel + OUT_OF_OFFICE indicator; i18n +~190 keys (AR/EN
  parity from day one).
- **Docs:** FEATURE_CATALOG (+6 keys → 203), ENTITY_CATALOG (+6 entities →
  217), DATA_DICTIONARY (trigger events, step states, rule operators),
  AUTHORIZATION_MATRIX §4 (+5 → 262 — drift re-pinned), NAVIGATION_MODEL,
  IMPLEMENTATION_STATUS / CHANGELOG, plus the W-10 rejection decision record.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T39-A | Migration 0053: the 6 engine tables + RLS + grants | `apps/api/migrations/0053_workflow_engine.sql`, `meta/_journal.json` | migrations.spec journal 54 entries (with T39-D); RLS battery picks up the new tables |
| T39-B | Contracts: workflow DTOs + the condition-operator schema (amount/cost-center/custom-field predicates) + INV-028/INV-029 tests | `packages/contracts/src/workflow/**` (+ index exports) | contracts suite; delegation-never-widens assertion; forbidden-surface test |
| T39-C | Engine service: instance spawn on trigger, step resolution, conditional routing, decision application, history append | `apps/api/src/modules/workflow/**` (new module per boundaries) | routing matrix unit tests (chains, ladders, predicates) |
| T39-D | Carry-forward migration 0054 + equivalence harness | `apps/api/migrations/0054_approval_policy_carryforward.sql`, `apps/api/src/modules/workflow/**` | every live policy → one-step definition; golden approval scenarios produce identical outcomes pre/post |
| T39-E | Delegation + OUT_OF_OFFICE + assignment-time resolution | `apps/api/src/modules/workflow/**`, identity profile surface | window/scope resolution tests; delegate-without-permission rejected |
| T39-F | SLA reminder + escalation pg-boss jobs + notifications-center integration | `apps/api/src/modules/workflow/**` jobs, notifications module | test-clock escalation; reminder-then-escalate order asserted |
| T39-G | Signed action links (one-time, expiring tokens) + email approve/reject + audit | `apps/api/src/modules/workflow/**`, auth token service | token single-use + TTL + user-bound tests; audit rows on every action |
| T39-H | Document tasks + unified task inbox + the approval timeline UI | `apps/api/src/modules/{workflow,crm}/**`, `apps/web/src/app/**` | inbox aggregation tests; timeline component snapshot (AR/EN) |
| T39-I | Smart alerts (definitions + evaluator job) + webhook event contracts + audit stub + docs sync | `apps/api/src/modules/workflow/**`, `packages/contracts/src/workflow/**`, `docs/**` | alert fires on overdue > X (test clock); webhook payload contracts validated; docs:validate green |

## 6. Verification

- Contracts suite green (workflow DTOs + INV-028/INV-029 + the webhook event
  payload shapes).
- API unit suite green (the existing baseline grows with the engine specs).
- `migrations.spec.ts`: journal 54 entries, manifest consistency.
- Permissions drift: 262 = 262 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- No SETTINGS_REGISTRY key wave ships in this phase (SLA values live per
  definition row, not in settings — no golden re-pin required, noted for the
  record).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: define a three-step amount-ladder workflow on sales
  invoices; submit above the threshold → routed manager → finance → CEO;
  delegate during a window; expire an SLA on the test clock → reminder then
  escalation; approve from an email link (single-use token — a second click
  fails); read the timeline; a pre-existing single-step policy still
  approves identically; a smart alert fires on an overdue invoice; a
  step-spawned task lands in the unified inbox.

## 7. Risks and Constraints

- **The carry-forward is the riskiest row:** every live approval policy must
  behave identically — an equivalence harness runs the golden approval
  scenarios pre/post cutover (report attached to the completion report).
- **Rule-evaluator complexity** — a bounded operator whitelist (amount,
  cost-center, custom-field predicates); no eval, no tenant expressions (the
  W-10 rejection discipline applies to the evaluator too).
- **Approve-by-email is an attack surface** — one-time, expiring, user-bound
  tokens; rate-limited; every action audited with token id + IP.
- **SLA jobs at scale** — pg-boss batching with tenant-scoped executors
  (ADR-0008 normative rules); the escalation path never spams (one reminder,
  one escalation, then visible-stuck state).

## 8. Completion and Handoff

- Completion report `reports/PHASE-039-COMPLETION.md` with the verification
  table (suites, drift numbers, the carry-forward equivalence report, i18n
  count, browser evidence) + honest deferrals if any.
- Handoff obligations: the engine is the mandated approval substrate for 041
  (3-bid + CAPEX + budget routing), 046 (HR approvals), and 048 (project
  approvals); the webhook event contracts are documented for PHASE-052's
  emission fabric; the task inbox is the mandated pattern for later phases.
- Next eligible: **PHASE-040** opens the register's W2 commerce wave
  (040 → 041 → 042 ‖ 050); 041's dependency (039 only) is satisfied; W1's
  gate ("every screen extensible, every claimed feature real, every approval
  multi-level") is checked at completion.
