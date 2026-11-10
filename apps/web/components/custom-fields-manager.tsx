"use client";

/**
 * PHASE-036 (P36-W) — the custom-fields manager (the phase's flagship UI):
 * entity-kind-scoped field definitions (create/edit/activate/delete with the
 * per-type validation families: TEXT regex, NUMBER/MONEY bounds, DATE range)
 * plus the picklists plane (create list + initial options, add/remove
 * options, delete with the in-use guard surfaced honestly as an API error).
 *
 * Reads are open to every authenticated member (the notifications self-plane
 * pattern); the create/edit/delete affordances appear only for holders of
 * settings.custom_fields.manage / settings.picklists.manage (server-checked
 * regardless — the flags only hide dead buttons).
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { JSX } from "react";

import { Badge, Button, Checkbox, DataTable, Input, Select } from "@erp/ui";
import { CUSTOM_FIELD_ENTITY_KINDS, type CustomFieldEntityKind } from "@erp/contracts";

import { getDictionary, type Dictionary, type Locale } from "../i18n/dictionaries";
import type {
  CustomFieldDefinitionRow,
  CustomFieldValidationRow,
  CustomPicklistRow,
} from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatMessage, localizedApiError, localizedName } from "../lib/messages";
import { Card } from "./card";
import { ErrorNotice, SuccessNotice } from "./notices";
import { activeLocaleHeader } from "./table-header";

const KEY_RE = /^[a-z][a-z0-9_]{0,59}$/;
const OPTION_VALUE_RE = /^[a-z0-9][a-z0-9_-]{0,59}$/;
const DECIMAL_RE = /^-?\d+(\.\d{1,10})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const INT_RE = /^-?\d+$/;

const ENTITY_KIND_LABEL_KEYS: Record<CustomFieldEntityKind, keyof Dictionary> = {
  PARTNER: "cfEntityPartner",
  ITEM: "cfEntityItem",
  SALES_QUOTATION: "cfEntitySalesQuotation",
  SALES_ORDER: "cfEntitySalesOrder",
  SALES_INVOICE: "cfEntitySalesInvoice",
  PURCHASE_ORDER: "cfEntityPurchaseOrder",
  SUPPLIER_INVOICE: "cfEntitySupplierInvoice",
  JOURNAL_ENTRY: "cfEntityJournalEntry",
  FIXED_ASSET: "cfEntityFixedAsset",
  EMPLOYEE: "cfEntityEmployee",
  EXPENSE: "cfEntityExpense",
};

const TYPE_LABEL_KEYS: Record<string, keyof Dictionary> = {
  TEXT: "cfTypeText",
  NUMBER: "cfTypeNumber",
  MONEY: "cfTypeMoney",
  DATE: "cfTypeDate",
  BOOLEAN: "cfTypeBoolean",
  SELECT: "cfTypeSelect",
};

function typeLabel(d: Dictionary, type: string): string {
  const key = TYPE_LABEL_KEYS[type];
  return key === undefined ? type : d[key];
}

function entityKindLabel(d: Dictionary, kind: string): string {
  const key = ENTITY_KIND_LABEL_KEYS[kind as CustomFieldEntityKind];
  return key === undefined ? kind : d[key];
}

const FIELD_TYPES = ["TEXT", "NUMBER", "MONEY", "DATE", "BOOLEAN", "SELECT"] as const;
type FieldType = (typeof FIELD_TYPES)[number];

interface DraftOption {
  value: string;
  label: string;
  labelAr: string;
}

interface OptionDraft {
  picklistId: string;
  value: string;
  label: string;
  labelAr: string;
  sort: string;
}

const EMPTY_OPTION: DraftOption = { value: "", label: "", labelAr: "" };

/** Builds the per-type validation jsonb (irrelevant keys never sent). */
function buildValidation(
  type: FieldType,
  fields: { regex: string; min: string; max: string; minDate: string; maxDate: string },
): CustomFieldValidationRow | null {
  if (type === "TEXT") {
    const regex = fields.regex.trim();
    return regex === "" ? null : { regex };
  }
  if (type === "NUMBER" || type === "MONEY") {
    const out: CustomFieldValidationRow = {};
    if (fields.min.trim() !== "") out.min = fields.min.trim();
    if (fields.max.trim() !== "") out.max = fields.max.trim();
    return Object.keys(out).length === 0 ? null : out;
  }
  if (type === "DATE") {
    const out: CustomFieldValidationRow = {};
    if (fields.minDate.trim() !== "") out.minDate = fields.minDate.trim();
    if (fields.maxDate.trim() !== "") out.maxDate = fields.maxDate.trim();
    return Object.keys(out).length === 0 ? null : out;
  }
  return null;
}

export function CustomFieldsManager({
  locale,
  initialDefinitions,
  initialPicklists,
  canManageFields,
  canManagePicklists,
}: {
  locale: Locale;
  initialDefinitions: readonly CustomFieldDefinitionRow[];
  initialPicklists: readonly CustomPicklistRow[];
  canManageFields: boolean;
  canManagePicklists: boolean;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [definitions, setDefinitions] = useState<readonly CustomFieldDefinitionRow[]>(initialDefinitions);
  const [picklists, setPicklists] = useState<readonly CustomPicklistRow[]>(initialPicklists);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [entityKind, setEntityKind] = useState<CustomFieldEntityKind>("PARTNER");

  // Definition create/edit form (inline section — the house pattern).
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [labelAr, setLabelAr] = useState("");
  const [type, setType] = useState<FieldType>("TEXT");
  const [picklistId, setPicklistId] = useState("");
  const [required, setRequired] = useState(false);
  const [showInList, setShowInList] = useState(false);
  const [sort, setSort] = useState("0");
  const [helpText, setHelpText] = useState("");
  const [helpTextAr, setHelpTextAr] = useState("");
  const [regex, setRegex] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");

  // Delete-definition confirm card.
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Picklist create form.
  const [picklistFormOpen, setPicklistFormOpen] = useState(false);
  const [picklistKey, setPicklistKey] = useState("");
  const [picklistName, setPicklistName] = useState("");
  const [picklistNameAr, setPicklistNameAr] = useState("");
  const [draftOptions, setDraftOptions] = useState<DraftOption[]>([{ ...EMPTY_OPTION }]);

  // Per-picklist add-option form (one open at a time).
  const [optionDraft, setOptionDraft] = useState<OptionDraft | null>(null);

  // Delete-picklist confirm card.
  const [deletePicklistId, setDeletePicklistId] = useState<string | null>(null);

  const scoped = useMemo(
    () =>
      definitions
        .filter((row) => row.entityKind === entityKind)
        .slice()
        .sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key)),
    [definitions, entityKind],
  );

  const picklistOptions = useMemo(
    () => [
      { value: "", label: d.cfPicklistNone },
      ...picklists.map((row) => ({
        value: row.id,
        label: `${row.key} · ${localizedName(row.name, row.nameAr, locale)}`,
      })),
    ],
    [picklists, locale, d],
  );

  const entityKindOptions = useMemo(
    () =>
      CUSTOM_FIELD_ENTITY_KINDS.map((kind) => ({
        value: kind,
        label: entityKindLabel(d, kind),
      })),
    [d],
  );

  const deleteTarget = definitions.find((row) => row.id === deleteId) ?? null;
  const deletePicklistTarget = picklists.find((row) => row.id === deletePicklistId) ?? null;

  /** Re-reads both planes after any mutation (state stays server-truthful). */
  async function refresh(): Promise<void> {
    const [defs, lists] = await Promise.all([
      bffFetch<readonly CustomFieldDefinitionRow[]>("settings/custom-fields"),
      bffFetch<readonly CustomPicklistRow[]>("settings/picklists"),
    ]);
    if (defs.ok) {
      setDefinitions(defs.data);
    }
    if (lists.ok) {
      setPicklists(lists.data);
    }
    router.refresh();
  }

  function startCreate(): void {
    setError(null);
    setNotice(null);
    setEditId(null);
    setKey("");
    setLabel("");
    setLabelAr("");
    setType("TEXT");
    setPicklistId("");
    setRequired(false);
    setShowInList(false);
    setSort("0");
    setHelpText("");
    setHelpTextAr("");
    setRegex("");
    setMin("");
    setMax("");
    setMinDate("");
    setMaxDate("");
    setFormOpen(true);
  }

  function startEdit(row: CustomFieldDefinitionRow): void {
    setError(null);
    setNotice(null);
    setEditId(row.id);
    setKey(row.key);
    setLabel(row.label);
    setLabelAr(row.labelAr);
    setType(row.type);
    setPicklistId(row.picklistId ?? "");
    setRequired(row.required);
    setShowInList(row.showInList);
    setSort(String(row.sort));
    setHelpText(row.helpText ?? "");
    setHelpTextAr(row.helpTextAr ?? "");
    setRegex(row.validation?.regex ?? "");
    setMin(row.validation?.min ?? "");
    setMax(row.validation?.max ?? "");
    setMinDate(row.validation?.minDate ?? "");
    setMaxDate(row.validation?.maxDate ?? "");
    setFormOpen(true);
  }

  function formValid(): boolean {
    if (label.trim() === "" || labelAr.trim() === "") {
      return false;
    }
    if (editId === null && !KEY_RE.test(key.trim())) {
      return false;
    }
    if (!INT_RE.test(sort.trim())) {
      return false;
    }
    if (type === "SELECT" && picklistId === "") {
      return false;
    }
    if (type === "TEXT" && regex.trim() !== "") {
      try {
        new RegExp(regex.trim());
      } catch {
        return false;
      }
    }
    if (type === "NUMBER" || type === "MONEY") {
      const minOk = min.trim() === "" || DECIMAL_RE.test(min.trim());
      const maxOk = max.trim() === "" || DECIMAL_RE.test(max.trim());
      if (!minOk || !maxOk) {
        return false;
      }
    }
    if (type === "DATE") {
      const minOk = minDate.trim() === "" || DATE_RE.test(minDate.trim());
      const maxOk = maxDate.trim() === "" || DATE_RE.test(maxDate.trim());
      if (!minOk || !maxOk) {
        return false;
      }
    }
    return true;
  }

  async function saveDefinition(): Promise<void> {
    setError(null);
    setNotice(null);
    if (!formValid()) {
      if (type === "SELECT" && picklistId === "") {
        setError(d.cfPicklistRequired);
        return;
      }
      setError(d.errorsValidation);
      return;
    }
    const validation = buildValidation(type, { regex, min, max, minDate, maxDate });
    const payload = {
      label: label.trim(),
      labelAr: labelAr.trim(),
      picklistId: type === "SELECT" ? picklistId : null,
      required: type === "BOOLEAN" ? false : required,
      showInList,
      sort: Number.parseInt(sort.trim(), 10),
      helpText: helpText.trim() === "" ? null : helpText.trim(),
      helpTextAr: helpTextAr.trim() === "" ? null : helpTextAr.trim(),
      validation,
    };
    setBusy("definition");
    const result =
      editId === null
        ? await bffFetch<CustomFieldDefinitionRow>("settings/custom-fields", {
            method: "POST",
            body: {
              entityKind,
              key: key.trim(),
              type,
              ...payload,
            },
          })
        : await bffFetch<CustomFieldDefinitionRow>(`settings/custom-fields/${editId}`, {
            method: "PATCH",
            body: payload,
          });
    setBusy(null);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setFormOpen(false);
    setEditId(null);
    setNotice(d.cfSaved);
    await refresh();
  }

  async function toggleActive(row: CustomFieldDefinitionRow): Promise<void> {
    setError(null);
    setNotice(null);
    setBusy(`toggle-${row.id}`);
    const result = await bffFetch<CustomFieldDefinitionRow>(`settings/custom-fields/${row.id}`, {
      method: "PATCH",
      body: { isActive: !row.isActive },
    });
    setBusy(null);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setNotice(d.cfSaved);
    await refresh();
  }

  async function removeDefinition(): Promise<void> {
    if (deleteId === null) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(`delete-${deleteId}`);
    const result = await bffFetch<{ deleted: boolean }>(`settings/custom-fields/${deleteId}`, {
      method: "DELETE",
    });
    setBusy(null);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setDeleteId(null);
    setNotice(d.cfDeleted);
    await refresh();
  }

  async function createPicklist(): Promise<void> {
    setError(null);
    setNotice(null);
    if (!KEY_RE.test(picklistKey.trim()) || picklistName.trim() === "" || picklistNameAr.trim() === "") {
      setError(d.errorsValidation);
      return;
    }
    const options = draftOptions
      .map((option, index) => ({
        value: option.value.trim(),
        label: option.label.trim(),
        labelAr: option.labelAr.trim(),
        sort: index,
      }))
      .filter((option) => option.value !== "" && option.label !== "" && option.labelAr !== "");
    if (options.some((option) => !OPTION_VALUE_RE.test(option.value))) {
      setError(d.errorsValidation);
      return;
    }
    setBusy("picklist");
    const result = await bffFetch<CustomPicklistRow>("settings/picklists", {
      method: "POST",
      body: {
        key: picklistKey.trim(),
        name: picklistName.trim(),
        nameAr: picklistNameAr.trim(),
        options,
      },
    });
    setBusy(null);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setPicklistFormOpen(false);
    setPicklistKey("");
    setPicklistName("");
    setPicklistNameAr("");
    setDraftOptions([{ ...EMPTY_OPTION }]);
    setNotice(d.cfPicklistSaved);
    await refresh();
  }

  async function removePicklist(): Promise<void> {
    if (deletePicklistId === null) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(`delete-picklist-${deletePicklistId}`);
    const result = await bffFetch<{ deleted: boolean }>(`settings/picklists/${deletePicklistId}`, {
      method: "DELETE",
    });
    setBusy(null);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setDeletePicklistId(null);
    setNotice(d.cfPicklistDeleted);
    await refresh();
  }

  function optionDraftValid(): boolean {
    if (optionDraft === null) {
      return false;
    }
    return (
      OPTION_VALUE_RE.test(optionDraft.value.trim()) &&
      optionDraft.label.trim() !== "" &&
      optionDraft.labelAr.trim() !== "" &&
      INT_RE.test(optionDraft.sort.trim())
    );
  }

  async function addOption(): Promise<void> {
    if (optionDraft === null) {
      return;
    }
    setError(null);
    setNotice(null);
    if (!optionDraftValid()) {
      setError(d.errorsValidation);
      return;
    }
    setBusy("option");
    const result = await bffFetch<CustomPicklistRow>(`settings/picklists/${optionDraft.picklistId}/options`, {
      method: "POST",
      body: {
        value: optionDraft.value.trim(),
        label: optionDraft.label.trim(),
        labelAr: optionDraft.labelAr.trim(),
        sort: Number.parseInt(optionDraft.sort.trim(), 10),
      },
    });
    setBusy(null);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setOptionDraft(null);
    setNotice(d.cfOptionAdded);
    await refresh();
  }

  async function removeOption(optionId: string): Promise<void> {
    setError(null);
    setNotice(null);
    setBusy(`delete-option-${optionId}`);
    const result = await bffFetch<{ deleted: boolean }>(`settings/picklists/options/${optionId}`, {
      method: "DELETE",
    });
    setBusy(null);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setNotice(d.cfOptionDeleted);
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {error !== null && <ErrorNotice>{error}</ErrorNotice>}
      {notice !== null && <SuccessNotice>{notice}</SuccessNotice>}

      <Card title={d.cfDefinitions} description={d.cfSubTitle}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <Select
              label={d.cfEntityKind}
              value={entityKind}
              onValueChange={(value) => {
                const kind = value as CustomFieldEntityKind;
                if ((CUSTOM_FIELD_ENTITY_KINDS as readonly string[]).includes(kind)) {
                  setEntityKind(kind);
                }
              }}
              options={entityKindOptions}
            />
          </div>
          {canManageFields && (
            <Button variant="primary" onClick={startCreate}>
              {d.cfNewField}
            </Button>
          )}
        </div>
        <div className="mt-4">
          <DataTable
            columns={[
              {
                id: "key",
                header: activeLocaleHeader(d.cfKey),
                accessor: (row) => row.key,
                mono: true,
                render: (row) => (
                  <span className="font-mono text-sm" dir="ltr">
                    {row.key}
                  </span>
                ),
              },
              {
                id: "label",
                header: activeLocaleHeader(d.cfLabel),
                accessor: (row) => localizedName(row.label, row.labelAr, locale),
                render: (row) => localizedName(row.label, row.labelAr, locale),
              },
              {
                id: "type",
                header: activeLocaleHeader(d.cfType),
                accessor: (row) => row.type,
                render: (row) => <Badge tone="primary">{typeLabel(d, row.type)}</Badge>,
              },
              {
                id: "picklist",
                header: activeLocaleHeader(d.cfPicklist),
                accessor: (row) =>
                  row.picklist === undefined || row.picklist === null
                    ? "—"
                    : localizedName(row.picklist.name, row.picklist.nameAr, locale),
                render: (row) =>
                  row.picklist === undefined || row.picklist === null
                    ? "—"
                    : localizedName(row.picklist.name, row.picklist.nameAr, locale),
              },
              {
                id: "required",
                header: activeLocaleHeader(d.cfRequired),
                accessor: (row) => (row.required ? "1" : "0"),
                render: (row) => (row.required ? d.cfYes : d.cfNo),
              },
              {
                id: "showInList",
                header: activeLocaleHeader(d.cfShowInList),
                accessor: (row) => (row.showInList ? "1" : "0"),
                render: (row) => (row.showInList ? d.cfYes : d.cfNo),
              },
              {
                id: "sort",
                header: activeLocaleHeader(d.cfSort),
                accessor: (row) => String(row.sort),
                numeric: true,
                render: (row) => (
                  <span className="font-mono tabular-nums" dir="ltr">
                    {row.sort}
                  </span>
                ),
              },
              {
                id: "active",
                header: activeLocaleHeader(d.cfActive),
                accessor: (row) => (row.isActive ? "1" : "0"),
                render: (row) =>
                  row.isActive ? <Badge tone="primary">{d.statusActive}</Badge> : <Badge tone="neutral">{d.statusInactive}</Badge>,
              },
            ]}
            rows={scoped}
            rowKey={(row) => row.id}
            rowActions={
              canManageFields
                ? [
                    {
                      id: "edit",
                      label: d.cfEdit,
                      onSelect: (row: CustomFieldDefinitionRow) => startEdit(row),
                    },
                    {
                      id: "activate",
                      label: d.cfActivate,
                      onSelect: (row: CustomFieldDefinitionRow) => {
                        if (row.isActive) return;
                        void toggleActive(row);
                      },
                    },
                    {
                      id: "deactivate",
                      label: d.cfDeactivate,
                      onSelect: (row: CustomFieldDefinitionRow) => {
                        if (!row.isActive) return;
                        void toggleActive(row);
                      },
                    },
                    {
                      id: "delete",
                      label: d.cfDelete,
                      danger: true,
                      onSelect: (row: CustomFieldDefinitionRow) => {
                        setError(null);
                        setNotice(null);
                        setDeleteId(row.id);
                      },
                    },
                  ]
                : undefined
            }
            rowActionsLabel={d.cfActions}
            empty={{ title: d.cfEmpty }}
          />
        </div>
      </Card>

      {formOpen && (
        <Card
          title={editId === null ? d.cfNewField : `${d.cfEditField} · ${key}`}
          description={editId === null ? undefined : d.cfKeyImmutable}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label={d.cfKey}
              value={key}
              onValueChange={setKey}
              hint={editId === null ? d.cfKeyHint : undefined}
              readOnly={editId !== null}
              mono
              bidiIsolate
              required={editId === null}
            />
            <Input label={d.cfLabel} value={label} onValueChange={setLabel} required />
            <Input label={d.cfLabelAr} value={labelAr} onValueChange={setLabelAr} required />
            <Select
              label={d.cfType}
              value={type}
              onValueChange={(value) => setType((FIELD_TYPES as readonly string[]).includes(value) ? (value as FieldType) : "TEXT")}
              options={FIELD_TYPES.map((value) => ({ value, label: typeLabel(d, value) }))}
              disabled={editId !== null}
            />
            {type === "SELECT" && (
              <Select
                label={d.cfPicklist}
                value={picklistId}
                onValueChange={setPicklistId}
                options={picklistOptions}
                hint={d.cfPicklistHint}
                required
              />
            )}
            <Input label={d.cfSort} value={sort} onValueChange={setSort} inputMode="numeric" mono bidiIsolate />
            <Input label={d.cfHelpText} value={helpText} onValueChange={setHelpText} />
            <Input label={d.cfHelpTextAr} value={helpTextAr} onValueChange={setHelpTextAr} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <Checkbox
              label={d.cfRequired}
              checked={type === "BOOLEAN" ? false : required}
              onCheckedChange={(checked) => setRequired(checked === true)}
              disabled={type === "BOOLEAN"}
            />
            {type === "BOOLEAN" && <p className="text-xs text-gray-600">{d.cfRequiredHint}</p>}
            <Checkbox label={d.cfShowInList} checked={showInList} onCheckedChange={(checked) => setShowInList(checked === true)} />
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900">{d.cfValidation}</h3>
            <p className="mt-1 text-xs text-gray-600">{d.cfValidationHint}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {type === "TEXT" && (
                <Input label={d.cfRegex} value={regex} onValueChange={setRegex} mono bidiIsolate />
              )}
              {(type === "NUMBER" || type === "MONEY") && (
                <>
                  <Input label={d.cfMin} value={min} onValueChange={setMin} inputMode="decimal" mono bidiIsolate />
                  <Input label={d.cfMax} value={max} onValueChange={setMax} inputMode="decimal" mono bidiIsolate />
                </>
              )}
              {type === "DATE" && (
                <>
                  <Input label={d.cfMinDate} value={minDate} onValueChange={setMinDate} mono bidiIsolate />
                  <Input label={d.cfMaxDate} value={maxDate} onValueChange={setMaxDate} mono bidiIsolate />
                </>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" loading={busy === "definition"} onClick={() => void saveDefinition()}>
              {d.commonSave}
            </Button>
            <Button variant="ghost" disabled={busy !== null} onClick={() => setFormOpen(false)}>
              {d.commonCancel}
            </Button>
          </div>
        </Card>
      )}

      {deleteTarget !== null && (
        <Card title={d.cfDelete} description={d.cfDeleteConfirm}>
          <div className="flex gap-2">
            <Button variant="danger" loading={busy === `delete-${deleteTarget.id}`} onClick={() => void removeDefinition()}>
              {d.cfDelete}
            </Button>
            <Button variant="ghost" disabled={busy !== null} onClick={() => setDeleteId(null)}>
              {d.commonCancel}
            </Button>
          </div>
        </Card>
      )}

      <Card title={d.cfPicklists}>
        <div className="flex flex-wrap items-center gap-2">
          {canManagePicklists && (
            <Button
              variant="secondary"
              onClick={() => {
                setError(null);
                setNotice(null);
                setPicklistFormOpen((open) => !open);
              }}
            >
              {d.cfNewPicklist}
            </Button>
          )}
        </div>

        {picklists.length === 0 && <p className="mt-3 text-sm text-gray-600">{d.cfPicklistEmpty}</p>}

        <div className="mt-3 flex flex-col gap-3">
          {picklists.map((picklist) => {
            const usedCount = definitions.filter((row) => row.picklistId === picklist.id).length;
            const isUsed = usedCount > 0;
            return (
              <div key={picklist.id} className="rounded-lg border border-subtle bg-surface-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm" dir="ltr">
                      {picklist.key}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {localizedName(picklist.name, picklist.nameAr, locale)}
                    </span>
                    {isUsed && <Badge tone="primary">{d.cfInUse}</Badge>}
                    {isUsed && (
                      <span className="text-xs text-gray-600">
                        {formatMessage(d.cfUsedByFields, { count: usedCount })}
                      </span>
                    )}
                    {!picklist.isActive && <Badge tone="neutral">{d.statusInactive}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    {canManagePicklists && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setError(null);
                            setNotice(null);
                            setOptionDraft(
                              optionDraft?.picklistId === picklist.id
                                ? null
                                : { picklistId: picklist.id, value: "", label: "", labelAr: "", sort: String(picklist.options.length) },
                            );
                          }}
                        >
                          {d.cfAddOption}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setError(null);
                            setNotice(null);
                            setDeletePicklistId(picklist.id);
                          }}
                        >
                          {d.cfDelete}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-600">{`${d.cfOptions} · ${formatMessage(d.cfOptionsCount, { count: picklist.options.length })}`}</p>

                {picklist.options.length > 0 && (
                  <div className="mt-2 overflow-x-auto">
                    <div className="min-w-[36rem]">
                      <div className="grid grid-cols-[10rem_1fr_1fr_4rem_6rem] gap-2 border-b border-subtle px-2 py-1 text-xs font-medium text-gray-600">
                        <span>{d.cfOptionValue}</span>
                        <span>{d.cfOptionLabel}</span>
                        <span>{d.cfOptionLabelAr}</span>
                        <span className="text-end">{d.cfSort}</span>
                        <span className="text-end">{d.cfActions}</span>
                      </div>
                      {picklist.options.map((option) => (
                        <div key={option.id} className="grid grid-cols-[10rem_1fr_1fr_4rem_6rem] items-center gap-2 border-b border-subtle px-2 py-1 text-sm">
                          <span className="font-mono text-sm" dir="ltr">
                            {option.value}
                          </span>
                          <span className="truncate">{option.label}</span>
                          <span className="truncate">{option.labelAr}</span>
                          <span className="text-end font-mono tabular-nums" dir="ltr">
                            {option.sort}
                          </span>
                          <span className="text-end">
                            {canManagePicklists && (
                              <Button
                                size="sm"
                                variant="ghost"
                                loading={busy === `delete-option-${option.id}`}
                                onClick={() => void removeOption(option.id)}
                                aria-label={d.cfRemoveOption}
                              >
                                {d.cfRemoveOption}
                              </Button>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {optionDraft?.picklistId === picklist.id && (
                  <div className="mt-3 rounded-md border border-subtle bg-surface-sunken p-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Input
                        label={d.cfOptionValue}
                        value={optionDraft.value}
                        onValueChange={(value) => setOptionDraft({ ...optionDraft, value })}
                        mono
                        bidiIsolate
                      />
                      <Input
                        label={d.cfOptionLabel}
                        value={optionDraft.label}
                        onValueChange={(value) => setOptionDraft({ ...optionDraft, label: value })}
                      />
                      <Input
                        label={d.cfOptionLabelAr}
                        value={optionDraft.labelAr}
                        onValueChange={(value) => setOptionDraft({ ...optionDraft, labelAr: value })}
                      />
                      <Input
                        label={d.cfSort}
                        value={optionDraft.sort}
                        onValueChange={(value) => setOptionDraft({ ...optionDraft, sort: value })}
                        inputMode="numeric"
                        mono
                        bidiIsolate
                      />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="primary" loading={busy === "option"} onClick={() => void addOption()}>
                        {d.cfAddOption}
                      </Button>
                      <Button variant="ghost" disabled={busy !== null} onClick={() => setOptionDraft(null)}>
                        {d.commonCancel}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {picklistFormOpen && canManagePicklists && (
        <Card title={d.cfNewPicklist} description={d.cfPicklistOptionsHint}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label={d.cfPicklistKey} value={picklistKey} onValueChange={setPicklistKey} hint={d.cfKeyHint} mono bidiIsolate />
            <Input label={d.cfPicklistName} value={picklistName} onValueChange={setPicklistName} required />
            <Input label={d.cfPicklistNameAr} value={picklistNameAr} onValueChange={setPicklistNameAr} required />
          </div>
          <div className="mt-4 space-y-3">
            {draftOptions.map((option, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Input
                  label={index === 0 ? d.cfOptionValue : undefined}
                  value={option.value}
                  onValueChange={(value) => setDraftOptions((rows) => rows.map((r, i) => (i === index ? { ...r, value } : r)))}
                  mono
                  bidiIsolate
                />
                <Input
                  label={index === 0 ? d.cfOptionLabel : undefined}
                  value={option.label}
                  onValueChange={(value) => setDraftOptions((rows) => rows.map((r, i) => (i === index ? { ...r, label: value } : r)))}
                />
                <Input
                  label={index === 0 ? d.cfOptionLabelAr : undefined}
                  value={option.labelAr}
                  onValueChange={(value) => setDraftOptions((rows) => rows.map((r, i) => (i === index ? { ...r, labelAr: value } : r)))}
                />
                <div className="flex items-end">
                  {draftOptions.length > 1 && (
                    <Button
                      variant="secondary"
                      onClick={() => setDraftOptions((rows) => rows.filter((_, i) => i !== index))}
                    >
                      {d.cfRemoveOption}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={() => setDraftOptions((rows) => [...rows, { ...EMPTY_OPTION }])}>
              {d.cfAddOption}
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" loading={busy === "picklist"} onClick={() => void createPicklist()}>
              {d.commonCreate}
            </Button>
            <Button
              variant="ghost"
              disabled={busy !== null}
              onClick={() => {
                setPicklistFormOpen(false);
                setDraftOptions([{ ...EMPTY_OPTION }]);
              }}
            >
              {d.commonCancel}
            </Button>
          </div>
        </Card>
      )}

      {deletePicklistTarget !== null && (
        <Card title={d.cfDelete} description={d.cfPicklistDeleteConfirm}>
          <div className="flex gap-2">
            <Button
              variant="danger"
              loading={busy === `delete-picklist-${deletePicklistTarget.id}`}
              onClick={() => void removePicklist()}
            >
              {d.cfDelete}
            </Button>
            <Button variant="ghost" disabled={busy !== null} onClick={() => setDeletePicklistId(null)}>
              {d.commonCancel}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
