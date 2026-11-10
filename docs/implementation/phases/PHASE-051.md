# PHASE-051 — Tax Expansion & E-Invoicing Phase-1 (التوسع الضريبي والفوترة الإلكترونية — المرحلة ١)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W4, tier P1) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §13 (X-01…X-13) + §2 (H-01 — offline half only) + this
> register's AD-36-01/AD-36-13 ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE051.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-051
- **Title:** Tax Expansion & E-Invoicing Phase-1 (التوسع الضريبي والفوترة
  الإلكترونية — المرحلة ١)
- **Objective:** move the tax axis from "ممتاز في VAT، صفر في الباقي" (62%) to a
  full statutory stack, and ship the **fully-offline ZATCA Phase-1 readiness** — the
  external report was blunt: the QR half "لا تحتاج أي وصول خارجي — هي مجرد ترميز
  رياضي" and its absence "قرار لا حاجة". This phase delivers **(1)** legal
  document numbering series (AD-36-01 — sequential, gapless, the ZATCA ICV
  prerequisite); **(2)** the Phase-1 offline stack — TLV QR encoder, ICV, PIH
  SHA-256 hash chain, UBL 2.1 XML, QR image embed via 038; **(3)** the corporate
  income tax provision engine + return workspace (X-01) with the Zakat alternative
  (X-06); **(4)** withholding tax (X-03); **(5)** the non-VAT returns workspace +
  compliance calendar (X-07/X-11); **(6)** multi-year tax reports (X-10); **(7)**
  the SAF-T-style audit file export (X-12); **(8)** the UAE FTA readiness port
  (AD-36-13); and **(9)** decision records for excise/stamp (X-04/X-05).
- **Business value:** the KSA market's legal precondition (Phase-1 QR invoices that
  scan) plus the CIT/Zakat/WHT stack every serious Saudi or Jordanian accountant
  asks for — with every rate carrying a source citation and nothing fabricated.
- **Tier / effort:** P1 · ~5 weeks single-stream (migration + contracts + api unit
  suite + web screens + docs + completion report).
- **Source gaps closed:** H-01 (**offline half only** — Phase-2 clearance/reporting
  stays DR-001-gated per register §2; see the boundary below), X-01, X-03, X-06,
  X-07, X-10…X-13 (X-13 candidate — §2 item 9), AD-36-01, AD-36-13. X-02 is 047's
  row; X-04/X-05 ship as decision records only (§2 item 10); X-08/X-09 are the
  live-portal halves that remain gated.

**Honest boundary (repeated in §7):** nothing here contacts ZATCA, submits, signs,
or claims clearance. Phase-2 (portal submission, CSID certificates, XAdES signing,
live reporting) stays behind compliance DR-001 (OPEN) with the four PHASE-023 gates
unchanged — what ships is mathematical encoding and local serialization, exactly
the half the external report proved needs no external access.

## 2. Scope

In scope:

1. **Legal document numbering series (AD-36-01):** `document_number_series` — per
   tenant + document type + branch/jurisdiction, sequential and **gapless with a
   DB-enforced no-gaps CHECK** (each issued number = previous + 1, enforced in the
   issuance transaction); the ZATCA ICV prerequisite and general legal numbering.
   Sales invoices and credit notes migrate to series-based numbering with a
   **dual-write transition period** (legacy + series numbers recorded per document;
   cutover per the BR transition discipline — never a big-bang renumber).
2. **ZATCA Phase-1 offline stack (H-01 offline half):**
   - **TLV QR encoder** — seller name, VAT registration number, timestamp, invoice
     total, VAT total in the published TLV→base64 spec. Pure math, no gate.
   - **ICV + PIH** — ICV derives from the numbering series; PIH is the SHA-256 hash
     of the previous invoice, stored in an append-only `invoice_hash_chain` table
     (evidence — never rewritable).
   - **UBL 2.1 XML** — standalone invoice/credit-note serialization from the
     existing invoice payload, extending the 023 **NON_AUTHORITATIVE
     compliance-archive payload builder**; validated locally against the published
     XSD where the schema ships with the spec.
   - **QR image embed** — a real scannable QR (closing H-02's "[QR] text, not
     image" defect) on A4/receipt templates via the 038 renderer, plus a
     digital-stamp placeholder for the future Phase-2 stamp.
3. **E-invoicing log report:** the F-6 `tax.e-invoicing-log` is delivered by 037
   (T37-C per the register); this phase **extends** it with QR/ICV/PIH/UBL columns so
   every invoice's compliance state is auditable in one report.
4. **Corporate income tax (X-01):** provision engine — taxable P&L adjustments
   schedule, permanent/temporary differences register, deferred-tax computation — +
   return workspace per jurisdiction (KSA 20% on tax-base profit vs the Zakat
   alternative for Saudi-owned; Jordan 20% + advances; Egypt 22.5% brackets).
   **Every rate carries a source citation in the `statutory_rules` registry** (the
   REQUIRES_VERIFICATION discipline extended to direct taxes); the Zakat base table
   (X-06) is REQUIRES_VERIFICATION where the published ZATCA base is unverified.
   Provision posting through the engine — golden **G-41** candidate.
5. **Withholding tax (X-03):** WHT rate table per nature-of-payment × jurisdiction
   (source-cited); deduction at payment creation (the WHT leg withholds and posts
   through the engine); WHT certificates printing (038); monthly return workspace.
6. **Non-VAT returns workspace (X-07) + compliance calendar (X-11):** return
   calendar per jurisdiction (VAT + CIT + Zakat + WHT + payroll filings) with
   periods, status, and filing-due ladders → `compliance_calendar` with an alert job.
   The governance-side obligation kinds (G-08, 056's row) extend this same table
   later — an adjacency recorded here, not a double-claim.
7. **Multi-year tax reports (X-10):** comparative tax reports (VAT-by-year,
   effective-tax-rate history) on the existing report contracts.
8. **SAF-T-style audit file (X-12):** read-only export package — GL + AR/AP +
   inventory registers in a structured audit-file XML/CSV per a **documented
   schema**; jurisdiction-specific SAF-T where published (Jordan/Egypt candidates).
   No new postings; the exporter rides the existing report export pipeline.
9. **UAE FTA readiness port (AD-36-13):** the 023 adapter registry gains the UAE
   family (offline-generation profile) with REQUIRES_VERIFICATION gates — UAE
   mandates roll 2026+, so this ships the port shape and honest gates, never a
   claimed adapter. **X-13 (transfer pricing)** lands as a candidate: the IC pricing
   hooks read 050's intercompany pairs; the TP pack requires a decision record.
10. **Excise/stamp (X-04/X-05):** decision records only — implement vs defer,
    recorded honestly with the reasoning (excise is currently a declared SCOPE
    non-goal; changing that is an owner decision, not a phase default).

Out of scope (explicit):

- **ZATCA Phase-2 clearance/reporting** (portal submission, CSID enrollment, XAdES
  signing): DR-001 stays OPEN; the shipped adapter remains the refuse-to-submit stub
  until the four gates pass (register §2.1). **Egypt ETA live** — DR-003 deferred.
- **Payroll income tax (X-02)** — 047's row; **excise/stamp implementation** —
  decision records only (§2 item 10).
- **Any new posting mathematics outside the engine** — provisions and WHT legs post
  through the one engine (frozen core).

## 3. Prerequisites

- **PHASE-038** — the QR embed and WHT certificates ride its renderer;
  verify-before-print is its pattern; **PHASE-023** — the ZATCA adapter family, the
  NON_AUTHORITATIVE payload-builder pattern, and the GATE-1…4 discipline extended,
  never bypassed; **PHASE-037 (T37-C)** — the F-6 log report this phase extends.
- **050 adjacency (not a dependency):** intercompany pairs (if shipped) feed the
  X-13 candidate hooks; the wave order never assumes it.
- **Binding decisions:** compliance DR-001 (ZATCA scope/timing — OPEN, respected),
  DR-003 (Egypt ETA — deferred), ADR-0009 (money precision), the frozen accounting
  core (register §O), the REQUIRES_VERIFICATION discipline (DF-23, preserved
  verbatim).
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) (new
  `tax.*` rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) (G-41),
  [REPORT_CATALOG.md](../../reporting/REPORT_CATALOG.md) (extended F-6 columns,
  new tax reports), [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md).

## 4. Design Impact

- **Database:** one additive migration `0071_tax_statutory.sql` (schema_version 71):
  `document_number_series` (+ issuance transaction function with the no-gaps CHECK),
  `invoice_hash_chain` (append-only grants hardened), `statutory_rules` (rates +
  source citations + verification status), `tax_provision_runs` (+ differences
  register), `wht_rates` (+ per-payment WHT legs), `compliance_calendar` (+ kinds),
  audit-file export configs. Additive columns: invoices/credit notes gain
  `series_id`/`icv`/`pih`/`qr_payload` (dual-write transition columns). Journal →
  **71 entries**.
- **New invariant (INV-032 candidate — re-pinned if earlier waves consumed the
  numbers):** *numbering integrity + archive non-authority* — a series is gapless
  by construction; the hash chain is append-only; QR/UBL/PIH artifacts are
  NON_AUTHORITATIVE archives that **never feed the posting engine or the AR/AP
  subledgers** (the INV-027 forbidden-surface pattern, applied to compliance).
- **Golden (G-41 candidate — continuing the G-33+ sequence from G-32; re-pinned at
  execution):** CIT provision posting (DR current-tax expense/deferred legs · CR tax
  provision — source-cited rates only; REQUIRES_VERIFICATION rates refuse to post).
- **Feature keys (projection):** `tax.numbering_series`, `tax.einvoice_phase1`
  (QR/ICV/PIH/UBL), `tax.corporate_income_tax`, `tax.zakat`, `tax.withholding_tax`,
  `tax.return_calendar`, `tax.multi_year_reports`, `tax.audit_file`,
  `tax.uae_readiness` — +9 keys (projection ≈298 program total; the delta is the
  binding figure, the total re-pinned at execution). Plan grants: business +
  enterprise (KSA saleability demands business tier).
- **Permissions (projection):** `tax.numbering.manage`, `tax.einvoice.manage`,
  `tax.cit.manage`, `tax.zakat.manage`, `tax.wht.manage`, `tax.returns.manage`,
  `tax.audit_file.export`, `tax.uae.manage` — +8 keys, a named bump (projection
  ≈349; re-pinned consciously at delivery).
- **API:** extensions to the `tax` module + a statutory subpackage — additive routes
  only; QR/ICV/PIH computation is a pure-function suite (golden byte-shape
  assertions on TLV/base64); UBL validates locally against the shipped XSD.
- **Web:** numbering-series manager, QR/UBL verify-before-print preview on the
  invoice, tax-provision workspace, WHT certificates, compliance calendar, return
  workspaces — i18n +~190 keys (AR/EN parity; statutory terms reviewed for official
  Arabic phrasing).
- **Docs:** FEATURE_CATALOG (+9), ENTITY_CATALOG (+7 entities — re-pinned),
  DATA_DICTIONARY, NAVIGATION_MODEL, AUTHORIZATION_MATRIX (+8), JOURNAL_RULES
  (G-41), REPORT_CATALOG (F-6 extension + comparative tax reports + audit-file
  package), IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T51-A | Migration 0071: numbering series (no-gaps CHECK + issuance transaction), hash chain, statutory_rules, provision/WHT/calendar tables, invoice compliance columns | `apps/api/migrations/0071_tax_statutory.sql`, `meta/_journal.json` | migrations.spec journal 71 entries; no-gaps concurrency test (parallel issuance never skips) |
| T51-B | Contracts: series/statutory/WHT/calendar DTOs + INV-032 forbidden-surface test (compliance artifacts never feed posting) | `packages/contracts/src/tax/**` (+ index exports) | contracts suite green (baseline grows; re-pinned) |
| T51-C | Numbering-series engine + invoice/credit-note dual-write transition (legacy + series numbers recorded; cutover configurable) | `apps/api/src/modules/tax/**`, `apps/api/src/modules/sales/**` | unit: gapless under concurrency; dual-write rows exact; voided documents never re-issue a number |
| T51-D | ZATCA Phase-1 offline stack: TLV QR encoder + ICV + PIH chain + UBL 2.1 serialization (local XSD validation) + QR image embed via 038 + digital-stamp placeholder | `apps/api/src/modules/tax/adapters/zatca/**`, `packages/ui/print/**` | golden byte-shape tests on TLV/base64 + known-vector QR payloads; chain append-only guard; XSD-valid XML; browser scan-smoke of the printed QR |
| T51-E | F-6 e-invoicing log extension (delivered by 037 T37-C; extended here) with QR/ICV/PIH/UBL columns | `apps/api/src/modules/reporting/**` | report contract update; per-invoice compliance state rows |
| T51-F | CIT provision engine + deferred tax + return workspace (KSA/Jordan/Egypt profiles) + Zakat base computation + statutory_rules citations + golden G-41 | `apps/api/src/modules/tax/statutory/**` | golden G-41; REQUIRES_VERIFICATION rates refuse to post (asserted); differences register balances |
| T51-G | WHT engine: rate table, deduction at payment creation, certificates printing (038), monthly return workspace | `apps/api/src/modules/tax/**`, `apps/api/src/modules/treasury/**` | unit: WHT leg posts through the engine; Σ (net + WHT) = gross exactly; certificate print payload |
| T51-H | Compliance calendar + alert job + multi-year comparative tax reports | `apps/api/src/modules/tax/**`, `apps/api/src/modules/reporting/**` | unit: ladder alerts; report contracts; X-10 comparisons tie to posted history |
| T51-I | SAF-T-style audit file export (documented schema, read-only) + UAE FTA adapter family (gated port shape) + X-04/X-05/X-13 decision records | `apps/api/src/modules/tax/**`, `docs/decisions/**` | export package schema validation; UAE adapter refuses live use without gates (asserted); decision records filed |
| T51-J | Web: series manager, QR/UBL verify-before-print preview, provision workspace, WHT certificates, compliance calendar + i18n | `apps/web/**`, `packages/ui/**` | web typecheck; browser smoke of the Phase-1 invoice flow |

## 6. Verification

- Contracts suite green (new DTOs + INV-032 forbidden-surface test); API unit suite
  green (the 479-test baseline grows with the statutory specs; re-pinned at
  delivery).
- `migrations.spec.ts`: journal 71 entries, manifest consistency.
- Permissions drift: projected 349 = 349 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: the SETTINGS keys (series cutover, calendar alert
  posture) ⇒ **all pins recomputed** with the old→new table recorded; golden G-41
  lands in JOURNAL_RULES and INV-032 in ACCOUNTING_INVARIANTS.
- **QR scan evidence:** a printed (or PDF-rendered) Phase-1 invoice QR decodes to
  the exact TLV fields — the H-02 "text, not image" defect is provably closed.
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: numbering series → invoice issued (dual-write) → scannable QR +
  UBL preview before print → hash-chain row inspected → CIT provision at a
  source-cited rate → payment with a WHT leg + certificate → return on the
  compliance calendar → audit-file export.

## 7. Risks and Constraints

- **The Phase-2 boundary (restated):** clearance/reporting, CSID certificates, and
  live signing stay DR-001-gated; the shipped adapter remains the honest
  refuse-to-submit stub — the QR half is mathematically complete, the portal half
  untouched, and the docs say exactly that in both languages.
- **Statutory rate honesty:** every CIT/Zakat/WHT rate carries a source citation;
  unverified entries are REQUIRES_VERIFICATION and refuse to post. A wrong
  transcribed rate is a legal liability — the verification posture is the control.
- **Numbering cutover + hash-chain immutability:** the no-gaps CHECK plus
  dual-write transition protects live tenants from renumbering shocks (concurrency
  stress is a named test, not an assumption); the chain is append-only evidence — a
  reprint or amendment creates a new chain row, never an edit.
- **UAE/Egypt shapes:** adapter families ship as gated port shapes only; claiming
  mandate readiness without published specs would be fabrication.

## 8. Completion and Handoff

- Completion report `reports/PHASE-051-COMPLETION.md` with the verification table
  (suites, drift numbers, golden re-pin table, i18n count, QR scan evidence,
  browser evidence) + honest deferrals (Phase-2 gated; X-04/X-05/X-13 decision
  records filed; Zakat base entries marked REQUIRES_VERIFICATION).
- Handoff obligations: the numbering series is the mandated numbering substrate for
  every document family; the compliance calendar is the surface 056 extends with
  governance kinds; `statutory_rules` is the only sanctioned home for direct-tax
  rates; the QR/UBL preview is the verify-before-print pattern for future
  jurisdictions.
- Next eligible: **PHASE-052** (integration fabric) per the W4 sequence
  051 → 052 → 053 (‖ 056) — the W4 gate "sellable in KSA; integrable; self-service
  analytics" is one-third met (the KSA offline half).
