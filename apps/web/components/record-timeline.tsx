"use client";

/**
 * PHASE-036 (P36-W) — the record timeline drawer: a per-row "Timeline"
 * trigger that opens an overlay side panel (logical `end-0` — right in LTR,
 * left in RTL) with the record's activity feed (GET extensibility/timeline,
 * newest-first: audit events + record comments as the discriminated union)
 * and the comment composer (POST extensibility/comments — @uuid tokens in
 * the body become mentions server-side; the hint says so).
 */
import { useState } from "react";
import type { JSX } from "react";

import { Badge, Button, Textarea } from "@erp/ui";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type {
  CustomFieldEntityKind,
  RecordCommentRow,
  TimelineEntryRow,
} from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatDateTime, localizedApiError } from "../lib/messages";
import { ErrorNotice, SuccessNotice } from "./notices";

export function RecordTimeline({
  locale,
  entityKind,
  entityId,
}: {
  locale: Locale;
  entityKind: CustomFieldEntityKind;
  entityId: string;
}): JSX.Element {
  const d = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<readonly TimelineEntryRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function load(): Promise<void> {
    setError(null);
    setLoading(true);
    const result = await bffFetch<readonly TimelineEntryRow[]>(
      `extensibility/timeline?entity=${encodeURIComponent(entityKind)}&id=${encodeURIComponent(entityId)}&limit=100`,
    );
    setLoading(false);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setLoaded(true);
    setEntries(result.data);
  }

  function openPanel(): void {
    setOpen(true);
    setNotice(null);
    void load();
  }

  async function sendComment(): Promise<void> {
    if (body.trim() === "") {
      setError(d.errorsValidation);
      return;
    }
    setError(null);
    setNotice(null);
    setSending(true);
    const result = await bffFetch<RecordCommentRow>("extensibility/comments", {
      method: "POST",
      body: { entityKind, entityId, body: body.trim() },
    });
    setSending(false);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setBody("");
    setNotice(d.timelineCommentSent);
    await load();
  }

  return (
    <>
      <Button size="sm" variant="ghost" iconStart="clock" aria-label={d.timelineTitle} onClick={openPanel}>
        <span className="sr-only">{d.timelineTitle}</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-[var(--erp-z-raised)]">
          {/* Click-away scrim (keyboard users get the Close button below). */}
          <button
            type="button"
            aria-label={d.timelineClose}
            className="absolute inset-0 bg-gray-900/30"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-label={d.timelineTitle}
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col gap-3 overflow-y-auto border-s border-subtle bg-surface-card p-4 shadow-e3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-md font-semibold text-gray-900">{d.timelineTitle}</h2>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                {d.timelineClose}
              </Button>
            </div>

            {error !== null && <ErrorNotice>{error}</ErrorNotice>}
            {notice !== null && <SuccessNotice>{notice}</SuccessNotice>}

            {loading && <p className="text-sm text-gray-600">{d.loading}</p>}

            {!loading && loaded && entries.length === 0 && (
              <p className="text-sm text-gray-600">{d.timelineNoEntries}</p>
            )}

            <ol className="flex flex-col gap-2">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-md border border-subtle bg-surface-card p-3">
                  {entry.kind === "audit" ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{d.timelineAudit}</Badge>
                        <span className="text-xs text-gray-600">{d.timelineAction}</span>
                        <span className="font-mono text-sm" dir="ltr">
                          {entry.action}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formatDateTime(entry.at, locale)}
                        {entry.actorId !== null && (
                          <span className="ms-2 font-mono text-xs text-gray-500" dir="ltr">
                            {entry.actorId.slice(0, 8)}
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="primary">{d.timelineComment}</Badge>
                        {entry.actorId !== null && (
                          <span className="font-mono text-xs text-gray-500" dir="ltr">
                            {entry.actorId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-gray-800">{entry.body}</p>
                      <p className="text-xs text-gray-600">{formatDateTime(entry.at, locale)}</p>
                      {entry.mentions.length > 0 && (
                        <p className="text-xs text-gray-500" dir="ltr">
                          {`@${entry.mentions.map((id) => id.slice(0, 8)).join(" @")}`}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-auto flex flex-col gap-2 border-t border-subtle pt-3">
              <h3 className="text-sm font-medium text-gray-900">{d.timelineAddComment}</h3>
              <Textarea
                value={body}
                onValueChange={setBody}
                placeholder={d.timelineCommentPlaceholder}
                rows={3}
                maxLength={4000}
              />
              <p className="text-xs text-gray-600">{d.timelineMentionHint}</p>
              <div className="flex gap-2">
                <Button variant="primary" loading={sending} onClick={() => void sendComment()}>
                  {d.timelineSend}
                </Button>
                <Button
                  variant="ghost"
                  disabled={sending}
                  onClick={() => {
                    void load();
                  }}
                >
                  {d.retryLabel}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
