import { describe, expect, it } from "vitest";

import {
  pageFooterTemplate,
  PRINT_TEMPLATE_VERSIONS,
  renderA4Document,
  renderA4Report,
  renderA4Payslip,
  renderReceipt58,
  renderReceipt80,
  EMBEDDED_FONTS,
  type A4DocumentPayload,
  type A4PayslipPayload,
  type A4ReportPayload,
  type ReceiptPayload,
} from "@erp/ui/print";

/**
 * PHASE-013 print-template unit suite (PRINTING_AND_EXPORT §1–§2): the four
 * versioned base templates are pure HTML generators — RTL by locale, real
 * <thead> for Chromium's per-page header repetition, tafqit + legal footer
 * on a4-document, the offline marker on receipts, embedded woff2 fonts, and
 * the frozen version registry. The same payloads render identically in the
 * web preview and the server PDF (ADR-0011) — proven end-to-end by
 * src/__db__/reporting/render.spec.ts against real Chromium.
 */

function reportPayload(locale: "ar" | "en"): A4ReportPayload {
  return {
    template: "a4-report",
    locale,
    title: { ar: "ميزان المراجعة", en: "Trial Balance" },
    parameterSummary: ["dateFrom=2026-01-01", "dateTo=2026-01-31"],
    branding: { tenantName: "شركة الاختبار" },
    columns: [
      { label: { ar: "رمز الحساب", en: "Account code" } },
      { label: { ar: "مدين الفترة", en: "Period debit" }, numeric: true },
    ],
    groups: [{ key: "ASSET", label: { ar: "الأصول", en: "Assets" } }],
    rows: [
      { values: ["1111", "10500.0000"], groupKey: "ASSET" },
      { values: ["1130", "1380.0000"], groupKey: "ASSET" },
    ],
    totals: [
      { label: { ar: "إجمالي مدين الفترة", en: "Total period debit" }, amount: "11880.0000" },
      {
        label: { ar: "الأصول = الالتزامات + حقوق الملكية", en: "Assets = Liabilities + Equity" },
        amount: "0.0000",
        isCheck: true,
      },
    ],
    assertions: [
      { id: "tb-debits-equal-credits", status: "PASS" },
      { id: "tb-closing-net-zero", status: "PASS" },
    ],
    asOf: "2026-02-01T09:00:00.000Z",
    computedAt: "2026-02-01T10:00:00.000Z",
  };
}

const documentPayload: A4DocumentPayload = {
  template: "a4-document",
  locale: "ar",
  title: { ar: "فاتورة ضريبية", en: "Tax Invoice" },
  docNo: "INV-2026-000123",
  docDate: "2026-01-15",
  branding: { tenantName: "شركة الاختبار للتجارة" },
  parties: [
    { label: { ar: "العميل", en: "Customer" }, lines: ["شركة النور", "الرياض"] },
    { label: { ar: "البائع", en: "Seller" }, lines: ["شركة الاختبار للتجارة"] },
  ],
  columns: [
    { label: { ar: "الوصف", en: "Description" } },
    { label: { ar: "المبلغ", en: "Amount" }, numeric: true },
  ],
  rows: [
    ["خدمة استشارية", "1150.0000"],
    [null, null],
  ],
  totals: [
    { label: { ar: "الإجمالي", en: "Total" }, amount: "1150.0000" },
    { label: { ar: "ض.ق.م 15%", en: "VAT 15%" }, amount: "172.5000" },
    { label: { ar: "الإجمالي مع الضريبة", en: "Total incl. VAT" }, amount: "1322.5000", isCheck: true },
  ],
  amountInWords: "ألف وثلاثمائة واثنان وعشرون ريالاً سعودياً وخمسون هللة",
  legalFooter: {
    legalName: "شركة الاختبار للتجارة (ش.م.م)",
    vatRegNo: "310000000000003",
    notices: ["هذه الفاتورة صادرة إلكترونياً", "Electronic invoice — no signature required"],
  },
};

function receiptPayload(overrides: Partial<ReceiptPayload> = {}): ReceiptPayload {
  return {
    template: "receipt-58",
    locale: "ar",
    merchantName: "متجر الاختبار",
    merchantVat: "310000000000003",
    docNo: "POS-2026-000045",
    cashier: "أمين الصندوق",
    items: [{ name: "منتج أ", qty: "2", price: "25.00", total: "50.00" }],
    totals: [
      { label: "الإجمالي", amount: "50.00" },
      { label: "ض.ق.م", amount: "6.50" },
    ],
    paymentMethod: "نقداً / Cash",
    ...overrides,
  };
}

describe("a4-report (statement prints, §1)", () => {
  it("locale ar renders RTL with a real thead, the AR title and group headers", () => {
    const html = renderA4Report(reportPayload("ar"));
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("<thead>");
    expect(html).toContain("ميزان المراجعة");
    expect(html).toContain("الأصول");
    expect(html).toContain("رمز الحساب");
    // Assertion chips + the freshness line (§8.3 self-describing print).
    expect(html).toContain("tb-debits-equal-credits");
    expect(html).toContain("كما في");
    expect(html).toContain("وقت الاحتساب");
  });

  it("locale en renders LTR with the EN labels", () => {
    const html = renderA4Report(reportPayload("en"));
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("Trial Balance");
    expect(html).toContain("Account code");
    expect(html).toContain("as of");
    expect(html).toContain("computed at");
  });
});

describe("a4-document (invoice/voucher prints, §1)", () => {
  it("renders the tafqit amount-in-words and the legal footer lines", () => {
    const html = renderA4Document(documentPayload);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("ألف وثلاثمائة واثنان وعشرون ريالاً سعودياً وخمسون هللة");
    expect(html).toContain("شركة الاختبار للتجارة (ش.م.م)");
    expect(html).toContain("310000000000003");
    expect(html).toContain("هذه الفاتورة صادرة إلكترونياً");
    expect(html).toContain("Electronic invoice — no signature required");
    expect(html).toContain("INV-2026-000123");
    expect(html).toContain("<thead>");
  });
});

describe("receipt-58 / receipt-80 (POS roll prints, §1)", () => {
  it("receipt-58 marks offline documents with OFF- and the pending-sync line", () => {
    const html = renderReceipt58(receiptPayload({ offlineNo: "20260115-0007" }));
    expect(html).toContain("OFF-");
    expect(html).toContain("20260115-0007");
    expect(html).toContain("pending sync");
    expect(html).toContain("بانتظار المزامنة");
  });

  it("a synced receipt carries no offline marker", () => {
    const html = renderReceipt80(receiptPayload({ template: "receipt-80" }));
    expect(html).not.toContain("OFF-");
    expect(html).not.toContain("pending sync");
  });
});

describe("a4-payslip (the payroll run's salary slips — PHASE-035 §5)", () => {
  const payslipPayload = (locale: "ar" | "en"): A4PayslipPayload => ({
    template: "a4-payslip",
    locale,
    title: { ar: "قسيمة رواتب", en: "Payslip" },
    runNo: "PAY-2026-000001",
    periodName: "2026-10",
    branding: { tenantName: "شركة الاختبار" },
    slips: [
      {
        employeeName: "سالم العتيبي",
        employeeNo: "EMP-0014",
        department: null,
        components: [
          { label: { ar: "الراتب الأساسي", en: "Basic salary" }, kind: "EARNING", amount: "8000.0000" },
          { label: { ar: "بدل سكن", en: "Housing allowance" }, kind: "EARNING", amount: "2000.0000" },
          { label: { ar: "استقطاع تأمينات", en: "GOSI deduction" }, kind: "DEDUCTION", amount: "920.0000" },
        ],
        gross: "10000.0000",
        deductions: "920.0000",
        net: "9080.0000",
      },
      {
        employeeName: "Maryam Ahmed",
        employeeNo: "EMP-0021",
        department: null,
        components: [
          { label: { ar: "الراتب الأساسي", en: "Basic salary" }, kind: "EARNING", amount: "6500.0000" },
        ],
        gross: "6500.0000",
        deductions: "0.0000",
        net: "6500.0000",
      },
    ],
    batchTotals: { gross: "16500.0000", deductions: "920.0000", net: "15580.0000", employees: 2 },
  });

  it("locale ar renders RTL with per-employee pages and the net as the check row", () => {
    const html = renderA4Payslip(payslipPayload("ar"));
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("قسيمة رواتب");
    expect(html).toContain("سالم العتيبي");
    expect(html).toContain("الصافي المستحق");
    expect(html).toContain("9080.0000");
    // One page-break per additional employee (the second slip) + the batch
    // totals page — the payslip-break token appears three times: the second
    // slip's section, the batch-totals block, and the stylesheet rule.
    expect(html.match(/payslip-break/g)).toHaveLength(3);
    expect(html).toContain("إجماليات الدفعة");
    expect(html).toContain("15580.0000");
  });

  it("locale en renders LTR with the EN labels", () => {
    const html = renderA4Payslip(payslipPayload("en"));
    expect(html).toContain('lang="en"');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("Payslip");
    expect(html).toContain("Net pay");
    expect(html).toContain("Batch totals");
    expect(html).toContain("Housing allowance");
  });

  it("the earnings and deductions columns split by component kind", () => {
    const html = renderA4Payslip(payslipPayload("ar"));
    expect(html).toContain("المستحقات");
    expect(html).toContain("الاستقطاعات");
    expect(html).toContain("استقطاع تأمينات");
    // tabular-nums money cells (the .num isolation rule).
    expect(html).toContain('class="numeric num"');
  });
});

describe("template registry + fonts (§1–§2)", () => {
  it("PRINT_TEMPLATE_VERSIONS freezes the five base templates at version 1", () => {
    expect(Object.keys(PRINT_TEMPLATE_VERSIONS).sort()).toEqual([
      "a4-document",
      "a4-payslip",
      "a4-report",
      "receipt-58",
      "receipt-80",
    ]);
    for (const version of Object.values(PRINT_TEMPLATE_VERSIONS)) {
      expect(version).toBe(1);
    }
  });

  it("the print stylesheet embeds the woff2 fonts as data URIs (no network fetch)", () => {
    const html = renderA4Report(reportPayload("ar"));
    expect(html).toContain("data:font/woff2;base64,");
    expect(Object.keys(EMBEDDED_FONTS).length).toBeGreaterThan(0);
  });

  it("pageFooterTemplate('ar') carries the localized page label", () => {
    expect(pageFooterTemplate("ar")).toContain("صفحة");
    expect(pageFooterTemplate("en")).toContain("Page");
  });
});
