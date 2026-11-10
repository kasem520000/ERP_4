"use client";

/**
 * PHASE-036 (P36-W) — the generic list toolbar: column chooser (per-column
 * checkboxes with local persistence per entity kind), saved views (load
 * GET settings/views?entity= on mount; apply → onApplyView; save-current
 * with name + optional shared/default flags; delete per view) and the list
 * export (CSV/XLSX via a same-origin anchor URL through the dedicated BFF
 * streaming route). Props-configurable so any list screen can mount it —
 * the sales-invoice workspace is the first consumer.
 */
import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import { Badge, Button, Checkbox, Input, Popover, Select } from "@erp/ui";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { CustomFieldEntityKind, SavedViewRow } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedApiError } from "../lib/messages";
import { LinkButton } from "./link-button";
import { ErrorNotice, SuccessNotice } from "./notices";

export interface ToolbarColumn {
  key: string;
  header: string;
}

export interface AppliedView {
  columns: string[];
  filters: Record<string, string>;
  sort: { column: string; dir: "asc" | "desc" }[] | null;
}

function storageKeyFor(entityKind: string): string {
  return `erp.listview.${entityKind}.columns`;
}

export function ListToolbar({
  locale,
  entityKind,
  columns,
  visibleColumns,
  onVisibleColumnsChange,
  filters,
  onApplyView,
  exportPath,
  canShare = false,
}: {
  locale: Locale;
  entityKind: CustomFieldEntityKind;
  columns: ToolbarColumn[];
  visibleColumns: string[];
  onVisibleColumnsChange: (next: string[]) => void;
  filters: Record<string, string>;
  onApplyView: (view: AppliedView) => void;
  /** The API path AFTER /api/v1/ (e.g. "sales/sales-invoices/export"); null hides the export menu. */
  exportPath: string | null;
  /** Shared views require settings.views.share (server-checked regardless). */
  canShare?: boolean;
}): JSX.Element {
  const d = getDictionary(locale);
  const [views, setViews] = useState<readonly SavedViewRow[]>([]);
  const [viewsError, setViewsError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [viewName, setViewName] = useState("");
  const [shared, setShared] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  // Restore the persisted column set once on mount (before any interaction).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKeyFor(entityKind));
      if (raw === null) {
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === "string")) {
        const stored = (parsed as string[]).filter((key) => columns.some((c) => c.key === key));
        if (stored.length > 0) {
          onVisibleColumnsChange(stored);
        }
      }
    } catch {
      // Unreadable/legacy value — keep the server-provided defaults.
    }
    // Mount-only restore: entityKind/columns identity is stable per screen.
  }, []);

  // Saved views for this entity kind (self + shared — the server list scope).
  useEffect(() => {
    void loadViews();
    // Reload per entity kind only.
  }, [entityKind]);

  async function loadViews(): Promise<void> {
    setViewsError(null);
    const result = await bffFetch<readonly SavedViewRow[]>(
      `settings/views?entity=${encodeURIComponent(entityKind)}`,
    );
    if (result.ok) {
      setViews(result.data);
    } else {
      setViewsError(localizedApiError(d, result.error, result.retryAfterSeconds));
    }
  }

  function persistColumns(next: string[]): void {
    try {
      window.localStorage.setItem(storageKeyFor(entityKind), JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode) — the session keeps working.
    }
  }

  function toggleColumn(key: string, checked: boolean): void {
    // Keep the canonical column order; refuse to hide the last column.
    const next = columns.map((c) => c.key).filter((k) => (k === key ? checked : visibleColumns.includes(k)));
    if (next.length === 0) {
      return;
    }
    persistColumns(next);
    onVisibleColumnsChange(next);
  }

  function applyView(view: SavedViewRow): void {
    const filterMap: Record<string, string> = {};
    for (const [key, value] of Object.entries(view.filters)) {
      if (typeof value === "string" && value !== "") {
        filterMap[key] = value;
      }
    }
    const validColumns = view.columns.filter((key) => columns.some((c) => c.key === key));
    const nextColumns = validColumns.length > 0 ? validColumns : columns.map((c) => c.key);
    persistColumns(nextColumns);
    onApplyView({ columns: nextColumns, filters: filterMap, sort: view.sort });
    setNotice(d.svViewApplied);
  }

  async function saveView(): Promise<void> {
    if (viewName.trim() === "") {
      setViewsError(d.errorsValidation);
      return;
    }
    setViewsError(null);
    setNotice(null);
    setBusy("save-view");
    const result = await bffFetch<SavedViewRow>("settings/views", {
      method: "POST",
      body: {
        entityKind,
        name: viewName.trim(),
        columns: visibleColumns,
        filters,
        sort: null,
        isDefault,
        shared: shared && canShare,
      },
    });
    setBusy(null);
    if (!result.ok) {
      setViewsError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setViewName("");
    setShared(false);
    setIsDefault(false);
    setNotice(d.svViewSaved);
    await loadViews();
  }

  async function deleteView(id: string): Promise<void> {
    setViewsError(null);
    setNotice(null);
    setBusy(`delete-view-${id}`);
    const result = await bffFetch<{ deleted: boolean }>(`settings/views/${id}`, {
      method: "DELETE",
    });
    setBusy(null);
    if (!result.ok) {
      setViewsError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setNotice(d.svViewDeleted);
    await loadViews();
  }

  /** The same-origin download URL (the dedicated BFF streaming route). */
  function exportUrl(format: "csv" | "xlsx"): string {
    const search = new URLSearchParams();
    search.set("format", format);
    if (visibleColumns.length > 0) {
      search.set("columns", visibleColumns.join(","));
    }
    for (const [key, value] of Object.entries(filters)) {
      const trimmed = value.trim();
      if (trimmed !== "") {
        search.set(key, trimmed);
      }
    }
    return `/api/bff/${exportPath}?${search.toString()}`;
  }

  const myViews = useMemo(() => views.filter((view) => view.userId !== null), [views]);
  const sharedViews = useMemo(() => views.filter((view) => view.userId === null), [views]);

  const viewSelectOptions = useMemo(() => {
    if (views.length === 0) {
      return [{ value: "", label: d.svNoViews }];
    }
    return views.map((view) => ({ value: view.id, label: view.name }));
  }, [views, d]);

  const filteredColumns = useMemo(() => {
    const needle = columnSearch.trim().toLowerCase();
    if (needle === "") {
      return columns;
    }
    return columns.filter((column) => column.header.toLowerCase().includes(needle));
  }, [columns, columnSearch]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-card p-4 shadow-e1">
      {viewsError !== null && <ErrorNotice>{viewsError}</ErrorNotice>}
      {notice !== null && <SuccessNotice>{notice}</SuccessNotice>}

      <div className="flex flex-wrap items-center gap-2">
        {/* Column chooser */}
        <Popover
          align="start"
          width="18rem"
          content={
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-900">{d.svChooseColumns}</p>
              <Input
                value={columnSearch}
                onValueChange={setColumnSearch}
                placeholder={d.svSearchColumns}
              />
              <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                {filteredColumns.map((column) => (
                  <Checkbox
                    key={column.key}
                    label={column.header}
                    checked={visibleColumns.includes(column.key)}
                    onCheckedChange={(checked) => toggleColumn(column.key, checked === true)}
                  />
                ))}
              </div>
            </div>
          }
        >
          <Button variant="secondary">{d.svColumns}</Button>
        </Popover>

        {/* Saved views */}
        <div className="w-full sm:w-64">
          <Select
            value=""
            placeholder={views.length === 0 ? d.svNoViews : d.svApply}
            options={viewSelectOptions}
            onValueChange={(value) => {
              const view = views.find((row) => row.id === value);
              if (view !== undefined) {
                applyView(view);
              }
            }}
          />
        </div>

        {/* Export — same-origin anchors through the dedicated BFF streaming
            route (the session cookie rides along; the attachment download
            never navigates away). */}
        {exportPath !== null && (
          <div className="flex items-center gap-2">
            <LinkButton href={exportUrl("csv")} variant="secondary">
              {d.svExportCsv}
            </LinkButton>
            <LinkButton href={exportUrl("xlsx")} variant="secondary">
              {d.svExportXlsx}
            </LinkButton>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{d.svTitle}</p>
          {views.length > 0 && (
            <span className="text-xs text-gray-600">{`${d.svColumns}: ${visibleColumns.length}`}</span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label={d.svViewName} value={viewName} onValueChange={setViewName} />
          {canShare && (
            <Checkbox label={d.svShared} checked={shared} onCheckedChange={(checked) => setShared(checked === true)} />
          )}
          <Checkbox
            label={d.svDefault}
            checked={isDefault}
            onCheckedChange={(checked) => setIsDefault(checked === true)}
          />
          <div className="flex items-end">
            <Button variant="secondary" loading={busy === "save-view"} onClick={() => void saveView()}>
              {d.commonSave}
            </Button>
          </div>
        </div>
        {canShare && <p className="text-xs text-gray-600">{d.svSharedHint}</p>}
        <p className="text-xs text-gray-600">{d.svDefaultHint}</p>

        {myViews.length > 0 && (
          <div className="mt-1 flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-700">{d.svMyViews}</p>
            {myViews.map((view) => (
              <div key={view.id} className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-800">{view.name}</span>
                {view.isDefault && <Badge tone="primary">{d.svDefault}</Badge>}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => applyView(view)}
                >
                  {d.svApply}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busy === `delete-view-${view.id}`}
                  onClick={() => void deleteView(view.id)}
                >
                  {d.svDelete}
                </Button>
              </div>
            ))}
          </div>
        )}

        {sharedViews.length > 0 && (
          <div className="mt-1 flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-700">{d.svSharedViews}</p>
            {sharedViews.map((view) => (
              <div key={view.id} className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-800">{view.name}</span>
                {view.isDefault && <Badge tone="primary">{d.svDefault}</Badge>}
                <Button size="sm" variant="ghost" onClick={() => applyView(view)}>
                  {d.svApply}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busy === `delete-view-${view.id}`}
                  onClick={() => void deleteView(view.id)}
                >
                  {d.svDelete}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
