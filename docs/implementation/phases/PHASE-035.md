# PHASE-035 — Gap-Closure: Marketing Landing, Platform Dashboard, Rental & Logistics Template, Payslip Print

> **Status:** COMPLETE (2026-11-10) · **Updated:** 2026-11-10 · completion evidence:
> [reports/PHASE-035-COMPLETION.md](reports/PHASE-035-COMPLETION.md)

## 1. Phase Overview

- **Phase ID:** PHASE-035
- **Title:** Gap-Closure: Marketing Landing, Platform Dashboard, Rental & Logistics
  Template, Payslip Print
- **Objective:** The first **post-roadmap maintenance phase** (GAP-CLOSURE). The
  user's review of `ERP_PLATFORM_PHASE034.zip` — the completed 34-phase roadmap —
  found four gaps; this phase closes exactly those, and nothing else: **(1)** the
  public marketing landing page `/{locale}/welcome` (bilingual hero + labelled
  stats + the 13-industry catalog + pricing teaser — anonymous visitors land
  there, not on the login form); **(2)** the platform control-panel dashboard
  (لوحة تحكم المنصة) — `GET /api/v1/platform/overview` + the
  `/{locale}/platform/overview` screen over the sanctioned migration-0048
  SECURITY DEFINER aggregate; **(3)** the THIRTEENTH industry template
  `industry.rental_logistics` — the CAPABILITY_MATRIX §3 pending-intake set
  completed (the PHASE-019 deferral closed) through the §25 catalog intake +
  migration 0047; **(4)** the payslip print template (a4-payslip) — the
  PHASE-029 honestly-admitted miss closed. Every rule of the completed build
  holds: configuration-only template shipping through the unmodified PHASE-015
  engine (INV-022), sanctioned definer readers (grouped counts only), the posting
  engine untouched, permissions drift-free at 245 = 245.
- **Business value:** The platform becomes presentable end-to-end — a stranger
  can see what it is and what it costs; the operator can see how the platform is
  doing on one screen; the rental & logistics vertical (car/equipment rental,
  freight agencies, storage) joins the 13/13 shipped template registry; and
  payroll runs produce the document employees actually receive — the payslip.

## 2. Scope

In scope:

1. **The public marketing landing page** (`platform` module surface, PUBLIC):
   `apps/web/app/[locale]/(marketing)/welcome/page.tsx` — bilingual hero +
   labelled stats strip (22 modules / 13 templates / 145 screens / 10
   jurisdictions / offline sync) + 8 feature tiles + the 13-industry catalog
   (live from `GET platform/register/options`) + 3-step onboarding + pricing
   teaser (live from `GET public/plans`) + FAQ + CTA + footer; the PublicShell
   marketing variant (nav bar + footer); anonymous visitors land on
   `/{locale}/welcome` (the session home redirects them); +100 phase i18n keys
   (68 landing + 31 platform-console + 1 payslip-print; ar=en=4,286 parity).
2. **The platform control-panel dashboard**: `GET /api/v1/platform/overview`
   (permission `platform.tenants.view`, audited per use as
   `platform.console.overview_viewed`) + web `/{locale}/platform/overview`
   (8 KPI tiles, tenant-status/plan/industry/country distributions with bars,
   subscription statuses + e-invoicing funnel, recent platform audit events,
   quick links) + nav registry item `platform.overview` + migration
   `0048_platform_overview.sql`: the sanctioned SECURITY DEFINER STABLE jsonb
   aggregate `erp.platform_console_overview()` over the tenant-RLS'd
   subscription/device/e-invoicing slices (the
   `erp.subscriptions_needing_attention()` precedent from migration 0021) —
   grouped counts only, no tenant-identifying rows, revoked from PUBLIC,
   granted to `erp_app` only, platform tenant excluded from business
   aggregates.
3. **The THIRTEENTH industry template — `industry.rental_logistics` (Rental &
   Logistics / التأجير والخدمات اللوجستية)**, configuration-only per the
   0044/0046 convention: migration `0047_industry_rental_logistics.sql` (the
   v1.0.0 manifest seed + the plan-grant wave for the four §25 intake keys —
   business + enterprise; starter blocked, the tier-4 posture); the §J report
   pins reconciled to LIVE registry keys (services.contract_revenue_schedule /
   ar.aging / inventory.valuation; `treasury.cash_accounts` → `treasury.accounts`,
   `partners.ar_aging` → `ar.aging`); the logistics `status_board` nav item
   merged into shipments; 7 new POLICY_REGISTRY keys (no-SETTINGS_REGISTRY, the
   0039/0040 convention); golden effective-configs re-pinned to 40 rows
   (13 templates × 3 plans + no-template).
4. **The payslip print template (a4-payslip)**: the FIFTH versioned base print
   template in `@erp/ui/print` (`A4PayslipPayload` + `renderA4Payslip` — one
   page per employee, earnings/deductions two columns, net check row,
   batch-totals page) + `GET /api/v1/payroll/runs/:id/payslips/print`
   (permission `payroll.employees.view`, masked C-PII payload) + the run
   workspace's print button + preview dialog (the report-workspace iframe
   pattern) + 3 new print-templates spec tests.
5. **Web wiring**: TARGET_ROUTE_ALIASES additions (`crm.service_orders` →
   `/crm/service-orders` — also fixing the healthcare visits nav item;
   `crm.rental_contracts` → `/crm/contracts`); the breadcrumbs map gains
   `platform/overview`; CURRENT_SHIPPED_PHASE PHASE-034 → PHASE-035 (the
   synthetic mechanism-proof fixtures moved to a deliberately post-roadmap
   phase horizon — the §18 lesson-5 pattern — keyed on `platform.payouts`).

Out of scope (explicit):

- **Any new ledger surface** — no new journal rules, goldens, or posting paths
  (the posting engine is untouched; INV-022 holds).
- **New permission keys** — the surface reuses `platform.tenants.view`,
  `payroll.employees.view`, and the existing `crm.*` / `distribution.*` sets
  (drift stays 245 = 245).
- **New report registry keys** — the rental pins land on LIVE keys only;
  register §J stays closed.
- **Hosted-infra legs, ZATCA verification, Egypt ETA, the payment production
  cutover** — external/infra-gated exactly as the standing honest ledger
  records them; this phase changes none of their statuses.
- **Deep-vertical rental operations** (fleet telematics, OTA/booking-channel
  integrations, carrier-adapter feeds) — the same non-goals the template doc
  records (PHASE-023 adapters remain the future path).

## 3. Prerequisites

- **PHASE-001…034 COMPLETE in one build** (the 2026-11-09 restoration merge) —
  verified via the phase table in
  [IMPLEMENTATION_STATUS.md](../../planning/IMPLEMENTATION_STATUS.md) and the
  restoration report
  ([reports/PHASE-034-FINAL-RESTORATION.md](reports/PHASE-034-FINAL-RESTORATION.md)).
- **PHASE-014 COMPLETE** — the public plans + registration-options endpoints
  the landing page consumes.
- **PHASE-015 COMPLETE** — the unmodified configuration engine the rental
  template applies through (BR-038 additive-only).
- **PHASE-019 COMPLETE** — `crm.service_contracts` / `crm.recurring_billing` /
  `crm.service_orders` (the rental REQUIRED chain's base) and the deferral
  decision record this phase closes.
- **PHASE-029 COMPLETE** — the payroll run surface the payslip print attaches
  to (and whose honest miss this phase closes).
- **Binding architecture decisions:** ADR-0003 (Next.js BFF surface),
  ADR-0005 (multi-tenancy — the 0048 definer rides the 0003 `erp_definer`
  envelope without touching RLS), ADR-0011 (printing — a fifth versioned base
  template on the same substrate), ADR-0016 (the @erp/ui print entry).
- Relevant documentation:
  [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) §13/§15/§25,
  [CAPABILITY_MATRIX.md](../../industries/capabilities/CAPABILITY_MATRIX.md) §3,
  [INDUSTRY_CATALOG.md](../../product/INDUSTRY_CATALOG.md),
  [SUBSCRIPTION_AND_ENTITLEMENTS.md](../../product/SUBSCRIPTION_AND_ENTITLEMENTS.md)
  §3, [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) §9,
  [PRINTING_AND_EXPORT.md](../../reporting/PRINTING_AND_EXPORT.md),
  [SECURITY_AND_TENANT_ISOLATION.md](../../security/SECURITY_AND_TENANT_ISOLATION.md)
  (the definer-reader discipline),
  [MASTER_ROADMAP.md](../../planning/MASTER_ROADMAP.md) (post-roadmap phases).

## 4. Design Impact

- **Database:** two additive migrations — `0047_industry_rental_logistics.sql`
  (registry seed + plan grants only: zero new tables/columns/enums, INV-022's
  configuration-only posture) and `0048_platform_overview.sql` (one STABLE
  SECURITY DEFINER function + grants; no tables). Journal 46 → **48 entries**.
- **API:** one new platform-scope read route
  (`GET /api/v1/platform/overview`, per-use audited) + one new payroll print
  route (`GET /api/v1/payroll/runs/:id/payslips/print`, masked C-PII payload).
  No tenant-plane write surface changes.
- **UI:** the (marketing) route group + the PublicShell marketing variant; the
  platform/overview dashboard screen (nav registry item `platform.overview`);
  the payroll run workspace print button + preview dialog; two TARGET_ROUTE_ALIASES
  additions + the platform/overview breadcrumb.
- **Security & authorization:** the 0048 aggregate follows the 0021 definer
  precedent (read-only, grouped counts only, revoked from PUBLIC, granted to
  `erp_app`, platform tenant excluded); platform-scope routes stay per-use
  audited; the payslip payload masks C-PII exactly as the payroll reports do;
  permission catalog unchanged (245 = 245).
- **Accounting:** none — no new posting rules, goldens, or invariants; deposits
  remain on-account amounts per BR-027 semantics as before.
- **Localization:** +100 AR/EN dictionary keys (68 landing + 31 platform-console
  + 1 payslip-print; ar=en=4,286, triple parity);
  the landing page is fully bilingual RTL/LTR.
- **Offline:** unaffected — the new surfaces are online-only (the landing page
  is public; the platform dashboard is operator-plane).
- **Module dependencies:** `tenancy` (platform overview), `payroll` (payslip
  print), `configuration`/`industry` (the rental manifest + grants), `web`
  (landing + dashboard + wiring). No new inter-module write edges.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T35-A1 | **The public marketing landing page**: the (marketing)/welcome route + PublicShell marketing variant + the session-home redirect for anonymous visitors | `apps/web/app/[locale]/(marketing)/welcome/page.tsx`, PublicShell, i18n dictionaries | i18n parity ar=en=4,286 (`check-i18n-parity`); the catalog + pricing teaser consume the live public endpoints; web typecheck zero errors |
| T35-A2 | **The platform overview aggregate + endpoint**: migration `0048_platform_overview.sql` (the STABLE SECURITY DEFINER jsonb aggregate, grouped counts only) + `GET /api/v1/platform/overview` (platform.tenants.view, audited per use as platform.console.overview_viewed) | `apps/api/migrations/0048_platform_overview.sql`, `apps/api/src/modules/tenancy/presentation/platform/**` | migrations journal 48 entries; the definer scope contract (read-only, no tenant-identifying rows, PUBLIC revoked); unit suite green |
| T35-A3 | **The platform overview screen**: `/{locale}/platform/overview` (8 KPI tiles, distributions with bars, subscription statuses + e-invoicing funnel, recent platform audit events, quick links) + nav registry item `platform.overview` + breadcrumb | `apps/web/app/[locale]/platform/overview/**`, `packages/contracts/src/navigation.ts` | web typecheck; nav registry resolution; AR/EN renders |
| T35-T1 | **The rental & logistics template**: the §25 catalog intake for the four keys (FEATURE_DEPS rows) + migration `0047_industry_rental_logistics.sql` (v1.0.0 manifest seed with the §J reconciliations + the plan-grant wave: business + enterprise, starter blocked) + the `RENTAL_LOGISTICS_TEMPLATE_MANIFEST` contracts constant + the 7 POLICY_REGISTRY keys | `apps/api/migrations/0047_industry_rental_logistics.sql`, `packages/contracts/src/industry/templates.ts`, FEATURE_DEPS, POLICY_REGISTRY | validate:manifests 13/13 (rental content hash sha256:b47d17b…45f48); template-prerequisites 37/37; golden-effective-configs 44/44 (40 rows); capability-matrix-reconciliation 6/6 (RNT joins the strict set) |
| T35-P1 | **The a4-payslip print template**: `A4PayslipPayload` + `renderA4Payslip` in @erp/ui/print (one page per employee, earnings/deductions two columns, net check row, batch-totals page) + `GET /api/v1/payroll/runs/:id/payslips/print` (masked C-PII) + the run workspace print button + preview dialog | `packages/ui/print/templates.ts`, `apps/api/src/modules/payroll/**`, `apps/web` run workspace | 3 new print-templates spec tests; payroll permission gating; the report-workspace iframe pattern |
| T35-W1 | **Web wiring**: TARGET_ROUTE_ALIASES (`crm.service_orders` → /crm/service-orders — fixes the healthcare visits nav item; `crm.rental_contracts` → /crm/contracts) + the platform/overview breadcrumb + CURRENT_SHIPPED_PHASE 034 → 035 (the synthetic mechanism-proof fixtures moved to a deliberately post-roadmap phase horizon keyed on platform.payouts) | `apps/web/lib/effective-config.ts`, breadcrumbs map, `apps/api/src/modules/configuration/application/apply/prerequisites.ts` | the phase-gate mechanism proofs stay green under the new gate; nav targets resolve |
| T35-V1 | **Verification**: the full in-sandbox suite run + the honest record (incl. the two pre-existing consolidation-file type errors fixed in-phase and the environment-artifact notes) | — | the §6 verification table in the completion report |
| T35-D1 | **Docs sync**: the phase doc + completion report + the catalog/matrix/manifest/subscription/navigation/status/handoff updates | `docs/**` | `docs:validate` 29/29 |

## 6. Verification

**Automated tests (required, recorded in
[reports/PHASE-035-COMPLETION.md](reports/PHASE-035-COMPLETION.md) §4):**

- contracts package **56/56** (was 55 — the rental manifest reconciliation legs).
- apps/api unit suite: **42 files / 479 tests ALL PASS** in-sandbox (previously
  395 pass + 5 file-load errors recorded — the sandbox now resolves
  argon2/exceljs/reflect-metadata so even more suites ran).
- `migrations.spec.ts`: journal **48 entries**, manifest consistency.
- i18n: **ar=en=4,286** (`check-i18n-parity` PASS).
- `validate:manifests` **13/13** (rental content hash
  `sha256:b47d17b1595860614df27e4132c7b568c013bcc4cf3d37a7afe25b0fb1b45f48`).
- `template-prerequisites.spec.ts` **37/37**; `golden-effective-configs.spec.ts`
  **44/44** (40 pinned rows: 13 templates × 3 plans + no-template);
  `capability-matrix-reconciliation.spec.ts` **6/6** (RNT joins the strict set).
- Web typecheck: **zero errors in all PHASE-035 files** (two pre-existing
  consolidation-file type errors FIXED in-phase; one environment-only
  React-types bleed error in `packages/ui` icons.tsx remains — an artifact of
  the nested sandbox checkout, not the repo).
- Web unit tests: **72/73** (the 1 failure = a dual-React-copy environment
  artifact of the nested sandbox, not a code defect).
- The `__db__` suites (166 files) still require the live Postgres harness
  exactly as before — unchanged posture, honestly recorded.

**Manual verification:**

1. Open `/{locale}/welcome` in a fresh private window (AR and EN): the hero,
   stats strip, 8 feature tiles, the 13-industry catalog (live data), the
   3-step onboarding, the pricing teaser (live plans), FAQ, CTA, footer — and
   confirm an anonymous visit to the session home redirects here.
2. Sign in as a platform operator: `/{locale}/platform/overview` renders the
   8 KPI tiles + the four distributions + the subscription statuses + the
   e-invoicing funnel + recent platform audit events; each use writes the
   `platform.console.overview_viewed` audit row.
3. Apply `industry.rental_logistics` on a business-plan tenant: the rental +
   logistics navigation appears (reservations / contracts / fleet / returns /
   shipments), the report pins resolve on LIVE keys, and a starter-plan apply
   degrades honestly with the exact missing chain.
4. Open a POSTED payroll run workspace → print payslips: the preview dialog
   renders one page per employee with masked C-PII; the printed batch carries
   the totals page.

**Acceptance criteria (objective):**

1. The four gaps are closed with the delivered surfaces above and nothing else
   changed (no new ledger surface, no new permission keys, no new report
   registry keys).
2. The 0048 definer aggregate obeys the 0021 precedent scope contract:
   read-only, grouped counts only (no tenant-identifying rows), revoked from
   PUBLIC, granted to `erp_app` only.
3. The rental template applies through the UNMODIFIED PHASE-015 engine
   (INV-022: zero new tables/columns/enums/journals/permissions beyond the
   four §25 intake keys' plan grants); the strict capability-matrix
   reconciliation set includes RNT with zero mismatches both directions.
4. Golden effective-configs: 40 rows (13 templates × 3 plans + no-template);
   all business/enterprise pins recomputed; starter pins byte-stable.
5. i18n parity ar=en=4,286 with the +100 phase keys (68 landing + 31 platform-console + 1 payslip-print) on both dictionaries.
6. The verification record above is green in-sandbox, with the environment
   artifacts honestly labeled (icons.tsx React-types bleed; the dual-React-copy
   web unit failure) and the `__db__` posture unchanged.
7. Docs validation green; every count statement updated (48 migrations, 13/13
   manifests, 176 feature keys, 145+ screens, 4,286 keys, 35 phase docs).

**Performance & security considerations:** the landing page is public and
static-renderable with live public endpoints only (no session, no tenant data);
the platform overview aggregate is one STABLE function call per dashboard load
(per-use audited); the payslip print is a bounded per-run artifact with masked
C-PII; the definer surface adds no new attack shape beyond the audited 0021
precedent family.

**Migration & rollback:** both migrations are additive (a registry seed + grants;
a function + grants) — expand-compatible; rollback = previous image; template
apply/switch stays BR-038 additive-only.

## 7. Risks and Constraints

- **The definer surface family grows** (0021 → 0041 → 0048): each member is
  read-only, grouped-counts-only, PUBLIC-revoked, and audited — the discipline
  is the mitigation; any future widening requires the same precedent review.
- **Public marketing copy vs the no-fabrication rule**: every stat on the
  landing page is a shipped, countable fact (22 modules / 13 templates /
  145 screens / 10 jurisdictions / offline sync); no compliance or
  verification claim appears anywhere in the copy (the compliance-matrix CD-05
  marketing rule).
- **Sandbox-only evidence** for the DB-level suites: the `__db__` files still
  need the live harness — the honest posture every prior report records; the
  environment artifacts (icons.tsx type bleed, the dual-React-copy unit
  failure) are labeled as such, never as code defects.
- **The tier-4 starter posture** for the rental keys is deliberate (the
  0025/0026/0027/0039/0040 precedent) — starter apply degrades honestly with
  the exact missing chain.

## 8. Completion and Handoff

- **Completion evidence:**
  [reports/PHASE-035-COMPLETION.md](reports/PHASE-035-COMPLETION.md) — the
  story, the four deliverables with file paths, the §25 catalog-intake record,
  the verification record table, the docs-sync list, and the final deliverable
  statement (`ERP_PLATFORM_PHASE035_FINAL.zip`).
- **Documentation updates required:** IMPLEMENTATION_STATUS (the 035 row + the
  refreshed cross-cutting table), CURRENT_STATE, NEXT_ACTION, CHANGELOG,
  INDUSTRY_CATALOG (rental SHIPPED — 13/13), FEATURE_CATALOG (the four intake
  keys — 176 keys), CAPABILITY_MATRIX §3 (the pending set now empty),
  rental-logistics.md + manifest.rental_logistics.json (the SHIPPED reconciled
  manifest), SUBSCRIPTION_AND_ENTITLEMENTS (rental/logistics AVAILABLE — 13
  add-ons live), NAVIGATION_MODEL §9 (the welcome + platform.overview rows),
  VALIDATION_REPORT (the PHASE-035 re-run line), MASTER_ROADMAP (the
  post-roadmap phases note), the docs READMEs.
- **Exit criteria:** all acceptance criteria green with evidence; docs
  validation 29/29; counts synchronized everywhere; the honest ledger
  unchanged (hosted-infra legs, ZATCA UNVERIFIED, Egypt ETA NOT_STARTED,
  payment cutover INCOMPLETE).
- **Definition of Done:** the four surfaces shipped + the two migrations + the
  §25 intake + the docs sync; the in-sandbox suites green with the honest
  artifact notes; zero TODOs in the delivered scope.
- **Handoff instructions:** read the PHASE-035 completion report. **No next
  phase is identified — the roadmap and the gap-closure phase are complete.**
  Post-completion: the maintenance/ops handoff per
  [MASTER_ROADMAP.md](../../planning/MASTER_ROADMAP.md) §Handoff and the
  standing honest ledger in [NEXT_ACTION.md](../../handoff/NEXT_ACTION.md)
  (hosted-infra legs, ZATCA verification, Egypt ETA, payment cutover — all
  external/infra-gated exactly as before).
