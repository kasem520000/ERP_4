# P36-W — PHASE-036 WEB LAYER (Custom Fields & Productivity) — WORK RECORD

Task: implement the WEB layer of PHASE-036 in `apps/web` only (backend API,
contracts, docs owned by the sibling agent — untouched). This record covers
the final verified state of the deliverables (a prior interrupted pass had
drafted the bulk of the files; this pass audited every surface against the
task spec, closed the gaps, re-validated everything, and wrote this record).

## Deliverables (all under apps/web)

### 1. Custom-fields manager (the flagship UI)
- `app/[locale]/settings/custom-fields/page.tsx` (NEW, 78 lines) — server
  page: `requireSessionToken` + `fetchApi` for `settings/custom-fields`,
  `settings/picklists`, `identity/sessions/current`; 401 → login redirect;
  403 → forbidden ErrorState (the sales-invoices page pattern); renders
  `CustomFieldsManager` with permission flags
  (`settings.custom_fields.manage` / `settings.picklists.manage`).
- `components/custom-fields-manager.tsx` (NEW, 982 lines, "use client") —
  entity-kind Select over the CLOSED 11-kind list from `@erp/contracts`
  (`CUSTOM_FIELD_ENTITY_KINDS`); definitions DataTable (key / localized
  label / type Badge / picklist / required / show-in-list / sort / active
  + row actions edit/activate/deactivate/delete with inline confirm card);
  create/edit inline form — key immutable on edit (readOnly), label +
  labelAr, type select (immutable on edit), picklist select when SELECT,
  required checkbox disabled for BOOLEAN, show-in-list, sort, help texts,
  per-type validation fields (TEXT regex; NUMBER/MONEY min/max; DATE
  minDate/maxDate) with client-side pattern checks (KEY_RE / DECIMAL_RE /
  DATE_RE / regex compile); picklists plane — list with options tables,
  in-use badge + used-by-fields count, create picklist (key/name/nameAr +
  initial options rows), per-picklist add-option form, delete-option,
  delete-picklist confirm (in-use guard surfaced as the honest API error).
  All mutations via `bffFetch` with ErrorNotice/SuccessNotice + `refresh()`
  re-reading both planes.

### 2. List toolbar + bulk bar (generic, props-configurable)
- `components/list-toolbar.tsx` (NEW, 367 lines, "use client") — props:
  `locale, entityKind, columns {key,header}[], visibleColumns,
  onVisibleColumnsChange, filters, onApplyView, exportPath, canShare`;
  column-chooser Popover with per-column checkboxes + search + localStorage
  persistence per entity kind (`erp.listview.{kind}.columns`, canonical
  order kept, last-column refuse-hide); saved views — `GET
  settings/views?entity=` on mount, apply Select + per-row Apply buttons
  (→ `onApplyView({columns, filters, sort})` with column validation),
  save-current form (name + shared checkbox gated by canShare + default
  checkbox), per-view delete, my/shared groups labeled svMyViews /
  svSharedViews; export CSV/XLSX as same-origin `LinkButton` anchors to
  `/api/bff/sales/sales-invoices/export?format=…&columns=…&<filters>`.
- `components/bulk-actions-bar.tsx` (NEW, 145 lines, "use client") —
  props: `locale, selectedIds, onClear, bulkPath, actions
  ("approve"|"post"|"void")[]`; bar with selected-count Badge + per-action
  Button POSTing `{action, ids}` via bffFetch; FD-01 honest result panel
  ("{action} — {succeeded} of {requested}", succeeded/failed badges,
  per-row failure list id+error code); selection cleared after the run.
- `app/api/bff/sales/sales-invoices/export/route.ts` (NEW, 93 lines) —
  dedicated BFF streaming route (the PHASE-024 audit-export precedent):
  the generic BFF proxy is JSON-only and would mangle the CSV/XLSX
  attachment, so this route forwards the session cookie as
  X-Session-Token, re-broadcasts ONLY the known filter keys
  (format/columns/status/customerId/kind) and passes the attachment
  through binary-safe with Content-Type/Content-Disposition intact;
  non-200 upstream passes as the standard JSON error envelope.

### 3. Record timeline + comments drawer
- `components/record-timeline.tsx` (NEW, 199 lines, "use client") —
  per-row "Timeline" icon Button opening a fixed overlay side panel
  (logical `end-0`, dir-aware, click-away scrim + labeled Close);
  `GET extensibility/timeline?entity=&id=&limit=100` newest-first with
  the discriminated union rendered per kind (audit: Badge + timelineAction
  label + mono action + at + actor short-id; comment: Badge + author
  short-id + pre-wrapped body + at + @mention tokens); comment composer
  (Textarea + send → `POST extensibility/comments` with the @uuid
  mention hint) + reload after send.

### 4. Sales-invoices reference screen (additive wiring)
- `components/sales-invoices.tsx` (MODIFIED, +428/−130 hunk-lines → 815
  lines) — DataTable's BUILT-IN selection API used (`selected` +
  `onSelectedChange` + `selectionLabel`; verified in
  packages/ui/src/components/data-table/data-table.tsx — no custom
  checkbox column needed, NO packages/ui changes); `BulkActionsBar`
  mounted (actions approve/post/void gated by canApprove/canPost/canCreate,
  bulkPath `sales/sales-invoices/bulk`, reload after clear);
  `ListToolbar` mounted (entityKind SALES_INVOICE, toolbarColumns from the
  canonical LIST_COLUMN_KEYS, visibleColumns/filters/sort state applied,
  exportPath `sales/sales-invoices/export`, canShare from the server);
  per-row quick-actions column — copy-to-new icon Button (`POST
  sales/sales-invoices/:id/copy-to-new` → prepends the fresh DRAFT row +
  router.refresh() via the shared `call` helper) + RecordTimeline per row
  (`key={row.id}` remount guard against virtualized slot reuse). ALL
  existing behavior kept intact (create form with item/account lines,
  submit/approve-with-override flows, cancel-with-reason, disabled print).
- `app/[locale]/sales/invoices/page.tsx` (MODIFIED, +1) — passes
  `canShareViews={permissions.includes("settings.views.share")}`.
- `app/[locale]/settings/page.tsx` (MODIFIED, +8) — the settings hub card
  (title + description + LinkButton → `/{locale}/settings/custom-fields`),
  mirroring the hub's card pattern.
- `components/app-shell.tsx` (MODIFIED, +4) — fallback crumb entry for
  `settings/custom-fields` (nav registry grows the row server-side).

### 5. Wire types + i18n
- `lib/api-types.ts` (MODIFIED, +137) — re-exports
  `CustomFieldEntityKind`/`CustomFieldType` from `@erp/contracts` (single
  source of truth) + plain-interface rows in the file's ADR-0003 style:
  `CustomFieldValidationRow`, `CustomFieldDefinitionRow` (with the resolved
  `picklist?`), `CustomFieldValueWire`, `CustomFieldValuesMap`,
  `CustomPicklistOptionRow`, `CustomPicklistRow`, `SavedViewRow`,
  `TimelineEntryRow` (discriminated union), `RecordCommentRow`,
  `BulkRowOutcomeRow`, `BulkActionResultRow`. All shapes verified against
  `packages/contracts/src/platform/custom-fields.ts` (money/number values
  stay decimal STRINGS — never Number()).
- `i18n/dictionaries.ts` (MODIFIED, +400) — **131 new keys** in BOTH ar
  and en (identical camelCase key sets; interface + ar + en all updated):
  cf×80, sv×22, bulk×12, timeline×12, row×4, exportFailed×1. Natural
  professional Gulf business Arabic.

## Validation (all re-run after the final polish pass)
1. `npx tsc --noEmit -p tsconfig.json` — the ONLY error is the
   pre-existing environment error in `packages/ui/src/utils/icons.tsx`
   (dual @types/react in the sandbox root node_modules); verified
   byte-identical on clean HEAD via `git stash`. ZERO errors in P36-W
   files.
2. `npx tsx scripts/check-i18n-parity.ts` — PASS: `ar=4417 keys,
   en=4417 keys`, 100% parity, no empty values (HEAD baseline was
   4286+4286; +131 per side).
3. `npx vitest run` — 72 passed / 1 failed = the ONE known environment
   failure (`components/offline/__tests__/offline-components.test.tsx >
   SyncNowButton`, dual-React useContext crash); verified failing on
   clean HEAD too. ZERO new failures.
4. `npx eslint` on all 12 touched files — ZERO errors/warnings.

## Deviations (small, reasoned)
- ListToolbar/BulkActionsBar/RecordTimeline take `locale` and derive the
  dictionary internally via `getDictionary(locale)` instead of a
  dictionary prop — the house pattern used by the reference component
  (`sales-invoices.tsx`); the task's "dictionary labels + locale" props
  are satisfied by the locale-derived dictionary.
- Export uses same-origin `<a href>` anchors (LinkButton) to the
  dedicated `/api/bff/sales/sales-invoices/export` streaming route rather
  than raw `window.location.assign` — equivalent mechanism per the task's
  own "or an `<a href>`" allowance; needed because the generic BFF proxy
  is JSON-only and would corrupt the file download (PHASE-024 precedent).
- Row selection uses the DataTable's existing built-in selection API
  (verified in packages/ui) instead of custom checkbox cells — the task
  explicitly allowed this branch of the alternative.
- `exportFailed` / `cfSaveFailed` / `svSaveFailed` / `timelineFailed` are
  coverage keys (present in both locales per the task's key list); anchor
  downloads cannot surface client-side failure without deviating from the
  prescribed export mechanism, and API failures already localize through
  `localizedApiError`.
- `cfSaveFailed` etc. remain unused-but-required by the task's key
  families; `svTitle`/`svMyViews`/`timelineAction`/`cfOptions` ARE wired
  (section heading, group labels, audit-action label, options heading).

## Boundary check
NO changes outside apps/web (apps/api + packages/contracts + docs +
scripts belong to the sibling agents; packages/ui untouched — its
DataTable already shipped selection support).
