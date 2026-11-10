/**
 * The list exporter (PHASE-036 T36-5, FD-04): server-side xlsx/csv over
 * the CURRENT filters + visible columns — never a client-side grid dump.
 * CSV is synthesized directly (RFC 4180 quoting); XLSX rides exceljs (the
 * reporting exporter's pipeline — dynamic import exactly as the VAT
 * return service does it, never a static dependency edge).
 *
 * The exporter takes plain rows + a column spec: each surface defines its
 * exportable columns (key + header) and maps its domain rows to
 * Record<string, string> values — one pattern, applied per surface.
 */

export interface ExportColumn {
  /** The column key (must appear in the surface's exportable set). */
  readonly key: string;
  /** Header row label (already localized by the caller). */
  readonly header: string;
}

export interface ExportSheet {
  /** Sheet/tab name (≤ 31 chars — the xlsx limit). */
  readonly name: string;
  readonly columns: readonly ExportColumn[];
  readonly rows: readonly Record<string, string>[];
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** RFC 4180 CSV serialization (CRLF rows, quoted when needed). */
export function toCsv(sheet: ExportSheet): string {
  const lines: string[] = [sheet.columns.map((column) => csvCell(column.header)).join(",")];
  for (const row of sheet.rows) {
    lines.push(sheet.columns.map((column) => csvCell(row[column.key] ?? "")).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

/** XLSX workbook buffer via exceljs (dynamic import — the vat-return pattern). */
export async function toXlsx(sheets: readonly ExportSheet[]): Promise<Buffer> {
  const ExcelJS = (await import("exceljs")) as typeof import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ERP platform";
  workbook.created = new Date();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31));
    worksheet.columns = sheet.columns.map((column) => ({ header: column.header, key: column.key }));
    for (const row of sheet.rows) {
      worksheet.addRow(sheet.columns.map((column) => row[column.key] ?? "")).commit();
    }
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * The cell sanitizer: numbers stay numbers-on-purpose only when the caller
 * marks them (the MONEY/NUMBER decimal-string discipline — everything else
 * is stringified, never float-coerced silently).
 */
export function cell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}
