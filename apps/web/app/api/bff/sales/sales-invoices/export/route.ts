/**
 * PHASE-036 (P36-W) — GET /api/bff/sales/sales-invoices/export: the
 * sales-invoice list download (CSV/XLSX). The generic BFF proxy is JSON-only
 * (it parses every upstream body as an envelope and would mangle a
 * text/csv or spreadsheet attachment into an INTERNAL error envelope), so
 * the export gets this dedicated streaming route — the PHASE-024 T8
 * audit-events-export precedent: forward the session cookie as
 * X-Session-Token, re-broadcast the SAME filter/column set the list page
 * used (only the known keys — never the raw search string), and pass the
 * API's attachment through with Content-Type + Content-Disposition intact.
 * An anchor with `href="/api/bff/sales/sales-invoices/export?…"` carries
 * the session cookie same-origin, so no fetch gymnastics are needed.
 *
 * Non-200 upstream answers (403 viewer, 402 plan gate, 429) pass through
 * as the normal JSON error envelope with the upstream status.
 */
import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, parseJsonOrUndefined } from "@/lib/api-types";
import { apiEndpoint } from "@/lib/bff";

/** The export controller's accepted query keys (re-broadcast allow-list). */
const FILTER_KEYS = ["format", "columns", "status", "customerId", "kind"] as const;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  if (sessionToken === "") {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "no session", traceId: randomUUID() } },
      { status: 401 },
    );
  }

  // Re-broadcast only the known filter keys (never the raw search string).
  const incoming = new URL(request.url).searchParams;
  const search = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = incoming.get(key);
    if (value !== null && value !== "") {
      search.set(key, value);
    }
  }

  let upstream: Response;
  try {
    const headers: Record<string, string> = {
      "x-request-id": randomUUID(),
      "x-session-token": sessionToken,
    };
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor !== null && forwardedFor !== "") {
      headers["x-forwarded-for"] = forwardedFor;
    }
    upstream = await fetch(`${apiEndpoint("sales/sales-invoices/export")}?${search.toString()}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: { code: "NETWORK_ERROR", message: "identity API is unreachable", traceId: randomUUID() } },
      { status: 502 },
    );
  }

  if (upstream.status !== 200) {
    // The API answers non-200 as the standard JSON error envelope.
    const payload = parseJsonOrUndefined(await upstream.text());
    const body =
      payload ?? { error: { code: "INTERNAL", message: "empty upstream response", traceId: randomUUID() } };
    const response = NextResponse.json(body, { status: upstream.status });
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter !== null) {
      response.headers.set("retry-after", retryAfter);
    }
    return response;
  }

  // Binary-safe passthrough (XLSX is a zip — text decoding would corrupt it).
  const body = await upstream.arrayBuffer();
  const headers = new Headers();
  headers.set(
    "content-type",
    upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
  );
  headers.set(
    "content-disposition",
    upstream.headers.get("content-disposition") ?? 'attachment; filename="sales-invoices.csv"',
  );
  return new NextResponse(body, { status: 200, headers });
}
