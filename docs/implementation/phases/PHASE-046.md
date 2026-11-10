# PHASE-046 — HRIS Core: Attendance, Leaves & Org (نظام الموارد البشرية الأساسي)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W3, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §10 (HR-01…HR-10, HR-13) + §2 (H-05 operational half)
> + §17 (N-17) · **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE046.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-046
- **Title:** HRIS Core — Attendance, Leaves & Org (نظام الموارد البشرية الأساسي)
- **Objective:** Close the **operational half** of H-05. The platform pays people
  but does not manage them: zero tables for attendance, leaves, overtime, shifts,
  org structure or employee documents (the external report's HR score: 26%). This
  phase delivers the **org structure** (org-unit tree, positions, employee→position
  history); **attendance** with shift rosters and late/early/absent derivation;
  **shift patterns + Hijri-aware holiday calendars** (the DF-01 differentiator);
  **leaves** — types, entitlement policies, balances with carry-forward caps,
  requests through 039 chains; **overtime** rules + entries; the **employee
  document registry** with the expiry alert ladder; the **employee↔user link** with
  self-service scoping; and **ESS + MSS** surfaces (AD-36-07). Performance,
  recruitment and training are **explicitly deferred** (§2) per the external
  report's own phase-C ordering.
- **Business value:** any company past ~20 employees stops running HR on paper:
  rosters are published, leave balances are queryable by the employee, iqama/
  passport expiries surface before they become legal problems, and managers
  approve from an inbox. This is the substrate 047 (statutory payroll) and 048
  (project labor) consume.
- **Tier / effort:** P2 · ~6 weeks single-stream (2 migrations + contracts + api
  unit suite + ESS/MSS web screens + docs).
- **Source gaps closed:** H-05 (operational half — the payroll/statutory half is
  PHASE-047), HR-01, HR-02, HR-03, HR-04, HR-05…HR-08 **deferred honestly** (§2),
  HR-09, HR-10, HR-13, N-17 (as port + fake adapter), AD-36-07 — matching the
  register §1 row, which schedules HR-05…HR-08's *deferral* here for precision:
  the register row reads "HR-01…HR-10" and this doc records that HR-05…HR-08
  (performance/goals/recruitment/training) ship as a **decision-gated
  follow-up**, not in this phase.

## 2. Scope

In scope:

1. **Org structure (HR-09):** `org_units` (tree, code/name AR-EN), `positions`
   (org unit + job grade + reports-to position), `position_assignments`
   (employee→position with effective dates — full history, never overwritten).
2. **Attendance (HR-01):** `attendance_records` (check-in/out, source ∈
   MANUAL/WEB/SELF_SERVICE/DEVICE_IMPORT), shift-assignment roster per day,
   late/early/absent derivation rules (configurable tolerance). **Biometric
   device integration = port + fake adapter** (N-17): an
   `attendance_import_formats` registry (the `bank_statement_formats` precedent)
   with a CSV reader + a ZK-style fake device adapter for tests — **no device
   fabrication**; live device cutover is a named waiver per the register §3.4
   rule (the PHASE-023 pattern).
3. **Shifts & rosters (HR-04):** `shift_patterns` (start/end, break, grace
   minutes, cross-midnight flag), weekly rosters per employee/unit, holiday
   calendars — **Hijri-aware**: an Umm al-Qura-based holiday table (DF-01
   differentiator) with tenant override for announced dates.
4. **Leaves (HR-02):** `leave_types` (paid/unpaid/sick/annual…; entitlement
   policy per grade/tenure), `leave_balances` (year + carry-forward cap),
   `leave_requests` (workflow via **039 chains**; calendar-conflict check;
   balance check fail-closed). Hajj/Ramadan/Eid awareness (DF-01/DF-02 hooks):
   a Ramadan reduced-hours policy flag on shift patterns; Hajj-leave type
   treated as once-per-service in the entitlement policy.
5. **Overtime (HR-03):** overtime rules (weekday %, holiday %, caps per
   jurisdiction policy pack — values land with 047's statutory packs; here the
   rule *shape* + tenant caps) + `overtime_entries` (approved → payroll
   variable-component feed — the **integration contract to 047**, versioned as a
   contract, not a live coupling).
6. **Employee documents (HR-10):** document registry with types + expiry dates
   (iqama/passport/license/certificates) + the **expiry alert ladder**
   (30/14/7 days — the certificate-ladder precedent from 023) riding the
   notifications center.
7. **Employee ↔ user link (HR-13):** `users.employee_id` additive NULLable +
   self-service scoping — an employee-linked user sees **own** rows only,
   enforced server-side (RLS-scoped reads; a contracts assertion).
8. **ESS + MSS (AD-36-07):** employee self-service screens (my payslips —
   linking the existing a4-payslip print; my leave balance/request; my
   documents; my overtime) + manager self-service (team roster, leave approvals
   inbox via 039, attendance exceptions view).
9. **Web:** the HR group (الموظفون والرواتب, nav group 10) gains
   الحضور والإجازات items; attendance dashboard; leave calendar with
   **Hijri/Gregorian toggle**; org chart browser.

Out of scope (explicit):

- **Performance (HR-05), goals/competencies (HR-06), recruitment (HR-07),
  training (HR-08)** — decision-gated follow-up; the external report's own
  roadmap places "full HR (performance + recruitment + training)" in its
  phase-C tail, and this register agrees: recorded honestly, not silently
  dropped.
- **Statutory deductions, PIT, EOS automation, WPS/GOSI files** — PHASE-047
  (the payroll/statutory half of H-05, HR-11/HR-12).
- **Any GL posting** — accruals land with 047; this phase is purely operational
  (the frozen-core rule is untouched by construction).
- **Live biometric device protocols, WhatsApp/SMS delivery of HR alerts** —
  port + fake + named waiver; delivery channels ride 052.
- **Expenses (HR-14) and employee loans (HR-15)** — already exist (`expenses`,
  `employee_loans`); no rebuild.

## 3. Prerequisites

- **PHASE-039 COMPLETE** (the register dependency) — approval chains for leave
  requests, overtime approvals, MSS inbox.
- **PHASE-029 base** (shipped) — the `employees`/payroll structures this phase
  extends (org data attaches to the existing employee master, not a parallel
  one).
- **PHASE-035 COMPLETE** — the a4-payslip print template ESS links to; the
  platform overview aggregate pattern the attendance dashboard reuses.
- **PHASE-015 patterns** — SETTINGS_REGISTRY wave convention for grace/roster/
  Ramadan-hours keys.
- **Binding decisions:** ADR-0002 (monorepo), ADR-0005 (multi-tenancy RLS — the
  self-service scoping rides the same macro), ADR-0006 (UUIDv7), ADR-0008
  (import jobs preview-gated — device import follows it), ADR-0009 (hours/
  balances as decimals, never float), the register §O safeguards.
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) (new
  `hr.*` family rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md) (new enums),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) (group 10 additions),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [NEXT_ACTION.md](../../handoff/NEXT_ACTION.md) (execution-order discipline).

## 4. Design Impact

- **Database:** two additive migrations — `0064_hris_core.sql`
  (schema_version 64: `org_units`, `positions`, `position_assignments`,
  `shift_patterns`, `rosters`, `holiday_calendars` + Umm al-Qura seed,
  `attendance_records`, `attendance_import_formats` + import jobs) and
  `0065_hr_leaves_ot.sql` (65: `leave_types`, `leave_balances`,
  `leave_requests`, `overtime_rules`, `overtime_entries`,
  `employee_documents`, additive `users.employee_id`) — tenant-owned + RLS
  macro + UUIDv7 per convention; the ESS scoping adds a self-scope policy on
  the HR tables.
- **No golden postings:** this phase introduces **no GL postings and no golden
  rows** (pure operational; accruals are 047's) — recorded explicitly so the
  JOURNAL_RULES §7 registry stays untouched.
- **Feature keys (projection):** twelve `hr.*` keys — `hr.org_structure`,
  `hr.attendance`, `hr.shifts`, `hr.rosters`, `hr.holidays`,
  `hr.device_import`, `hr.leaves`, `hr.overtime`, `hr.documents`,
  `hr.employee_link`, `hr.ess`, `hr.mss`. Catalog ≈256 after 045 (projection
  assumes the wave's sequential order); +12 here → **≈268** (re-pinned at
  execution).
- **Permissions (projection):** `hr.org.manage`, `hr.attendance.view`,
  `hr.attendance.manage`, `hr.shifts.manage`, `hr.rosters.manage`,
  `hr.leaves.request`, `hr.leaves.approve` (approval-separated — audited),
  `hr.overtime.approve`, `hr.documents.manage`, `hr.mss.view` (+10; ESS reads
  are self-scoped, not permission-widened). Matrix ≈311 after 045 → **≈321** —
  re-pinned consciously, a named bump.
- **API:** additive routes (org/positions, attendance + import, shifts/rosters/
  holidays, leaves lifecycle, overtime, documents, ESS/MSS scoped reads);
  existing payroll payloads unaffected.
- **Web:** group-10 nav additions + ESS/MSS surfaces; i18n +~160 keys (AR/EN
  parity from day one — the Hijri/Gregorian calendar toggle is bilingual by
  construction).
- **Docs:** FEATURE_CATALOG (+12), ENTITY_CATALOG (+~13 entities — re-pinned),
  DATA_DICTIONARY (enums), NAVIGATION_MODEL (group 10 rows),
  AUTHORIZATION_MATRIX (+10 — drift re-pinned), IMPLEMENTATION_STATUS/
  CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T46-A | Migration 0064: org tree, positions, assignments, shifts, rosters, holiday calendars + Umm al-Qura seed, attendance + import formats | `apps/api/migrations/0064_hris_core.sql`, `meta/_journal.json` | journal 65 entries; RLS battery |
| T46-B | Migration 0065: leaves, overtime, documents, `users.employee_id` + self-scope policy | `apps/api/migrations/0065_hr_leaves_ot.sql` | journal consistency; self-scope isolation A-test |
| T46-C | Contracts: org/attendance/leave/OT/document DTOs + self-service scoping assertions | `packages/contracts/src/hr/hris.ts` | contracts suite |
| T46-D | Org + position services (tree integrity, assignment history) | `apps/api/src/modules/hr/**` (or `payroll` extension per boundaries) | unit: no cycles; history append-only |
| T46-E | Attendance engine: records, roster resolution, late/early/absent derivation, cross-midnight shifts | `apps/api/src/modules/hr/**` | unit: derivation table over grace minutes; Hijri holiday honored |
| T46-F | Device import: format registry + CSV adapter + ZK-style fake + preview-gated job (ADR-0008) | `apps/api/src/modules/hr/**` | unit: fake adapter round-trip; no live-device claims |
| T46-G | Leaves: types/entitlements, balances + carry-forward caps, requests via 039 chains, conflict/balance checks | `apps/api/src/modules/hr/**` | unit: over-balance request fails closed; chain approval respected |
| T46-H | Overtime rules/entries + the 047 feed contract; employee documents + expiry ladder (30/14/7) | `apps/api/src/modules/hr/**` | unit: ladder fires at 30/14/7; OT approval gates the feed |
| T46-I | ESS + MSS screens (my payslips/leave/documents/overtime; team roster, approvals inbox, exceptions) + Hijri/Gregorian leave calendar | `apps/web/**` | web typecheck; ESS scoping browser smoke |
| T46-J | Docs sync: catalogs, matrix, dictionary, nav, status, changelog | `docs/**` | `docs:validate` (validator v3.0 ranges 001–058) |

## 6. Verification

- Contracts suite green (new DTOs + self-scoping assertions).
- API unit suite green (the HR module's specs grow accordingly).
- `migrations.spec.ts`: journal **65** entries, manifest consistency.
- Permissions drift: ≈321 = ≈321 (re-pinned consciously — a named bump, recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the grace/roster/Ramadan-hours SETTINGS wave ⇒ pins
  recomputed via the composeTenantStaticConfig pattern, old→new table in
  agent-ctx.
- **Golden postings discipline:** none introduced — the completion report states
  the no-GL boundary explicitly (the re-pin machinery applies only when policy
  defaults land, as above).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: build an org tree with positions, assign an employee with history,
  publish a weekly roster, import a day of attendance through the fake device
  adapter and watch late/absent derive, request leave and approve it through the
  039 inbox with the balance falling and the carry-forward cap applying, open ESS
  as an employee-linked user and see **only own** data, toggle the leave calendar
  Hijri/Gregorian, and receive the 30-day iqama-expiry ladder alert.

## 7. Risks and Constraints

- **Attendance volume:** daily rows × employees × tenure grow fast — monthly
  partition-ready design + hot indexes from day one (the read model stays the
  derivation, raw stays append-only).
- **Hijri correctness:** calendar *conversion* (Umm al-Qura tables) is data;
  *announced* holiday dates are politics — the seeded table is
  tenant-overridable and the seed's provenance is recorded (a
  REQUIRES_VERIFICATION-adjacent discipline; no silent authority claim).
- **Device honesty:** the fake adapter exists for tests and demos only — any
  live-device claim before a waiver is fabrication and must not appear in
  marketing or completion reports.
- **Privacy/SoD:** HR data is the most sensitive tenant data after payroll —
  ESS scoping is server-side enforced and isolation A-tests cover the new
  tables; MSS visibility is limited to the reporting line.
- **Deferred scope honesty:** performance/recruitment/training deferral must be
  restated in the completion report with the decision record pointer — the
  register's "no silent narrowing" rule.

## 8. Completion and Handoff

- Completion report `reports/PHASE-046-COMPLETION.md` with the verification
  table (suites, drift numbers, isolation evidence for ESS scoping, i18n count,
  browser evidence) + the honest deferral ledger (HR-05…HR-08 decision-gated;
  device integration port + fake + waiver).
- Handoff obligations: the approved-overtime/absence **feed contract to 047**
  (variable components), the roster/shift patterns for 044's scheduler upgrade
  (if 044 shipped on static calendars), and the technician roster for 048's
  field-service board are all documented contracts.
- Next eligible: **PHASE-047** (payroll statutory — register dependency on this
  phase) and **PHASE-048** (projects & contracting — deps 039+046).
