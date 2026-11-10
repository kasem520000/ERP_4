# PHASE-048 — Projects & Contracting: WBS, Certificates & Field Service Lite (إدارة المشاريع والمقاولات)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W3, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §11 (PR-01…PR-15) + §2 (H-06) + §29 (DF-08) + §3 (A-12)
> · **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE048.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-048
- **Title:** Projects & Contracting — WBS, Certificates & Field Service Lite
  (إدارة المشاريع والمقاولات)
- **Objective:** The `projects` table is an analytical dimension of six columns
  (H-06) — no budget, no WBS, no EVM, no change orders, no subcontractors, no
  retention; a contracting or consulting company "is not served at all" by the
  current tree. This phase turns the dimension into a module: **WBS** with
  dependencies and a Gantt read-model; **project budget vs actual** over the
  existing GL dimension; **progress + earned-value metrics**; **resource
  assignments** against real timeslips; **change orders** through 039 chains; the
  **GCC contracting core (DF-08)** — subcontract agreements + progress certificates
  (المستخلصات) with BOQ quantities, retention and advance recovery generating the
  customer invoice and the subcontractor bill from one certificate; **retention
  tracking** with defect-liability release; **milestone/percent progress billing**;
  **payroll-dimensioned labor cost into project WIP**; **full project P&L**;
  **field service lite** (scheduling board + SLA alerts — full FSM decision-gated);
  and employee custody/advances (العهد, A-12).
- **Business value:** contracting is the region's largest non-retail sector and
  the external report names GCC contracting support (مستخلصات · احتجاز) a
  differentiation opportunity where "SAP is very expensive here" (DF-08). A
  contractor can finally run one certificate end-to-end: BOQ quantities →
  retention → advance recovery → net payable → invoice + subcontractor bill,
  with WIP and profitability visible per project.
- **Tier / effort:** P2 · ~6 weeks single-stream (1 migration + contracts + api
  unit suite + project workspace web + docs).
- **Source gaps closed:** H-06, PR-01, PR-02, PR-03, PR-04, PR-05, PR-06,
  PR-07, PR-08, PR-09, PR-10, PR-11, PR-12, PR-13, PR-14, PR-15, DF-08, A-12
  (the register §1 row exactly; PR-13…PR-15 close via field service *lite*
  with the full FSM explicitly gated, §2).

## 2. Scope

In scope:

1. **WBS (PR-04):** `project_tasks` tree (WBS code, dates, owner, FS/SS
   dependencies, % complete rules — manual or weighted-children) + a Gantt
   read-model (rendered; progress and dates update through the task records).
2. **Project budget (PR-01):** budget lines by cost category **linked to the
   projects dimension already on journal lines** (the budget engine's
   `scope=PROJECTS` becomes real) + a budget-vs-actual report contract (per
   project + rollup).
3. **Progress & EVM (PR-02):** % complete by method, PV/EV/AC → SPI/CPI/EAC — an
   earned-value report contract, decimal math end-to-end.
4. **Resources (PR-03 + PR-10 full):** resource assignments (employee/asset/item)
   per task with planned hours vs `crm_time_entries` actuals — time entries gain
   the **project_task dimension** (PR-10's "contracts only" limit retired).
5. **Change orders (PR-05):** `project_change_orders` (scope delta, delta
   value, approval chain via **039**) revising budget and contract value —
   approved orders restate the baseline; nothing rewrites history.
6. **Subcontractors & certificates (PR-06/PR-11/DF-08):** `subcontract_agreements`
   + `progress_certificates` — BOQ items with previous/current/cumulative
   quantities, retention %, advance recovery, and a computed **net payable**; one
   certificate generates the **customer invoice** and the **subcontractor bill**
   (both walk their ordinary approve/post chains).
7. **Retention (PR-07):** retention receivable/payable tracking per certificate,
   released upon defect-liability expiry (a dated release workflow with approval).
8. **Progress billing (PR-11):** milestone/percent billing schedules — the
   `recurring_invoice_rules` pattern from 040 generalized to "on milestone /
   on % complete", generating DRAFT invoices only.
9. **Labor cost (PR-09):** payroll run lines dimensioned by project
   (timesheet-driven allocation) → labor cost posts to **project WIP**
   (**golden G-36 candidate**, §4).
10. **Profitability (PR-12):** full project P&L — recognized revenue
    (certificates/billing) + WIP cost + overhead allocation via the 050 cycles
    when they ship — as a report contract.
11. **Field service lite (PR-13/PR-14/PR-15):** service-order scheduling board with
    the technician roster from 046 shifts + SLA-breach alerts through the **039
    rules engine**. Full FSM (dispatch optimization, van stock, returns
    logistics) is decision-gated — recorded honestly.
12. **Employee custody/advances (A-12):** العهد tracking on projects — custody
    issued to an employee against a project, settled by expense claim or return;
    distinct from payroll loans.
13. **Web:** the project workspace (overview / WBS / Gantt / budget / certificates /
    files via **036 attachments**), the field-service board, the project P&L.

Out of scope (explicit):

- **Full FSM** (dispatch optimization, route planning, van-stock integration) —
  decision-gated follow-up; this phase ships the board + alerts only.
- **Project manufacturing MTO** — already 045's M-22 linkage; not rebuilt here.
- **Customer portal for project status (S-20-adjacent)** — deferred by
  decision; ESS-style surfaces cover internal stakeholders.
- **Frozen-core discipline:** every posting (G-36, certificate revenue,
  retention lines) goes through the engine's registered purposes with
  fail-closed maps; invoice/bill generation reuses the existing trade canon
  (G-01 family) — no new document-posting machinery.

## 3. Prerequisites

- **PHASE-039 COMPLETE** (the register dependency) — change-order and
  certificate approval chains; the rules engine for SLA-breach alerts.
- **PHASE-046 COMPLETE** (the register dependency) — technician roster +
  shifts for the scheduling board; the employee master behind custody.
- **PHASE-019 base** (shipped) — `projects` dimension (journal-line stamps),
  `crm_tasks`, `crm_time_entries`, `service_contracts`, `service_orders`:
  this phase **builds on** them (the projects stamp becomes a module) rather
  than forking a second projects concept.
- **PHASE-028 base** (shipped) — the budget engine (`scope=PROJECTS`) the
  project budget lines extend.
- **PHASE-036 COMPLETE** — attachments on every new entity (the workspace's
  files tab) + custom-field rendering on WBS/certificate records.
- **PHASE-040 pattern** (W2, ordering assumption) — `recurring_invoice_rules`
  generalized by progress billing; **PHASE-047 soft** — payroll run lines' project
  dimension (labor cost): if either has not executed, progress billing lands behind
  its feature key disabled and labor cost degrades gracefully to timeslip-cost-only
  — the report says so.
- **Binding decisions:** ADR-0002 (monorepo), ADR-0007 (posting engine — G-36
  through registered purposes), ADR-0009 (all money NUMERIC(19,4)/decimal.js),
  ADR-0011 (report contracts), the register §O safeguards.
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) (new
  `projects.*` family rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) §7 (G-36 candidate),
  [REPORT_CATALOG.md](../../reporting/REPORT_CATALOG.md) (+3 contracts),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) (projects workspace
  item), [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md).

## 4. Design Impact

- **Database:** one additive migration `0067_projects_contracting.sql`
  (schema_version 67): `project_tasks`, `project_budget_lines`,
  `project_change_orders`, `subcontract_agreements`, `progress_certificates` +
  `certificate_lines` (BOQ rows: previous/current/cumulative qty, retention %,
  advance recovery), `project_billing_schedules`, `resource_assignments`,
  `employee_custodies` (+ settlement), additive project dimension on
  `crm_time_entries` and payroll run lines, retention columns — tenant-owned +
  RLS macro + UUIDv7 per convention.
- **New golden (G-36 candidate):** *project WIP posting* — timesheet-driven labor
  allocation posts DR `PROJECT_WIP` · CR `WIP_LABOR_CLEARING` (the payroll expense
  re-class); as certificates recognize revenue, WIP relieves to
  `PROJECT_COST_EXPENSE`, with retention lines posting DR `AR_CONTROL` (net) + DR
  `RETENTION_RECEIVABLE` · CR `PROJECT_REVENUE` (gross) through registered
  purposes (fail-closed maps). Failure pack: certificate without a project
  dimension → refuses.
- **Feature keys (projection):** eleven `projects.*` keys —
  `projects.wbs`, `projects.budgeting`, `projects.evm`, `projects.resources`,
  `projects.change_orders`, `projects.subcontracting`,
  `projects.certificates`, `projects.retention`,
  `projects.progress_billing`, `projects.profitability`,
  `projects.field_service_lite` (+ custody folded into resources). Catalog
  ≈273 after 047 (projection); +11 here → **≈284** (re-pinned at execution).
- **Permissions (projection):** `projects.wbs.manage`,
  `projects.budgets.manage`, `projects.change_orders.approve`
  (approval-separated — audited), `projects.subcontracting.manage`,
  `projects.certificates.manage`, `projects.certificates.approve` (separated),
  `projects.retention.release` (separated), `projects.billing.manage`,
  `projects.pnl.view` (+9). Matrix ≈326 after 047 → **≈335** — re-pinned
  consciously, a named bump.
- **API:** additive routes (workspace reads, WBS CRUD, change orders,
  certificates lifecycle, billing schedules, board + SLA alerts, custody);
  invoice/bill generation calls the existing trade services.
- **Web:** the project workspace archetype + field-service board; i18n +~150
  keys (AR/EN parity from day one — certificate labels are bilingual by
  construction: المستخلص / progress certificate).
- **Docs:** FEATURE_CATALOG (+11), ENTITY_CATALOG (+~10 entities — re-pinned),
  DATA_DICTIONARY (enums), NAVIGATION_MODEL (workspace row),
  AUTHORIZATION_MATRIX (+9 — drift re-pinned), JOURNAL_RULES §7 (G-36),
  REPORT_CATALOG (+3: budget-vs-actual, EVM, project P&L),
  IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T48-A | Migration 0067: WBS, budget lines, change orders, subcontracts, certificates + BOQ lines, billing schedules, assignments, custody, additive dimensions | `apps/api/migrations/0067_projects_contracting.sql`, `meta/_journal.json` | journal 67 entries; RLS battery |
| T48-B | Contracts: WBS/budget/certificate/retention DTOs + certificate math shape tests | `packages/contracts/src/projects/contracting.ts` | contracts suite |
| T48-C | WBS service (tree, FS/SS dependencies, % complete rules) + Gantt read-model | `apps/api/src/modules/projects/**` | unit: weighted-children math decimal; cycle rejection |
| T48-D | Project budget over the GL dimension + budget-vs-actual report contract | `apps/api/src/modules/projects/**` + `apps/api/src/modules/reporting/**` | unit: rollup = Σ projects; §11 assertions |
| T48-E | EVM engine (PV/EV/AC → SPI/CPI/EAC) + earned-value report contract | `apps/api/src/modules/projects/**` | unit: metric math decimal; report registry validation |
| T48-F | Change orders via 039 chains (baseline restatement) + resource assignments + time-entry project dimension (PR-10) | `apps/api/src/modules/projects/**` + `apps/api/src/modules/crm/**` (hook) | unit: approved order restates; unapproved never touches baseline |
| T48-G | Certificates: BOQ cumulative math, retention %, advance recovery → net payable → customer invoice + subcontractor bill via existing chains | `apps/api/src/modules/projects/**` + `{sales,purchasing}/**` hooks | unit: cumulative quantities monotonic; both docs from one certificate |
| T48-H | Retention tracking + defect-liability release workflow; progress billing schedules (040 pattern); PR-08 advances generalization | `apps/api/src/modules/projects/**` | unit: release after DLP expiry only; DRAFT-only generation |
| T48-I | G-36 golden (labor → project WIP → relief) + project P&L report + custody tracking | `apps/api/src/modules/projects/**`, `apps/api/src/__db__/projects/**` | g36 golden + failure packs; INV-010 intact |
| T48-J | Field-service lite: scheduling board (046 roster), SLA-breach alerts (039 rules) + project workspace web + docs sync | `apps/web/**`, `docs/**` | browser smoke (§6); `docs:validate` |

## 6. Verification

- Contracts suite green (new DTOs + certificate-math shape tests).
- API unit suite green (the projects module's specs grow accordingly).
- `migrations.spec.ts`: journal **67** entries, manifest consistency.
- Permissions drift: ≈335 = ≈335 (re-pinned consciously — a named bump, recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the retention-%/DLP/billing SETTINGS wave ⇒ pins
  recomputed via the composeTenantStaticConfig pattern, old→new table in
  agent-ctx.
- **G-36 golden re-pin discipline:** JOURNAL_RULES §7 + ACCOUNTING_TESTS §3 row
  with mandatory failure packs; golden effective-configs regenerate when the
  new project policy defaults land (the composeTenantStaticConfig script
  pattern).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: create a project with a three-level WBS and FS dependencies,
  budget it against cost categories, assign an employee with planned hours and book
  a timeslip against the task, approve a change order through the 039 inbox and
  watch the baseline restate, issue a progress certificate with cumulative BOQ
  quantities + retention + advance recovery generating both the customer invoice
  and the subcontractor bill, release retention after the defect-liability expiry,
  open the EVM report (SPI/CPI/EAC) and the project P&L, see the G-36 labor posting
  on the journal, issue custody to a technician and settle it, and watch an
  SLA-breach alert fire on the field-service board.

## 7. Risks and Constraints

- **Certificate math complexity:** cumulative BOQ quantities, retention and advance
  recovery are where money silently leaks — decimal math, monotonic-cumulative checks
  fail closed, and every invoice/bill figure traces to its certificate line (INV-006).
- **WIP accounting policy:** percentage-of-completion vs completed-contract is
  a tenant policy (default conservative); purpose maps fail closed — an
  unmapped `PROJECT_WIP` purpose stops the posting, never guesses.
- **Cross-module payroll coupling:** PR-09 depends on 047's run-line dimension
  (and the graceful timeslip-only fallback) — the integration contract is
  versioned so 047 changes cannot silently break allocation.
- **Board scope creep:** field service lite must stay lite; dispatch optimization
  is a decision-gated follow-up the completion report names if pressure appears.
- **Gantt performance:** the read-model is materialized per project, not
  computed per request; deep WBS trees (500+ tasks) stay within the p50 budget
  or the phase records the miss honestly.

## 8. Completion and Handoff

- Completion report `reports/PHASE-048-COMPLETION.md` with the verification
  table (suites, drift numbers, G-36 golden + failure packs, re-pin tables,
  i18n count, browser evidence) + the deferral ledger (full FSM decision-gated;
  040-pattern degradation outcome if applicable).
- Handoff obligations: the W3 wave's gate check — "a factory and a
  100-employee company can run on it" (L4 core) — is now scorable across
  043–048; the certificate/invoice contract documented for 042/040 surfaces;
  the project P&L contract documented for 050 (overhead cycles) and 053 (BI).
- Next eligible: no later phase hard-depends on 048 (register §1) — the owner may
  order W4 (**051 → 052 → 053**, ‖ 056) or the W5 verticals per their own
  dependencies; the register §3.5 completion criterion (weighted re-score,
  accounting ≥94%, no axis <60%, top-5 criticals closed) is the next checkpoint.
