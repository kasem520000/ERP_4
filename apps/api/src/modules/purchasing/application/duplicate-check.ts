import { type DuplicateInvoiceWarning } from "@erp/contracts";

/**
 * PHASE-036 T36-7 (AD-36-10) — the duplicate supplier-invoice classifier
 * (pure): the BR-011 semantics widened to the full match key
 * (tenant, supplier, invoice number, CURRENCY, amount) with the
 * configurable amount tolerance (`purchasing.duplicate_invoice_tolerance_pct`,
 * the 028/029 SETTINGS wave pattern).
 *
 * The upgrade contract (backward compatible — the migration-0016
 * `duplicate_warning` column and the PHASE-011 DB tests keep their
 * meanings at tolerance 0):
 *   - candidates = every non-CANCELLED (supplier, number) invoice; rows in
 *     a DIFFERENT currency are skipped entirely (a different financial
 *     fact, never a duplicate);
 *   - a candidate within ±tolerance% of the submitted amount (or exactly
 *     equal at tolerance 0) classifies "triple" — the blocking/warning
 *     family per the behavior setting;
 *   - a same-currency candidate outside the tolerance classifies
 *     "number" — always a warning (BR-011's recorded-on-the-draft case);
 *   - the WARNING LIST (every match) rides both the typed
 *     DuplicateSupplierInvoiceError (the dialog's data) and the draft's
 *     duplicate_warning jsonb (additive: kind/existingId/existingAmount/
 *     existingDate stay top-level; `warnings` + currency join additively).
 */

export interface DuplicateCandidate {
  readonly id: string;
  readonly invoiceNo: string;
  readonly amount: string;
  readonly currency: string;
  readonly invoiceDate: string;
  readonly status: string;
}

/** True when |candidate − submitted| ≤ tolerance% of the submitted amount. */
export function withinTolerance(
  submittedAmount: string,
  candidateAmount: string,
  tolerancePct: number,
): boolean {
  if (tolerancePct <= 0) {
    return submittedAmount === candidateAmount;
  }
  const submitted = Number(submittedAmount);
  const candidate = Number(candidateAmount);
  if (!Number.isFinite(submitted) || !Number.isFinite(candidate)) {
    // Non-numeric shapes never match silently — fall back to exact string
    // equality (fail-closed, never a fabricated numeric pass).
    return submittedAmount === candidateAmount;
  }
  const band = Math.abs(submitted) * (tolerancePct / 100);
  return Math.abs(candidate - submitted) <= band;
}

/**
 * Classify every candidate against the submitted invoice. The output is
 * ordered as the store returned it (created_at ascending — the dialog
 * lists the oldest first, the most likely legitimate original).
 */
export function classifyDuplicateCandidates(
  submitted: { readonly amount: string; readonly currency: string },
  candidates: readonly DuplicateCandidate[],
  tolerancePct: number,
): DuplicateInvoiceWarning[] {
  const warnings: DuplicateInvoiceWarning[] = [];
  for (const candidate of candidates) {
    if (candidate.currency !== submitted.currency) {
      continue; // different financial fact — never a duplicate
    }
    const sameAmount = withinTolerance(submitted.amount, candidate.amount, tolerancePct);
    warnings.push({
      kind: sameAmount ? "triple" : "number",
      existingId: candidate.id,
      existingInvoiceNo: candidate.invoiceNo,
      existingAmount: candidate.amount,
      existingCurrency: candidate.currency,
      existingDate: candidate.invoiceDate,
      existingStatus: candidate.status,
    });
  }
  return warnings;
}
