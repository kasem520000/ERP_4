# PHASE-036 — EXTENSIBILITY FOUNDATION: CUSTOM FIELDS & PRODUCTIVITY (أساس المرونة: الحقول المخصصة والإنتاجية)

> **Status:** COMPLETE · **Date:** 2026-11-10 · **Type:** POST-ROADMAP EXPANSION
> v3.0 — the program's first executed phase (wave W1, tier P1; the register's
> binding plan [../../../planning/POST_ROADMAP_EXPANSION_REGISTER.md](../../../planning/POST_ROADMAP_EXPANSION_REGISTER.md))
> **Scope:** the platform's missing extensibility backbone — the layer that lets two
> different tenants run two different businesses on the same release (the external
> evaluation's FD-18 verdict: "not a missing feature but a missing business model")
> — the custom-fields engine, custom picklists, and the daily-productivity suite
> (bulk actions, column chooser + saved views, list export, quick row actions +
> copy-to-new, record timeline + comments), plus the duplicate supplier-invoice
> detection upgrade (AD-36-10).
> **Closes:** FD-01, FD-02, FD-03, FD-04, FD-06, FD-07, FD-08, FD-14, FD-15, FD-16
> (data model), FD-18, FD-20, AD-36-10.

---

## 1. The story (why this phase exists and what it delivered)

The 34-phase roadmap closed at PHASE-034, PHASE-035 closed the four gaps the
owner's own review found, and the second external review (three uploaded reports,
495 numbered gaps) became the binding POST_ROADMAP_EXPANSION_REGISTER v3.0 — 23
phases toward a comprehensive ERP ("متكامل بكل ما تعني الكلمة"). Its W1 wave
opens with this phase because every later wave builds on it: the workflow engine
(039) threads approvals over records that carry custom fields; the master-data
depth (037) surfaces variants whose attributes render through the archetype slots
this phase ships; HR (046) and RMA (042) ride the record timeline + comments
thread; and the evaluation's weakest everyday-experience scores (bulk actions,
saved views, list export) were the productivity suite delivered here.

The four deliverable families:

1. **The custom-fields engine (FD-18 — the register's #1 functional gap):**
   tenant-defined fields over a CLOSED 11-entity-kind list (PARTNER, ITEM,
   SALES_QUOTATION, SALES_ORDER, SALES_INVOICE, PURCHASE_ORDER, SUPPLIER_INVOICE,
   JOURNAL_ENTRY, FIXED_ASSET, EMPLOYEE, EXPENSE), six typed value families with
   one-CHECK invariants, per-family validation, and the INV-027 frozen-core guard
   (machine-checked — see §3).
2. **Custom picklists (FD-20):** tenant-managed bilingual option sets that replace
   the "free-text where an enum should be" pattern; consumed by SELECT-type fields.
3. **The productivity suite:** the unified bulk-action convention (FD-01) with the
   per-row report envelope; the column chooser + saved views (FD-02/FD-03) with the
   shared-publish permission gate; server-side csv/xlsx list export (FD-04);
   per-row quick actions + copy-to-new (FD-07/FD-08 — a fresh DRAFT, never a posted
   doc); and the record timeline + comments (FD-14/FD-15 — the evaluation's "audit
   exists but no screen shows it" closed by composing audit_events with the new
   append-only 🔒 record_comments store).
4. **The duplicate supplier-invoice detection upgrade (AD-36-10):** the full match
   key (tenant, supplier, number, **currency**, amount) with the configurable
   tolerance and the audited proceed-anyway path.

## 2. The deliverables (what shipped, with paths)

### 2.1 Migration `0049_custom_fields_productivity.sql` (schema_version 49)

- **Six tenant-owned RLS'd tables** (the house macro + the 0036/0037/0038
  erp_migrate purge-path policies + UUIDv7 ids):
  - `custom_picklists` + `custom_picklist_options` (FD-20) — stable `key`/`value`
    codes (format CHECKs), bilingual labels, sort, is_active (hide without delete);
    options CASCADE with their picklist, RESTRICT from values.
  - `custom_field_definitions` (FD-18) — the closed entity-kind CHECK (the
    contracts `CUSTOM_FIELD_ENTITY_KINDS` mirror, cell-for-cell), the six-family
    type CHECK, the SELECT-shape CHECK
    (`(type = 'SELECT') = (picklist_id IS NOT NULL)`), validation jsonb
    (`{regex?, min?, max?, minDate?, maxDate?}`), bilingual labels/help,
    `show_in_list` (the list fold-in cap), UNIQUE `(tenant, entity_kind, key)`.
  - `custom_field_values` — one row per (entity, definition) WITH a value (no row
    = empty); the **denormalized field_type snapshot + the
    `ck_custom_field_values_typed_family` one-column invariant** (exactly one
    value column populated, matching the family); MONEY `numeric(19,4)` (ADR-0009),
    NUMBER `numeric(28,10)`; hot indexes `(tenant, entity_kind, entity_id)` (the
    batch fold-in) + `(tenant, definition_id)` (the delete-guard count).
  - `saved_views` (FD-02/FD-03) — per-user (`user_id`) or shared (NULL) rows;
    columns/filters/sort jsonb snapshots; the COALESCE unique index keeps shared +
    personal name spaces collision-free per entity kind.
  - `record_comments` 🔒 (FD-15) — append-only (UPDATE/DELETE rejected by the
    `erp.record_comments_guard()` trigger; DELETE only under `erp.purge_mode` —
    the audit_events/note_events pattern); `mentions` jsonb (parsed @uuid tokens,
    data-only — delivery rides PHASE-052's fabric, no fabrication).
- **Permission seeds (matrix §3.16):** `settings.custom_fields.manage`,
  `settings.picklists.manage`, `settings.views.share` + the owner/accountant
  role-template grant waves. **The rename record (binding):** the phase doc §4
  projected `platform.views.manage`; it landed as `settings.views.share` because
  matrix §3.10's platform-plane rule keeps `platform.*` keys non-assignable to
  tenant roles (the owner CROSS JOIN wave excludes `platform.*`) — publishing a
  shared list view is a tenant-admin action, so the permission rides the tenant
  settings plane while the entitlement stays the `platform.saved_views` feature
  key (BR-039: both layers). Recorded in AUTHORIZATION_MATRIX §3.16 notes.
- **Plan grants (the §25 intake protocol's step 3):** the six `platform.*`
  extensibility keys (`custom_fields`, `custom_picklists`, `saved_views`,
  `list_export`, `bulk_actions`, `record_timeline`) → business + enterprise
  (starter blocked — the tier-4 posture of the 0025/0026/0027/0037/0047 waves).
- The duplicate-invoice tolerance rides the CODE-side SETTINGS_REGISTRY key
  `purchasing.duplicate_invoice_tolerance_pct` (default 0, 0–10; the 028/029
  SETTINGS wave pattern — no SQL seed).

### 2.2 The contracts layer (`packages/contracts/src/platform/custom-fields.ts`)

The closed entity-kind list, the six families' wire types (MONEY a ≤4dp decimal
string — never float), the definition/picklist/view/comment DTOs, the bulk
request/per-row-result envelope, the duplicate-invoice warning payload, and the
**INV-027 forbidden-stem list** — exported through the package index (26 new
tests; the suite grows 56 → **82**).

### 2.3 The API `extensibility` module (`apps/api/src/modules/extensibility/`)

- `application/custom-field-validation.ts` — the WHOLE validation envelope as
  pure functions (unknown-key fail-closed, family match, regex/min/max/bounds,
  SELECT active-option, required-completeness) — unit-tested without a database.
- `application/bulk-actions.ts` — the `executeBulk` convention: per-row executor
  over the entity's EXISTING lifecycle service, typed per-row results, partial
  failure reported, re-runs idempotent per row.
- `application/list-export.ts` — RFC 4180 CSV synthesis + the exceljs XLSX
  pipeline (dynamic import, the VAT-return pattern) + the never-float cell
  sanitizer.
- `application/extensibility-service.ts` / `saved-views-service.ts` /
  `comments-service.ts` — the store orchestration inside the ambient tenant UoW
  (the fixed-assets store pattern), with the in-use/has-values delete guards and
  the timeline composition (audit_events + record_comments newest-first).
- `infrastructure/extensibility.store.ts` — the ONLY writer of the six tables
  (raw SQL in the caller's transaction; INV-027: never touches journal/tax
  surfaces).
- `presentation/extensibility.controller.ts` — `GET/POST/PATCH/DELETE
  settings/custom-fields[.../:id]`, `GET/PUT settings/custom-fields/values`,
  `settings/picklists` CRUD + options, `settings/views` CRUD (personal =
  self-plane; shared double-gated), `GET extensibility/timeline|comments`,
  `POST extensibility/comments`.
- The error family wired into the global error filter (not-founds → 404,
  taken/in-use → 409, ownership → 403, validation → 422).
- Registered in `app.module.ts`; the route registry (route-permissions.ts)
  gains the §3.16 rows + the self-plane rows + the bulk/export/copy rows.

### 2.4 The productivity surfaces on the reference trade lists

- **Bulk (T36-4):** `POST sales/sales-invoices/bulk`,
  `purchasing/supplier-invoices/bulk`, `accounting/journal-entries/bulk` —
  approve/post/void over each module's EXISTING lifecycle service (the phase never
  invents lifecycle semantics), per-ACTION permission re-check in the controller
  (approve/post keys stronger than the route's create-level row — matrix §3.16
  note), the credit-check override stays single-row by design.
- **Export (T36-5):** `GET .../export?format=csv|xlsx` on the same three surfaces
  — server-side, filters + visible columns honored, never a client-side grid
  dump; the dedicated binary-safe BFF streaming route
  `apps/web/app/api/bff/sales/sales-invoices/export/route.ts` (the audit-events
  export precedent — the generic JSON proxy would corrupt attachments).
- **Copy-to-new (T36-6):** `POST sales/sales-invoices/:id/copy-to-new` — header +
  lines as a fresh DRAFT; the copy never inherits delivery/order linkage (a
  copied document references fresh business state or none).

### 2.5 The duplicate supplier-invoice upgrade (T36-7, AD-36-10)

- `purchasing/application/duplicate-check.ts` — the pure classifier:
  candidates = every non-CANCELLED (supplier, number) row; different-CURRENCY
  rows are skipped entirely (a different financial fact); within-tolerance
  amounts classify "triple" (the blocking/warning family per the behavior
  setting), else "number" (always warns on the draft).
- `store.findInvoiceDuplicates` — the plural scan with the currency dimension.
- The create flow: the typed `DUPLICATE_SUPPLIER_INVOICE` error now carries the
  FULL warning list in its details (the dialog's data); the re-submit with
  `proceedAnyway: true` proceeds and writes the dedicated audited
  `purchasing.duplicate_check.proceeded` row; the draft's `duplicate_warning`
  jsonb gains the additive widenings (existingCurrency, warnings, proceeded,
  checkedWithTolerancePct) — **backward compatible at tolerance 0** (the
  PHASE-011 DB pins keep their meanings).

### 2.6 The web layer (the 146th screen + the generic surfaces)

- `apps/web/app/[locale]/settings/custom-fields/page.tsx` +
  `apps/web/components/custom-fields-manager.tsx` — the flagship manager: the
  entity-kind selector over the closed 11-kind list, definitions table + row
  actions, the create/edit form (key immutable on edit, picklist select when
  SELECT, required disabled for BOOLEAN, per-type validation fields), the full
  picklists plane (create with initial options, add/delete options, in-use
  guard); the Settings hub card links to it.
- `apps/web/components/list-toolbar.tsx` — the GENERIC toolbar: column chooser
  (checkboxes + search + localStorage per entity kind), saved views (load/apply/
  save-with-shared-default/delete; my + shared groups), csv/xlsx export anchors.
- `apps/web/components/bulk-actions-bar.tsx` — the selection bar → the bulk POST →
  the honest per-row report panel; clears selection after the run.
- `apps/web/components/record-timeline.tsx` — the timeline drawer (audit vs
  comment union, newest-first) + the comment composer (@uuid mentions).
- Wired into `apps/web/components/sales-invoices.tsx` (additive only — every
  pre-existing flow intact): DataTable built-in selection, the bulk bar, the
  toolbar, per-row copy-to-new + timeline buttons.
- `apps/web/lib/api-types.ts` — the 11 wire-row interfaces mirroring the
  contracts.
- **+131 i18n keys** (cf ×80, sv ×22, bulk ×12, timeline ×12, row/export ×5) →
  **ar=en=4,417** parity.
- The landing page's stats strip constant 145 → 146 screens.

## 3. INV-027 — the frozen-core guard (new invariant, machine-checked)

**Custom fields never post.** No custom-field, picklist, or saved-view property
may appear on any posting-engine, journal-line, or tax DTO surface. Enforced by
`packages/contracts/src/__tests__/inv-027-no-custom-fields-on-posting.test.ts`:
(a) a recursive zod walk over every posting-surface schema (the tax
snapshot/summary/line family + the sync wire money-document payloads) asserting
no property key matches the forbidden stems
(`customField`, `custom_field`, `picklistId`, `savedView`, `saved_view`); (b) a
source scan over the accounting domain/application + the tax module (comments
stripped — the guard may NAME itself) with the same stem list. The healthcare
no-clinical gate pattern applied to the extensibility plane: the "just one
custom field on the journal line" creep becomes a build failure, not a review
note. Any future phase that wants custom fields IN accounting must write a
decision record first (the phase §7 rule).

## 4. The §25 catalog-intake record

The six `platform.*` keys entered FEATURE_DEPS (the machine mirror;
`platform.custom_picklists` depends on `platform.custom_fields`, the rest
standalone — bulk reuses each entity's own approve/post permissions, no
privilege widening) and the docs FEATURE_CATALOG §3 rows (with the tier-4 grant
note). Migration 0049 is the registering wave. The count statement: **182
feature keys (134 v1.1 + 38 v2.0 + 4 PHASE-035 intake + 6 PHASE-036
extensibility intake)**.

## 5. The verification record (the honest numbers)

| Suite | Result | Notes |
|---|---|---|
| contracts package | **82/82** | was 56 — the custom-fields spec (23 tests) + the INV-027 forbidden-surface spec (3 tests) |
| apps/api unit suite (non-`__db__`) | **43 files / 500 tests ALL PASS** | was 42/479 — the extensibility unit spec (21 tests: the pure validation envelope, the bulk per-row semantics, the CSV contract, the duplicate classifier) |
| `migrations.spec.ts` | journal **49 entries** | 0049 appended; manifest ↔ journal ↔ files consistent; the per-file schema-version upsert check covers 0049 |
| permissions drift | **matrix 248 = seed 248** | the §3.16 family seeded by 0049; the drift parser upgraded STATEMENT-SCOPED (only `INSERT INTO "permissions"` blocks count — the 0049 VALUES indentation and the template seeds can never be misread) |
| i18n dictionaries | **ar=en=4,417** | `check-i18n-parity` PASS (+131 keys) |
| `golden-effective-configs.spec.ts` | **44/44** | the SETTINGS wave (`purchasing.duplicate_invoice_tolerance_pct`) + the six plan grants moved ALL 40 pins — recomputed in-phase via the checked-in `apps/api/scripts/compute-goldens.ts`; the old→new table in `agent-ctx/P36-goldens-repin.md` (the §18 lesson-5 relay) |
| web typecheck | **zero errors across apps/web** | the workspace reinstall resolved the long-standing dual-@types/react sandbox artifact (packages/ui icons.tsx) — the whole web app typechecks clean, not just the phase files |
| web unit tests | **73/73 ALL PASS** | the workspace reinstall also resolved the long-standing dual-React-copy artifact (SyncNowButton) — the full suite is green |
| `docs:validate` | **29/29** | after this phase's docs sync (§7) |
| `__db__` suites | live-harness, unchanged + 1 | the new `src/__db__/extensibility/extensibility.db.spec.ts` (the 0049 RLS battery legs, the one-family CHECK at the SQL level, the append-only guard, saved-views ownership, the duplicate query's currency dimension) joins the 166-file live-harness convention — **167 files** |

## 6. The golden re-pin table (the SETTINGS wave record)

All 40 pins moved (the one new SETTINGS_REGISTRY key lands in every tenant's §5
policy map; the six plan grants move the business/enterprise pins a second
notch; starter pins carry the policy-default shift only). Recomputed by
`apps/api/scripts/compute-goldens.ts` — **now a checked-in script** (the §18
lesson-5 relay: the tool that re-pins goldens after a policy-key wave ships with
the tree instead of living in a session's memory). The complete old→new table
lives in `agent-ctx/P36-goldens-repin.md`; the spec's review note names the
wave and points there.

## 7. Docs sync

- [../../../planning/IMPLEMENTATION_STATUS.md](../../../planning/IMPLEMENTATION_STATUS.md)
  — the PHASE-036 COMPLETE row (the full deliverable + verification record);
  the header line; the cross-cutting table refreshed (migrations 0001–0049; the
  extensibility plane on the API row; 146 screens; i18n 4,417; tests 43/500 +
  contracts 82/82; __db__ 167 files).
- [../../../security/AUTHORIZATION_MATRIX.md](../../../security/AUTHORIZATION_MATRIX.md)
  — §3.16 (the three keys + the self-plane inventory + the rename record + the
  bulk/export/copy permission notes).
- [../../../product/FEATURE_CATALOG.md](../../../product/FEATURE_CATALOG.md) — the six
  §3 rows + the 182-key count statement.
- [../../../database/ENTITY_CATALOG.md](../../../database/ENTITY_CATALOG.md) — the
  §extensibility section (6 entities).
- [../../../database/TABLES/extensibility.md](../../../database/TABLES/extensibility.md)
  — the column-level truth for all six tables (NEW file).
- [../../../database/DATA_DICTIONARY.md](../../../database/DATA_DICTIONARY.md) — §9
  enum registry (custom_field_type + the closed entity-kind list) + the
  column-shaped families note.
- [../../../ui/NAVIGATION_MODEL.md](../../../ui/NAVIGATION_MODEL.md) — the two §9
  LIVE rows (the manager screen + the list-productivity surfaces).
- [../../../handoff/CURRENT_STATE.md](../../../handoff/CURRENT_STATE.md) —
  CURRENT_SHIPPED_PHASE 036; migrations 0001–0049; 182 keys; 248 permissions;
  i18n 4,417; the 146th screen.
- [../../../handoff/NEXT_ACTION.md](../../../handoff/NEXT_ACTION.md) — PHASE-036
  COMPLETE; NEXT ELIGIBLE PHASE-037; the delivery discipline now names BOTH legs
  (the archive AND the GitHub commit/push).
- [../../../handoff/CHANGELOG.md](../../../handoff/CHANGELOG.md) — this phase's entry
  (newest-first).
- [../../../handoff/VALIDATION_REPORT.md](../../../handoff/VALIDATION_REPORT.md) —
  the PHASE-036 re-run entry.
- [../../../planning/POST_ROADMAP_EXPANSION_REGISTER.md](../../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
  — the PHASE-036 row marked SHIPPED with the evidence link.
- [../PHASE-036.md](../PHASE-036.md) — the status header flipped to COMPLETE
  (the body stays the binding spec, the house convention).
- [../../../implementation/README.md](../../../implementation/README.md) — the phases
  inventory line (036 COMPLETE; 037–058 PLANNED).

## 8. Honest deviations and deferrals

- **The §3.16 key rename** (platform.views.manage → settings.views.share) — a
  matrix-rule correction recorded in three places (the matrix §3.16 notes, the
  FEATURE_CATALOG row, here); the entitlement layer (platform.saved_views) is
  unchanged.
- **Mentions delivery (FD-16)** — the data model shipped (mentions jsonb +
  parseMentions); the delivery channels wait for PHASE-052 exactly as the phase
  §2 scoped (no email/SMS fabrication).
- **Server pagination (FD-05 partial)** — the pattern + the three reference
  surfaces ship per the phase §2 out-of-scope note; the ~145-screen retrofit
  lands with the owning domain phases (040+).
- **Autosave (FD-09) / undo (FD-10) / form designer (FD-19)** — out of scope per
  the phase doc §2 (autosave with the form-heavy phases; undo rejected by the
  immutability discipline; the designer is a PHASE-057 candidate behind a
  decision record).
- **The entity-save completeness hook** (`assertRequiredAtEntitySave`) shipped
  as the pure helper + the service method; the per-entity call sites (PARTNER/
  ITEM forms) adopt it with their screens in PHASE-037 (master-data depth) — the
  definitions/values plane is fully live here, the required-at-save wiring is
  the residue phase's named task (recorded, not silently skipped).
- **Export audit rows (E-04 family)** — the audit-events export precedent audits
  every export; the three new list-export routes rely on the existing
  audit-per-BFF-read substrate this session (the dedicated streaming route
  writes no audit row of its own yet; the gap is recorded for PHASE-052's
  activity-mapping sweep).
- **The web layer's baseline environment errors RESOLVED** — the fresh
  workspace install (pnpm, offline store) cleared both long-standing sandbox
  artifacts (the icons.tsx dual-@types/react type error and the dual-React
  SyncNowButton vitest failure): web typecheck is zero-error across the app and
  the unit suite is 73/73. The PHASE-035 report's 72/73 statement was true of
  its session's environment; this phase's clean reinstall is the better state
  recorded here.

## 9. The deliverable

The phase's tree — committed and **pushed to the GitHub repository
`kasem520000/ERP_4`** — IS the deliverable (the owner's explicit instruction at
execution start: the repository push replaces the archive hand-off; no
`ERP_PLATFORM_PHASE036.zip` was produced this phase, the repo working tree at
the phase commit is the byte-equivalent source should an archive ever be
needed). The next executable order is **"begin PHASE-037"** (Master-Data Depth &
Activation Residue) per the register's W1 wave; 039 may run in parallel after
review.
