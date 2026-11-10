import { type CustomFieldValue } from "@erp/contracts";

import {
  CustomFieldPicklistOnNonSelectError,
  CustomFieldRequiredNotSupportedError,
  CustomFieldSelectRequiresPicklistError,
  CustomFieldValueRequiredError,
  CustomFieldValueTypeError,
  CustomFieldValueValidationError,
  CustomFieldUnknownKeyError,
} from "../domain/extensibility-errors";

/**
 * Pure custom-field value validation (PHASE-036 T36-3): the whole
 * validation envelope as functions over plain data — unit-tested without
 * a database; the service is a thin UoW wrapper around these.
 *
 * Invariants:
 *   - every submitted key must resolve to an ACTIVE definition of the
 *     right entity kind (closed set — unknown keys fail closed);
 *   - the value's family must equal the definition's type;
 *   - family-level validation applies (regex / min / max / bounds);
 *   - SELECT values must be an ACTIVE option of the definition's picklist;
 *   - required-ness is checked at VALUE-WRITE time for the keys present
 *     and at the completeness check below for keys missing entirely (the
 *     entity-save call sites use the same helper — one rule, one place).
 */

export interface PicklistOptionLite {
  readonly id: string;
  readonly isActive: boolean;
}

export interface DefinitionLite {
  readonly id: string;
  readonly entityKind: string;
  readonly key: string;
  readonly type: string;
  readonly required: boolean;
  readonly validation: Record<string, unknown> | null;
  readonly picklistId: string | null;
}

export interface DefinitionBundle {
  /** Active definitions for the entity kind (from the store). */
  readonly definitions: readonly DefinitionLite[];
  /** ACTIVE options of every referenced picklist, keyed by picklist id. */
  readonly optionsByPicklist: ReadonlyMap<string, readonly PicklistOptionLite[]>;
}

function describeValue(value: CustomFieldValue): string {
  switch (value.type) {
    case "BOOLEAN":
      return `BOOLEAN ${value.value}`;
    default:
      return `${value.type} "${value.value}"`;
  }
}

/** Validate one submitted (key → value) pair against its definition. */
export function validateOneValue(
  key: string,
  value: CustomFieldValue,
  definition: DefinitionLite,
  options: readonly PicklistOptionLite[] | undefined,
): void {
  if (value.type !== definition.type) {
    throw new CustomFieldValueTypeError(key, definition.type, describeValue(value));
  }
  const validation = definition.validation ?? {};
  switch (value.type) {
    case "TEXT": {
      const regex = typeof validation.regex === "string" ? validation.regex : undefined;
      if (regex !== undefined) {
        let matcher: RegExp;
        try {
          matcher = new RegExp(regex);
        } catch {
          throw new CustomFieldValueValidationError(key, `the stored regex "${regex}" is invalid`);
        }
        if (!matcher.test(value.value)) {
          throw new CustomFieldValueValidationError(key, `"${value.value}" does not match ${regex}`);
        }
      }
      break;
    }
    case "NUMBER":
    case "MONEY": {
      const numeric = Number(value.value);
      const min = typeof validation.min === "string" ? Number(validation.min) : undefined;
      const max = typeof validation.max === "string" ? Number(validation.max) : undefined;
      if (min !== undefined && numeric < min) {
        throw new CustomFieldValueValidationError(
          key,
          `${value.value} is below the minimum ${validation.min}`,
        );
      }
      if (max !== undefined && numeric > max) {
        throw new CustomFieldValueValidationError(
          key,
          `${value.value} is above the maximum ${validation.max}`,
        );
      }
      break;
    }
    case "DATE": {
      const minDate = typeof validation.minDate === "string" ? validation.minDate : undefined;
      const maxDate = typeof validation.maxDate === "string" ? validation.maxDate : undefined;
      if (minDate !== undefined && value.value < minDate) {
        throw new CustomFieldValueValidationError(key, `${value.value} is before ${minDate}`);
      }
      if (maxDate !== undefined && value.value > maxDate) {
        throw new CustomFieldValueValidationError(key, `${value.value} is after ${maxDate}`);
      }
      break;
    }
    case "BOOLEAN":
      break;
    case "SELECT": {
      if (
        options === undefined ||
        !options.some((option) => option.id === value.value && option.isActive)
      ) {
        throw new CustomFieldValueValidationError(
          key,
          "the selected option is not an active option of the field's picklist",
        );
      }
      break;
    }
  }
}

/**
 * Validate a full values map (the PUT body). Throws on the FIRST problem
 * (fail-closed, typed) — the error names the offending key.
 */
export function validateValuesMap(
  entityKind: string,
  values: Readonly<Record<string, CustomFieldValue>>,
  bundle: DefinitionBundle,
): void {
  for (const [key, value] of Object.entries(values)) {
    const definition = bundle.definitions.find(
      (candidate) => candidate.key === key && candidate.entityKind === entityKind,
    );
    if (definition === undefined) {
      throw new CustomFieldUnknownKeyError(entityKind, key);
    }
    validateOneValue(
      key,
      value,
      definition,
      definition.picklistId === null
        ? undefined
        : bundle.optionsByPicklist.get(definition.picklistId),
    );
  }
}

/**
 * Completeness check (the entity-save hook): every REQUIRED definition of
 * the entity kind must have a value in the effective map (callers merge
 * the submitted map over the stored values first).
 */
export function assertRequiredPresent(
  entityKind: string,
  effectiveValues: Readonly<Record<string, unknown>>,
  bundle: DefinitionBundle,
): void {
  for (const definition of bundle.definitions) {
    if (
      definition.entityKind === entityKind
      && definition.required
      && effectiveValues[definition.key] === undefined
    ) {
      throw new CustomFieldValueRequiredError(definition.key);
    }
  }
}

/**
 * Definition-create validation (pure part): the SELECT-shape and
 * BOOLEAN-required rules the SQL CHECKs cannot express cross-table.
 */
export function validateDefinitionShape(input: {
  type: string;
  picklistId: string | null | undefined;
  required: boolean;
}): void {
  if (input.type === "SELECT" && (input.picklistId === null || input.picklistId === undefined)) {
    throw new CustomFieldSelectRequiresPicklistError();
  }
  if (input.type !== "SELECT" && input.picklistId != null) {
    throw new CustomFieldPicklistOnNonSelectError(input.type);
  }
  if (input.type === "BOOLEAN" && input.required) {
    throw new CustomFieldRequiredNotSupportedError();
  }
}
