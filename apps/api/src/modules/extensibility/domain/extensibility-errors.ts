import { DomainError } from "@erp/domain-core";

/**
 * Extensibility domain errors (PHASE-036; ERROR_MODEL §4 — codes are stable
 * UPPER_SNAKE strings; messages are human-facing and never parsed).
 *
 * Status mapping lives in the global error filter:
 *   - *NotFoundError        → 404 (A7 parity — RLS makes foreign ids
 *                             indistinguishable from missing ones);
 *   - *TakenError / *InUse* → 409 (conflicts with existing state);
 *   - everything else       → 422 (validation, the default).
 */

// -- definitions ---------------------------------------------------------------

export class CustomFieldKeyTakenError extends DomainError {
  constructor(entityKind: string, key: string) {
    super("extensibility/custom-field-key-taken", `A custom field "${key}" already exists for ${entityKind}`, {
      entityKind,
      key,
    });
  }
}

export class CustomFieldNotFoundError extends DomainError {
  constructor(id: string) {
    super("extensibility/custom-field-not-found", `No custom field ${id}`, { id });
  }
}

export class CustomFieldHasValuesError extends DomainError {
  constructor(id: string, valueCount: number) {
    super(
      "extensibility/custom-field-has-values",
      `The custom field still holds ${valueCount} value(s) — delete them (or deactivate the field) first`,
      { id, valueCount },
    );
  }
}

export class CustomFieldTypeImmutableError extends DomainError {
  constructor(id: string) {
    super("extensibility/custom-field-type-immutable", "A custom field's type is immutable once created (typed value rows depend on it)", { id });
  }
}

export class CustomFieldSelectRequiresPicklistError extends DomainError {
  constructor() {
    super(
      "extensibility/custom-field-select-requires-picklist",
      "A SELECT-type custom field must reference an active picklist",
    );
  }
}

export class CustomFieldPicklistOnNonSelectError extends DomainError {
  constructor(type: string) {
    super(
      "extensibility/custom-field-picklist-on-non-select",
      `A ${type}-type custom field cannot reference a picklist`,
      { type },
    );
  }
}

export class CustomFieldRequiredNotSupportedError extends DomainError {
  constructor() {
    super(
      "extensibility/custom-field-required-invalid",
      "BOOLEAN fields cannot be required (absence is meaningful)",
    );
  }
}

// -- picklists -----------------------------------------------------------------

export class PicklistKeyTakenError extends DomainError {
  constructor(key: string) {
    super("extensibility/picklist-key-taken", `A picklist "${key}" already exists`, { key });
  }
}

export class PicklistNotFoundError extends DomainError {
  constructor(id: string) {
    super("extensibility/picklist-not-found", `No picklist ${id}`, { id });
  }
}

export class PicklistInUseError extends DomainError {
  constructor(id: string, definitionCount: number) {
    super(
      "extensibility/picklist-in-use",
      `The picklist is referenced by ${definitionCount} custom field(s) — deactivate instead of deleting`,
      { id, definitionCount },
    );
  }
}

export class PicklistOptionValueTakenError extends DomainError {
  constructor(value: string) {
    super("extensibility/picklist-option-value-taken", `An option "${value}" already exists in the picklist`, { value });
  }
}

export class PicklistOptionNotFoundError extends DomainError {
  constructor(id: string) {
    super("extensibility/picklist-option-not-found", `No picklist option ${id}`, { id });
  }
}

// -- values --------------------------------------------------------------------

export class CustomFieldValueTypeError extends DomainError {
  constructor(key: string, expected: string, received: string) {
    super(
      "extensibility/custom-field-value-type",
      `Field "${key}" expects a ${expected} value (received ${received})`,
      { key, expected, received },
    );
  }
}

export class CustomFieldValueValidationError extends DomainError {
  constructor(key: string, reason: string) {
    super("extensibility/custom-field-value-invalid", `Field "${key}" failed validation: ${reason}`, {
      key,
      reason,
    });
  }
}

export class CustomFieldValueRequiredError extends DomainError {
  constructor(key: string) {
    super("extensibility/custom-field-value-required", `Field "${key}" is required`, { key });
  }
}

export class CustomFieldUnknownKeyError extends DomainError {
  constructor(entityKind: string, key: string) {
    super(
      "extensibility/custom-field-unknown-key",
      `No active custom field "${key}" is defined for ${entityKind}`,
      { entityKind, key },
    );
  }
}

// -- saved views ---------------------------------------------------------------

export class SavedViewNotFoundError extends DomainError {
  constructor(id: string) {
    super("extensibility/saved-view-not-found", `No saved view ${id}`, { id });
  }
}

export class SavedViewNotYoursError extends DomainError {
  constructor(id: string) {
    super("extensibility/saved-view-not-yours", "Only the owner (or a shared-view manager) may change this view", { id });
  }
}

export class SavedViewNameTakenError extends DomainError {
  constructor(name: string) {
    super("extensibility/saved-view-name-taken", `A view named "${name}" already exists`, { name });
  }
}

// -- comments ------------------------------------------------------------------

export class CommentBodyInvalidError extends DomainError {
  constructor() {
    super("extensibility/comment-body-invalid", "A comment body is required (1–4,000 characters)");
  }
}

// -- bulk actions --------------------------------------------------------------

export class BulkActionUnsupportedError extends DomainError {
  constructor(entity: string, action: string, supported: readonly string[]) {
    super(
      "extensibility/bulk-action-unsupported",
      `Bulk "${action}" is not supported on ${entity} (supported: ${supported.join(", ")})`,
      { entity, action, supported },
    );
  }
}

// -- list export ---------------------------------------------------------------

export class ExportColumnUnknownError extends DomainError {
  constructor(column: string, entity: string) {
    super(
      "extensibility/export-column-unknown",
      `Column "${column}" is not exportable on ${entity}`,
      { column, entity },
    );
  }
}
