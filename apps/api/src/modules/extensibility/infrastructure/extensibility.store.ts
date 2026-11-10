import { sql } from "drizzle-orm";

import { generateUuidV7 } from "@erp/domain-core";

import { type TenantDb } from "../../../infra/db/client";
import { requireTenantContext } from "../../../infra/db/tenant-context";

/**
 * Extensibility store (PHASE-036): the ONLY writer of the six module
 * tables (custom_picklists, custom_picklist_options,
 * custom_field_definitions, custom_field_values, saved_views,
 * record_comments 🔒). Every statement runs in the caller's ambient tenant
 * UoW so a failure anywhere rolls the whole business operation back
 * (INV-018 discipline). journal_entries/journal_lines are NEVER touched
 * (INV-027 — custom fields are DATA dimensions only); record_comments is
 * append-only (SELECT/INSERT grants + the erp.record_comments_guard
 * trigger — this store exposes insert/list only).
 *
 * Pure validation logic lives in ../application/custom-field-validation.ts
 * (unit-tested without a database); this file is storage only.
 */

function tenantTx(): TenantDb {
  const context = requireTenantContext();
  if (context.tx === undefined) {
    throw new Error("extensibility access requires an ambient tenant scope");
  }
  return context.tx;
}

export interface CustomFieldDefinitionRow {
  id: string;
  entityKind: string;
  key: string;
  label: string;
  labelAr: string;
  type: "TEXT" | "NUMBER" | "MONEY" | "DATE" | "BOOLEAN" | "SELECT";
  picklistId: string | null;
  required: boolean;
  defaultValue: unknown;
  validation: Record<string, unknown> | null;
  helpText: string | null;
  helpTextAr: string | null;
  showInList: boolean;
  sort: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PicklistRow {
  id: string;
  key: string;
  name: string;
  nameAr: string;
  isActive: boolean;
  createdAt: string;
}

export interface PicklistOptionRow {
  id: string;
  picklistId: string;
  value: string;
  label: string;
  labelAr: string;
  sort: number;
  isActive: boolean;
}

export interface SavedViewRow {
  id: string;
  userId: string | null;
  entityKind: string;
  name: string;
  columns: string[];
  filters: Record<string, unknown>;
  sort: { column: string; dir: "asc" | "desc" }[] | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecordCommentRow {
  id: string;
  entityKind: string;
  entityId: string;
  authorId: string;
  authorName: string | null;
  body: string;
  mentions: string[] | null;
  createdAt: string;
}

export interface CustomFieldValueRow {
  id: string;
  entityKind: string;
  entityId: string;
  definitionId: string;
  fieldKey: string;
  fieldType: "TEXT" | "NUMBER" | "MONEY" | "DATE" | "BOOLEAN" | "SELECT";
  valueText: string | null;
  valueNumber: string | null;
  valueMoney: string | null;
  valueDate: string | null;
  valueBoolean: boolean | null;
  valuePicklistOptionId: string | null;
}

// -- definitions ------------------------------------------------------------------

const DEFINITION_SELECT = sql`
  SELECT d.id, d.entity_kind AS "entityKind", d.key, d.label, d.label_ar AS "labelAr",
         d.type, d.picklist_id AS "picklistId", d.required, d.default_value AS "defaultValue",
         d.validation, d.help_text AS "helpText", d.help_text_ar AS "helpTextAr",
         d.show_in_list AS "showInList", d.sort, d.is_active AS "isActive",
         d.created_at AS "createdAt", d.updated_at AS "updatedAt", d.version
  FROM custom_field_definitions d
`;

export async function listDefinitions(entityKind?: string): Promise<readonly CustomFieldDefinitionRow[]> {
  const rows = entityKind === undefined
    ? await tenantTx().execute(sql`${DEFINITION_SELECT} ORDER BY d.entity_kind, d.sort, d.key`)
    : await tenantTx().execute(
        sql`${DEFINITION_SELECT} WHERE d.entity_kind = ${entityKind} ORDER BY d.sort, d.key`,
      );
  return rows.rows as unknown as CustomFieldDefinitionRow[];
}

export async function listActiveDefinitions(entityKind: string): Promise<readonly CustomFieldDefinitionRow[]> {
  const rows = await tenantTx().execute(
    sql`${DEFINITION_SELECT} WHERE d.entity_kind = ${entityKind} AND d.is_active = true ORDER BY d.sort, d.key`,
  );
  return rows.rows as unknown as CustomFieldDefinitionRow[];
}

export async function findDefinitionById(id: string): Promise<CustomFieldDefinitionRow | undefined> {
  const rows = await tenantTx().execute(sql`${DEFINITION_SELECT} WHERE d.id = ${id} LIMIT 1`);
  return (rows.rows as unknown as CustomFieldDefinitionRow[])[0];
}

export async function findDefinitionByKey(
  entityKind: string,
  key: string,
): Promise<CustomFieldDefinitionRow | undefined> {
  const rows = await tenantTx().execute(
    sql`${DEFINITION_SELECT} WHERE d.entity_kind = ${entityKind} AND d.key = ${key} LIMIT 1`,
  );
  return (rows.rows as unknown as CustomFieldDefinitionRow[])[0];
}

export async function countValuesByDefinition(definitionId: string): Promise<number> {
  const rows = await tenantTx().execute(
    sql`SELECT count(*)::int AS n FROM custom_field_values WHERE definition_id = ${definitionId}`,
  );
  return (rows.rows as unknown as { n: number }[])[0]?.n ?? 0;
}

export async function insertDefinition(input: {
  entityKind: string;
  key: string;
  label: string;
  labelAr: string;
  type: string;
  picklistId: string | null;
  required: boolean;
  defaultValue: unknown;
  validation: Record<string, unknown> | null;
  helpText: string | null;
  helpTextAr: string | null;
  showInList: boolean;
  sort: number;
  isActive: boolean;
  actorId: string | null;
}): Promise<CustomFieldDefinitionRow> {
  const id = generateUuidV7();
  await tenantTx().execute(sql`
    INSERT INTO custom_field_definitions
      (id, tenant_id, created_by, entity_kind, key, label, label_ar, type, picklist_id,
       required, default_value, validation, help_text, help_text_ar, show_in_list, sort, is_active)
    VALUES (${id}, erp.current_tenant_id(), ${input.actorId}, ${input.entityKind}, ${input.key},
            ${input.label}, ${input.labelAr}, ${input.type}, ${input.picklistId},
            ${input.required}, ${JSON.stringify(input.defaultValue ?? null)}::jsonb,
            ${JSON.stringify(input.validation ?? null)}::jsonb,
            ${input.helpText}, ${input.helpTextAr}, ${input.showInList}, ${input.sort}, ${input.isActive})
  `);
  return (await findDefinitionById(id))!;
}

export async function updateDefinition(
  id: string,
  patch: {
    label?: string;
    labelAr?: string;
    picklistId?: string | null;
    required?: boolean;
    defaultValue?: unknown;
    validation?: Record<string, unknown> | null;
    helpText?: string | null;
    helpTextAr?: string | null;
    showInList?: boolean;
    sort?: number;
    isActive?: boolean;
  },
): Promise<void> {
  await tenantTx().execute(sql`
    UPDATE custom_field_definitions SET
      label = COALESCE(${patch.label ?? null}, label),
      label_ar = COALESCE(${patch.labelAr ?? null}, label_ar),
      picklist_id = CASE WHEN ${patch.picklistId === undefined} THEN picklist_id ELSE ${patch.picklistId ?? null} END,
      required = CASE WHEN ${patch.required === undefined} THEN required ELSE ${patch.required ?? false} END,
      default_value = CASE WHEN ${patch.defaultValue === undefined} THEN default_value ELSE ${JSON.stringify(patch.defaultValue ?? null)}::jsonb END,
      validation = CASE WHEN ${patch.validation === undefined} THEN validation ELSE ${JSON.stringify(patch.validation ?? null)}::jsonb END,
      help_text = CASE WHEN ${patch.helpText === undefined} THEN help_text ELSE ${patch.helpText ?? null} END,
      help_text_ar = CASE WHEN ${patch.helpTextAr === undefined} THEN help_text_ar ELSE ${patch.helpTextAr ?? null} END,
      show_in_list = CASE WHEN ${patch.showInList === undefined} THEN show_in_list ELSE ${patch.showInList ?? false} END,
      sort = CASE WHEN ${patch.sort === undefined} THEN sort ELSE ${patch.sort ?? 0} END,
      is_active = CASE WHEN ${patch.isActive === undefined} THEN is_active ELSE ${patch.isActive ?? true} END,
      updated_at = now(),
      version = version + 1
    WHERE id = ${id}
  `);
}

export async function deleteDefinition(id: string): Promise<void> {
  await tenantTx().execute(sql`DELETE FROM custom_field_definitions WHERE id = ${id}`);
}

// -- picklists ---------------------------------------------------------------------

const PICKLIST_SELECT = sql`
  SELECT p.id, p.key, p.name, p.name_ar AS "nameAr", p.is_active AS "isActive", p.created_at AS "createdAt"
  FROM custom_picklists p
`;

export async function listPicklists(): Promise<readonly PicklistRow[]> {
  const rows = await tenantTx().execute(sql`${PICKLIST_SELECT} ORDER BY p.key`);
  return rows.rows as unknown as PicklistRow[];
}

export async function findPicklistById(id: string): Promise<PicklistRow | undefined> {
  const rows = await tenantTx().execute(sql`${PICKLIST_SELECT} WHERE p.id = ${id} LIMIT 1`);
  return (rows.rows as unknown as PicklistRow[])[0];
}

export async function findPicklistByKey(key: string): Promise<PicklistRow | undefined> {
  const rows = await tenantTx().execute(sql`${PICKLIST_SELECT} WHERE p.key = ${key} LIMIT 1`);
  return (rows.rows as unknown as PicklistRow[])[0];
}

export async function countDefinitionsOnPicklist(picklistId: string): Promise<number> {
  const rows = await tenantTx().execute(
    sql`SELECT count(*)::int AS n FROM custom_field_definitions WHERE picklist_id = ${picklistId}`,
  );
  return (rows.rows as unknown as { n: number }[])[0]?.n ?? 0;
}

export async function insertPicklist(input: {
  key: string;
  name: string;
  nameAr: string;
  actorId: string | null;
}): Promise<PicklistRow> {
  const id = generateUuidV7();
  await tenantTx().execute(sql`
    INSERT INTO custom_picklists (id, tenant_id, created_by, key, name, name_ar)
    VALUES (${id}, erp.current_tenant_id(), ${input.actorId}, ${input.key}, ${input.name}, ${input.nameAr})
  `);
  return (await findPicklistById(id))!;
}

export async function updatePicklist(
  id: string,
  patch: { name?: string; nameAr?: string; isActive?: boolean },
): Promise<void> {
  await tenantTx().execute(sql`
    UPDATE custom_picklists SET
      name = COALESCE(${patch.name ?? null}, name),
      name_ar = COALESCE(${patch.nameAr ?? null}, name_ar),
      is_active = CASE WHEN ${patch.isActive === undefined} THEN is_active ELSE ${patch.isActive ?? true} END,
      updated_at = now(),
      version = version + 1
    WHERE id = ${id}
  `);
}

export async function deletePicklist(id: string): Promise<void> {
  await tenantTx().execute(sql`DELETE FROM custom_picklists WHERE id = ${id}`);
}

export async function listOptions(picklistId: string): Promise<readonly PicklistOptionRow[]> {
  const rows = await tenantTx().execute(sql`
    SELECT o.id, o.picklist_id AS "picklistId", o.value, o.label, o.label_ar AS "labelAr",
           o.sort, o.is_active AS "isActive"
    FROM custom_picklist_options o
    WHERE o.picklist_id = ${picklistId}
    ORDER BY o.sort, o.value
  `);
  return rows.rows as unknown as PicklistOptionRow[];
}

export async function listActiveOptions(picklistId: string): Promise<readonly PicklistOptionRow[]> {
  const rows = await tenantTx().execute(sql`
    SELECT o.id, o.picklist_id AS "picklistId", o.value, o.label, o.label_ar AS "labelAr",
           o.sort, o.is_active AS "isActive"
    FROM custom_picklist_options o
    WHERE o.picklist_id = ${picklistId} AND o.is_active = true
    ORDER BY o.sort, o.value
  `);
  return rows.rows as unknown as PicklistOptionRow[];
}

export async function findOptionById(id: string): Promise<PicklistOptionRow | undefined> {
  const rows = await tenantTx().execute(sql`
    SELECT o.id, o.picklist_id AS "picklistId", o.value, o.label, o.label_ar AS "labelAr",
           o.sort, o.is_active AS "isActive"
    FROM custom_picklist_options o WHERE o.id = ${id} LIMIT 1
  `);
  return (rows.rows as unknown as PicklistOptionRow[])[0];
}

export async function insertOption(input: {
  picklistId: string;
  value: string;
  label: string;
  labelAr: string;
  sort: number;
  actorId: string | null;
}): Promise<PicklistOptionRow> {
  const id = generateUuidV7();
  await tenantTx().execute(sql`
    INSERT INTO custom_picklist_options
      (id, tenant_id, created_by, picklist_id, value, label, label_ar, sort)
    VALUES (${id}, erp.current_tenant_id(), ${input.actorId}, ${input.picklistId},
            ${input.value}, ${input.label}, ${input.labelAr}, ${input.sort})
  `);
  return (await findOptionById(id))!;
}

export async function deleteOption(id: string): Promise<void> {
  await tenantTx().execute(sql`DELETE FROM custom_picklist_options WHERE id = ${id}`);
}

// -- values ---------------------------------------------------------------------

export async function listValuesForEntities(
  entityKind: string,
  entityIds: readonly string[],
): Promise<readonly CustomFieldValueRow[]> {
  if (entityIds.length === 0) {
    return [];
  }
  const rows = await tenantTx().execute(sql`
    SELECT v.id, v.entity_kind AS "entityKind", v.entity_id AS "entityId",
           v.definition_id AS "definitionId", d.key AS "fieldKey", v.field_type AS "fieldType",
           v.value_text AS "valueText", v.value_number::text AS "valueNumber",
           v.value_money::text AS "valueMoney", v.value_date::text AS "valueDate",
           v.value_boolean AS "valueBoolean", v.value_picklist_option_id AS "valuePicklistOptionId"
    FROM custom_field_values v
    JOIN custom_field_definitions d ON d.id = v.definition_id AND d.tenant_id = v.tenant_id
    WHERE v.entity_kind = ${entityKind}
      AND v.entity_id IN (${sql.join(entityIds.map((id) => sql`${id}`), sql`, `)})
  `);
  return rows.rows as unknown as CustomFieldValueRow[];
}

export async function upsertValue(input: {
  entityKind: string;
  entityId: string;
  definitionId: string;
  fieldType: string;
  valueText: string | null;
  valueNumber: string | null;
  valueMoney: string | null;
  valueDate: string | null;
  valueBoolean: boolean | null;
  valuePicklistOptionId: string | null;
  actorId: string | null;
}): Promise<void> {
  const id = generateUuidV7();
  await tenantTx().execute(sql`
    INSERT INTO custom_field_values
      (id, tenant_id, created_by, entity_kind, entity_id, definition_id, field_type,
       value_text, value_number, value_money, value_date, value_boolean, value_picklist_option_id)
    VALUES (${id}, erp.current_tenant_id(), ${input.actorId}, ${input.entityKind}, ${input.entityId},
            ${input.definitionId}, ${input.fieldType}, ${input.valueText}, ${input.valueNumber},
            ${input.valueMoney}, ${input.valueDate}, ${input.valueBoolean}, ${input.valuePicklistOptionId})
    ON CONFLICT (tenant_id, entity_kind, entity_id, definition_id) DO UPDATE SET
      field_type = EXCLUDED.field_type,
      value_text = EXCLUDED.value_text,
      value_number = EXCLUDED.value_number,
      value_money = EXCLUDED.value_money,
      value_date = EXCLUDED.value_date,
      value_boolean = EXCLUDED.value_boolean,
      value_picklist_option_id = EXCLUDED.value_picklist_option_id,
      updated_at = now(),
      version = custom_field_values.version + 1
  `);
}

export async function deleteValue(
  entityKind: string,
  entityId: string,
  definitionId: string,
): Promise<void> {
  await tenantTx().execute(sql`
    DELETE FROM custom_field_values
    WHERE entity_kind = ${entityKind} AND entity_id = ${entityId} AND definition_id = ${definitionId}
  `);
}

// -- saved views -------------------------------------------------------------------

export async function listViews(
  entityKind: string,
  userId: string,
): Promise<readonly SavedViewRow[]> {
  const rows = await tenantTx().execute(sql`
    SELECT v.id, v.user_id AS "userId", v.entity_kind AS "entityKind", v.name,
           v.columns, v.filters, v.sort, v.is_default AS "isDefault",
           v.created_at AS "createdAt", v.updated_at AS "updatedAt"
    FROM saved_views v
    WHERE v.entity_kind = ${entityKind} AND (v.user_id = ${userId} OR v.user_id IS NULL)
    ORDER BY v.user_id NULLS FIRST, v.name
  `);
  return rows.rows as unknown as SavedViewRow[];
}

export async function findViewById(id: string): Promise<SavedViewRow | undefined> {
  const rows = await tenantTx().execute(sql`
    SELECT v.id, v.user_id AS "userId", v.entity_kind AS "entityKind", v.name,
           v.columns, v.filters, v.sort, v.is_default AS "isDefault",
           v.created_at AS "createdAt", v.updated_at AS "updatedAt"
    FROM saved_views v WHERE v.id = ${id} LIMIT 1
  `);
  return (rows.rows as unknown as SavedViewRow[])[0];
}

export async function clearDefaultView(entityKind: string, userId: string | null): Promise<void> {
  if (userId === null) {
    await tenantTx().execute(sql`
      UPDATE saved_views SET is_default = false
      WHERE entity_kind = ${entityKind} AND user_id IS NULL AND is_default = true
    `);
  } else {
    await tenantTx().execute(sql`
      UPDATE saved_views SET is_default = false
      WHERE entity_kind = ${entityKind} AND user_id = ${userId} AND is_default = true
    `);
  }
}

export async function insertView(input: {
  userId: string | null;
  entityKind: string;
  name: string;
  columns: string[];
  filters: Record<string, unknown>;
  sort: { column: string; dir: "asc" | "desc" }[] | null;
  isDefault: boolean;
  actorId: string | null;
}): Promise<SavedViewRow> {
  const id = generateUuidV7();
  await tenantTx().execute(sql`
    INSERT INTO saved_views
      (id, tenant_id, created_by, user_id, entity_kind, name, columns, filters, sort, is_default)
    VALUES (${id}, erp.current_tenant_id(), ${input.actorId}, ${input.userId}, ${input.entityKind},
            ${input.name}, ${JSON.stringify(input.columns)}::jsonb,
            ${JSON.stringify(input.filters)}::jsonb,
            ${JSON.stringify(input.sort ?? null)}::jsonb, ${input.isDefault})
  `);
  return (await findViewById(id))!;
}

export async function updateView(
  id: string,
  patch: {
    name?: string;
    columns?: string[];
    filters?: Record<string, unknown>;
    sort?: { column: string; dir: "asc" | "desc" }[] | null;
    isDefault?: boolean;
  },
): Promise<void> {
  await tenantTx().execute(sql`
    UPDATE saved_views SET
      name = COALESCE(${patch.name ?? null}, name),
      columns = CASE WHEN ${patch.columns === undefined} THEN columns ELSE ${JSON.stringify(patch.columns ?? [])}::jsonb END,
      filters = CASE WHEN ${patch.filters === undefined} THEN filters ELSE ${JSON.stringify(patch.filters ?? {})}::jsonb END,
      sort = CASE WHEN ${patch.sort === undefined} THEN sort ELSE ${JSON.stringify(patch.sort ?? null)}::jsonb END,
      is_default = CASE WHEN ${patch.isDefault === undefined} THEN is_default ELSE ${patch.isDefault ?? false} END,
      updated_at = now(),
      version = version + 1
    WHERE id = ${id}
  `);
}

export async function deleteView(id: string): Promise<void> {
  await tenantTx().execute(sql`DELETE FROM saved_views WHERE id = ${id}`);
}

// -- record comments (append-only 🔒) ----------------------------------------------

export async function listComments(
  entityKind: string,
  entityId: string,
  limit = 200,
): Promise<readonly RecordCommentRow[]> {
  const rows = await tenantTx().execute(sql`
    SELECT c.id, c.entity_kind AS "entityKind", c.entity_id AS "entityId", c.author_id AS "authorId",
           u.full_name AS "authorName", c.body, c.mentions, c.created_at AS "createdAt"
    FROM record_comments c
    LEFT JOIN users u ON u.id = c.author_id AND u.tenant_id = c.tenant_id
    WHERE c.entity_kind = ${entityKind} AND c.entity_id = ${entityId}
    ORDER BY c.created_at DESC
    LIMIT ${limit}
  `);
  return rows.rows as unknown as RecordCommentRow[];
}

export async function insertComment(input: {
  authorId: string;
  entityKind: string;
  entityId: string;
  body: string;
  mentions: string[] | null;
}): Promise<RecordCommentRow> {
  const id = generateUuidV7();
  await tenantTx().execute(sql`
    INSERT INTO record_comments (id, tenant_id, author_id, entity_kind, entity_id, body, mentions)
    VALUES (${id}, erp.current_tenant_id(), ${input.authorId}, ${input.entityKind},
            ${input.entityId}, ${input.body},
            ${JSON.stringify(input.mentions ?? [])}::jsonb)
  `);
  const rows = await tenantTx().execute(sql`
    SELECT c.id, c.entity_kind AS "entityKind", c.entity_id AS "entityId", c.author_id AS "authorId",
           u.full_name AS "authorName", c.body, c.mentions, c.created_at AS "createdAt"
    FROM record_comments c
    LEFT JOIN users u ON u.id = c.author_id AND u.tenant_id = c.tenant_id
    WHERE c.id = ${id} LIMIT 1
  `);
  return (rows.rows as unknown as RecordCommentRow[])[0]!;
}

/** Extract the @uuid mention tokens from a comment body (data-only — no delivery). */
export function parseMentions(body: string): string[] {
  const tokens = [...body.matchAll(/@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi)].map(
    (m) => m[1]!.toLowerCase(),
  );
  return [...new Set(tokens)];
}
