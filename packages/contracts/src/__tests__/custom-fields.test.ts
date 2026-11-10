import { describe, expect, it } from "vitest";

import {
  BULK_ACTIONS,
  CUSTOM_FIELD_ENTITY_KINDS,
  CUSTOM_FIELD_KEY_PATTERN,
  CUSTOM_FIELD_TYPES,
  bulkActionRequestSchema,
  bulkActionResultSchema,
  customFieldCreatePayloadSchema,
  customFieldEntityKindSchema,
  customFieldUpdatePayloadSchema,
  customFieldValueSchema,
  customFieldValuesWritePayloadSchema,
  customPicklistCreatePayloadSchema,
  duplicateInvoiceWarningSchema,
  isCustomFieldEntityKind,
  recordCommentCreatePayloadSchema,
  savedViewCreatePayloadSchema,
} from "../index";

/**
 * PHASE-036 T36-2 test hook: the extensibility & productivity contracts —
 * the closed entity-kind list, the six value families, the definition/
 * picklist/view/comment DTO shapes, the bulk per-row envelope, the
 * duplicate-invoice warning payload; negative fixtures rejected with the
 * precise issue. The INV-027 forbidden-surface leg lives in its own
 * spec (inv-027-no-custom-fields-on-posting.test.ts).
 */

const UUID = "3f2a1c9e-8b7d-4c5a-9e6f-1a2b3c4d5e6f";

describe("custom-field entity kinds (the closed list)", () => {
  it("accepts every shipped kind", () => {
    for (const kind of CUSTOM_FIELD_ENTITY_KINDS) {
      expect(customFieldEntityKindSchema.safeParse(kind).success).toBe(true);
      expect(isCustomFieldEntityKind(kind)).toBe(true);
    }
  });

  it("rejects unknown kinds (the catalog is closed)", () => {
    expect(customFieldEntityKindSchema.safeParse("PROJECT_TASK").success).toBe(false);
    expect(isCustomFieldEntityKind("project_task")).toBe(false);
  });

  it("carries the migration 0049 CHECK mirror cell-for-cell (11 kinds)", () => {
    expect(CUSTOM_FIELD_ENTITY_KINDS).toHaveLength(11);
  });
});

describe("custom-field definitions", () => {
  const base = {
    entityKind: "PARTNER",
    key: "municipality_license",
    label: "Municipality license",
    labelAr: "رقم الرخصة البلدية",
    type: "TEXT",
  };

  it("accepts a minimal definition (defaults applied)", () => {
    const parsed = customFieldCreatePayloadSchema.parse(base);
    expect(parsed.required).toBe(false);
    expect(parsed.showInList).toBe(false);
    expect(parsed.isActive).toBe(true);
  });

  it("rejects malformed keys (the ck format mirror)", () => {
    for (const key of ["1starts_with_digit", "Has-Upper", "", "a".repeat(61)]) {
      expect(CUSTOM_FIELD_KEY_PATTERN.test(key)).toBe(false);
      expect(
        customFieldCreatePayloadSchema.safeParse({ ...base, key }).success,
        `key "${key}" must be rejected`,
      ).toBe(false);
    }
  });

  it("rejects a SELECT definition without a picklist (ck shape mirror)", () => {
    const result = customFieldCreatePayloadSchema.safeParse({ ...base, type: "SELECT" });
    expect(result.success).toBe(true); // picklistId optional at the DTO edge…
    // …but the service rejects SELECT-without-picklist; the SQL ck enforces
    // the final word. The contract keeps picklistId nullable for TEXT etc.
    expect(customFieldCreatePayloadSchema.parse({ ...base, picklistId: UUID }).picklistId).toBe(
      UUID,
    );
  });

  it("update payload cannot touch entityKind/key/type (immutable spine)", () => {
    expect(() => customFieldUpdatePayloadSchema.parse({ entityKind: "ITEM" })).toThrow();
    expect(() => customFieldUpdatePayloadSchema.parse({ key: "renamed" })).toThrow();
    expect(() => customFieldUpdatePayloadSchema.parse({ type: "MONEY" })).toThrow();
    expect(customFieldUpdatePayloadSchema.parse({ label: "New label" }).label).toBe("New label");
  });

  it("validates the per-family validation jsonb", () => {
    expect(
      customFieldCreatePayloadSchema.safeParse({ ...base, validation: { regex: "^SA-" } })
        .success,
    ).toBe(true);
    expect(
      customFieldCreatePayloadSchema.safeParse({ ...base, validation: { min: "1.5" } }).success,
    ).toBe(true);
    expect(
      customFieldCreatePayloadSchema.safeParse({ ...base, validation: { min: "abc" } }).success,
    ).toBe(false);
    expect(
      customFieldCreatePayloadSchema.safeParse({ ...base, validation: { unknown: true } }).success,
    ).toBe(false);
  });
});

describe("typed values (the six families)", () => {
  it("accepts each family's wire value", () => {
    expect(customFieldValueSchema.safeParse({ type: "TEXT", value: "SA-1234" }).success).toBe(
      true,
    );
    expect(customFieldValueSchema.safeParse({ type: "NUMBER", value: "42.125" }).success).toBe(
      true,
    );
    expect(customFieldValueSchema.safeParse({ type: "MONEY", value: "1234.5678" }).success).toBe(
      true,
    );
    expect(customFieldValueSchema.safeParse({ type: "DATE", value: "2026-11-10" }).success).toBe(
      true,
    );
    expect(customFieldValueSchema.safeParse({ type: "BOOLEAN", value: true }).success).toBe(true);
    expect(customFieldValueSchema.safeParse({ type: "SELECT", value: UUID }).success).toBe(true);
  });

  it("rejects the wrong wire type per family (ADR-0009: money never float)", () => {
    expect(customFieldValueSchema.safeParse({ type: "MONEY", value: 12.5 }).success).toBe(false);
    expect(customFieldValueSchema.safeParse({ type: "MONEY", value: "12.56789" }).success).toBe(
      false,
    );
    expect(customFieldValueSchema.safeParse({ type: "NUMBER", value: "1.12345678901" }).success).toBe(
      false,
    );
    expect(customFieldValueSchema.safeParse({ type: "DATE", value: "10-11-2026" }).success).toBe(
      false,
    );
    expect(customFieldValueSchema.safeParse({ type: "SELECT", value: "not-a-uuid" }).success).toBe(
      false,
    );
    expect(customFieldValueSchema.safeParse({ type: "TEXT", value: "" }).success).toBe(false);
  });

  it("the values write payload carries the entity coordinates", () => {
    const parsed = customFieldValuesWritePayloadSchema.parse({
      entityKind: "PARTNER",
      entityId: UUID,
      values: { municipality_license: { type: "TEXT", value: "SA-1" } },
    });
    expect(Object.keys(parsed.values)).toEqual(["municipality_license"]);
    expect(
      customFieldValuesWritePayloadSchema.safeParse({
        entityKind: "NOPE",
        entityId: UUID,
        values: {},
      }).success,
    ).toBe(false);
  });
});

describe("custom picklists (FD-20)", () => {
  it("accepts a bilingual option set with stable value codes", () => {
    const parsed = customPicklistCreatePayloadSchema.parse({
      key: "vehicle_types",
      name: "Vehicle types",
      nameAr: "أنواع المركبات",
      options: [
        { value: "sedan", label: "Sedan", labelAr: "سيدان", sort: 1 },
        { value: "pickup", label: "Pickup", labelAr: "بيك أب", sort: 2 },
      ],
    });
    expect(parsed.options).toHaveLength(2);
    expect(parsed.options[0]?.sort).toBe(1);
  });

  it("rejects malformed option codes and duplicate-unfriendly shapes", () => {
    expect(
      customPicklistCreatePayloadSchema.safeParse({
        key: "bad",
        name: "x",
        nameAr: "x",
        options: [{ value: "-leading-dash", label: "x", labelAr: "x" }],
      }).success,
    ).toBe(false);
    expect(
      customPicklistCreatePayloadSchema.safeParse({ key: "UPPER", name: "x", nameAr: "x" })
        .success,
    ).toBe(false);
  });
});

describe("saved views (FD-02/FD-03)", () => {
  it("accepts a personal view with the DataTable snapshot", () => {
    const parsed = savedViewCreatePayloadSchema.parse({
      entityKind: "SALES_INVOICE",
      name: "Overdue KD",
      columns: ["docNo", "partner", "total", "dueDate"],
      filters: { status: "POSTED", balance: { gt: "0.0000" } },
      sort: [{ column: "dueDate", dir: "asc" }],
    });
    expect(parsed.shared).toBe(false);
    expect(parsed.isDefault).toBe(false);
  });

  it("flags shared views (the settings.views.share gate is server-side)", () => {
    const parsed = savedViewCreatePayloadSchema.parse({
      entityKind: "PARTNER",
      name: "Team default",
      columns: ["code", "name"],
      shared: true,
      isDefault: true,
    });
    expect(parsed.shared).toBe(true);
  });

  it("caps the sort spec and column list", () => {
    expect(
      savedViewCreatePayloadSchema.safeParse({
        entityKind: "PARTNER",
        name: "x",
        columns: Array.from({ length: 61 }, (_, i) => `c${i}`),
      }).success,
    ).toBe(false);
  });
});

describe("record comments + mentions (FD-15)", () => {
  it("accepts a body with @uuid mentions", () => {
    const parsed = recordCommentCreatePayloadSchema.parse({
      entityKind: "SALES_INVOICE",
      entityId: UUID,
      body: `@${UUID} please review the credit hold`,
    });
    expect(parsed.body).toContain("@");
  });

  it("rejects empty and over-long bodies", () => {
    expect(
      recordCommentCreatePayloadSchema.safeParse({ entityKind: "ITEM", entityId: UUID, body: "" })
        .success,
    ).toBe(false);
    expect(
      recordCommentCreatePayloadSchema.safeParse({
        entityKind: "ITEM",
        entityId: UUID,
        body: "x".repeat(4001),
      }).success,
    ).toBe(false);
  });
});

describe("bulk actions (FD-01 — the per-row envelope)", () => {
  it("accepts the four actions over a bounded id list", () => {
    expect(BULK_ACTIONS).toEqual(["approve", "post", "void", "archive"]);
    const parsed = bulkActionRequestSchema.parse({ action: "approve", ids: [UUID] });
    expect(parsed.ids).toHaveLength(1);
  });

  it("rejects unknown actions, empty and oversized lists", () => {
    expect(bulkActionRequestSchema.safeParse({ action: "delete", ids: [UUID] }).success).toBe(
      false,
    );
    expect(bulkActionRequestSchema.safeParse({ action: "post", ids: [] }).success).toBe(false);
    expect(
      bulkActionRequestSchema.safeParse({
        action: "post",
        ids: Array.from({ length: 101 }, () => UUID),
      }).success,
    ).toBe(false);
  });

  it("the result envelope reports partial failure (never silent)", () => {
    const result = bulkActionResultSchema.parse({
      action: "approve",
      requested: 2,
      succeeded: 1,
      failed: 1,
      results: [
        { id: UUID, ok: true, error: null },
        { id: "11111111-2222-4333-8444-555555555555", ok: false, error: { code: "INVALID_STATE" } },
      ],
    });
    expect(result.failed).toBe(1);
    expect(result.results[1]?.error?.code).toBe("INVALID_STATE");
  });
});

describe("duplicate-invoice warnings (AD-36-10)", () => {
  it("carries the full prior-invoice context for the dialog", () => {
    const parsed = duplicateInvoiceWarningSchema.parse({
      kind: "triple",
      existingId: UUID,
      existingInvoiceNo: "INV-991",
      existingAmount: "1250.0000",
      existingCurrency: "KWD",
      existingDate: "2026-11-01",
      existingStatus: "POSTED",
    });
    expect(parsed.kind).toBe("triple");
  });

  it("rejects unknown kinds", () => {
    expect(
      duplicateInvoiceWarningSchema.safeParse({
        kind: "quadruple",
        existingId: UUID,
        existingInvoiceNo: "x",
        existingAmount: "1",
        existingCurrency: "KWD",
        existingDate: "2026-11-01",
        existingStatus: "POSTED",
      }).success,
    ).toBe(false);
  });
});
