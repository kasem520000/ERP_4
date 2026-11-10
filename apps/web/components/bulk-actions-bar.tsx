"use client";

/**
 * PHASE-036 (P36-W) — the bulk-actions bar: when the list has a selection,
 * renders one bar per configured action (approve/post/void …) that POSTs
 * {action, ids} to the surface's bulk route and reports FD-01's per-row
 * envelope honestly — "N succeeded, M failed" plus the failed rows
 * (short id + error code). Partial failure is REPORTED, never silently
 * dropped; the selection clears after the run and the result panel stays
 * visible until the next run.
 */
import { useEffect, useState } from "react";
import type { JSX } from "react";

import { Badge, Button } from "@erp/ui";

import { getDictionary, type Dictionary, type Locale } from "../i18n/dictionaries";
import type { BulkActionResultRow } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatMessage, localizedApiError } from "../lib/messages";
import { ErrorNotice } from "./notices";

const ACTION_LABEL_KEYS: Record<string, keyof Dictionary> = {
  approve: "bulkApprove",
  post: "bulkPost",
  void: "bulkVoid",
};

function actionLabel(d: Dictionary, action: string): string {
  const key = ACTION_LABEL_KEYS[action];
  return key === undefined ? action : d[key];
}

export function BulkActionsBar({
  locale,
  selectedIds,
  onClear,
  bulkPath,
  actions,
}: {
  locale: Locale;
  selectedIds: readonly string[];
  onClear: () => void;
  /** The API path AFTER /api/v1/ (e.g. "sales/sales-invoices/bulk"). */
  bulkPath: string;
  actions: readonly ("approve" | "post" | "void")[];
}): JSX.Element | null {
  const d = getDictionary(locale);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkActionResultRow | null>(null);

  // A fresh selection retires the previous run's report (the result panel
  // stays visible after the run itself — FD-01's honest-report window).
  useEffect(() => {
    if (selectedIds.length > 0) {
      setResult(null);
      setError(null);
    }
  }, [selectedIds.length]);

  if (selectedIds.length === 0 && result === null && error === null) {
    return null;
  }

  async function run(action: "approve" | "post" | "void"): Promise<void> {
    if (selectedIds.length === 0) {
      setError(d.bulkNoSelection);
      return;
    }
    setError(null);
    setResult(null);
    setBusy(action);
    const response = await bffFetch<BulkActionResultRow>(bulkPath, {
      method: "POST",
      body: { action, ids: [...selectedIds] },
    });
    setBusy(null);
    if (!response.ok) {
      setError(localizedApiError(d, response.error, response.retryAfterSeconds));
      return;
    }
    setResult(response.data);
    onClear();
  }

  const failedRows = result?.results.filter((row) => !row.ok) ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-card p-4 shadow-e1">
      {error !== null && <ErrorNotice>{error}</ErrorNotice>}

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{formatMessage(d.bulkSelected, { count: selectedIds.length })}</Badge>
          {actions.map((action) => (
            <Button
              key={action}
              variant="secondary"
              loading={busy === action}
              disabled={busy !== null}
              onClick={() => void run(action)}
            >
              {actionLabel(d, action)}
            </Button>
          ))}
          <Button variant="ghost" disabled={busy !== null} onClick={onClear}>
            {d.bulkClear}
          </Button>
        </div>
      )}

      {result !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-900">{d.bulkResult}</p>
          <p className="text-sm text-gray-800">
            {formatMessage(d.bulkSummary, {
              action: actionLabel(d, result.action),
              succeeded: result.succeeded,
              requested: result.requested,
            })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{formatMessage(d.bulkSucceeded, { count: result.succeeded })}</Badge>
            <Badge tone="neutral">{formatMessage(d.bulkFailed, { count: result.failed })}</Badge>
          </div>
          {failedRows.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-700">{d.bulkFailedRows}</p>
              <ul className="flex flex-col gap-1">
                {failedRows.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center gap-2 text-sm text-danger-text">
                    <span className="font-mono text-xs" dir="ltr">
                      {formatMessage(d.bulkRowError, { id: row.id.slice(0, 8), code: row.error?.code ?? "—" })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
