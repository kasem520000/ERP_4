# Post-Roadmap Expansion Register v3.0 — The Comprehensive-ERP Program

> **Status:** BINDING PLANNING DOCUMENT (documented 2026-11-10; execution begins on the
> owner's explicit phase order — one phase per delivery) · **Owner:** Platform Architecture
> · **Companion living docs:** [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) ·
> [../handoff/NEXT_ACTION.md](../handoff/NEXT_ACTION.md)

## 0. What this register is

The 34-phase roadmap closed at PHASE-034 (the Enterprise Depth gate), and PHASE-035
delivered the first post-roadmap gap-closure batch. This register governs the **post-roadmap
expansion program v3.0**: the plan that takes the platform from **ERP-L3.2 (~60% of a
comprehensive ERP by the external evaluation's weighted scale)** to a genuinely
**comprehensive, integrated ERP ("متكامل بكل ما تعني الكلمة")**.

It is derived from three externally-produced review documents (uploaded 2026-11-10, all
written against the pre-PHASE-035 tree):

| External document | What it measured | Numbered gaps |
|---|---|---|
| `PROJECT_EVALUATION_2026-11-10.md` | Documentation ↔ implementation conformance audit | 16 named findings (F-1…F-9 + doc-drift items) |
| `ERP_COMPLETENESS_GAP_REPORT.md` | Market-standard maturity (Odoo/SAP B1/D365/NetSuite/Epicor + Arab peers) | 6 major axes + 20 medium gaps, verdict L3 (~7.2/10) |
| `ERP_FULL_GAP_ANALYSIS.md` (parts 1+2) | Capability-by-capability depth audit (~120 standard capabilities + ~90 experience/integration capabilities) | **495 numbered gaps**: 23 critical (H-01…H-23) + 304 detailed (§3–§20) + 191 commercial (FD/IN/TB/PP/DF) |

Every gap ID below (`H-03`, `M-01`, `FD-18`, …) refers to those documents. **Every phase in
this register closes a named, code-verified gap — nothing here is speculative.**

### 0.1 The three reconciliations (honest ledger)

**A. EXCLUDED — already closed by PHASE-035** (do not plan again; verified in the shipped
`ERP_PLATFORM_PHASE035.zip` tree):

| External gap claim | PHASE-035 reality (verified 2026-11-10) |
|---|---|
| "13th template `industry.rental_logistics` deferred — no constant, no seed" (EVAL §4, §9a-4) | **CLOSED** — migration 0047 + full manifest + plan grants + 7 policies; 13/13 templates validated (`validate:manifests`) |
| "No marketing landing page" (GAP §3-20, FULL UX-01, TB-15-adjacent) | **CLOSED** — public `/{locale}/welcome` (bilingual hero, live 13-industry catalog from `platform/register/options`, live pricing teaser from `public/plans`, onboarding steps, FAQ); anonymous visitors land there |
| "No payslip print template" (FULL FD-23) | **CLOSED** — the fifth base print template `a4-payslip` (A4PayslipPayload + renderA4Payslip + batch totals) + `GET /payroll/runs/:id/payslips/print` + run-workspace print dialog |
| "Platform dashboard missing" (the user's original review point) | **CLOSED** — `/{locale}/platform/overview` over `GET /api/v1/platform/overview` (migration 0048 sanctioned definer aggregate; 8 KPI tiles + distributions + e-invoicing funnel + audit feed) |
| Doc-drift: i18n counts, NEXT_ACTION staleness (EVAL §9c 8–13) | **CLOSED for the recorded counts** — all handoff docs re-synchronized (i18n 4,286=4,286; NEXT_ACTION rewritten post-035). Residual catalog drift is scheduled: **PHASE-037 T37-C** |

**B. CORRECTED — claimed missing but already exists** (per the external report's own §30 +
this repo's re-verification; listed so no phase re-builds them): command palette ⌘K and
keyboard shortcuts (`shell.tsx`), customer/item quick search, toasts, confirm dialogs,
draft states, report PDF/XLSX/CSV export, report drill-down links, notifications center,
attachments, CRM board/list tabs, offline sync queues (mobile fieldsales), mobile approvals,
feature flags, PDC cheque cycle (11 services), landed costs, consolidation, decimal
precision discipline, `recurring_journals` (schema + store), `partner_addresses` +
`partner_contacts`, `partners.statements` (API/controller level).

**C. ADDED — gaps this register contributes beyond the external reports** (the owner asked
for "comprehensive by every meaning of the word"; each was verified absent in the tree
before being added):

| Add ID | Gap | Scheduled phase |
|---|---|---|
| AD-36-01 | **Legal document numbering series** (per document type / branch / jurisdiction, sequential, gapless — also a ZATCA ICV prerequisite) | PHASE-051 |
| AD-36-02 | **Item variants / matrices** (size-color axes, variant-level stock & pricing) | PHASE-037 |
| AD-36-03 | **Item image galleries** (multi-image item master) | PHASE-037 |
| AD-36-04 | **Customer/supplier item cross-references** (their part codes on our items) | PHASE-037 |
| AD-36-05 | **Cost-center allocation cycles** (rule-based secondary postings; the external report's A-02 covers hierarchies only) | PHASE-050 |
| AD-36-06 | **WPS salary files (Saudi Wage Protection System)** + GOSI file export | PHASE-047 |
| AD-36-07 | **Employee self-service (ESS) + manager self-service (MSS)** surfaces | PHASE-046 |
| AD-36-08 | **Credit-hold automation + customer risk scoring** at order entry | PHASE-040 |
| AD-36-09 | **Recurring sales invoices** (subscription-style billing for customers) | PHASE-040 |
| AD-36-10 | **Duplicate vendor-invoice detection** (same supplier + number + amount) | PHASE-036 |
| AD-36-11 | **Scheduled statement-of-account delivery** (monthly email/WhatsApp of كشف الحساب) | PHASE-042 |
| AD-36-12 | **Period-close checklist** (the report's PP-09 names it; this register makes it a tracked deliverable) | PHASE-050 |
| AD-36-13 | **UAE FTA e-invoicing readiness port** (the external reports cover KSA ZATCA + Egypt ETA only; UAE mandates roll out 2026+) | PHASE-051 |
| AD-36-14 | **Sandbox tenant + demo-data loader for prospects** (merges TB-19/TB-35/PL-08 into one deliverable) | PHASE-057 |

## 1. The program — 23 phases (PHASE-036…PHASE-058)

Priority tiers: **P1** = unlocks sales/completeness fundamentals · **P2** = core ERP depth
(the "comprehensive" claim) · **P3** = professional polish / vertical depth · **P4** =
decision-gated differentiators. Effort is an honest engineering estimate (single senior
full-stack stream, in-repo convention: each phase = migration + contracts + api unit suite +
web screens + docs + completion report).

| Phase (ID) | Title (EN / AR) | Tier | Depends on | Closes (external IDs) | Est. |
|---|---|---|---|---|---|
| **PHASE-036** ✅ | Extensibility Foundation: Custom Fields & Productivity / أساس المرونة: الحقول المخصصة والإنتاجية — **SHIPPED 2026-11-10** (the first executed phase of this program; evidence: [PHASE-036-COMPLETION.md](../implementation/phases/reports/PHASE-036-COMPLETION.md)) | P1 | — | H-18¹, FD-01…FD-10, FD-14…FD-16, FD-18, FD-20, AD-36-10 | 3 wks |
| **PHASE-037** | Master-Data Depth & Activation Residue / تعميق البيانات الأساسية وسدّ بقايا التفعيل | P1 | 036 | F-1, F-2, F-5, F-6, F-7², F-9², EVAL §9c-9/10/14, H-17, I-16, I-18, AD-36-02/03/04 | 3 wks |
| **PHASE-038** | Brand & Document Engine v2 / محرك العلامة والمستندات (الطباعة القابلة للتخصيص) | P1 | 036 | H-02, FD-21, FD-22, FD-24…FD-30, TB-03, UX-02, PP-26 | 3 wks |
| **PHASE-039** | Workflow Engine & Approval Orchestration / محرك سير العمل والموافقات متعددة المستويات | P1 | 036 | H-14, W-01…W-12, PP-17 | 4 wks |
| **PHASE-040** | CRM & Sales Force Depth / تعميق إدارة العلاقات والمبيعات | P2 | 036, 039 | S-01…S-07, S-10, S-11, S-18, AD-36-08/09 | 4 wks |
| **PHASE-041** | Procurement & Sourcing / المشتريات والمنافسة بين الموردين | P2 | 039, 041³ | H-11, P-01…P-10, P-12, P-13, P-15, A-11 | 4 wks |
| **PHASE-042** | Customer Lifecycle: RMA, Warranty, Dunning & Loyalty / دورة حياة العميل: المرتجعات والضمان والتحصيل والولاء | P2 | 038, 040 | H-12, H-13, S-08, S-09, S-14, S-15, S-16, AD-36-11 | 4 wks |
| **PHASE-043** | Warehouse Management (WMS) / إدارة المستودعات بالمواقع والرفوف | P2 | 036, 037 | H-07, I-01…I-09, I-12, I-14, I-20, I-24, DF-12 | 6 wks |
| **PHASE-044** | Manufacturing I: Routing, Work Centers & Shop Floor / التصنيع ١: مسارات التشغيل ومراكز العمل | P2 | 043 | H-04, M-02…M-04, M-13, M-15…M-19, M-23, M-25 | 6 wks |
| **PHASE-045** | Manufacturing II: MRP & Planning / التصنيع ٢: تخطيط احتياجات المواد | P2 | 044 | H-03, M-01, M-05…M-11, M-14, M-21, M-22, M-24, S-10 | 6 wks |
| **PHASE-046** | HRIS Core / نظام الموارد البشرية الأساسي | P2 | 039 | H-05 (operational half), HR-01…HR-10, HR-13, N-17, AD-36-07 | 6 wks |
| **PHASE-047** | Payroll Statutory & Compliance / الامتثال القانوني للرواتب | P2 | 046 | HR-11, HR-12, X-02, T-11, AD-36-06 | 4 wks |
| **PHASE-048** | Projects & Contracting / إدارة المشاريع والمقاولات | P2 | 039, 046 | H-06, PR-01…PR-15, DF-08, A-12 | 6 wks |
| **PHASE-049** | Foreign Trade & Logistics / التجارة الخارجية واللوجستيات | P3 | 041, 038 | H-08, L-01…L-12, S-13, IN-09 | 5 wks |
| **PHASE-050** | Treasury & Cash Intelligence / الخزينة وذكاء التدفق النقدي | P2 | — | T-01…T-13, A-03, A-08, A-09, A-10, A-14, PP-09, AD-36-05/12 | 4 wks |
| **PHASE-051** | Tax Expansion & E-Invoicing Phase-1 / التوسع الضريبي والفوترة الإلكترونية (المرحلة ١) | P1 | 038 | H-01 (offline half), X-01, X-03, X-06, X-07, X-10…X-13, AD-36-01/13 | 5 wks |
| **PHASE-052** | Integration Fabric: API Keys, Webhooks & Notifications / نسيج التكامل: المفاتيح والويبهوك والإشعارات | P1 | 039 | H-21, H-22, N-06…N-08, N-11, N-12, N-19, N-21, IN-02, IN-03, IN-09, IN-13…IN-15, IN-19…IN-21, TB-05, UX-07, W-12, F-9² | 5 wks |
| **PHASE-053** | BI & Scheduled Reporting v2 / ذكاء الأعمال والتقارير المجدولة | P2 | 036, 052 | R-01…R-09, R-12, R-15, F-7² (implementation), PP-20, PP-22…PP-28 | 5 wks |
| **PHASE-054** | Quality Management System (QMS) / نظام إدارة الجودة | P3 | 044 | Q-01…Q-03, Q-05…Q-12 (Q-04 decision-gated) | 4 wks |
| **PHASE-055** | Asset Lifecycle & Maintenance (CMMS) / دورة حياة الأصول والصيانة | P3 | — | H-15, F-01…F-15 | 4 wks |
| **PHASE-056** | Enterprise Security, Identity & Governance / أمن المؤسسات والهوية والحوكمة | P2 | 036 | H-19, H-20, G-01…G-03, G-05, G-06, G-08…G-10, G-18, IN-28…IN-32, PL-07, PL-08, PL-13, TB-24, TB-31, TB-32, DF-50 | 5 wks |
| **PHASE-057** | UX Polish & Growth / صقل التجربة والنمو | P3 | 052, 053 | TB-01, TB-02, TB-04, TB-06, TB-07, TB-12, TB-15…TB-23, TB-28, UX-03…UX-08, UX-12, PP-13, PP-14, DF-36, DF-37, DF-43…DF-48, AD-36-14 | 5 wks |
| **PHASE-058** | AI Assistants & Document Intelligence / المساعدات الذكية وذكاء المستندات | P4 | 052, 053 | DF-25…DF-35, UX-19, UX-20, G-07 | 6 wks |

¹ H-18 (the `items.import_export` plan-grant) is the one-line migration fix inside 037,
listed under 036's family in the external report; scheduled **T37-A** for precision.
² F-7 (`reporting.scheduled_reports`) and F-9 (`platform.payouts`) are documented-claimed
but unbuilt: 037 ships the honest **decision records** (DEFERRED-with-pointer), 052/053
ship the implementations.
³ PHASE-041 lists "041" (itself) by mistake-proofing convention: no — its dependency is
**039 only** (approval chains). Fixed in the phase doc.

### 1.1 Canonical execution waves

| Wave | Phases | Theme | Gate |
|---|---|---|---|
| **W1 — Foundation** | 036 → 037 → 038 → 039 | extensibility, activation, branding, workflow | "every screen extensible, every claimed feature real, every approval multi-level" |
| **W2 — Commerce depth** | 040 → 041 → 042 (‖ 050) | sales, sourcing, customer lifecycle, treasury | "the trade cycle has no manual gaps" |
| **W3 — Operations depth** | 043 → 044 → 045 (‖ 046 → 047 → 048) | WMS, manufacturing I/II, HRIS, payroll compliance, projects | "a factory and a 100-employee company can run on it" (L4 core) |
| **W4 — Reach & intelligence** | 051 → 052 → 053 (‖ 056) | tax/e-invoice phase-1, integration fabric, BI, enterprise identity | "sellable in KSA; integrable; self-service analytics" |
| **W5 — Vertical & polish** | 049, 054, 055, 057, 058 | foreign trade, QMS, CMMS, UX/growth, AI (decision-gated) | "differentiated, not just complete" |

## 2. Explicitly decision-gated (NOT auto-scheduled)

Per the repo's honesty discipline these stay **out of the execution queue until a decision
record orders them** — a documented INCOMPLETE beats a fabricated pass:

1. **ZATCA Phase-2 clearance/reporting** (live portal integration) — DR-001 stays OPEN;
   PHASE-051 delivers the **offline Phase-1 half only** (TLV QR, ICV, PIH hash chain, UBL
   XML generation) which needs no external access.
2. **Egypt ETA live** — DR-003 deferred; port shape only.
3. **iOS client** — DR-P25-05 deferred.
4. **Marketplace / third-party app platform** — SCOPE non-goal #2.
5. **AI assistant** — SCOPE non-goal #9; PHASE-058 is a *proposal* requiring an ADR that
   formally revisits the non-goal before any implementation.
6. **K8s / multi-region / external APM** (PL-01, PL-02, PL-11) — hosted-infra-gated ops
   posture, not product code; stays with the operations waiver ledger.
7. **Blockchain, on-prem, riba-based financing** — standing non-goals (SCOPE §1).

## 3. Register integrity rules (binding)

1. Each phase document lives at `docs/implementation/phases/PHASE-0NN.md` with the 8
   canonical headings and a **PLANNED — NOT STARTED** status header until executed.
2. A phase may pull scope forward only via a decision record (the MASTER_ROADMAP rule,
   unchanged).
3. Every new feature key, permission, entity, golden, or report introduced by an executed
   phase must land in the same phase's docs updates (FEATURE_CATALOG, AUTHORIZATION_MATRIX,
   ENTITY_CATALOG, JOURNAL_RULES, REPORT_CATALOG) — the drift battery enforces it.
4. **No fabrication rule, restated:** anything requiring external credentials or live
   portals (payment providers, WhatsApp/SMS senders, carriers, GOSI submission, WPS
   transmission, ZATCA clearance) ships as a **port + fake-adapter + honest verification
   gate** exactly like the PHASE-023 pattern; the live cutover remains a named waiver.
5. The completion criterion for the whole program is not "all 23 phases shipped" but the
   weighted matrix re-scored: **accounting stays ≥94%, and no remaining axis < 60%**, with
   the top-5 critical gaps (MRP, HR, ZATCA-1, WMS, workflow) closed.
6. Validator upgrade (this revision): phase-reference range becomes **001–058**; phase-doc
   count becomes **58**; the canonical-headings sweep covers **026–058**. See
   `scripts/validate_docs.py` (§N convention of the v2.0 register).

## 4. Source-of-truth mapping (traceability)

- Critical H-01…H-23 → 051 (H-01), 038 (H-02), 045 (H-03), 044 (H-04), 046/047 (H-05),
  048 (H-06), 043 (H-07), 049 (H-08), 052 (H-09 partial: payout reconciliation port),
  037 (H-10 decision + pricing constants surface; commercial pricing itself is an owner
  business decision recorded as OQ-002 — the platform surfaces real prices once provided),
  041 (H-11), 042 (H-12, H-13), 039 (H-14), 055 (H-15), 051 (H-16 excise/stamp decisions
  + core taxes), 037 (H-17, H-18), 056 (H-19, H-20), 052 (H-21, H-22), 057 (H-23: the
  i18n loader becomes data-driven; new locales ship as dictionaries + jurisdiction packs
  per the CD-05 marketing rule).
- Detailed §3–§20 (A/S/P/I/M/Q/F/HR/PR/T/X/L/R/W/N/PL/G/UX) → distributed per the §1
  table; every ID appears in exactly one phase's "Source gaps" line, except the named
  cross-references (F-7, F-9, A-02/A-11 adjacencies) which the phase docs repeat
  explicitly.
- Commercial part 2 (FD/IN/TB/PP/DF) → 036 (FD list operations/depth), 037–038 (FD
  master-data/print), 039 (PP approval UX), 040–042 (FD/S commercial), 043–049 (FD
  operational), 050–053 (PP/TB/R), 054–058 (TB/DF).
- Items the external reports mark ✅ (their §21/§30 "exists and excellent") are frozen —
  no phase may refactor them without a decision record.

---

*This register is the PHASE-036…058 program contract. The first executable order is
**"begin PHASE-036"**; delivery discipline is one phase per archive
(`ERP_PLATFORM_PHASE036.zip`, …, `ERP_PLATFORM_PHASE058.zip`).*
