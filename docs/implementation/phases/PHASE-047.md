# PHASE-047 — Payroll Statutory & Compliance (الامتثال القانوني للرواتب)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W3, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §10 (HR-11, HR-12) + §13 (X-02) + §12 (T-11) ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE047.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-047
- **Title:** Payroll Statutory & Compliance (الامتثال القانوني للرواتب)
- **Objective:** Close the half of H-05 the external report marks "legally
  dangerous": **zero GOSI/social-insurance computation, zero payroll income tax,
  and an end-of-service amount typed in by hand** (HR-11/HR-12/X-02). This phase
  delivers the **statutory deduction engine** as versioned, effective-dated
  jurisdiction rules (GOSI Saudi pension/Hazard/SANED employer + employee rates;
  Jordan civil-service/military funds; Egypt social-insurance tiers — every rate
  REQUIRES_VERIFICATION-sourced, never guessed); **payroll income tax** per
  jurisdiction (KSA's no-PIT-on-salaries recorded honestly as a zero-rule; Jordan
  progressive brackets; Egypt brackets + exemptions); **EOS automation** replacing
  the manual provision input; **WPS SADB + GOSI file generation** (AD-36-06) with
  download endpoints — transmission stays manual/ported; **treasury-linked
  disbursement and non-payroll employee advances** (T-11); and the automatic 046
  overtime/attendance feed into payroll variable components.
- **Business value:** the platform becomes legally employable in its three
  launch jurisdictions — social-insurance and tax numbers stop being a
  spreadsheet beside the system, EOS stops being a negotiation, and WPS/GOSI
  files stop being retyped into bank portals by hand.
- **Tier / effort:** P2 · ~4 weeks single-stream (1 migration + contracts + api
  unit suite + web screens + docs).
- **Source gaps closed:** HR-11, HR-12, X-02, T-11, AD-36-06 (the register §1
  row exactly). X-01/X-03…X-13 (corporate income tax, WHT, Zakat, excise,
  SAF-T…) belong to PHASE-051 — nothing here duplicates them.

## 2. Scope

In scope:

1. **Statutory deduction engine (HR-11/X-02):** jurisdiction policy packs —
   `statutory_rules` **versioned with effective dates** (the
   `jurisdiction_tax_rates` precedent: `verified_at` + `source_ref`, values
   ship REQUIRES_VERIFICATION and flip to VERIFIED only via the
   compliance-matrix protocol). KSA GOSI (employer/employee shares across
   pension / occupational-hazard / SANED), Jordan (civil-service/military
   funds), Egypt (social-insurance tiers). The payroll run integrates each rule
   as **employee-share deduction** + **employer-share contribution component**
   (employer share = expense; employee share = deduction off net).
   **Golden G-35 candidate:** statutory accrual posting (§4).
2. **Payroll income tax (X-02/PIT):** bracket computation per jurisdiction —
   KSA: **no PIT on salaries, recorded honestly as an explicit zero-rule**
   (an empty bracket table is a *fact*, not a missing feature); Jordan
   progressive brackets; Egypt brackets + personal exemptions. Same
   verification discipline; same decimal math.
3. **EOS automation (HR-12):** end-of-service rules engine — Hijri hire-date
   aware, service-years fractionation, the half-month/full-month salary table
   per remaining-days band (Saudi Labor Law Art. 84 shape; Jordan/Egypt
   variants), replacing PHASE-029's **honestly-admitted manual EOS provision
   input** with a computed value + override-with-audit (the manual path
   upgrades, it does not disappear).
4. **WPS files (AD-36-06):** Saudi Wage Protection System SADB file generation
   — per-bank header/detail/trailer records, HMAC fields where the published
   spec mandates them; format constants sourced from published central-bank
   specs (REQUIRES_VERIFICATION provenance), a per-bank format registry, a
   download endpoint, and **manual/ported transmission** — no bank API
   fabrication (register §3.4; the live cutover is a named waiver).
5. **GOSI file export (AD-36-06):** contribution-file generation against the
   published GOSI layout, same discipline: generate + download; submission
   itself is the operator's portal action, recorded as a waiver until an
   integration fabric exists (052+).
6. **Treasury integration (T-11):** payroll disbursement via a treasury payment
   batch linked to the WPS file (the payout posting stays G-30's shape — only
   the batch linkage is new); non-payroll **employee cash advances from petty
   cash with settlement tracking** (distinct from `employee_loans`: custody-
   style advances with settlement against expense claims).
7. **Overtime/attendance feed:** 046's approved overtime and absence entries
   become payroll **variable components automatically** (the integration
   contract 046 ships) — the run pulls them, the run never invents them; every
   pulled line references its source entry (INV-006 chain discipline).
8. **Web:** statutory rules screens (per-jurisdiction editor with verification
   status), WPS/GOSI file download center (generation history + re-download),
   EOS calculator on the employee card (computed vs. override diff).

Out of scope (explicit):

- **Corporate income tax (X-01), WHT (X-03), Zakat (X-06), excise/stamp (X-04/
  X-05), non-VAT returns (X-07), SAF-T (X-12)** — PHASE-051's tax expansion.
- **Live GOSI/bank submission, any bank API** — port + file generation only;
  transmission is manual with a named waiver (no-fabrication rule).
- **HR-05…HR-08 operational HR depth** — the decision-gated follow-up recorded
  in 046.
- **Frozen-core discipline:** no new posting shapes beyond the G-35 statutory
  accrual through the engine's registered purposes (fail-closed maps); G-29/
  G-30/G-31 shapes are extended, not rewritten.

## 3. Prerequisites

- **PHASE-046 COMPLETE** (the register dependency) — the overtime/absence feed
  contract, employee master, Hijri-aware calendars (EOS service years read
  hire dates against the same calendar discipline).
- **PHASE-029 base** (shipped) — payroll runs, component model, G-29/G-30/
  G-31 canon, the manual EOS provision path this phase upgrades.
- **PHASE-009 discipline** (shipped) — the REQUIRES_VERIFICATION tax-pack
  pattern (`verified_at` + `source_ref` + official-source provenance; adapters
  refuse unverified regimes) that `statutory_rules` mirrors exactly.
- **PHASE-023 pattern** (shipped) — port + fake adapter + honest verification
  gate; the WPS/GOSI file generators follow its "no external access claimed"
  posture.
- **Binding decisions:** ADR-0002 (monorepo), ADR-0007 (posting engine — G-35
  through registered purposes only), ADR-0009 (rates/amounts NUMERIC(19,4) +
  decimal.js — **INV-028 candidate**, §4), ADR-0010 (tax jurisdiction packs —
  the statutory packs are its payroll sibling), the register §O safeguards.
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) §13
  (payroll rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) §7 (G-29…G-31 + G-35
  candidate), [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  the compliance-matrix localization docs (verification protocol).

## 4. Design Impact

- **Database:** one additive migration `0066_payroll_statutory.sql`
  (schema_version 66): `statutory_rules` (+ rule rows seeded REQUIRES_VERIFICATION
  with source refs), PIT bracket tables, EOS rule tables (Art. 84-shaped band
  table per jurisdiction), `wps_file_batches`, `gosi_export_batches` (generated-
  file registry with per-bank format refs), petty-cash advance/settlement rows,
  additive run-line columns (statutory rule version snapshot + source-entry
  refs for the 046 feed) — tenant-owned + RLS macro + UUIDv7 per convention.
- **New golden (G-35 candidate):** *statutory accrual posting* — on run post,
  employer-share contributions accrue: DR `EMPLOYER_CONTRIBUTIONS` (expense) ·
  CR `STATUTORY_PAYABLE` (employer share), while employee shares reduce net
  through `DEDUCTIONS_PAYABLE` (G-29's shape extended with the statutory
  purpose); settlement at treasury payment clears `STATUTORY_PAYABLE` (the
  G-30 payout mirror). Failure pack: run with an unverified rule version →
  refuses to post (fail-closed, the no-guessing gate).
- **New invariant (INV-028 candidate):** *payroll statutory deduction math
  precision* — every statutory/tax computation is decimal.js over
  NUMERIC(19,4) inputs, rounding per the rule's declared rounding mode; a
  contracts + unit battery forbids float anywhere in the statutory path.
- **Feature keys (projection):** five `payroll.*` keys —
  `payroll.statutory`, `payroll.pit`, `payroll.eos_automation`,
  `payroll.statutory_files`, `payroll.treasury_link`. Catalog ≈268 after 046
  (projection); +5 here → **≈273** (re-pinned at execution).
- **Permissions (projection):** `payroll.statutory.manage` (risky — audited),
  `payroll.statutory.verify` (the VERIFIED flip, separated from manage),
  `payroll.eos.manage`, `payroll.files.generate`, `payroll.disburse.manage`
  (+5). Matrix ≈321 after 046 → **≈326** — re-pinned consciously, a named
  bump.
- **API:** additive routes (rules CRUD + verification flip, PIT preview, EOS
  compute/override, file generation/download, disbursement batch linkage);
  run payloads gain optional statutory sections.
- **Web:** statutory editor + file center + EOS calculator; i18n +~90 keys
  (AR/EN parity from day one).
- **Docs:** FEATURE_CATALOG (+5), ENTITY_CATALOG (+~8 entities — re-pinned),
  DATA_DICTIONARY (rule enums), AUTHORIZATION_MATRIX (+5 — drift re-pinned),
  JOURNAL_RULES §7 (G-35), ACCOUNTING_TESTS (G-35 + INV-028 rows),
  IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T47-A | Migration 0066: statutory rules + seeds (REQUIRES_VERIFICATION + source refs), PIT brackets, EOS bands, file batches, advance/settlement rows | `apps/api/migrations/0066_payroll_statutory.sql`, `meta/_journal.json` | journal 66 entries; seeds carry source_ref |
| T47-B | Contracts: rule/bracket/EOS/file DTOs + INV-028 no-float forbidden-surface test | `packages/contracts/src/payroll/statutory.ts` | contracts suite |
| T47-C | Statutory engine: versioned rule resolution at run date, employee/employer split, run integration | `apps/api/src/modules/payroll/**` | unit: effective-date snapshot; unverified rule blocks post |
| T47-D | PIT computation per jurisdiction (KSA zero-rule explicit; Jordan progressive; Egypt brackets + exemptions) | `apps/api/src/modules/payroll/**` | unit: bracket math decimal; zero-rule is a recorded fact |
| T47-E | EOS rules engine (Hijri-aware service years, band table, computed + override-with-audit) | `apps/api/src/modules/payroll/**` | unit: Art. 84 band cases; override writes audit row |
| T47-F | G-35 golden: statutory accrual posting + settlement mirror + failure packs | `apps/api/src/modules/payroll/**`, `apps/api/src/__db__/payroll/**` | g35 golden + failure packs; G-29 shape intact |
| T47-G | WPS SADB generator (per-bank registry, header/detail/trailer, HMAC where mandated) + download endpoint | `apps/api/src/modules/payroll/**` | unit: byte-shape goldens per bank; no transmission claim |
| T47-H | GOSI contribution-file generator + download; verification-status gate on both generators | `apps/api/src/modules/payroll/**` | unit: layout constants from spec refs; unverified → refuse |
| T47-I | Treasury link: disbursement batch ↔ WPS file; petty-cash advances + settlement | `apps/api/src/modules/payroll/**` + `apps/api/src/modules/treasury/**` (hook) | unit: batch linkage idempotent; settlement clears advance |
| T47-J | 046 feed activation (OT/absence → variable components with source refs) + web screens + docs sync | `apps/web/**`, `docs/**` | browser smoke (§6); `docs:validate` |

## 6. Verification

- Contracts suite green (new DTOs + the INV-028 no-float battery).
- API unit suite green (the statutory path's specs grow accordingly).
- `migrations.spec.ts`: journal **66** entries, manifest consistency.
- Permissions drift: ≈326 = ≈326 (re-pinned consciously — a named bump, recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the statutory-default SETTINGS wave ⇒ pins
  recomputed via the composeTenantStaticConfig pattern, old→new table in
  agent-ctx.
- **G-35 golden re-pin discipline:** JOURNAL_RULES §7 + ACCOUNTING_TESTS §3 row
  with mandatory failure packs; the golden effective-configs regenerate when
  the new statutory policy defaults land (the composeTenantStaticConfig script
  pattern).
- **Verification ledger:** every seeded rate row carries `source_ref` +
  `verified_at NULL` (REQUIRES_VERIFICATION); nothing flips to VERIFIED inside
  this phase without the compliance-matrix checklist — the completion report
  publishes the pack-status table honestly.
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: open the statutory editor and see GOSI/Jordan/Egypt packs with
  their verification badges, run a payroll with approved overtime from 046 flowing
  in as variable components and the employer/employee shares split in the run
  lines, post the run and see the G-35 accrual journal, generate a WPS file for
  two banks and re-download it, compute EOS on an employee card with a Hijri hire
  date and override it with an audit row, disburse via a treasury batch linked to
  the WPS file, and settle a petty-cash advance.

## 7. Risks and Constraints

- **Rate accuracy is legal risk:** the REQUIRES_VERIFICATION gate is the guard —
  an unverified rule refuses to post; the platform must never ship
  "we think GOSI is 9.75%" as a working number.
- **Retro-effective rule changes:** statutory rules are effective-dated and
  versioned; past runs never re-compute (the snapshot discipline) — corrections
  go through off-cycle runs, recorded as such.
- **WPS format drift:** banks publish variants; the per-bank format registry +
  byte-shape goldens keep generation honest, and a spec change is a versioned
  registry update, not a code guess.
- **EOS legal variants:** the Art. 84 band table is recorded with its source;
  Jordan/Egypt variants ship only where sources were checked — absent source =
  the rule stays REQUIRES_VERIFICATION and the calculator says so.
- **Transmission honesty:** generating a file ≠ submitting it; the UI and the
  completion report must keep saying "transmission is manual" until a waiver
  names a live integration.

## 8. Completion and Handoff

- Completion report `reports/PHASE-047-COMPLETION.md` with the verification
  table (suites, drift numbers, G-35 golden + failure packs, the statutory
  pack verification ledger, i18n count, browser evidence) + the transmission-
  waiver list (WPS/GOSI submission remain manual).
- Handoff obligations: the variable-component feed contract back to 046 (now
  live), the project-dimension hooks payroll run lines expose for 048's labor
  allocation, and the statutory-rules table shape documented for 051's tax
  expansion (X-01/X-03+ reuse the same versioned-rule substrate).
- Next eligible: **PHASE-048** (projects & contracting — deps 039+046, both
  complete by then); no later phase hard-depends on 047, so the owner may also
  order W4 (051/052/053) — the W3 gate re-score becomes checkable once 048
  lands.
