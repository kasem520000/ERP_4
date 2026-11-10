import { type BulkAction, type BulkActionResult, type BulkRowResult } from "@erp/contracts";

/**
 * The bulk-action executor (PHASE-036 T36-4, FD-01): ONE convention for
 * every surface — batch the entity's EXISTING lifecycle service per row,
 * catch per-row typed failures, and report a per-row result array.
 *
 * Contract semantics (the phase §2 rules):
 *   - the phase NEVER invents lifecycle semantics — each surface supplies
 *     its own executor (approve/post/void calling the same service methods
 *     the single-row routes call);
 *   - partial failure is REPORTED, never silently dropped: every requested
 *     id appears in the results exactly once with ok or the typed error;
 *   - re-runs are safe per row: an already-succeeded row returns its
 *     natural typed INVALID_STATE-style failure on re-run (the underlying
 *     service's own state machine) — the executor never mutates on its own;
 *   - the per-row permission check is the executor's responsibility (the
 *     route permission gates the batch; per-row overrides like the
 *     credit-check override stay single-row only, by design).
 */

export interface BulkExecutorInput {
  readonly id: string;
}

/** Per-row executor: returns the row's natural result or throws a typed error. */
export type BulkRowExecutor = (input: BulkExecutorInput) => Promise<unknown> | unknown;

function errorCodeOf(error: unknown): { code: string; message?: string } {
  if (error instanceof Error && "code" in error && typeof (error as { code?: unknown }).code === "string") {
    const domainError = error as { code: string; message: string };
    return { code: domainError.code, message: domainError.message };
  }
  return { code: "internal/unexpected-error" };
}

/** Execute the batch with the per-row report envelope. */
export async function executeBulk(
  action: BulkAction,
  ids: readonly string[],
  executor: BulkRowExecutor,
): Promise<BulkActionResult> {
  const results: BulkRowResult[] = [];
  let succeeded = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await executor({ id });
      results.push({ id, ok: true, error: null });
      succeeded += 1;
    } catch (error) {
      results.push({ id, ok: false, error: errorCodeOf(error) });
      failed += 1;
    }
  }
  return {
    action,
    requested: ids.length,
    succeeded,
    failed,
    results,
  };
}
