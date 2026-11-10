import { z } from "zod";

/**
 * PHASE-036 contracts — the extensibility & productivity plane
 * (FD-01…FD-20 family; the register's AD-36-10 duplicate tolerance rides
 * the settings registry, not a DTO).
 *
 * Owns the CLOSED entity-kind list (migration 0049's CHECK mirrors this
 * enum cell-for-cell), the six value families with their wire types, and
 * the DTOs of the four surfaces: custom-field definitions, custom
 * picklists, saved views, record comments — plus the bulk-action request/
 * result envelope (FD-01's per-row report contract) and the
 * duplicate-invoice warning payload (AD-36-10).
 *
 * INV-027 (the frozen-core guard, machine-checked in
 * inv-027-no-custom-fields-on-posting.test.ts): custom fields are DATA
 * dimensions only — no custom-field property may appear on any posting
 * engine, journal-line, or tax DTO surface. The forbidden-stem list below
 * is the single source both that test and any future surface audit use.
 */

// ---------------------------------------------------------------------------
// The closed entity-kind list (migration 0049 CHECK mirror).
// ---------------------------------------------------------------------------

export const CUSTOM_FIELD_ENTITY_KINDS = [
  "PARTNER",
  "ITEM",
  "SALES_QUOTATION",
  "SALES_ORDER",
  "SALES_INVOICE",
  "PURCHASE_ORDER",
  "SUPPLIER_INVOICE",
  "JOURNAL_ENTRY",
  "FIXED_ASSET",
  "EMPLOYEE",
  "EXPENSE",
] as const;

export type CustomFieldEntityKind = (typeof CUSTOM_FIELD_ENTITY_KINDS)[number];

export const customFieldEntityKindSchema = z.enum(CUSTOM_FIELD_ENTITY_KINDS);

export function isCustomFieldEntityKind(value: string): value is CustomFieldEntityKind {
  return (CUSTOM_FIELD_ENTITY_KINDS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// The six value families (ADR-0009: MONEY is a decimal string ≤ 4dp on the
// wire — never float; NUMBER is a decimal string ≤ 10dp; DATE is ISO
// YYYY-MM-DD; SELECT carries the picklist option id).
// ---------------------------------------------------------------------------

export const CUSTOM_FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "MONEY",
  "DATE",
  "BOOLEAN",
  "SELECT",
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export const customFieldTypeSchema = z.enum(CUSTOM_FIELD_TYPES);

/** Stable field-key format (the migration ck format mirror). */
export const CUSTOM_FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]{0,59}$/;

/** Per-family validation jsonb shape (all keys optional). */
export const customFieldValidationSchema = z
  .object({
    /** TEXT only. */
    regex: z.string().min(1).max(500).optional(),
    /** NUMBER/MONEY only — canonical decimal strings. */
    min: z.string().regex(/^-?\d+(\.\d{1,10})?$/).optional(),
    max: z.string().regex(/^-?\d+(\.\d{1,10})?$/).optional(),
    /** DATE only — inclusive ISO bounds. */
    minDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    maxDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict();

export type CustomFieldValidation = z.infer<typeof customFieldValidationSchema>;

/** A definition row as the API returns it (the wire DTO). */
export const customFieldDefinitionSchema = z
  .object({
    id: z.string().uuid(),
    entityKind: customFieldEntityKindSchema,
    key: z.string().regex(CUSTOM_FIELD_KEY_PATTERN),
    label: z.string().min(1).max(120),
    labelAr: z.string().min(1).max(120),
    type: customFieldTypeSchema,
    picklistId: z.string().uuid().nullable(),
    required: z.boolean(),
    defaultValue: z.unknown().nullable(),
    validation: customFieldValidationSchema.nullable(),
    helpText: z.string().max(400).nullable(),
    helpTextAr: z.string().max(400).nullable(),
    showInList: z.boolean(),
    sort: z.number().int(),
    isActive: z.boolean(),
    /** The referenced picklist (SELECT only) — resolved for the manager UI. */
    picklist: z
      .object({
        id: z.string().uuid(),
        key: z.string().regex(/^[a-z][a-z0-9_]{0,59}$/),
        name: z.string(),
        nameAr: z.string(),
      })
      .nullable()
      .optional(),
  })
  .strict();

export type CustomFieldDefinition = z.infer<typeof customFieldDefinitionSchema>;

/** Definition create/update payloads (key immutable on update). */
export const customFieldCreatePayloadSchema = z
  .object({
    entityKind: customFieldEntityKindSchema,
    key: z.string().regex(CUSTOM_FIELD_KEY_PATTERN),
    label: z.string().min(1).max(120),
    labelAr: z.string().min(1).max(120),
    type: customFieldTypeSchema,
    picklistId: z.string().uuid().nullable().optional(),
    required: z.boolean().default(false),
    defaultValue: z.unknown().nullable().optional(),
    validation: customFieldValidationSchema.nullable().optional(),
    helpText: z.string().max(400).nullable().optional(),
    helpTextAr: z.string().max(400).nullable().optional(),
    showInList: z.boolean().default(false),
    sort: z.number().int().default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

export type CustomFieldCreatePayload = z.infer<typeof customFieldCreatePayloadSchema>;

export const customFieldUpdatePayloadSchema = customFieldCreatePayloadSchema
  .omit({ entityKind: true, key: true, type: true })
  .partial()
  .strict();

export type CustomFieldUpdatePayload = z.infer<typeof customFieldUpdatePayloadSchema>;

// ---------------------------------------------------------------------------
// Typed values. The wire shape is a flat map keyed by field key; the family
// is carried per entry so the server write is total (definition-resolved).
// ---------------------------------------------------------------------------

export const customFieldValueSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("TEXT"), value: z.string().min(1).max(2000) }),
  z.object({ type: z.literal("NUMBER"), value: z.string().regex(/^-?\d+(\.\d{1,10})?$/) }),
  z.object({ type: z.literal("MONEY"), value: z.string().regex(/^-?\d+(\.\d{1,4})?$/) }),
  z.object({ type: z.literal("DATE"), value: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  z.object({ type: z.literal("BOOLEAN"), value: z.boolean() }),
  z.object({ type: z.literal("SELECT"), value: z.string().uuid() }),
]);

export type CustomFieldValue = z.infer<typeof customFieldValueSchema>;

/** `PUT /settings/custom-fields/values` body. */
export const customFieldValuesWritePayloadSchema = z
  .object({
    entityKind: customFieldEntityKindSchema,
    entityId: z.string().uuid(),
    /** Absent key = clear the field (DELETE the row). */
    values: z.record(z.string(), customFieldValueSchema),
  })
  .strict();

export type CustomFieldValuesWritePayload = z.infer<typeof customFieldValuesWritePayloadSchema>;

/** The batch read response: entityId → { fieldKey → wire value }. */
export const customFieldValuesMapSchema = z.record(
  z.string().uuid(),
  z.record(z.string(), z.unknown()),
);

// ---------------------------------------------------------------------------
// Custom picklists (FD-20).
// ---------------------------------------------------------------------------

export const customPicklistOptionSchema = z
  .object({
    id: z.string().uuid(),
    value: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,59}$/),
    label: z.string().min(1).max(120),
    labelAr: z.string().min(1).max(120),
    sort: z.number().int(),
    isActive: z.boolean(),
  })
  .strict();

export type CustomPicklistOption = z.infer<typeof customPicklistOptionSchema>;

export const customPicklistSchema = z
  .object({
    id: z.string().uuid(),
    key: z.string().regex(/^[a-z][a-z0-9_]{0,59}$/),
    name: z.string().min(1).max(120),
    nameAr: z.string().min(1).max(120),
    isActive: z.boolean(),
    options: z.array(customPicklistOptionSchema).default([]),
  })
  .strict();

export type CustomPicklist = z.infer<typeof customPicklistSchema>;

export const customPicklistCreatePayloadSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]{0,59}$/),
    name: z.string().min(1).max(120),
    nameAr: z.string().min(1).max(120),
    options: z
      .array(
        z
          .object({
            value: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,59}$/),
            label: z.string().min(1).max(120),
            labelAr: z.string().min(1).max(120),
            sort: z.number().int().default(0),
          })
          .strict(),
      )
      .max(200)
      .default([]),
  })
  .strict();

export type CustomPicklistCreatePayload = z.infer<typeof customPicklistCreatePayloadSchema>;

// ---------------------------------------------------------------------------
// Saved views (FD-02/FD-03). columns/filters/sort are opaque jsonb to the
// contract layer (the DataTable state snapshot); the entity kind + share
// flag are the typed spine.
// ---------------------------------------------------------------------------

export const savedViewSchema = z
  .object({
    id: z.string().uuid(),
    entityKind: customFieldEntityKindSchema,
    /** null = shared tenant view (write-gated by settings.views.share). */
    userId: z.string().uuid().nullable(),
    name: z.string().min(1).max(120),
    columns: z.array(z.string()),
    filters: z.record(z.string(), z.unknown()),
    sort: z
      .array(z.object({ column: z.string(), dir: z.enum(["asc", "desc"]) }))
      .nullable(),
    isDefault: z.boolean(),
  })
  .strict();

export type SavedView = z.infer<typeof savedViewSchema>;

export const savedViewCreatePayloadSchema = z
  .object({
    entityKind: customFieldEntityKindSchema,
    name: z.string().min(1).max(120),
    columns: z.array(z.string()).max(60),
    filters: z.record(z.string(), z.unknown()).default({}),
    sort: z
      .array(z.object({ column: z.string(), dir: z.enum(["asc", "desc"]) }))
      .max(6)
      .nullable()
      .optional(),
    isDefault: z.boolean().default(false),
    /** Shared views require settings.views.share (service-checked). */
    shared: z.boolean().default(false),
  })
  .strict();

export type SavedViewCreatePayload = z.infer<typeof savedViewCreatePayloadSchema>;

// ---------------------------------------------------------------------------
// Record comments (FD-15) + the timeline entry union (FD-14).
// ---------------------------------------------------------------------------

export const recordCommentSchema = z
  .object({
    id: z.string().uuid(),
    entityKind: customFieldEntityKindSchema,
    entityId: z.string().uuid(),
    authorId: z.string().uuid(),
    authorName: z.string().nullable(),
    body: z.string().min(1).max(4000),
    /** Parsed @uuid mention tokens (data-only — delivery rides PHASE-052). */
    mentions: z.array(z.string().uuid()).default([]),
    createdAt: z.string(),
  })
  .strict();

export type RecordComment = z.infer<typeof recordCommentSchema>;

export const recordCommentCreatePayloadSchema = z
  .object({
    entityKind: customFieldEntityKindSchema,
    entityId: z.string().uuid(),
    body: z.string().min(1).max(4000),
  })
  .strict();

export type RecordCommentCreatePayload = z.infer<typeof recordCommentCreatePayloadSchema>;

/** One timeline entry (audit event or comment, newest-first). */
export const timelineEntrySchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("audit"),
      id: z.string().uuid(),
      at: z.string(),
      actorId: z.string().uuid().nullable(),
      action: z.string(),
      after: z.unknown().nullable(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("comment"),
      id: z.string().uuid(),
      at: z.string(),
      actorId: z.string().uuid().nullable(),
      body: z.string(),
      mentions: z.array(z.string().uuid()).default([]),
    })
    .strict(),
]);

export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

// ---------------------------------------------------------------------------
// Bulk actions (FD-01): the per-row result envelope is the contract —
// partial failure is REPORTED, never silently dropped, and re-runs are
// idempotent per row (succeeded rows stay succeeded).
// ---------------------------------------------------------------------------

export const BULK_ACTIONS = ["approve", "post", "void", "archive"] as const;

export type BulkAction = (typeof BULK_ACTIONS)[number];

export const bulkActionRequestSchema = z
  .object({
    action: z.enum(BULK_ACTIONS),
    ids: z.array(z.string().uuid()).min(1).max(100),
  })
  .strict();

export type BulkActionRequest = z.infer<typeof bulkActionRequestSchema>;

export const bulkRowResultSchema = z
  .object({
    id: z.string().uuid(),
    ok: z.boolean(),
    /** The typed API error body when ok = false (code + message). */
    error: z.object({ code: z.string(), message: z.string().optional() }).nullable(),
  })
  .strict();

export type BulkRowResult = z.infer<typeof bulkRowResultSchema>;

export const bulkActionResultSchema = z
  .object({
    action: z.enum(BULK_ACTIONS),
    requested: z.number().int(),
    succeeded: z.number().int(),
    failed: z.number().int(),
    results: z.array(bulkRowResultSchema),
  })
  .strict();

export type BulkActionResult = z.infer<typeof bulkActionResultSchema>;

// ---------------------------------------------------------------------------
// Duplicate supplier-invoice warnings (AD-36-10): the check returns the
// warning LIST (every matching prior invoice), the create re-submit with
// proceedAnyway = true writes the audit row and proceeds — never a silent
// block.
// ---------------------------------------------------------------------------

export const duplicateInvoiceWarningSchema = z
  .object({
    /** "triple" = same supplier+number+currency+amount (within tolerance);
     * "number" = same supplier+number, different amount. */
    kind: z.enum(["triple", "number"]),
    existingId: z.string().uuid(),
    existingInvoiceNo: z.string(),
    existingAmount: z.string(),
    existingCurrency: z.string(),
    existingDate: z.string(),
    existingStatus: z.string(),
  })
  .strict();

export type DuplicateInvoiceWarning = z.infer<typeof duplicateInvoiceWarningSchema>;

// ---------------------------------------------------------------------------
// INV-027 — the forbidden-surface stem list (the frozen-core guard).
// ---------------------------------------------------------------------------

/**
 * No property whose name contains one of these stems may appear on any
 * posting-engine / journal-line / tax DTO surface. The contracts test
 * `inv-027-no-custom-fields-on-posting.test.ts` walks every zod schema
 * reachable from the posting surfaces and fails on any match — the
 * healthcare no-clinical gate pattern, applied to the extensibility plane.
 */
export const CUSTOM_FIELDS_FORBIDDEN_STEMS: readonly string[] = Object.freeze([
  "customField",
  "custom_field",
  "picklistId",
  "savedView",
  "saved_view",
]);
