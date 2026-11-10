# PHASE-038 — Brand & Document Engine v2 (محرك العلامة والمستندات (الطباعة القابلة للتخصيص))

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W1, tier P1) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §2 (H-02), §20 (UX-02), §25.3 (FD-21…FD-30),
> §27.1 (TB-03), §28.3 (PP-26) · **Execution:** begins on the owner's explicit
> phase order; delivery = `ERP_PLATFORM_PHASE038.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-038
- **Title:** Brand & Document Engine v2 (محرك العلامة والمستندات (الطباعة
  القابلة للتخصيص))
- **Objective:** Turn printing from a fixed code artifact into a **tenant-data
  product**. Today the QR field prints as the literal text `[QR] abc123`
  instead of a scannable image (H-02), the five base templates
  (a4-document, a4-report, receipt-80, receipt-58, a4-payslip) admit no
  per-tenant customization (FD-21/FD-22), documents print one at a time with
  no watermark, no reprint reason, and no PDF export (FD-24…FD-27), labels and
  email templates do not exist (FD-29/FD-30), and tenants cannot brand their
  workspace or documents (TB-03). This phase ships **(1)** server-side
  QR/barcode rendering as real images inside every print template; **(2)**
  `print_template_overrides` per tenant per template family + a template
  designer screen with live preview; **(3)** white-label branding on the
  `tenants` table; **(4)** DRAFT/VOID watermarks; **(5)** batch print +
  reason-coded reprint audit; **(6)** `?format=pdf` (and PNG) on any document
  print endpoint; **(7)** label templates; **(8)** `email_templates` with
  AR/EN merge fields; and **(9)** the public legal pages /privacy, /terms,
  /dpa (UX-02).
- **Business value:** printed output is the document an auditor, a customer,
  and a tax officer actually see — scannable QRs, branded letterhead, draft
  stamps, and PDF delivery move the platform from "renders HTML" to "issues
  documents". White-labeling opens reseller/MSP distribution, and the QR
  image pipeline is the hard prerequisite PHASE-051 (ZATCA phase-1) renders
  its TLV payloads through — this phase renders pixels; the payload semantics
  arrive in 051.
- **Tier / effort:** P1 · ~3 weeks single-stream (one migration + contracts +
  api suite + designer screen + print-template work + public pages).
- **Source gaps closed:** H-02, FD-21, FD-22, FD-24, FD-25, FD-26, FD-27,
  FD-28, FD-29, FD-30, TB-03, UX-02, PP-26.

## 2. Scope

In scope:

1. **QR/barcode as real images (H-02/FD-28):** a server-side QR matrix
   renderer producing SVG/PNG data URLs embedded in the a4/receipt template
   families — killing the `[QR] ${esc(payload)}` text placeholder in
   `packages/ui/print/templates.ts`; barcode Code128/EAN rendering for item
   labels. The pipeline is **payload-agnostic**: it renders whatever string a
   document carries; ZATCA TLV semantics stay PHASE-051's.
2. **Tenant print-template customization (FD-21/FD-22):**
   `print_template_overrides` (tenant; template family; logo file ref via the
   existing `file_objects`; address block; footer notes; color accents;
   show/hide field flags jsonb) + a template designer screen (Settings group)
   with live preview against a sample document. The five base templates stay
   versioned artifacts in @erp/ui — overrides are **data layered over them**,
   never forks (ADR-0011's versioned-artifact rule).
3. **White-label (TB-03):** tenant branding — additive `tenants` columns per
   the widening convention (logo file ref, brand color palette token,
   login-screen branding, document header variant). "tenants = 9 columns with
   no logo" ends.
4. **Watermarks + draft stamps (FD-24):** diagonal DRAFT/VOID watermarks on
   unposted/voided document prints, localized AR/EN.
5. **Batch print (FD-25) + reprint with reason (FD-26):** the payslip batch
   print pattern generalized into a multi-document print queue;
   `print_audit` rows with reason codes on reprints (who/when/why, surfaced
   through the audit trail).
6. **PDF export for any document (FD-27) + report-as-image (PP-26):**
   `GET /sales/invoices/:id/print?format=pdf` and the sibling document
   families — the report workspace's Chromium HTML→PDF pipeline (ADR-0011)
   generalized to documents; PP-26 (report export as PNG image) rides the
   same render path.
7. **Label templates (FD-29):** item/shelf/bin label templates (Code128/EAN +
   item name/price/variant) as printable sheets — the bin label shape is
   designed now and consumed by PHASE-043's WMS bins.
8. **Email templates (FD-30):** `email_templates` (tenant; purpose key;
   AR/EN subject + body with merge fields) + the send surface consumes them.
   The channel adapters themselves stay PHASE-052 — no email/SMS fabrication
   here (the register's §3 rule 4, the PHASE-023 port+fake pattern).
9. **Legal pages (UX-02):** `/privacy`, `/terms`, `/dpa` public pages —
   bilingual, on the PublicShell marketing variant delivered with the
   `/welcome` surface.

Out of scope (explicit):

- **Channel sending** (email/SMS/WhatsApp adapters) — PHASE-052 (the
  no-fabrication rule; templates ship here, delivery ships there).
- **Report scheduling/delivery** — PHASE-053 (F-7's implementation).
- **ZATCA QR payload semantics** (TLV, ICV, PIH hash chain) — PHASE-051; this
  phase renders pixels only. NOTE: 051 depends on this phase for the QR image
  rendering.
- **Dark mode / full UI theming (UX-05/UX-06)** — brand tokens ship here; the
  theming surface is PHASE-057.

## 3. Prerequisites

- **PHASE-036 COMPLETE** (the designer form slots + saved-views pattern the
  template designer screen reuses); wave order W1 executes 037 first, so this
  phase's migration projects as 0052.
- **PHASE-013** — the report workspace + Chromium (Playwright) HTML→PDF +
  exceljs export pipeline the document PDF export generalizes (ADR-0011).
- **The existing files module** — `file_objects` tenancy for logo/label image
  uploads (no new storage surface).
- **PHASE-035** — the fifth base print template `a4-payslip` + the batch
  payslip print pattern item 5 generalizes; the PublicShell marketing variant
  the legal pages ride.
- **Binding decisions:** ADR-0002 (monorepo), ADR-0011 (reporting/printing —
  versioned print templates, Chromium PDF), ADR-0016 (UI tailwind/radix — the
  designer screen), the v3.0 register §3 rule 4 (no-fabrication — port+fake
  pattern per PHASE-023 for anything needing external credentials) and §O
  safeguards (frozen accounting core — printing never posts).
- Relevant docs: [PRINTING_AND_EXPORT.md](../../reporting/PRINTING_AND_EXPORT.md),
  [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) §9 (settings-group
  items), [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md).

## 4. Design Impact

- **Database:** one additive migration `0052_brand_document_engine.sql`
  (schema_version 52): `print_template_overrides`, `print_audit`
  (append-only by grants), `email_templates` — tenant-owned + RLS + UUIDv7;
  plus additive `tenants` widenings (logo_file_id, brand palette token,
  login branding jsonb, document header variant) per the widening convention.
- **Feature keys (projection):** `printing.qr_barcode`,
  `printing.template_designer`, `printing.white_label`,
  `printing.watermarks`, `printing.batch_print`, `printing.reprint_audit`,
  `printing.pdf_export`, `printing.labels`, `platform.email_templates` — plan
  grants business + enterprise (tier-4 posture; the drift battery enforces
  catalog rows + seed convergence). Legal pages are public — no key.
- **Permissions (projection):** `settings.print_templates.manage`,
  `settings.branding.manage`, `settings.email_templates.manage`,
  `documents.print_batch`, `documents.reprint` (reason-coded) → 257 — drift
  re-pinned consciously, a named bump.
- **API:** additive only — template-override CRUD + preview render, branding
  read/update (tenant-admin plane), batch-print enqueue,
  `?format=pdf|png` on the document print endpoints, email-template CRUD +
  merge-field render preview; the legal pages are public web routes (no API).
- **Web:** the template designer (Settings group, live preview), the brand
  settings panel, watermark/label rendering inside @erp/ui print templates,
  the batch-print queue UI, and the three public legal pages on PublicShell;
  i18n +~170 keys (AR/EN parity from day one).
- **Docs:** FEATURE_CATALOG (+9 keys → 197), ENTITY_CATALOG (+3 entities →
  211), DATA_DICTIONARY (template families, print reason codes),
  NAVIGATION_MODEL §9, AUTHORIZATION_MATRIX (+5 → 257 — drift re-pinned),
  PRINTING_AND_EXPORT.md (the v2 engine chapter), IMPLEMENTATION_STATUS /
  CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T38-A | QR/barcode render service (server-side matrix → SVG/PNG data URLs) + embedding in the a4/receipt template families | `apps/api/src/modules/reporting/**` (render service), `packages/ui/print/templates.ts` | decode-back test: the printed QR decodes to the payload; barcode checksum tests (Code128/EAN) |
| T38-B | Migration 0052: overrides + print_audit + email_templates + tenants widenings | `apps/api/migrations/0052_brand_document_engine.sql`, `meta/_journal.json` | migrations.spec journal 52 entries; RLS battery picks up the 3 new tables |
| T38-C | Override API + resolution order (override → base template) + the designer screen with live preview | `apps/api/src/modules/configuration/**`, `apps/web/src/app/**/settings/print-templates/**` | resolution tests (no override ⇒ base output byte-identical); designer preview snapshot |
| T38-D | White-label branding: login-screen branding + document header + palette token | `apps/api/src/modules/tenancy/**`, `apps/web/src/**` (login + shell) | tenancy isolation test (tenant A's logo never resolves for tenant B) |
| T38-E | DRAFT/VOID watermarks (diagonal, localized) on unposted/voided document prints | `packages/ui/print/**` | watermark present iff document state DRAFT/VOID; AR/EN baselines |
| T38-F | Batch print queue (multi-document) + `print_audit` reason-coded reprints | `apps/api/src/modules/reporting/**`, web queue UI | batch job completes per pg-boss; reprint without reason is rejected; audit row written |
| T38-G | Document PDF/PNG export: `?format=` on the document print endpoints via the Chromium pipeline (FD-27, PP-26) | `apps/api/src/modules/{sales,purchasing,treasury}/**` print routes | content-type + byte-shape assertions; RTL/PDF font parity spot-check |
| T38-H | Label templates: item/shelf/bin sheets (barcode + name/price/variant) | `packages/ui/print/**`, web label dialog | label sheet golden render; EAN/Code128 encode tests |
| T38-I | Email templates (table + CRUD + merge-field render) + legal pages + docs sync | `apps/api/src/modules/configuration/**`, `apps/web/src/app/**/(public)/**`, `docs/**` | merge-field resolution tests; docs:validate green |

## 6. Verification

- Contracts suite green (override/audit/email-template DTOs; watermark +
  label payload shapes; the QR/barcode asset contract).
- API unit suite green (the existing baseline grows with the new specs).
- `migrations.spec.ts`: journal 52 entries, manifest consistency.
- Permissions drift: 257 = 257 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- No SETTINGS_REGISTRY key wave ships in this phase (no golden re-pin
  required — the discipline is idle, noted for the record).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: print an invoice whose QR **decodes back** to the payload;
  upload a logo → save an override → live preview → print; the login screen
  shows tenant branding; a DRAFT document prints with the diagonal watermark;
  batch-print three invoices; reprint one with a reason → the audit row
  appears; `GET /sales/invoices/:id/print?format=pdf` returns a valid PDF;
  render an item label sheet; edit an email template with merge fields and
  preview it; open /privacy, /terms, /dpa bilingually.

## 7. Risks and Constraints

- **QR correctness is compliance-critical** — scannability is asserted by
  decode-back tests in the suite; the TLV payload semantics remain 051's risk
  (this phase's contract is pixels for an arbitrary string).
- **Override layering can drift from base-template upgrades** — overrides are
  data keyed by template family with version tolerance; a base-template major
  bump degrades gracefully (fallback + a visible notice), never a broken
  print.
- **Chromium render load on batch print** — jobs run through pg-boss with
  capped concurrency (ADR-0008 normative rules); the queue is per-tenant
  scoped.
- **White-label must not leak across tenants** — logo/branding assets go
  through `file_objects` tenancy; the RLS battery is extended to the new
  tables and the branding read.

## 8. Completion and Handoff

- Completion report `reports/PHASE-038-COMPLETION.md` with the verification
  table (suites, drift numbers, i18n count, browser evidence incl. the
  QR decode proof) + honest deferrals if any.
- Handoff obligations: the QR image pipeline is documented as the render path
  PHASE-051's ZATCA TLV payloads flow through; the bin label templates are
  documented for PHASE-043's WMS; the email templates + purpose keys are
  documented for PHASE-052's send surface (adapters consume them verbatim).
- Next eligible: **PHASE-039** per the register's W1 wave — completing W1 and
  its gate ("every screen extensible, every claimed feature real, every
  approval multi-level"); after W1, the W2 commerce wave opens (040 → 041 →
  042 ‖ 050), and 051's dependency on this phase is satisfied (W4 order).
