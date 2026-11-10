import { describe, expect, it } from "vitest";

import { DomainError } from "@erp/domain-core";

import {
  assertRequiredPresent,
  validateDefinitionShape,
  validateOneValue,
  validateValuesMap,
  type DefinitionBundle,
  type DefinitionLite,
} from "../application/custom-field-validation";
import { executeBulk } from "../application/bulk-actions";
import { cell, toCsv, type ExportSheet } from "../application/list-export";
import {
  classifyDuplicateCandidates,
  withinTolerance,
} from "../../purchasing/application/duplicate-check";

/**
 * PHASE-036 T36-3/T36-4/T36-5/T36-7 unit suite (sandbox-runnable — pure
 * logic, no database): the custom-field validation envelope, the bulk
 * per-row report semantics, the exporter's CSV contract, and the
 * duplicate-invoice tolerance classifier. The store/service DB paths run
 * on the live harness (the __db__ pack).
 */

const UUID_A = "11111111-2222-4333-8444-555555555555";
const UUID_B = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const UUID_OPT1 = "12345678-1234-4123-8123-123456789012";
const UUID_OPT2 = "87654321-4321-4321-8321-210987654321";

function definition(overrides: Partial<DefinitionLite>): DefinitionLite {
  return {
    id: UUID_A,
    entityKind: "PARTNER",
    key: "municipality_license",
    type: "TEXT",
    required: false,
    validation: null,
    picklistId: null,
    ...overrides,
  };
}

function bundle(definitions: readonly DefinitionLite[], optionsByPicklist: Record<string, { id: string; isActive: boolean }[]> = {}): DefinitionBundle {
  return {
    definitions,
    optionsByPicklist: new Map(Object.entries(optionsByPicklist)),
  };
}

// -- value validation ------------------------------------------------------------

describe("custom-field value validation (the pure envelope)", () => {
  it("accepts each family's well-typed value", () => {
    const cases: { def: DefinitionLite; value: { type: string; value: unknown } }[] = [
      { def: definition({ type: "TEXT" }), value: { type: "TEXT", value: "SA-1234" } },
      { def: definition({ type: "NUMBER" }), value: { type: "NUMBER", value: "42.5" } },
      { def: definition({ type: "MONEY" }), value: { type: "MONEY", value: "1250.0000" } },
      { def: definition({ type: "DATE" }), value: { type: "DATE", value: "2026-11-10" } },
      { def: definition({ type: "BOOLEAN" }), value: { type: "BOOLEAN", value: true } },
    ];
    for (const { def, value } of cases) {
      expect(() =>
        validateOneValue(def.key, value as never, def, undefined),
      ).not.toThrow();
    }
  });

  it("rejects a value of the wrong family (typed error)", () => {
    const def = definition({ type: "MONEY" });
    try {
      validateOneValue(def.key, { type: "TEXT", value: "abc" } as never, def, undefined);
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-value-type");
    }
  });

  it("applies the TEXT regex rule", () => {
    const def = definition({ validation: { regex: "^SA-\\d{4}$" } });
    expect(() =>
      validateOneValue(def.key, { type: "TEXT", value: "SA-1234" } as never, def, undefined),
    ).not.toThrow();
    try {
      validateOneValue(def.key, { type: "TEXT", value: "XX-1" } as never, def, undefined);
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-value-invalid");
    }
  });

  it("applies the NUMBER/MONEY min-max rules", () => {
    const def = definition({ type: "MONEY", validation: { min: "100.0000", max: "5000.0000" } });
    expect(() =>
      validateOneValue(def.key, { type: "MONEY", value: "2500.0000" } as never, def, undefined),
    ).not.toThrow();
    for (const bad of ["50.0000", "6000.0000"]) {
      try {
        validateOneValue(def.key, { type: "MONEY", value: bad } as never, def, undefined);
        expect.unreachable("must throw");
      } catch (error) {
        expect((error as DomainError).code).toBe("extensibility/custom-field-value-invalid");
      }
    }
  });

  it("applies the DATE bounds", () => {
    const def = definition({ type: "DATE", validation: { minDate: "2026-01-01", maxDate: "2026-12-31" } });
    expect(() =>
      validateOneValue(def.key, { type: "DATE", value: "2026-06-15" } as never, def, undefined),
    ).not.toThrow();
    try {
      validateOneValue(def.key, { type: "DATE", value: "2027-01-01" } as never, def, undefined);
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-value-invalid");
    }
  });

  it("SELECT requires an ACTIVE option of the definition's picklist", () => {
    const def = definition({ type: "SELECT", picklistId: UUID_B });
    const options = [
      { id: UUID_OPT1, isActive: true },
      { id: UUID_OPT2, isActive: false },
    ];
    expect(() =>
      validateOneValue(def.key, { type: "SELECT", value: UUID_OPT1 } as never, def, options),
    ).not.toThrow();
    try {
      // inactive option — hidden from new picks
      validateOneValue(def.key, { type: "SELECT", value: UUID_OPT2 } as never, def, options);
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-value-invalid");
    }
  });

  it("the values map fails closed on unknown keys (closed catalog)", () => {
    try {
      validateValuesMap("PARTNER", { not_defined: { type: "TEXT", value: "x" } as never }, bundle([]));
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-unknown-key");
    }
  });

  it("the values map enforces the entity-kind match", () => {
    const def = definition({ entityKind: "ITEM", key: "shelf" });
    try {
      validateValuesMap("PARTNER", { shelf: { type: "TEXT", value: "A1" } as never }, bundle([def]));
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-unknown-key");
    }
  });

  it("the completeness check requires required definitions", () => {
    const defs = [definition({ required: true, key: "license" }), definition({ key: "optional" })];
    expect(() => assertRequiredPresent("PARTNER", { license: { v: 1 } }, bundle(defs))).not.toThrow();
    try {
      assertRequiredPresent("PARTNER", { optional: { v: 2 } }, bundle(defs));
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-value-required");
    }
  });
});

// -- definition shape rules --------------------------------------------------------

describe("definition shape rules (cross-table CHECKs the SQL cannot express)", () => {
  it("SELECT requires a picklist", () => {
    try {
      validateDefinitionShape({ type: "SELECT", picklistId: null, required: false });
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-select-requires-picklist");
    }
  });

  it("non-SELECT types reject a picklist", () => {
    try {
      validateDefinitionShape({ type: "TEXT", picklistId: UUID_B, required: false });
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-picklist-on-non-select");
    }
  });

  it("BOOLEAN fields cannot be required (absence is meaningful)", () => {
    try {
      validateDefinitionShape({ type: "BOOLEAN", picklistId: null, required: true });
      expect.unreachable("must throw");
    } catch (error) {
      expect((error as DomainError).code).toBe("extensibility/custom-field-required-invalid");
    }
  });
});

// -- bulk actions -------------------------------------------------------------------

describe("bulk actions (FD-01 — the per-row report semantics)", () => {
  it("reports every row exactly once with ok/typed-error", async () => {
    const result = await executeBulk("approve", [UUID_A, UUID_B], ({ id }) => {
      if (id === UUID_B) {
        throw Object.assign(new Error("draft is POSTED"), { code: "accounting/journal-state" });
      }
      return { done: true };
    });
    expect(result.requested).toBe(2);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({ id: UUID_A, ok: true, error: null });
    expect(result.results[1]).toMatchObject({
      id: UUID_B,
      ok: false,
      error: { code: "accounting/journal-state" },
    });
  });

  it("non-DomainError throws degrade to the internal code (never crash the batch)", async () => {
    const result = await executeBulk("post", [UUID_A], () => {
      throw new Error("boom");
    });
    expect(result.results[0]?.ok).toBe(false);
    expect(result.results[0]?.error?.code).toBe("internal/unexpected-error");
  });

  it("preserves idempotent re-run semantics (succeeded rows stay succeeded)", async () => {
    let calls = 0;
    const executor = () => {
      calls += 1;
      return calls;
    };
    const first = await executeBulk("approve", [UUID_A], executor);
    const second = await executeBulk("approve", [UUID_A], executor);
    expect(first.succeeded).toBe(1);
    expect(second.succeeded).toBe(1); // the executor re-runs; state machine owns semantics
  });
});

// -- list export --------------------------------------------------------------------

describe("list export (FD-04 — the CSV contract)", () => {
  const sheet: ExportSheet = {
    name: "partners",
    columns: [
      { key: "code", header: "Code" },
      { key: "name", header: "Name, Full" },
      { key: "balance", header: "Balance" },
    ],
    rows: [
      { code: "C-001", name: 'Ali "The" Trader', balance: "1250.0000" },
      { code: "C-002", name: "Multi\nLine", balance: "" },
    ],
  };

  it("serializes RFC 4180 (CRLF rows, quoted commas/quotes/newlines)", () => {
    const csv = toCsv(sheet);
    const lines = csv.split("\r\n").filter((line) => line.length > 0);
    expect(lines[0]).toBe("Code,\"Name, Full\",Balance");
    expect(lines[1]).toBe("C-001,\"Ali \"\"The\"\" Trader\",1250.0000");
    expect(lines[2]).toBe("C-002,\"Multi\nLine\",");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("the cell sanitizer never float-coerces money strings", () => {
    expect(cell("1250.0000")).toBe("1250.0000");
    expect(cell(null)).toBe("");
    expect(cell(true)).toBe("true");
  });
});

// -- duplicate-invoice classifier (AD-36-10) ----------------------------------------

describe("duplicate supplier-invoice classifier (AD-36-10)", () => {
  const candidates = [
    { id: UUID_A, invoiceNo: "SUP-1", amount: "77.0000", currency: "SAR", invoiceDate: "2026-11-01", status: "POSTED" },
    { id: UUID_B, invoiceNo: "SUP-1", amount: "99.0000", currency: "SAR", invoiceDate: "2026-11-05", status: "DRAFT" },
  ];

  it("tolerance 0 = the pre-036 exact semantics (triple + number)", () => {
    const warnings = classifyDuplicateCandidates({ amount: "77.0000", currency: "SAR" }, candidates, 0);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatchObject({ kind: "triple", existingId: UUID_A });
    expect(warnings[1]).toMatchObject({ kind: "number", existingId: UUID_B });
  });

  it("tolerance > 0 widens the same-amount band (±pct of submitted)", () => {
    // 77 vs 77.5: |0.5| ≤ 77×1% = 0.77 → triple
    const warnings = classifyDuplicateCandidates({ amount: "77.5000", currency: "SAR" }, candidates, 1);
    expect(warnings[0]).toMatchObject({ kind: "triple" });
    // 99 vs 77.5 stays a number-kind warning
    expect(warnings[1]).toMatchObject({ kind: "number" });
  });

  it("different-currency candidates are skipped entirely (different financial fact)", () => {
    const usd = [{ id: UUID_A, invoiceNo: "SUP-1", amount: "77.0000", currency: "USD", invoiceDate: "2026-11-01", status: "POSTED" }];
    expect(classifyDuplicateCandidates({ amount: "77.0000", currency: "SAR" }, usd, 5)).toHaveLength(0);
  });

  it("withinTolerance is exact-string at 0 and band-based above", () => {
    expect(withinTolerance("77.0000", "77.0000", 0)).toBe(true);
    expect(withinTolerance("77.0000", "77.0001", 0)).toBe(false);
    expect(withinTolerance("100.0000", "99.0000", 1)).toBe(true);
    expect(withinTolerance("100.0000", "98.0000", 1)).toBe(false);
  });
});
