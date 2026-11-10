import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../audit/api/audit";
import {
  type CustomFieldCreatePayload,
  type CustomFieldDefinition,
  type CustomFieldValue,
} from "@erp/contracts";

import {
  CustomFieldKeyTakenError,
  CustomFieldNotFoundError,
  CustomFieldHasValuesError,
  PicklistInUseError,
  PicklistKeyTakenError,
  PicklistNotFoundError,
  PicklistOptionValueTakenError,
} from "../domain/extensibility-errors";
import {
  assertRequiredPresent,
  validateDefinitionShape,
  validateValuesMap,
  type DefinitionBundle,
  type DefinitionLite,
} from "./custom-field-validation";
import * as store from "../infrastructure/extensibility.store";

/**
 * Extensibility service (PHASE-036 T36-3): definitions + picklists CRUD,
 * and the values read/write plane. Thin by design — every rule lives in
 * the pure validation module (unit-tested); this class owns the store
 * orchestration inside the ambient tenant UoW.
 */

@Injectable()
export class ExtensibilityService {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  // -- definitions ----------------------------------------------------------------

  async listDefinitions(entityKind?: string): Promise<readonly CustomFieldDefinition[]> {
    const rows = entityKind === undefined
      ? await store.listDefinitions()
      : await store.listDefinitions(entityKind);
    const picklists = await store.listPicklists();
    return rows.map((row) => this.toDefinitionDto(row, picklists));
  }

  async listActiveDefinitions(entityKind: string): Promise<readonly CustomFieldDefinition[]> {
    const rows = await store.listActiveDefinitions(entityKind);
    const picklists = await store.listPicklists();
    return rows.map((row) => this.toDefinitionDto(row, picklists));
  }

  private toDefinitionDto(
    row: store.CustomFieldDefinitionRow,
    picklists: readonly store.PicklistRow[],
  ): CustomFieldDefinition {
    const picklist = row.picklistId === null
      ? null
      : (() => {
          const found = picklists.find((candidate) => candidate.id === row.picklistId);
          return found === undefined
            ? null
            : { id: found.id, key: found.key, name: found.name, nameAr: found.nameAr };
        })();
    return {
      id: row.id,
      entityKind: row.entityKind as CustomFieldDefinition["entityKind"],
      key: row.key,
      label: row.label,
      labelAr: row.labelAr,
      type: row.type,
      picklistId: row.picklistId,
      required: row.required,
      defaultValue: row.defaultValue ?? null,
      validation: (row.validation ?? null) as CustomFieldDefinition["validation"],
      helpText: row.helpText,
      helpTextAr: row.helpTextAr,
      showInList: row.showInList,
      sort: row.sort,
      isActive: row.isActive,
      picklist,
    };
  }

  async createDefinition(
    actorId: string,
    input: CustomFieldCreatePayload,
  ): Promise<CustomFieldDefinition> {
    // The cross-table rules the SQL CHECKs cannot express.
    validateDefinitionShape({
      type: input.type,
      picklistId: input.picklistId ?? null,
      required: input.required,
    });
    if (input.type === "SELECT") {
      const picklistId = input.picklistId!;
      const picklist = await store.findPicklistById(picklistId);
      if (picklist === undefined || !picklist.isActive) {
        throw new PicklistNotFoundError(picklistId);
      }
    }
    const existing = await store.findDefinitionByKey(input.entityKind, input.key);
    if (existing !== undefined) {
      throw new CustomFieldKeyTakenError(input.entityKind, input.key);
    }
    const row = await store.insertDefinition({
      entityKind: input.entityKind,
      key: input.key,
      label: input.label,
      labelAr: input.labelAr,
      type: input.type,
      picklistId: input.picklistId ?? null,
      required: input.required,
      defaultValue: input.defaultValue ?? null,
      validation: (input.validation ?? null) as Record<string, unknown> | null,
      helpText: input.helpText ?? null,
      helpTextAr: input.helpTextAr ?? null,
      showInList: input.showInList,
      sort: input.sort,
      isActive: input.isActive,
      actorId,
    });
    await this.audit.record({
      action: "extensibility.custom_field_created",
      entityType: "custom_field_definition",
      entityId: row.id,
      actorId,
      after: { entityKind: row.entityKind, key: row.key, type: row.type, required: row.required },
    });
    const picklists = await store.listPicklists();
    return this.toDefinitionDto(row, picklists);
  }

  async updateDefinition(
    actorId: string,
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
  ): Promise<CustomFieldDefinition> {
    const existing = await store.findDefinitionById(id);
    if (existing === undefined) {
      throw new CustomFieldNotFoundError(id);
    }
    // The type is the immutable spine (the DTO schema strips it — typed
    // value rows depend on the family); re-pointing a SELECT's picklist is
    // allowed only onto an ACTIVE picklist.
    const nextPicklistId = patch.picklistId !== undefined ? patch.picklistId : existing.picklistId;
    validateDefinitionShape({
      type: existing.type,
      picklistId: nextPicklistId,
      required: patch.required ?? existing.required,
    });
    if (existing.type === "SELECT" && nextPicklistId !== null) {
      const picklist = await store.findPicklistById(nextPicklistId);
      if (picklist === undefined || !picklist.isActive) {
        throw new PicklistNotFoundError(nextPicklistId);
      }
    }
    await store.updateDefinition(id, patch);
    const updated = await store.findDefinitionById(id);
    await this.audit.record({
      action: "extensibility.custom_field_updated",
      entityType: "custom_field_definition",
      entityId: id,
      actorId,
      after: { ...patch },
    });
    const picklists = await store.listPicklists();
    return this.toDefinitionDto(updated!, picklists);
  }

  async deleteDefinition(actorId: string, id: string): Promise<void> {
    const existing = await store.findDefinitionById(id);
    if (existing === undefined) {
      throw new CustomFieldNotFoundError(id);
    }
    const valueCount = await store.countValuesByDefinition(id);
    if (valueCount > 0) {
      // The operator path is deactivate-first; deleting a field with data
      // is the explicit purge decision (typed, fail-closed).
      throw new CustomFieldHasValuesError(id, valueCount);
    }
    await store.deleteDefinition(id);
    await this.audit.record({
      action: "extensibility.custom_field_deleted",
      entityType: "custom_field_definition",
      entityId: id,
      actorId,
      after: { entityKind: existing.entityKind, key: existing.key },
    });
  }

  // -- picklists ------------------------------------------------------------------

  async listPicklists(): Promise<readonly store.PicklistRow[]> {
    const [picklists, allOptions] = await Promise.all([
      store.listPicklists(),
      (async () => {
        // Options for every list — one query per picklist keeps the store
        // simple; the manager UI is a low-traffic settings surface.
        const rows: { picklistId: string; options: readonly store.PicklistOptionRow[] }[] = [];
        for (const picklist of await store.listPicklists()) {
          rows.push({ picklistId: picklist.id, options: await store.listOptions(picklist.id) });
        }
        return rows;
      })(),
    ]);
    return picklists.map((picklist) => ({
      ...picklist,
      options: allOptions.find((entry) => entry.picklistId === picklist.id)?.options ?? [],
    }));
  }

  async createPicklist(
    actorId: string,
    input: { key: string; name: string; nameAr: string },
  ): Promise<store.PicklistRow> {
    const existing = await store.findPicklistByKey(input.key);
    if (existing !== undefined) {
      throw new PicklistKeyTakenError(input.key);
    }
    return store.insertPicklist({ ...input, actorId });
  }

  async updatePicklist(
    actorId: string,
    id: string,
    patch: { name?: string; nameAr?: string; isActive?: boolean },
  ): Promise<void> {
    if ((await store.findPicklistById(id)) === undefined) {
      throw new PicklistNotFoundError(id);
    }
    await store.updatePicklist(id, patch);
    await this.audit.record({
      action: "extensibility.picklist_updated",
      entityType: "custom_picklist",
      entityId: id,
      actorId,
      after: { ...patch },
    });
  }

  async deletePicklist(actorId: string, id: string): Promise<void> {
    if ((await store.findPicklistById(id)) === undefined) {
      throw new PicklistNotFoundError(id);
    }
    const definitionCount = await store.countDefinitionsOnPicklist(id);
    if (definitionCount > 0) {
      throw new PicklistInUseError(id, definitionCount);
    }
    await store.deletePicklist(id);
    await this.audit.record({
      action: "extensibility.picklist_deleted",
      entityType: "custom_picklist",
      entityId: id,
      actorId,
    });
  }

  async addOption(
    actorId: string,
    picklistId: string,
    input: { value: string; label: string; labelAr: string; sort: number },
  ): Promise<store.PicklistOptionRow> {
    if ((await store.findPicklistById(picklistId)) === undefined) {
      throw new PicklistNotFoundError(picklistId);
    }
    const options = await store.listOptions(picklistId);
    if (options.some((option) => option.value === input.value)) {
      throw new PicklistOptionValueTakenError(input.value);
    }
    const option = await store.insertOption({ ...input, picklistId, actorId });
    await this.audit.record({
      action: "extensibility.picklist_option_added",
      entityType: "custom_picklist_option",
      entityId: option.id,
      actorId,
      after: { picklistId, value: input.value },
    });
    return option;
  }

  async deleteOption(actorId: string, id: string): Promise<void> {
    const option = await store.findOptionById(id);
    if (option === undefined) {
      throw new PicklistNotFoundError(id);
    }
    // Values referencing the option keep it findable (RESTRICT at the FK);
    // the operator path is deactivate via a fresh option set — the typed
    // failure surfaces the reference to the UI honestly.
    await store.deleteOption(id);
    await this.audit.record({
      action: "extensibility.picklist_option_deleted",
      entityType: "custom_picklist_option",
      entityId: id,
      actorId,
      after: { picklistId: option.picklistId, value: option.value },
    });
  }

  // -- values ---------------------------------------------------------------------

  private async bundleFor(entityKind: string): Promise<DefinitionBundle> {
    const definitions = (await store.listActiveDefinitions(entityKind)) as readonly DefinitionLite[];
    const optionsByPicklist = new Map<string, { id: string; isActive: boolean }[]>();
    for (const definition of definitions) {
      if (definition.picklistId !== null && !optionsByPicklist.has(definition.picklistId)) {
        optionsByPicklist.set(
          definition.picklistId,
          (await store.listActiveOptions(definition.picklistId)).map((option) => ({
            id: option.id,
            isActive: option.isActive,
          })),
        );
      }
    }
    return { definitions, optionsByPicklist };
  }

  /**
   * The batch read (the list/detail fold-in source): entityId → { key → wire
   * value }. Lists compose only show_in_list fields themselves (the payload
   * cap is the caller's rule — the values map here carries everything so
   * the detail compose is complete).
   */
  async readValues(
    entityKind: string,
    entityIds: readonly string[],
  ): Promise<Record<string, Record<string, unknown>>> {
    const map: Record<string, Record<string, unknown>> = {};
    if (entityIds.length === 0) {
      return map;
    }
    const rows = await store.listValuesForEntities(entityKind, entityIds);
    for (const row of rows) {
      const bucket = (map[row.entityId] ??= {});
      switch (row.fieldType) {
        case "TEXT":
          bucket[row.fieldKey] = { type: "TEXT", value: row.valueText };
          break;
        case "NUMBER":
          bucket[row.fieldKey] = { type: "NUMBER", value: row.valueNumber };
          break;
        case "MONEY":
          bucket[row.fieldKey] = { type: "MONEY", value: row.valueMoney };
          break;
        case "DATE":
          bucket[row.fieldKey] = { type: "DATE", value: row.valueDate };
          break;
        case "BOOLEAN":
          bucket[row.fieldKey] = { type: "BOOLEAN", value: row.valueBoolean };
          break;
        case "SELECT":
          bucket[row.fieldKey] = { type: "SELECT", value: row.valuePicklistOptionId };
          break;
      }
    }
    return map;
  }

  /**
   * The values write: validate the submitted map against the active
   * definitions (fail-closed on the first problem), then upsert each
   * present key and delete each absent key (absent = clear).
   */
  async writeValues(
    actorId: string,
    input: { entityKind: string; entityId: string; values: Record<string, CustomFieldValue> },
  ): Promise<void> {
    const bundle = await this.bundleFor(input.entityKind);
    validateValuesMap(input.entityKind, input.values, bundle);
    const existing = await store.listValuesForEntities(input.entityKind, [input.entityId]);
    const existingKeys = new Set(existing.map((row) => row.fieldKey));
    for (const [key, value] of Object.entries(input.values)) {
      const definition = bundle.definitions.find(
        (candidate) => candidate.key === key && candidate.entityKind === input.entityKind,
      )!;
      await store.upsertValue({
        entityKind: input.entityKind,
        entityId: input.entityId,
        definitionId: definition.id,
        fieldType: value.type,
        valueText: value.type === "TEXT" ? value.value : null,
        valueNumber: value.type === "NUMBER" ? value.value : null,
        valueMoney: value.type === "MONEY" ? value.value : null,
        valueDate: value.type === "DATE" ? value.value : null,
        valueBoolean: value.type === "BOOLEAN" ? value.value : null,
        valuePicklistOptionId: value.type === "SELECT" ? value.value : null,
        actorId,
      });
      existingKeys.delete(key);
    }
    for (const key of existingKeys) {
      // Absent from the submitted map = clear the field (the no-row contract).
      const row = existing.find((candidate) => candidate.fieldKey === key)!;
      await store.deleteValue(input.entityKind, input.entityId, row.definitionId);
    }
    await this.audit.record({
      action: "extensibility.custom_field_values_written",
      entityType: `${input.entityKind.toLowerCase()}_custom_values`,
      entityId: input.entityId,
      actorId,
      after: { entityKind: input.entityKind, keys: Object.keys(input.values) },
    });
  }

  /**
   * The entity-save completeness hook (PARTNER/ITEM reference surfaces):
   * merge the submitted values over the stored ones, then require every
   * required definition present. Callers invoke this BEFORE their own row
   * write so the whole entity save fails atomically.
   */
  async assertRequiredAtEntitySave(
    entityKind: string,
    entityId: string | null,
    submittedValues: Record<string, CustomFieldValue> | undefined,
  ): Promise<void> {
    const bundle = await this.bundleFor(entityKind);
    if (bundle.definitions.length === 0) {
      return;
    }
    const stored = entityId === null
      ? {}
      : await this.readValues(entityKind, [entityId]).then((map) => (map[entityId] ?? {}));
    const effective = { ...(stored as Record<string, unknown>), ...(submittedValues ?? {}) };
    assertRequiredPresent(entityKind, effective, bundle);
  }
}
