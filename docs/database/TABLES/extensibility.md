# TABLES — Extensibility Cluster (PHASE-036)

> **Status:** DELIVERED (PHASE-036, migration `0049_custom_fields_productivity.sql`,
> schema_version 49) · **Owner:** Database Architecture · **Updated:** 2026-11-10 ·
> Column-level specs for the extensibility backbone — custom picklists + options,
> custom field definitions + typed values, saved list views, and the append-only 🔒
> record-comments store (the FD-18/FD-20/FD-02/FD-03/FD-15 surfaces of the
> post-roadmap gap-closure program's first module). ENTITY_CATALOG §extensibility is
> the catalog-level map; this file is the column-level truth. ADR-0009 precision
> discipline: the MONEY family is `numeric(19,4)` (decimal strings on the wire, never
> floats), the NUMBER family carries `numeric(28,10)` headroom. All six tables are
> tenant-owned with the house RLS macro + the erp_migrate purge-path policies; every
> id is UUIDv7. **INV-027 (the frozen-core guard, machine-checked by the contracts
> forbidden-stem test): nothing in this cluster may appear on any posting-engine,
> journal-line, or tax DTO surface — custom fields are DATA dimensions only.**

## §custom_picklists — the option-set register (FD-20)

One row per tenant-defined picklist. `key` is the stable identifier (CHECK
`^[a-z][a-z0-9_]{0,59}$`, UNIQUE per tenant) SELECT-type field definitions
reference; `name`/`name_ar` are the bilingual display names (the triple-parity
rule). `is_active` hides a picklist from new SELECT definitions without deleting
it — definitions referencing an inactive picklist keep resolving historical
values (deletion is blocked by the service while any definition references it:
the typed `extensibility/picklist-in-use` error). Grants: full
SELECT/INSERT/UPDATE/DELETE for `erp_app` (option-set management is the
`settings.picklists.manage` permission's surface — the store guards the
in-use rule at the service edge).

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | uuid | PK; UUIDv7; `uq (id, tenant_id)` |
| `tenant_id` | uuid | NOT NULL FK → tenants RESTRICT; RLS macro |
| `key` | varchar(60) | CHECK `^[a-z][a-z0-9_]{0,59}$`; `uq (tenant_id, key)` |
| `name` / `name_ar` | text | NOT NULL — bilingual display names |
| `is_active` | boolean | NOT NULL DEFAULT true |
| `created_at` / `updated_at` | timestamptz | NOT NULL DEFAULT now() |
| `version` | integer | NOT NULL DEFAULT 1 (optimistic) |
| `created_by` | uuid | NULL allowed |

Hot index: `(tenant_id, is_active, key)`.

## §custom_picklist_options — the option rows

One row per option. `value` is the stable code (CHECK
`^[a-z0-9][a-z0-9_-]{0,59}$`, UNIQUE per picklist) — the human-readable label
renders from `label`/`label_ar`; `sort` drives the form order; deactivating an
option (is_active false) hides it from NEW picks while historical
`custom_field_values` rows keep resolving it. `ON DELETE CASCADE` from the owning
picklist row — option rows are definition-scoped data, never cross-referenced
elsewhere (the value rows reference them via FK RESTRICT, so deleting an option
that carries values fails closed at the FK).

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | uuid | PK; UUIDv7 |
| `tenant_id` | uuid | NOT NULL FK → tenants RESTRICT |
| `picklist_id` | uuid | NOT NULL; composite FK → custom_picklists ON DELETE CASCADE |
| `value` | varchar(60) | CHECK format; `uq (picklist_id, tenant_id, value)` |
| `label` / `label_ar` | text | NOT NULL — bilingual |
| `sort` | integer | NOT NULL DEFAULT 0 |
| `is_active` | boolean | NOT NULL DEFAULT true |

Hot index: `(picklist_id, tenant_id, sort, value)`.

## §custom_field_definitions — the field register (FD-18)

One row per tenant-defined field. `entity_kind` is the CLOSED 11-kind list
(PARTNER, ITEM, SALES_QUOTATION, SALES_ORDER, SALES_INVOICE, PURCHASE_ORDER,
SUPPLIER_INVOICE, JOURNAL_ENTRY, FIXED_ASSET, EMPLOYEE, EXPENSE — the contracts
`CUSTOM_FIELD_ENTITY_KINDS` mirror, cell-for-cell with this CHECK);
`(tenant_id, entity_kind, key)` is UNIQUE. `type` is the six-family enum
(TEXT/NUMBER/MONEY/DATE/BOOLEAN/SELECT); `ck_..._select_shape` enforces
`(type = 'SELECT') = (picklist_id IS NOT NULL)` (a SELECT must carry its
option set; every other family must not). `validation` jsonb carries the
per-family rules `{regex?, min?, max?, minDate?, maxDate?}` (zod-validated at
the contracts edge — a CHECK cannot carry the family-dispatch). BOOLEAN fields
cannot be `required` (absence is meaningful — service-enforced with the typed
error; the SQL CHECK family cannot express it without a subquery). The type is
the IMMUTABLE SPINE once created (the update DTO strips it; typed rows depend
on the family). Deleting a definition with values fails closed (typed
`extensibility/custom-field-has-values`; deactivate is the operator path).
`show_in_list` caps the list payload fold-in (the payload-bloat rule).

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | uuid | PK; UUIDv7 |
| `tenant_id` | uuid | NOT NULL FK → tenants RESTRICT |
| `entity_kind` | text | NOT NULL CHECK closed 11-list |
| `key` | varchar(60) | CHECK `^[a-z][a-z0-9_]{0,59}$`; `uq (tenant_id, entity_kind, key)` |
| `label` / `label_ar` | text | NOT NULL — bilingual field captions |
| `type` | text | CHECK `TEXT\|NUMBER\|MONEY\|DATE\|BOOLEAN\|SELECT` — immutable spine |
| `picklist_id` | uuid | composite FK → custom_picklists RESTRICT; ck select-shape |
| `required` | boolean | NOT NULL DEFAULT false (never true for BOOLEAN) |
| `default_value` | jsonb | typed per family (zod edge) |
| `validation` | jsonb | CHECK object shape; per-family rules |
| `help_text` / `help_text_ar` | text | ≤ 400 chars each — bilingual field help |
| `show_in_list` | boolean | NOT NULL DEFAULT false — the list fold-in cap |
| `sort` | integer | NOT NULL DEFAULT 0 — form order |
| `is_active` | boolean | NOT NULL DEFAULT true — hides from new writes |

Hot index: `(tenant_id, entity_kind, is_active, sort, key)`.

## §custom_field_values — the typed value store

One row per (entity, definition) **with a value** — an optional field with no
value has NO row (DELETE clears; "no row = empty" is the write contract).
`field_type` is the denormalized definition snapshot so the value-family
invariant is a pure CHECK: `ck_custom_field_values_typed_family` requires
EXACTLY ONE value column populated, matching the family —

| family | the populated column |
|---|---|
| TEXT | `value_text` (≤ 2,000) |
| NUMBER | `value_number` **numeric(28,10)** |
| MONEY | `value_money` **numeric(19,4)** (ADR-0009) |
| DATE | `value_date` |
| BOOLEAN | `value_boolean` |
| SELECT | `value_picklist_option_id` (FK RESTRICT → options) |

— and every other family's column NULL. `entity_kind ↔ definition.entity_kind`
consistency is SERVICE-enforced (a CHECK cannot join across tables; the zod
schema + the store's typed writes own it — recorded here as the invariant's
home). Grants: SELECT/INSERT/UPDATE/DELETE (DELETE clears an optional field's
row). Definitions cascade on delete (a definition's values die with it — the
delete guard above makes that a deliberate purge decision); options RESTRICT.

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | uuid | PK; UUIDv7 |
| `tenant_id` | uuid | NOT NULL FK → tenants RESTRICT |
| `entity_kind` / `entity_id` | text / uuid | NOT NULL; the polymorphic anchor (service-validated own-tenant) |
| `definition_id` | uuid | NOT NULL composite FK → definitions CASCADE; `uq (tenant_id, entity_kind, entity_id, definition_id)` |
| `field_type` | text | NOT NULL — the definition snapshot; CHECK 6 families |
| `value_text` … `value_picklist_option_id` | per family | the ck one-family invariant above |

Hot indexes: `(tenant_id, entity_kind, entity_id)` — the batch fold-in read
(the phase's hot path); `(tenant_id, definition_id)` — the delete-guard count.

## §saved_views — the list-view snapshots (FD-02/FD-03)

One row per saved view. `user_id` NULL = a SHARED tenant view (writing one
requires the `settings.views.share` permission — route-side AND service-side,
defense in depth; the §3.16 rename record: the phase doc projected
`platform.views.manage`, it landed on the tenant settings plane per the
matrix §3.10 rule). `columns` (jsonb array of column keys), `filters` (jsonb
object), `sort` (jsonb array of `{column, dir}`) are the DataTable state
snapshot — opaque to SQL, zod-shaped at the contracts edge. `is_default` marks
the view a user's list opens with; ONE default per (tenant, entity, owner) is
service-guarded (the COALESCE unique index below carries the NULL-shared
shape). The COALESCE unique index `uq_saved_views_tenant_entity_owner_name`
maps NULL user_id to the nil UUID so shared + personal name spaces stay
collision-free within one entity kind.

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | uuid | PK; UUIDv7 |
| `tenant_id` | uuid | NOT NULL FK → tenants RESTRICT |
| `user_id` | uuid | NULL = shared tenant view |
| `entity_kind` | text | NOT NULL CHECK closed 11-list |
| `name` | text | CHECK 1–120; COALESCE-unique per (tenant, entity, owner) |
| `columns` | jsonb | NOT NULL; CHECK array shape |
| `filters` | jsonb | NOT NULL DEFAULT '{}'; CHECK object shape |
| `sort` | jsonb | NULL or [{column, dir}] |
| `is_default` | boolean | NOT NULL DEFAULT false |

Hot index: `(tenant_id, entity_kind, user_id)`.

## §record_comments 🔒 — the collaboration thread (FD-15)

One row per comment — **append-only** exactly like `audit_events`: UPDATE
never (grant-denied + the `erp.record_comments_guard()` trigger), DELETE only
under `erp.purge_mode` (the offboarding purge path — the trigger owns the
policy). `body` CHECK 1–4,000 chars; `mentions` jsonb array carries the parsed
@uuid tokens (the store's `parseMentions`), DATA-ONLY now — notification
delivery rides PHASE-052's fabric (no email/SMS fabrication). The record
TIMELINE (FD-14) composes this store with `audit_events` newest-first through
`GET /api/v1/extensibility/timeline` — audit rows carry actor/action/after;
comments carry body/mentions; the drawer renders both. An audit row per
comment would duplicate the thread — the timeline composes instead (the
phase §2 design, recorded).

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | uuid | PK; UUIDv7 |
| `tenant_id` | uuid | NOT NULL FK → tenants RESTRICT |
| `author_id` | uuid | NOT NULL (no created_by/updated_at — immutable rows) |
| `entity_kind` / `entity_id` | text / uuid | NOT NULL CHECK closed 11-list; the polymorphic anchor |
| `body` | text | CHECK length 1–4,000 |
| `mentions` | jsonb | CHECK array shape (uuid format zod-validated at the edge) |
| `created_at` | timestamptz | NOT NULL DEFAULT now() |

Hot index: `(tenant_id, entity_kind, entity_id, created_at)`.

## Seeds, grants, and the settings wave

Migration 0049 seeds the three §3.16 permission keys + the owner/accountant
role grants + the six `platform.*` feature-key plan grants (business +
enterprise — the tier-4 posture; starter blocked). The duplicate-invoice
tolerance rides the CODE-side `SETTINGS_REGISTRY` key
`purchasing.duplicate_invoice_tolerance_pct` (default 0, 0–10; the 028/029
SETTINGS wave pattern — no SQL seed) — that policy-key wave is why every
golden effective-config pin was recomputed in-phase (spec 44/44; the old→new
table lives in `agent-ctx/P36-goldens-repin.md`).
