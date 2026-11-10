# PHASE-036 — Extensibility Foundation: Custom Fields & Productivity (أساس المرونة)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W1, tier P1) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §25 (FD-01…FD-20) + this register's AD-36-10 ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE036.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-036
- **Title:** Extensibility Foundation: Custom Fields & Productivity
  (أساس المرونة: الحقول المخصصة والإنتاجية)
- **Objective:** Build the platform's **missing extensibility backbone** — the layer
  that lets two different tenants run two different businesses on the same release.
  The external evaluation called its absence "not a missing feature but a missing
  business model" (FD-18): without tenant-defined fields, every "add the
  municipality-license number to customers" request is a code change + migration +
  deploy. This phase delivers **(1)** the custom-fields engine (definitions,
  per-entity typed values, validation, list filters, form + table rendering);
  **(2)** custom picklists (FD-20 — tenant-managed option sets instead of
  hard-coded enums); **(3)** the daily-productivity suite the evaluation scored as
  the weakest everyday experience: bulk actions, column chooser, saved views,
  list export, quick row actions, copy-document-to-new, record timeline, record
  comments, and duplicate-supplier-invoice detection (AD-36-10).
- **Business value:** the SaaS scale ceiling lifts — tenants self-serve their
  long-tail data needs; accountants stop re-building the same filter every morning;
  data-entry throughput rises (copy-to-new, bulk post/approve); and every record
  gains an auditable activity thread (timeline + comments) that later phases
  (workflow, RMA, HR) build on.
- **Tier / effort:** P1 · ~3 weeks single-stream (migration + contracts + api suite
  + web patterns + docs).
- **Source gaps closed:** FD-01, FD-02, FD-03, FD-04, FD-06, FD-07, FD-08, FD-14,
  FD-15, FD-16, FD-18, FD-20, AD-36-10 (partial FD-05/FD-09 — server pagination and
  autosave land with their natural screens in later phases; see §2 out-of-scope).

## 2. Scope

In scope:

1. **Custom-fields engine (FD-18 — the register's #1 functional gap):**
   - Migration: `custom_field_definitions` (tenant-owned; entity kind; key; type ∈
     TEXT/NUMBER/MONEY/DATE/BOOLEAN/SELECT/picklist-ref; required; default; regex/
     min/max validation jsonb; help text AR/EN; sort; ACTIVE status) and
     `custom_field_values` (tenant; entity id; definition id; typed value columns —
     one NULLable column per primitive family, per the DATA_DICTIONARY money-precision
     rule: MONEY as NUMERIC(19,4), never float) + RLS macro + hot indexes
     `(tenant, entity_kind, entity_id)`.
   - Contracts: `CustomFieldDefinitionDTO`, validation of key uniqueness per
     (tenant, entity), value-type invariant (value column matches definition family —
     a CHECK, the repo convention).
   - API: definitions CRUD + values read/write folded into the existing entity
     detail/list payloads (additive `customFields` map — no breaking shape change)
     + `GET /api/v1/settings/custom-fields?entity=…`.
   - Web: a definitions manager (Settings group) + automatic render in every
     DataTable row expander and every form archetype the @erp/ui kit already owns
     (the 12 screen archetypes) — no per-screen bespoke code.
   - List filtering on custom fields joins the existing query-builder surface.
   - **Boundary:** custom fields are DATA dimensions only — they never enter the
     posting engine, journal lines, or tax computation (an explicit invariant, see
     §4; the accounting core stays frozen per the v2.0 register §O safeguards).
2. **Custom picklists (FD-20):** `custom_picklists` + `custom_picklist_options`
   (tenant-owned option sets with AR/EN labels, sort, ACTIVE) consumed by
   SELECT-type custom fields; the same surface replaces the "free-text where an
   enum should be" pattern the evaluation flagged.
3. **Bulk actions (FD-01):** a unified `POST /api/v1/{module}/{entity}/bulk`
   convention (action ∈ approve/post/void/archive per the entity's existing
   lifecycle service — the phase never invents new lifecycle semantics, it
   batches existing ones) with per-row result arrays, partial-failure report,
   Idempotency-Key per the API_CONVENTIONS §6 discipline; web: multi-select
   checkboxes + action bar on the trade lists (invoices, orders, GRNs, journals).
4. **Column chooser + saved views (FD-02/FD-03):** `saved_views` table (tenant,
   user optional/shared, entity kind, columns jsonb, filters jsonb, sort, default
   flag); web: the DataTable header gains column show/hide/order and a
   "Save this view" affordance; views switcher per user.
5. **List export (FD-04):** `GET /api/v1/{module}/{entity}/export?format=xlsx|csv`
   honoring the current filters + visible columns (server-side, the existing
   exceljs pipeline from the reporting exporter — no client-side grid dump).
6. **Quick row actions (FD-07) + copy-to-new (FD-08):** row hover menu (view/edit/
   print where the entity supports it) and "copy to new document" on the sales/
   purchasing document families (lines + header copied as a fresh DRAFT — never a
   posted doc; the draft-lifecycle rule).
7. **Record timeline (FD-14) + comments (FD-15):** a unified `record_activity`
   read (audit_events already exist — this is a per-record timeline UI over them,
   the evaluation's "exists but no screen shows it") + `record_comments` table
   (tenant; entity kind/id; author; body; mentions stored but notify-later —
   notifications ride PHASE-052's realtime fabric).
8. **Duplicate supplier-invoice detection (AD-36-10):** on supplier-invoice
   create/submit, a check over (tenant, supplier, invoice number, currency, amount)
   with a configurable tolerance (SETTINGS_REGISTRY key, the 028/029 wave pattern)
   returning a warning-list with "proceed anyway" audit trail (never a silent
   block — an operator decision with an audit row).
9. **Multi-column list sort/filter unification (FD-06):** the DataTable pattern's
   contract gains typed filter operators per column family (date range, money
   range, enum set, text contains) — one pattern, applied to the trade lists.

Out of scope (explicit):

- **Server pagination retrofit across all ~145 screens (FD-05)** — lands
  per-surface with each domain phase (040–055) which own their lists; the pattern
  + three reference implementations (partners, items, invoices) ship here.
- **Autosave (FD-09) and undo (FD-10)** — autosave lands with the form-heavy
  phases (040/041/048); undo-after-post is rejected by the immutability discipline
  (counter-entry only) and stays out per BR/INV rules.
- **Form designer (FD-19)** — requires the custom-fields substrate this phase
  ships; scheduled as a PHASE-057 candidate behind a decision record.
- **Mentions/followers notifications (FD-16)** — the data model lands (mentions
  column) but delivery channels wait for PHASE-052 (no email/SMS fabrication).
- **Any posting-engine, tax, or consolidation change** — the frozen-core rule.

## 3. Prerequisites

- **PHASE-035 COMPLETE** (the tree this program plans against).
- **PHASE-004/005 patterns** — the tenant-owned RLS table + bilingual dictionary
  conventions every migration here follows.
- **PHASE-013** — the DataTable/report-export substrate (exceljs) the list export
  reuses.
- **PHASE-015** — SETTINGS_REGISTRY wave convention for the duplicate-check
  tolerance key (the 028/029 pattern; a SETTINGS wave ⇒ golden effective-configs
  re-pin discipline applies — see §6).
- **Binding decisions:** ADR-0002 (monorepo), ADR-0009 (money precision — the
  custom MONEY family is NUMERIC(19,4)/decimal.js, never float), ADR-0012 (the
  @erp/ui archetypes that render custom fields), the v3.0 register §O safeguards
  (frozen accounting core).
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) (new
  `platform.custom_fields` family row), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md) (new types/enums),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) §9 (settings-group item),
  [AUDIT spec] — record_activity rides audit_events.

## 4. Design Impact

- **Database:** one additive migration `0049_custom_fields_productivity.sql`
  (schema_version 49): 5 tables (`custom_field_definitions`, `custom_field_values`,
  `custom_picklists`, `custom_picklist_options`, `saved_views`, `record_comments`
  — 6 with the duplicate-tolerance SETTINGS key seeded) — all tenant-owned + RLS
  macro + UUIDv7 + append-only grants per the repo convention; a CHECK invariant
  binding each value row to its definition's type family.
- **New invariant (INV-027 candidate):** *custom fields never post* — no
  custom-field value may appear in journal lines, tax lines, or posting
  payloads; machine-checked by a contracts test over the posting-engine DTO
  surface (forbidden-property stem list, the healthcare no-clinical gate
  pattern).
- **Feature keys (projection):** `platform.custom_fields`,
  `platform.custom_picklists`, `platform.saved_views`, `platform.list_export`,
  `platform.bulk_actions`, `platform.record_timeline` — plan grants:
  business + enterprise (starter blocked, tier-4 posture; FEATURE_DEPS catalog
  rows + the 0004-seed drift convergence per the two-site precedent).
- **Permissions (projection):** `settings.custom_fields.manage`,
  `settings.picklists.manage`, `platform.views.manage` (shared views), and the
  bulk endpoints reuse each entity's existing approve/post permissions (no
  privilege widening — the guard checks per-row permission, a contracts
  assertion).
- **API:** additive routes only (definitions, picklists, views, export, bulk,
  comments); the entity payload `customFields` map is optional-additive — old
  clients unaffected (API_CONVENTIONS compatibility rule).
- **Web:** @erp/ui DataTable + form archetypes gain the extensibility slots;
  a Settings → "الحقول المخصصة" manager screen; i18n +~140 keys (AR/EN parity
  from day one, the triple-parity rule).
- **Docs:** FEATURE_CATALOG (+6 keys → 182), ENTITY_CATALOG (+6 entities →
  204), DATA_DICTIONARY (types/enums), NAVIGATION_MODEL §9, AUTHORIZATION_MATRIX
  (+3 keys → 248 — drift check re-pinned), IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T36-1 | Migration 0049: the 6 tables + RLS + grants + the duplicate-tolerance SETTINGS seed | `apps/api/migrations/0049_custom_fields_productivity.sql`, `meta/_journal.json` | migrations.spec journal 49 entries; RLS battery picks up the new tables |
| T36-2 | Contracts: definition/picklist/view/comment DTOs + the INV-027 forbidden-surface test | `packages/contracts/src/platform/custom-fields.ts` (+ index exports) | contracts suite (57+ tests) |
| T36-3 | API module `custom-fields` (definitions/picklists CRUD + values fold-in) | `apps/api/src/modules/configuration/**` (or a new `extensibility` module per boundaries) | unit suite + route-permissions row |
| T36-4 | Bulk-action convention + first three surfaces (sales invoices, purchase invoices, journal entries) | `apps/api/src/modules/{sales,purchasing,accounting}/**` | partial-failure + idempotency + per-row permission tests |
| T36-5 | Export endpoint on the same three surfaces (xlsx/csv, filters-aware) | same modules | golden byte-shape assertions (exceljs) |
| T36-6 | Web: settings manager screen + archetype slots (table/form) + column chooser + saved views UI + row actions + copy-to-new + timeline drawer + comments panel | `apps/web/**`, `packages/ui/**` | web typecheck; browser smoke of the 3 reference lists |
| T36-7 | Duplicate supplier-invoice check service + tolerance setting + UI warning dialog with proceed-anyway audit | `apps/api/src/modules/purchasing/**` | unit: collision detected, tolerance honored, audit row written |
| T36-8 | Docs sync: catalogs, matrix, dictionary, nav, status, changelog | `docs/**` | `docs:validate` 29/29 (validator v3.0 ranges) |

## 6. Verification

- Contracts suite green (new DTO + INV-027 forbidden-surface test).
- API unit suite green (the 479+ baseline grows with the new module's specs).
- `migrations.spec.ts`: journal 49 entries, manifest consistency.
- Permissions drift: 248 = 248 (re-pinned consciously — a named bump, recorded).
- i18n parity ar=en (triple parity: TS types + runtime + CI script).
- Golden effective-configs: the SETTINGS key wave ⇒ **all pins recomputed** with
  the old→new table recorded in agent-ctx (the §18 lesson-5 relay).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: create a custom field on PARTNERS, see it in the partners form +
  list, filter on it, save a view, export the filtered list, bulk-approve two
  draft invoices, copy an invoice to new, open a record timeline, add a comment.

## 7. Risks and Constraints

- **Value-table fan-out vs EAV:** typed-column-family design (one table, NULLable
  per-family columns) chosen over pure EAV to keep money precision + indexes;
  migration cost if a new type family is needed later is additive (new NULLable
  column) — acceptable.
- **Payload bloat:** `customFields` map on list endpoints capped by a
  list-vs-detail split (lists return only fields marked show-in-list).
- **Bulk partial failure semantics:** per-row results + never-silent-block; the
  operator report is the contract (idempotent re-run safe).
- **Frozen-core discipline:** the INV-027 machine check is the guard; any future
  phase that wants custom fields *in accounting* must write a decision record
  first.

## 8. Completion and Handoff

- Completion report `reports/PHASE-036-COMPLETION.md` with the verification
  table (suites, drift numbers, golden re-pin table, i18n count, browser
  evidence) + honest deferrals if any.
- Handoff obligations: the extensibility slots are documented for every later
  phase (custom fields render automatically on new entities that adopt the
  archetype slots); saved-views + bulk conventions are the mandated pattern for
  040+.
- Next eligible: **PHASE-037** (master-data depth + activation residue) per the
  register's W1 wave; 039 may run in parallel after review.
