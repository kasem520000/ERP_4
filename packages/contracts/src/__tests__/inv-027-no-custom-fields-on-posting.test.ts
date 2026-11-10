import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import type { z } from "zod";

import {
  CUSTOM_FIELDS_FORBIDDEN_STEMS,
  cashTransferCreateDraftPayloadSchema,
  creditNoteCreateDraftPayloadSchema,
  deliveryNoteCreateDraftPayloadSchema,
  documentTaxSummarySchema,
  draftInvoiceCreateSchema,
  draftInvoiceUpdateSchema,
  resolvedTaxLineSchema,
  taxSnapshotSchema,
  taxSummaryGroupSchema,
} from "../index";

/**
 * PHASE-036 T36-2 — INV-027, the frozen-core guard (machine-checked): custom
 * fields are DATA dimensions only — NO custom-field, picklist, or saved-view
 * property may appear on any posting-engine / journal-line / tax DTO
 * surface. The healthcare no-clinical gate pattern applied to the
 * extensibility plane: the "just one custom field on the journal line"
 * creep (which would make tenant data unauditable — a value the ledger
 * depends on but no golden can pin) becomes a build failure here, not a
 * review note.
 *
 * The inventory covers both surface families:
 *   (a) the contracts zod posting surfaces — the tax snapshot/summary/line
 *       family + the sync wire money-document schemas (the draft invoice /
 *       credit note / delivery note / cash transfer payloads whose lines
 *       feed the posting engine);
 *   (b) the apps/api posting-engine sources — a source scan over the
 *       accounting domain (posting-engine, journal rules) and the tax
 *       engine, asserting none of the forbidden stems appears in a
 *       property/parameter position (comments naming INV-027 itself are
 *       the guard's own vocabulary and are excluded).
 */

/** The posting-surface zod schemas (the DTO surfaces that feed the engine). */
const POSTING_SURFACE_SCHEMAS: readonly { name: string; schema: z.ZodTypeAny }[] = [
  { name: "documentTaxSummarySchema", schema: documentTaxSummarySchema },
  { name: "resolvedTaxLineSchema", schema: resolvedTaxLineSchema },
  { name: "taxSnapshotSchema", schema: taxSnapshotSchema },
  { name: "taxSummaryGroupSchema", schema: taxSummaryGroupSchema },
  { name: "draftInvoiceCreateSchema", schema: draftInvoiceCreateSchema },
  { name: "draftInvoiceUpdateSchema", schema: draftInvoiceUpdateSchema },
  { name: "creditNoteCreateDraftPayloadSchema", schema: creditNoteCreateDraftPayloadSchema },
  { name: "deliveryNoteCreateDraftPayloadSchema", schema: deliveryNoteCreateDraftPayloadSchema },
  { name: "cashTransferCreateDraftPayloadSchema", schema: cashTransferCreateDraftPayloadSchema },
];

/** Recursively collect every property key a zod schema accepts. */
function propertyKeys(schema: z.ZodTypeAny, seen = new Set<z.ZodTypeAny>()): string[] {
  if (seen.has(schema)) {
    return [];
  }
  seen.add(schema);
  const inner = (schema as unknown as { _def?: { innerType?: z.ZodTypeAny } })._def?.innerType;
  if (inner !== undefined) {
    return propertyKeys(inner, seen);
  }
  const anySchema = schema as unknown as {
    _def?: {
      shape?: Record<string, z.ZodTypeAny>;
      options?: readonly z.ZodTypeAny[];
      valueType?: z.ZodTypeAny;
    };
  };
  const shape = anySchema._def?.shape;
  if (shape !== undefined) {
    return Object.entries(shape).flatMap(([key, value]) => [key, ...propertyKeys(value, seen)]);
  }
  const options = anySchema._def?.options;
  if (Array.isArray(options)) {
    return options.flatMap((option) => propertyKeys(option, seen));
  }
  return [];
}

function matchesForbiddenStem(key: string): string | undefined {
  return CUSTOM_FIELDS_FORBIDDEN_STEMS.find((stem) =>
    key.toLowerCase().includes(stem.toLowerCase()),
  );
}

describe("INV-027 — no custom-field surface on the posting DTOs (zod walk)", () => {
  it("walks every posting-surface schema and finds no forbidden stem", () => {
    for (const { name, schema } of POSTING_SURFACE_SCHEMAS) {
      const keys = propertyKeys(schema);
      expect(keys.length, `${name} must be walkable (non-empty shape)`).toBeGreaterThan(0);
      for (const key of keys) {
        const stem = matchesForbiddenStem(key);
        expect(
          stem,
          `INV-027 violation: property "${key}" on ${name} matches forbidden stem "${stem}" — custom fields are DATA dimensions only (frozen-core rule)`,
        ).toBeUndefined();
      }
    }
  });

  it("the forbidden-stem list itself is the frozen vocabulary", () => {
    expect(CUSTOM_FIELDS_FORBIDDEN_STEMS).toEqual([
      "customField",
      "custom_field",
      "picklistId",
      "savedView",
      "saved_view",
    ]);
  });
});

describe("INV-027 — no custom-field surface in the posting-engine sources (source scan)", () => {
  function resolveFromMonorepo(relative: string): string {
    const candidates = [join(process.cwd(), relative), join(process.cwd(), "..", "..", relative)];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
    throw new Error(`inv-027 scan: cannot resolve ${relative} from ${process.cwd()}`);
  }

  function listTsFiles(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        listTsFiles(full, acc);
      } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
        acc.push(full);
      }
    }
    return acc;
  }

  /** Strip comments — the guard's own INV-027 vocabulary is allowed to NAME itself. */
  function stripComments(source: string): string {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");
  }

  const scanRoots = [
    "apps/api/src/modules/accounting/domain",
    "apps/api/src/modules/accounting/application",
    "apps/api/src/modules/tax",
  ];

  it("finds no forbidden stem in any posting-engine or tax source", () => {
    const files = scanRoots.flatMap((root) =>
      listTsFiles(resolveFromMonorepo(root)).filter((file) => !file.endsWith(".spec.ts")),
    );
    expect(files.length, "the scan must reach the engine sources").toBeGreaterThan(20);
    for (const file of files) {
      const code = stripComments(readFileSync(file, "utf8"));
      for (const stem of CUSTOM_FIELDS_FORBIDDEN_STEMS) {
        expect(
          code.includes(stem),
          `INV-027 violation: "${stem}" appears in ${file} — custom fields are DATA dimensions only (frozen-core rule); extending the posting surface requires a decision record first`,
        ).toBe(false);
      }
    }
  });
});
