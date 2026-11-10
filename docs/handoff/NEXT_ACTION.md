# Next Action

> **Status:** LIVING DOCUMENT — updated at every phase completion · **Updated:** 2026-11-10 (PHASE-036 executed — the expansion program's first phase)

## The single next action

**PHASE-036 is COMPLETE (2026-11-10) — the post-roadmap expansion program v3.0's
first executed phase: the extensibility backbone is shipped** (evidence:
[../implementation/phases/reports/PHASE-036-COMPLETION.md](../implementation/phases/reports/PHASE-036-COMPLETION.md):
the custom-fields engine (definitions + typed values + picklists, INV-027
machine-checked) · saved views · the bulk/export/copy-to-new productivity suite
on the reference trade lists · the record timeline + comments 🔒 · the
duplicate-invoice tolerance with audited proceed-anyway · the 146th screen
`/{locale}/settings/custom-fields`; migrations 0001–0049; permissions 248=248;
i18n 4,417=4,417; golden pins re-pinned 44/44; CURRENT_SHIPPED_PHASE 035 → 036).
The tree is committed and pushed to the GitHub repository
`kasem520000/ERP_4` (the phase-per-commit delivery workflow).

**NEXT ELIGIBLE: PHASE-037 — Master-Data Depth & Activation Residue (تعميق
البيانات الأساسية وسدّ بقايا التفعيل), on the owner's explicit execution
order.** The register's W1 wave order is 036 → 037 → 038 → 039 (foundation),
then W2–W5 per its §1.1 table. **Delivery discipline: the owner says "begin
PHASE-03NN" (this conversation or a fresh one with the
`ERP_PLATFORM_PHASE036.zip` archive attached) → the phase executes end-to-end
(migration + contracts + api suite + web screens + docs + completion report) →
delivery = a commit+push to the GitHub repository `kasem520000/ERP_4` (the
owner's standing instruction from PHASE-036 on: the repository push replaces
the archive hand-off; an `ERP_PLATFORM_PHASE03NN.zip` is produced only on
explicit request — the repo tree at the phase commit is the byte-equivalent
source).**

**The standing external/infra-gated ledger (unchanged; a documented INCOMPLETE
beats a fabricated pass — directive §1.10–1.11):**

1. **The standing hosted-infra legs** (the owner-directive waiver pattern, with
   named follow-up obligations): the production-class hosted k6 full-load + the
   12 h staging soak + the recovery-region wall time
   ([../testing/PERFORMANCE_TEST_PLAN.md](../testing/PERFORMANCE_TEST_PLAN.md) §8
   — passing on weaker hardware does not close the hosted gate), the external
   pen-test firm leg (the PHASE-024 waiver), and the November backup
   attestation honestly NOT SIGNED (first due 2026-12-01), plus the hosted-CI /
   compose / Testcontainers runs waived since PHASE-001.
2. **ZATCA verification** — the adapter stays the honestly UNVERIFIED
   refuse-to-submit stub ([DR-001](../decisions/compliance/DR-001-zatca-scope-and-timing.md)
   OPEN, option C: the launch segment excludes e-invoicing-requiring taxpayers;
   GATE-1…GATE-4 unmet and named in every refusal — no external access, nothing
   fabricated).
3. **Egypt ETA** — NOT_STARTED pending the approving decision record
   ([DR-003](../decisions/compliance/DR-003-egypt-eta-scope.md) stays the
   DEFERRED draft; the fake-eta evaluation harness proves the port only).
4. **The payment production cutover** — INCOMPLETE with
   [DR-002](../decisions/product/DR-002-payment-provider-selection.md) OPEN (the
   sandbox is hardened; no production cutover claim).
5. **The standing decision-record queue** — DR-P25-01 bug bounty · DR-P25-02
   support SLA (OQ-008) · DR-P25-03 personal payments (OQ-007) · DR-P25-04
   ETA/UAE adapter follow-ups · DR-P25-05 iOS · DR-P25-06 the observability
   exporter swap · DR-P25-07 the report-run quota · DR-024-02 legal review
   (BLOCKED-EXTERNAL, the 90-day working assumption).

Why now: the gap-closure review closed the product's own last four self-found
gaps — the marketing landing, the platform dashboard screen, the thirteenth
template, and the payslip print — with all in-sandbox evidence green (contracts
56/56; apps/api 42 files / 479 tests ALL PASS; validate-manifests 13/13;
template-prerequisites 37/37; golden-effective-configs 44/44;
capability-matrix-reconciliation 6/6; i18n parity ar=en=4,286; the `__db__`
suites on the live harness exactly as before). Everything that remains open is
external or infrastructure — the honest ledger above is the entire list.

How (the standing operating rules, now the product's operating system):

1. The maintenance protocols of every governing document own the cadences: test
   plan §14 (new hot queries → the top-10 EXPLAIN list), performance §9
   (historical results never re-quoted without a re-run note), secrets §8
   (rotation drills), chaos §9, compliance matrix §6 (official-source
   monitoring), backup runbook §8 (quarterly cold drills + monthly
   attestations), DR §7 (readiness inventory quarterly).
2. Any future phase intake follows the handoff protocol: read the completion
   report + the consumed-as-is specs first; register intake keys per
   FEATURE_CATALOG §25 BEFORE code (catalog drift: migrations manifest +
   ENTITY_CATALOG + AUTHORIZATION_MATRIX + schema.ts mirror + runtime
   FEATURE_DEPS + check-rls + attack-suite fixtures for every new table) —
   the PHASE-035 rental intake is the worked example.
3. Do not mark a hosted leg green without its hosted evidence (the honest-marker
   discipline: a documented INCOMPLETE beats a fabricated pass — directive
   §1.10–1.11).
4. The staged client channels' crash gates (10/50/100, halt < 98.5%) stay live
   through and after every rollout; error-budget exhaustion pauses feature
   releases (MONITORING §5 — the policy recorded in the GA checklist).
