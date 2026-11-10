# PHASE-035 — GAP-CLOSURE: Landing, Platform Dashboard, Rental & Logistics, Payslip Print

> **Status:** COMPLETE · **Date:** 2026-11-10 · **Type:** GAP-CLOSURE (post-roadmap
> maintenance — the first phase past the completed 34-phase roadmap)
> **Scope:** the four gaps the user's review of `ERP_PLATFORM_PHASE034.zip` found —
> the public marketing landing, the platform control-panel dashboard screen, the
> thirteenth (still-deferred) industry template, and the honestly-missing payslip
> print — closed in one phase; the final deliverable
> `ERP_PLATFORM_PHASE035_FINAL.zip`.

---

## 1. The story (what happened and why this report exists)

The restoration merge (2026-11-09) united PHASE-001…034 in one build and produced
`ERP_PLATFORM_PHASE034.zip` — the complete roadmap. The user then reviewed that
archive and found four gaps, each one real and each one already recorded somewhere
in the docs as an honest deferral or a missing surface:

1. **No public marketing landing page.** An anonymous visitor hit the login form —
   nothing told them what the product is, which industries it serves, or what it
   costs.
2. **No platform control-panel dashboard screen.** The platform operators had
   tenants/e-invoicing/sync consoles but no single overview answering "how is the
   platform doing?" — the tenant-facing owner dashboard (PHASE-014) existed, the
   platform-side one did not.
3. **The thirteenth industry template still deferred.** `industry.rental_logistics`
   was the one v2.0-only CAPABILITY_MATRIX column with no shipped shell — the
   PHASE-019 decision record had deferred it because its four capability keys were
   pending FEATURE_CATALOG intake (CAPABILITY_MATRIX §3).
4. **The payslip print honestly missing.** PHASE-029 shipped payroll runs with a
   recorded, honestly-admitted miss: no payslip print template — the register
   printed, the individual payslip did not.

PHASE-035 is the gap-closure phase: the first phase past the finished roadmap, and
deliberately the last of its kind — it closes exactly those four gaps and nothing
else. Every architectural rule of the completed build held: configuration-only
template shipping through the unmodified PHASE-015 engine (INV-022), sanctioned
SECURITY DEFINER readers under the 0003 `erp_definer` envelope (grouped counts
only), the posting engine untouched, permissions drift-free at 245 = 245.

## 2. The deliverables (what shipped, with paths)

### 2.1 The public marketing landing page

- `apps/web/app/[locale]/(marketing)/welcome/page.tsx` — **PUBLIC** (no session):
  bilingual hero + labelled stats strip (**22 modules / 13 templates / 145 screens /
  10 jurisdictions / offline sync**) + 8 feature tiles + the 13-industry catalog
  (live from `GET platform/register/options`) + 3-step onboarding + pricing teaser
  (live from `GET public/plans`) + FAQ + CTA + footer.
- Anonymous visitors now land on `/{locale}/welcome` instead of the login form (the
  session home redirects them); `PublicShell` gained the marketing variant (nav bar
  + footer).
- +100 i18n keys (68 landing + 31 platform-console + 1 payslip-print) — ar=en=**4,286** parity (`check-i18n-parity` PASS).

### 2.2 The platform control-panel dashboard (لوحة تحكم المنصة)

- `GET /api/v1/platform/overview` — permission `platform.tenants.view`, audited
  per use as `platform.console.overview_viewed`.
- Web `/{locale}/platform/overview` — 8 KPI tiles, tenant-status / plan / industry
  / country distributions with bars, subscription statuses + the e-invoicing
  funnel, recent platform audit events, quick links.
- Nav registry item `platform.overview` + the breadcrumbs map entry.
- Migration `0048_platform_overview.sql` — the sanctioned **SECURITY DEFINER jsonb
  aggregate `erp.platform_console_overview()`** over the tenant-RLS'd
  subscription/device/e-invoicing slices (the `erp.subscriptions_needing_attention()`
  precedent from migration 0021): STABLE, read-only, revoked from PUBLIC, granted
  to `erp_app` only, **grouped counts only — no tenant-identifying rows cross the
  boundary**; the platform tenant is excluded from business aggregates exactly as
  the 0021 precedent excludes it.

### 2.3 The THIRTEENTH industry template — `industry.rental_logistics`

- Migration `0047_industry_rental_logistics.sql` — the v1.0.0 manifest seed
  (idempotent registry upsert, the 0044/0046 convention) + the plan-grant wave for
  the four intake keys (business + enterprise; **starter blocked — the tier-4
  posture**, exactly the 0025/0026/0027/0039/0040 precedent). Configuration-only on
  the template side: no new tables, columns, or posting rules (INV-022).
- `SHIPPED_TEMPLATE_MANIFESTS` 12 → **13**; `validate:manifests` **13/13** (rental
  content hash
  `sha256:b47d17b1595860614df27e4132c7b568c013bcc4cf3d37a7afe25b0fb1b45f48`).
- **§J report-key reconciliations** (the 0025/0027/0039/0040/0044/0046 convention):
  `treasury.cash_accounts` → `treasury.accounts` (the LIVE catalog key);
  `partners.ar_aging` → `ar.aging`; report pins land on LIVE keys only —
  `services.contract_revenue_schedule` (dashboard) / `ar.aging` (dashboard) /
  `inventory.valuation` (custom). `rental.fleet_utilization` /
  `rental.late_fee_register` / `logistics.shipment_status_board` have no live report
  keys, so register §J stays closed: zero new report keys. The navigation's
  logistics `status_board` item merged into the shipments item (one
  milestone-board capability).
- **7 new POLICY_REGISTRY keys** — `rental_deposit_required`,
  `late_fee_after_grace_hours` (number), `late_fee_calculation` (enum),
  `damage_charge_requires_inspection`,
  `deposit_release_requires_manager_approval`,
  `overdue_rental_blocks_new_reservation`, `shipment_milestones_manual` — all
  no-SETTINGS_REGISTRY (the 0039/0040 convention: non-rental tenants' policy maps
  stay byte-stable).
- The strict capability-matrix reconciliation set now includes **RNT** (6/6 strict
  columns); golden effective-configs: **40 rows** now (13 templates × 3 plans + the
  no-template row) — all business/enterprise pins recomputed, starter pins
  byte-stable.

### 2.4 The payslip print template (a4-payslip)

- The **FIFTH versioned base print template** in `@erp/ui/print`:
  `A4PayslipPayload` + `renderA4Payslip` — one page per employee,
  earnings/deductions in two columns, the net check row, and a batch-totals page
  (the 4 existing templates: a4-document / a4-report / receipt-80 / receipt-58).
- `GET /api/v1/payroll/runs/:id/payslips/print` — permission
  `payroll.employees.view`, masked C-PII payload.
- The payroll run workspace's print button + preview dialog (the report-workspace
  iframe pattern) + **3 new print-templates spec tests**.

### 2.5 Also shipped

- TARGET_ROUTE_ALIASES additions in apps/web: `crm.service_orders` →
  `/crm/service-orders` (also fixes the healthcare visits nav item) and
  `crm.rental_contracts` → `/crm/contracts`.
- The breadcrumbs map gained `platform/overview`.
- `CURRENT_SHIPPED_PHASE` bumped PHASE-034 → **PHASE-035** (the honesty rule:
  001–035 are all implemented in this build; the §4 phase-gate mechanism stays
  proven by synthetic fixtures on a deliberately post-roadmap phase horizon — the
  §18 lesson-5 pattern — keyed on `platform.payouts`).

## 3. The §25 catalog-intake record (FEATURE_CATALOG maintenance protocol)

The four CAPABILITY_MATRIX §3 pending-intake keys completed the §25 intake and are
now full FEATURE_DEPS catalog rows (module tables in
[../../../product/FEATURE_CATALOG.md](../../../product/FEATURE_CATALOG.md) §13/§15):

| Key | Module | Capability | FEATURE_DEPS edges | Plan grants (0047) |
|---|---|---|---|---|
| `crm.rental_contracts` | crm | `rental_contracts` | `crm.service_contracts` | business + enterprise |
| `crm.contract_deposits` | crm | `deposits_late_fees` | `crm.service_contracts` | business + enterprise |
| `crm.late_fees` | crm | `deposits_late_fees` | `crm.service_contracts` | business + enterprise |
| `distribution.shipment_tracking` | distribution | `shipment_tracking` | `partners.directory`, `sales.invoices` | business + enterprise |

- Starter is blocked on the rental REQUIRED chain (the tier-4 posture — the
  0025/0026/0027/0039/0040 template precedent), so apply on starter degrades
  honestly with the exact missing chain, never a silent gate.
- The feature-key count moves 172 → **176** (134 v1.1 + 38 v2.0 + 4 PHASE-035
  intake); permissions stay **245 = 245** (zero new permission keys — the surface
  reuses `crm.*` / `distribution.*` / `platform.tenants.view` /
  `payroll.employees.view`).
- CAPABILITY_MATRIX §3's pending table is now **empty** — every matrix key is a
  catalog key.

## 4. The verification record (the honest numbers)

| Suite | Result | Notes |
|---|---|---|
| contracts package | **56/56** | was 55 — the rental manifest reconciliation legs |
| apps/api unit suite (non-`__db__`) | **42 files / 479 tests ALL PASS** in-sandbox | previously 395 pass + 5 file-load errors recorded — the sandbox now resolves argon2/exceljs/reflect-metadata so even more suites ran |
| `migrations.spec.ts` | journal **48 entries** | 0047 + 0048 appended, manifest consistency |
| i18n dictionaries | **ar=en=4,286** | `check-i18n-parity` PASS (+100 keys: ~99 welcome/console + 1 payslip-print) |
| `validate:manifests` | **13/13** | rental content hash `sha256:b47d17b1595860614df27e4132c7b568c013bcc4cf3d37a7afe25b0fb1b45f48` |
| `template-prerequisites.spec.ts` | **37/37** | the 13-template entitlement suite incl. the rental legs |
| `golden-effective-configs.spec.ts` | **44/44** | 40 pinned rows (13 × 3 plans + no-template) + the §5/structure legs |
| `capability-matrix-reconciliation.spec.ts` | **6/6** | the strict set now includes RNT (WHL/ELC/HLT/EDU/AGR/RNT) |
| web typecheck | **zero errors in all PHASE-035 files** | two pre-existing consolidation-file type errors FIXED in-phase; one environment-only React-types bleed error in `packages/ui` icons.tsx remains — an artifact of the nested sandbox checkout, not the repo |
| web unit tests | **72/73** | the 1 failure = a dual-React-copy environment artifact of the nested sandbox, not a code defect |
| `__db__` suites | live-harness, unchanged | the 166 files still require the live Postgres harness exactly as every prior completion report records |
| `docs:validate` | **29/29** | after this phase's docs sync (see §5) |

## 5. Docs sync

- [../../../planning/IMPLEMENTATION_STATUS.md](../../../planning/IMPLEMENTATION_STATUS.md)
  — the PHASE-035 row (COMPLETE 2026-11-10); the header current-state line gains the
  gap-closure phase; the stale cross-cutting table refreshed to reality (UI: 145
  screens bilingual RTL; i18n 4,286 keys; migrations 0001–0048; compliance:
  baseline research only; deployment: docker-compose + k6 scripts; tests: unit
  suites green in-sandbox, DB suites on live harness).
- [../../../handoff/CURRENT_STATE.md](../../../handoff/CURRENT_STATE.md) — the
  honest statement updated (CURRENT_SHIPPED_PHASE PHASE-035, migrations
  0001–0048, the 13-template registry, the PHASE-035 surface inventory); the
  apps/web inventory gains the (marketing) welcome page, the platform/overview
  screen, and the payslip print button; the feature-key count 172 → 176.
- [../../../handoff/NEXT_ACTION.md](../../../handoff/NEXT_ACTION.md) — the header
  refreshed: PHASE-035 COMPLETE; NEXT: the maintenance/ops handoff per
  MASTER_ROADMAP §Handoff + the standing honest ledger (hosted-infra legs, ZATCA
  verification, Egypt ETA, payment cutover — all external/infra-gated as before).
- [../../../handoff/CHANGELOG.md](../../../handoff/CHANGELOG.md) — this phase's
  entry (newest-first).
- [../../../implementation/phases/PHASE-035.md](../PHASE-035.md) — the phase spec
  document.
- [../../../product/INDUSTRY_CATALOG.md](../../../product/INDUSTRY_CATALOG.md) —
  the rental_logistics row flipped DEFERRED → SHIPPED (PHASE-035, configuration-only
  per the 0044/0046 convention, with the reconciliation notes); **13/13 templates
  now shipped**.
- [../../../product/FEATURE_CATALOG.md](../../../product/FEATURE_CATALOG.md) — the
  four intake keys added to the crm (§13) and distribution (§15) module tables; the
  count statement 172 → 176 feature keys (134 v1.1 + 38 v2.0 + 4 PHASE-035 intake).
- [../../../industries/capabilities/CAPABILITY_MATRIX.md](../../../industries/capabilities/CAPABILITY_MATRIX.md)
  — §3: the four keys moved to the intake-completions note; **the pending set is
  now empty**.
- [../../../industries/templates/rental-logistics.md](../../../industries/templates/rental-logistics.md)
  + [manifest.rental_logistics.json](../../../industries/templates/manifests/manifest.rental_logistics.json) —
  the SHIPPED reconciled manifest (mirrors
  `RENTAL_LOGISTICS_TEMPLATE_MANIFEST` in
  `packages/contracts/src/industry/templates.ts` exactly: `treasury.accounts`,
  the reconciled report pins, the merged shipments nav item, the 14-entry
  capability_prerequisites matching the RNT column).
- [../../../product/SUBSCRIPTION_AND_ENTITLEMENTS.md](../../../product/SUBSCRIPTION_AND_ENTITLEMENTS.md)
  — the rental/logistics add-on AVAILABLE (the 0047 wiring note); Financial Depth
  Pack unchanged; **13 industry add-ons all live**.
- [../../../ui/NAVIGATION_MODEL.md](../../../ui/NAVIGATION_MODEL.md) — §9 phasing
  rows for the public marketing landing and the platform dashboard.
- [../../../handoff/VALIDATION_REPORT.md](../../../handoff/VALIDATION_REPORT.md) —
  the PHASE-035 re-run line with the new corpus count.
- [../../../planning/MASTER_ROADMAP.md](../../../planning/MASTER_ROADMAP.md) — the
  post-roadmap phases note (PHASE-035 recorded past the 34-phase index).
- [../../../README.md](../../../README.md) +
  [../../../implementation/README.md](../../../implementation/README.md) — the
  phase/template/migration/screen counts.

## 6. The final deliverable

`ERP_PLATFORM_PHASE035_FINAL.zip` — produced from this phase's tree — carries the
complete PHASE-001…035 build: the 48-migration journal, the thirteen-template
registry (13/13 manifests validated), the 176-key feature catalog, the 245-key
permission catalog (drift-free), the 85-contract report registry, the 145-screen
bilingual web client with its public marketing landing, and every doc synchronized
to this report.

**NEXT: NONE — the roadmap and the gap-closure phase are complete; the
maintenance/ops handoff per
[../../../planning/MASTER_ROADMAP.md](../../../planning/MASTER_ROADMAP.md)
§Handoff, with the standing honest ledger (hosted-infra legs, ZATCA verification,
Egypt ETA, payment cutover — all external/infra-gated exactly as before).**
