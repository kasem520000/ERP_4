import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { z } from "zod";

import { bulkActionRequestSchema } from "@erp/contracts";

import { identityOf, type SessionContext } from "../../../infra/context/session-context";
import { UnauthenticatedError, ForbiddenError } from "../../identity/api/identity";
import { RequirePermissions } from "../../../infra/auth/require-permissions.decorator";
import { RequireFeature } from "../../../infra/auth/require-feature.decorator";
import { envelope } from "../../../infra/http/envelope";
import { executeBulk } from "../../extensibility/application/bulk-actions";
import { cell, toCsv, toXlsx, type ExportColumn } from "../../extensibility/application/list-export";
import { QuotationService } from "../application/quotations";
import { SalesOrderService } from "../application/orders";
import { DeliveryNoteService } from "../application/deliveries";
import { SalesInvoiceService } from "../application/invoices";
import { CreditNoteService } from "../application/credit-notes";
import { SalesReallocationService } from "../application/reallocations";
import { ArQueriesService } from "../application/ar-queries";
import { SalesRepService, InvoiceOverdueService } from "../application/reps";
import { creditCheckPreview } from "../application/credit-limits";

/**
 * Sales routes (PHASE-012 §4; matrix §3.2): every route is
 * permission-guarded (the exact seeded matrix keys), Idempotency-Key'd by
 * the global POST guard, and returns the success envelope. Foreign or
 * unknown ids are 404-shaped (A7 — no existence disclosure). Risky keys
 * (invoice approve/post with override, credit-note post, re-allocations)
 * are approval-separated + audited server-side.
 *
 * Receipts themselves (the money leg) ride the PHASE-008 treasury routes
 * (`/api/v1/treasury/receipts` — already keyed sales.receipts.*); this
 * controller adds the AR-specific surfaces: re-allocations, AR
 * aging/statements/open items, the credit-check preview, and the
 * invoice.overdue scan.
 */

function requireIdentity(request: Request): SessionContext {
  const identity = identityOf(request);
  if (identity === undefined) {
    throw new UnauthenticatedError();
  }
  return identity;
}

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date");
const QTY = z.string().regex(/^\d+(\.\d{1,6})?$/, "positive decimal (≤ 6dp)");
const PRICE = z.string().regex(/^\d+(\.\d{1,6})?$/, "non-negative decimal (≤ 6dp)");
const MONEY = z.string().regex(/^\d+(\.\d{1,4})?$/, "positive decimal");
const RATE = z.string().regex(/^\d+(\.\d{1,8})?$/, "positive rate").nullable().optional();
const UUID = z.string().uuid();

const quoteLineSchema = z.object({
  itemId: UUID,
  qty: QTY,
  unitPrice: PRICE.nullable().optional(),
  discountAmount: MONEY.nullable().optional(),
  taxCodeId: UUID.nullable().optional(),
  description: z.string().min(1).max(300).nullable().optional(),
  descriptionAr: z.string().min(1).max(300).nullable().optional(),
  note: z.string().min(1).max(300).nullable().optional(),
});

const createQuoteSchema = z.object({
  branchId: UUID,
  customerId: UUID,
  salesRepId: UUID.nullable().optional(),
  quoteDate: DATE,
  validUntil: DATE.nullable().optional(),
  currencyCode: z.string().length(3),
  exchangeRate: RATE,
  note: z.string().min(1).max(500).nullable().optional(),
  noteAr: z.string().min(1).max(500).nullable().optional(),
  lines: z.array(quoteLineSchema).min(1).max(200),
});

const orderLineSchema = z.object({
  itemId: UUID,
  qty: QTY,
  unitPrice: PRICE.nullable().optional(),
  discountAmount: MONEY.nullable().optional(),
  taxCodeId: UUID.nullable().optional(),
  description: z.string().min(1).max(300).nullable().optional(),
  descriptionAr: z.string().min(1).max(300).nullable().optional(),
  note: z.string().min(1).max(300).nullable().optional(),
});

const createOrderSchema = z.object({
  branchId: UUID,
  customerId: UUID,
  salesRepId: UUID.nullable().optional(),
  warehouseId: UUID,
  quotationId: UUID.nullable().optional(),
  orderDate: DATE,
  expectedDate: DATE.nullable().optional(),
  currencyCode: z.string().length(3),
  exchangeRate: RATE,
  note: z.string().min(1).max(500).nullable().optional(),
  noteAr: z.string().min(1).max(500).nullable().optional(),
  reserve: z.boolean().optional(),
  lines: z.array(orderLineSchema).min(1).max(200),
});

const deliveryLineSchema = z.object({
  orderLineId: UUID.nullable().optional(),
  itemId: UUID,
  qty: QTY,
  unitPrice: PRICE.nullable().optional(),
  discountAmount: MONEY.nullable().optional(),
  batchId: UUID.nullable().optional(),
  serialIds: z.array(UUID).nullable().optional(),
  description: z.string().min(1).max(300).nullable().optional(),
  descriptionAr: z.string().min(1).max(300).nullable().optional(),
  note: z.string().min(1).max(300).nullable().optional(),
});

const createDeliverySchema = z.object({
  branchId: UUID,
  customerId: UUID,
  salesRepId: UUID.nullable().optional(),
  orderId: UUID.nullable().optional(),
  warehouseId: UUID,
  deliveryDate: DATE,
  currencyCode: z.string().length(3),
  note: z.string().min(1).max(500).nullable().optional(),
  noteAr: z.string().min(1).max(500).nullable().optional(),
  lines: z.array(deliveryLineSchema).min(1).max(200),
});

const invoiceLineSchema = z.object({
  itemId: UUID.nullable().optional(),
  accountId: UUID.nullable().optional(),
  deliveryLineId: UUID.nullable().optional(),
  description: z.string().min(1).max(300).nullable().optional(),
  descriptionAr: z.string().min(1).max(300).nullable().optional(),
  qty: QTY,
  unitPrice: PRICE,
  discountAmount: MONEY.nullable().optional(),
  taxCodeId: UUID.nullable().optional(),
  batchId: UUID.nullable().optional(),
  serialIds: z.array(UUID).nullable().optional(),
  note: z.string().min(1).max(300).nullable().optional(),
});

const createInvoiceSchema = z.object({
  branchId: UUID,
  customerId: UUID,
  salesRepId: UUID.nullable().optional(),
  kind: z.enum(["CASH", "CREDIT"]),
  invoiceDate: DATE,
  dueDate: DATE.nullable().optional(),
  currencyCode: z.string().length(3),
  exchangeRate: RATE,
  orderId: UUID.nullable().optional(),
  deliveryId: UUID.nullable().optional(),
  warehouseId: UUID.nullable().optional(),
  cashAccountId: UUID.nullable().optional(),
  /** PHASE-031 (0042 — healthcare claim-ref light extension, read-compat
   * per CONFIGURATION_ENGINE §4 governance): `insured` is the payer
   * selection (insurance billing selected); `claimRef` the external
   * insurer claim reference (varchar(64), never a document number,
   * ADR-0006). Older clients ignore both — absent = self-pay. */
  insured: z.boolean().optional(),
  claimRef: z.string().min(1).max(64).nullable().optional(),
  note: z.string().min(1).max(500).nullable().optional(),
  noteAr: z.string().min(1).max(500).nullable().optional(),
  lines: z.array(invoiceLineSchema).min(1).max(200),
});

const creditLineSchema = z.object({
  invoiceLineId: UUID,
  qty: QTY,
  unitPrice: PRICE.nullable().optional(),
  discountAmount: MONEY.nullable().optional(),
  taxCodeId: UUID.nullable().optional(),
  returnToStock: z.boolean().optional(),
  batchId: UUID.nullable().optional(),
  serialIds: z.array(UUID).nullable().optional(),
  description: z.string().min(1).max(300).nullable().optional(),
  descriptionAr: z.string().min(1).max(300).nullable().optional(),
  note: z.string().min(1).max(300).nullable().optional(),
});

const createCreditSchema = z.object({
  branchId: UUID,
  salesRepId: UUID.nullable().optional(),
  invoiceId: UUID,
  noteDate: DATE,
  note: z.string().min(1).max(500).nullable().optional(),
  noteAr: z.string().min(1).max(500).nullable().optional(),
  lines: z.array(creditLineSchema).min(1).max(200),
});

const reallocationSchema = z.object({
  receiptId: UUID,
  reason: z.string().min(1).max(300),
  lines: z
    .array(
      z.object({
        fromOpenItemId: UUID.nullable().optional(),
        toOpenItemId: UUID.nullable().optional(),
        amount: MONEY,
      }),
    )
    .min(1)
    .max(50),
});

const reasonSchema = z.object({ reason: z.string().min(1).max(300) });
const creditCheckSchema = z.object({ documentAmount: MONEY.optional() });

@Controller("/api/v1/sales")
export class SalesController {
  constructor(
    @Inject(QuotationService) private readonly quotations: QuotationService,
    @Inject(SalesOrderService) private readonly orders: SalesOrderService,
    @Inject(DeliveryNoteService) private readonly deliveries: DeliveryNoteService,
    @Inject(SalesInvoiceService) private readonly invoices: SalesInvoiceService,
    @Inject(CreditNoteService) private readonly notes: CreditNoteService,
    @Inject(SalesReallocationService) private readonly reallocations: SalesReallocationService,
    @Inject(ArQueriesService) private readonly arQueries: ArQueriesService,
    @Inject(SalesRepService) private readonly reps: SalesRepService,
    @Inject(InvoiceOverdueService) private readonly overdue: InvoiceOverdueService,
  ) {}

  // -- quotations (BR-006) ------------------------------------------------------

  @Get("quotations")
  @RequirePermissions("sales.quotations.view")
  listQuotations(
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
    @Query("limit") limit?: string,
  ) {
    return envelope(
      this.quotations.list({
        status,
        customerId,
        limit: z.coerce.number().int().min(1).max(500).parse(limit ?? 100),
      }),
    );
  }

  @Get("quotations/:id")
  @RequirePermissions("sales.quotations.view")
  getQuotation(@Param("id") id: string) {
    return envelope(this.quotations.findWithLines(id));
  }

  @Post("quotations")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("sales.quotations.create")
  async createQuotation(@Req() request: Request, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = createQuoteSchema.parse(body);
    return envelope(
      this.quotations.create({
        ...input,
        salesRepId: input.salesRepId ?? null,
        validUntil: input.validUntil ?? null,
        exchangeRate: input.exchangeRate ?? null,
        note: input.note ?? null,
        noteAr: input.noteAr ?? null,
        actorId: identity.userId,
        lines: input.lines.map((line) => ({
          itemId: line.itemId,
          qty: line.qty,
          unitPrice: line.unitPrice ?? null,
          discountAmount: line.discountAmount ?? null,
          taxCodeId: line.taxCodeId ?? null,
          description: line.description ?? null,
          descriptionAr: line.descriptionAr ?? null,
          note: line.note ?? null,
        })),
      }),
    );
  }

  @Post("quotations/:id/send")
  @RequirePermissions("sales.quotations.approve")
  sendQuotation(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.quotations.send(id, identity.userId));
  }

  @Post("quotations/:id/reject")
  @RequirePermissions("sales.quotations.approve")
  rejectQuotation(
    @Req() request: Request,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const identity = requireIdentity(request);
    const { reason } = z.object({ reason: z.string().min(1).max(300).nullable().optional() }).parse(body ?? {});
    return envelope(this.quotations.reject(id, reason ?? null, identity.userId));
  }

  @Post("quotations/:id/cancel")
  @RequirePermissions("sales.quotations.create")
  cancelQuotation(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const { reason } = reasonSchema.parse(body);
    return envelope(this.quotations.cancel(id, reason, identity.userId));
  }

  @Post("quotations/:id/accept")
  @RequirePermissions("sales.quotations.convert")
  acceptQuotation(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = z
      .object({
        warehouseId: UUID,
        expectedDate: DATE.nullable().optional(),
        note: z.string().min(1).max(500).nullable().optional(),
        reserve: z.boolean().optional(),
      })
      .parse(body);
    return envelope(
      this.orders.acceptQuotation({
        quotationId: id,
        warehouseId: input.warehouseId,
        expectedDate: input.expectedDate ?? null,
        note: input.note ?? null,
        actorId: identity.userId,
        reserve: input.reserve ?? false,
      }),
    );
  }

  @Post("quotations/:id/convert")
  @RequirePermissions("sales.quotations.convert")
  convertQuotation(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    return this.acceptQuotation(request, id, body);
  }

  @Post("quotations/sweep-expired")
  @RequirePermissions("sales.quotations.approve")
  sweepExpired(@Req() request: Request) {
    const identity = requireIdentity(request);
    return envelope(this.quotations.sweepExpired(identity.userId));
  }

  // -- sales orders --------------------------------------------------------------

  @Get("sales-orders")
  @RequirePermissions("sales.orders.view")
  listOrders(
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
    @Query("limit") limit?: string,
  ) {
    return envelope(
      this.orders.list({
        status,
        customerId,
        limit: z.coerce.number().int().min(1).max(500).parse(limit ?? 100),
      }),
    );
  }

  @Get("sales-orders/:id")
  @RequirePermissions("sales.orders.view")
  getOrder(@Param("id") id: string) {
    return envelope(this.orders.findWithLines(id));
  }

  @Post("sales-orders")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("sales.orders.create")
  createOrder(@Req() request: Request, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = createOrderSchema.parse(body);
    return envelope(
      this.orders.create({
        ...input,
        salesRepId: input.salesRepId ?? null,
        quotationId: input.quotationId ?? null,
        expectedDate: input.expectedDate ?? null,
        exchangeRate: input.exchangeRate ?? null,
        note: input.note ?? null,
        noteAr: input.noteAr ?? null,
        actorId: identity.userId,
        reserve: input.reserve ?? false,
        lines: input.lines.map((line) => ({
          itemId: line.itemId,
          qty: line.qty,
          unitPrice: line.unitPrice ?? null,
          discountAmount: line.discountAmount ?? null,
          taxCodeId: line.taxCodeId ?? null,
          description: line.description ?? null,
          descriptionAr: line.descriptionAr ?? null,
          note: line.note ?? null,
        })),
      }),
    );
  }

  @Post("sales-orders/:id/submit")
  @RequirePermissions("sales.orders.create")
  submitOrder(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.orders.submit(id, identity.userId));
  }

  @Post("sales-orders/:id/approve")
  @RequirePermissions("sales.orders.approve")
  approveOrder(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.orders.approve(id, identity.userId));
  }

  @Post("sales-orders/:id/issue")
  @RequirePermissions("sales.orders.approve")
  issueOrder(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.orders.issue(id, identity.userId));
  }

  @Post("sales-orders/:id/close")
  @RequirePermissions("sales.orders.approve")
  closeOrder(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.orders.close(id, identity.userId));
  }

  @Post("sales-orders/:id/cancel")
  @RequirePermissions("sales.orders.create")
  cancelOrder(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const { reason } = reasonSchema.parse(body);
    return envelope(this.orders.cancel(id, reason, identity.userId));
  }

  // -- delivery notes (BR-007 flow A; G-03) ----------------------------------------

  @Get("delivery-notes")
  @RequirePermissions("sales.deliveries.view")
  listDeliveries(
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
    @Query("orderId") orderId?: string,
    @Query("limit") limit?: string,
  ) {
    return envelope(
      this.deliveries.list({
        status,
        customerId,
        orderId,
        limit: z.coerce.number().int().min(1).max(500).parse(limit ?? 100),
      }),
    );
  }

  @Get("delivery-notes/:id")
  @RequirePermissions("sales.deliveries.view")
  getDelivery(@Param("id") id: string) {
    return envelope(this.deliveries.findWithLines(id));
  }

  @Post("delivery-notes")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("sales.deliveries.create")
  createDelivery(@Req() request: Request, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = createDeliverySchema.parse(body);
    return envelope(
      this.deliveries.create({
        ...input,
        salesRepId: input.salesRepId ?? null,
        orderId: input.orderId ?? null,
        note: input.note ?? null,
        noteAr: input.noteAr ?? null,
        actorId: identity.userId,
        lines: input.lines.map((line) => ({
          orderLineId: line.orderLineId ?? null,
          itemId: line.itemId,
          qty: line.qty,
          unitPrice: line.unitPrice ?? null,
          discountAmount: line.discountAmount ?? null,
          batchId: line.batchId ?? null,
          serialIds: line.serialIds ?? null,
          description: line.description ?? null,
          descriptionAr: line.descriptionAr ?? null,
          note: line.note ?? null,
        })),
      }),
    );
  }

  @Post("delivery-notes/:id/post")
  @RequirePermissions("sales.deliveries.create")
  postDelivery(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.deliveries.post(id, identity.userId));
  }

  @Post("delivery-notes/:id/convert-to-invoice")
  @RequirePermissions("sales.invoices.create")
  convertDelivery(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = z
      .object({
        dueDate: DATE.nullable().optional(),
        taxCodeId: UUID.nullable().optional(),
        note: z.string().min(1).max(500).nullable().optional(),
      })
      .parse(body ?? {});
    return envelope(
      this.invoices.createFromDelivery({
        deliveryId: id,
        dueDate: input.dueDate ?? null,
        taxCodeId: input.taxCodeId ?? null,
        note: input.note ?? null,
        actorId: identity.userId,
      }),
    );
  }

  @Post("delivery-notes/:id/cancel")
  @RequirePermissions("sales.deliveries.create")
  cancelDelivery(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const { reason } = reasonSchema.parse(body);
    return envelope(this.deliveries.cancel(id, reason, identity.userId));
  }

  // -- sales invoices (G-01/G-02/G-03; BR-001) --------------------------------------

  @Get("sales-invoices")
  @RequirePermissions("sales.invoices.view")
  listInvoices(
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
    @Query("orderId") orderId?: string,
    @Query("kind") kind?: string,
    @Query("limit") limit?: string,
  ) {
    return envelope(
      this.invoices.list({
        status,
        customerId,
        orderId,
        kind,
        limit: z.coerce.number().int().min(1).max(500).parse(limit ?? 100),
      }),
    );
  }

  @Get("sales-invoices/:id")
  @RequirePermissions("sales.invoices.view")
  getInvoice(@Param("id") id: string) {
    return envelope(this.invoices.findWithLines(id));
  }

  @Post("sales-invoices")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("sales.invoices.create")
  createInvoice(@Req() request: Request, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = createInvoiceSchema.parse(body);
    return envelope(
      this.invoices.create({
        ...input,
        salesRepId: input.salesRepId ?? null,
        dueDate: input.dueDate ?? null,
        exchangeRate: input.exchangeRate ?? null,
        orderId: input.orderId ?? null,
        deliveryId: input.deliveryId ?? null,
        warehouseId: input.warehouseId ?? null,
        cashAccountId: input.cashAccountId ?? null,
        insured: input.insured ?? false,
        claimRef: input.claimRef ?? null,
        note: input.note ?? null,
        noteAr: input.noteAr ?? null,
        actorId: identity.userId,
        lines: input.lines.map((line) => ({
          itemId: line.itemId ?? null,
          accountId: line.accountId ?? null,
          deliveryLineId: line.deliveryLineId ?? null,
          description: line.description ?? null,
          descriptionAr: line.descriptionAr ?? null,
          qty: line.qty,
          unitPrice: line.unitPrice,
          discountAmount: line.discountAmount ?? null,
          taxCodeId: line.taxCodeId ?? null,
          batchId: line.batchId ?? null,
          serialIds: line.serialIds ?? null,
          note: line.note ?? null,
        })),
      }),
    );
  }

  @Post("sales-invoices/:id/submit")
  @RequirePermissions("sales.invoices.create")
  submitInvoice(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.invoices.submit(id, identity.userId));
  }

  @Post("sales-invoices/:id/approve")
  @RequirePermissions("sales.invoices.approve")
  approveInvoice(
    @Req() request: Request,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const identity = requireIdentity(request);
    const { override } = z.object({ override: z.boolean().optional() }).parse(body ?? {});
    // The risky override key is verified HERE (the route permission alone
    // is not enough — sales.credit_check.override is the audited gate).
    const allowed = override === true && identity.permissions?.has("sales.credit_check.override") === true;
    return envelope(this.invoices.approve(id, identity.userId, allowed));
  }

  @Post("sales-invoices/:id/post")
  @RequirePermissions("sales.invoices.post")
  postInvoice(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.invoices.post(id, identity.userId));
  }

  @Post("sales-invoices/:id/cancel")
  @RequirePermissions("sales.invoices.create")
  cancelInvoice(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const { reason } = reasonSchema.parse(body);
    return envelope(this.invoices.cancel(id, reason, identity.userId));
  }

  // -- PHASE-036 productivity surfaces (bulk / export / copy-to-new) ------------------

  /**
   * PHASE-036 T36-4 (FD-01): bulk approve/post/void over the EXISTING
   * lifecycle service — the per-row report envelope is the contract
   * (partial failure reported, never silent; re-runs idempotent per row).
   * The route permission is sales.invoices.create (the void-level key);
   * approve/post re-check their own keys per ACTION (a stronger rule than
   * the registry row — matrix §3.16 note).
   */
  @Post("sales-invoices/bulk")
  @RequirePermissions("sales.invoices.create")
  @RequireFeature("platform.bulk_actions")
  async bulkInvoices(@Req() request: Request, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = bulkActionRequestSchema.parse(body);
    const actionPermissions: Record<string, string> = {
      approve: "sales.invoices.approve",
      post: "sales.invoices.post",
      void: "sales.invoices.create",
    };
    const required = actionPermissions[input.action];
    if (required === undefined || identity.permissions?.has(required) !== true) {
      throw new ForbiddenError(required ?? `sales.invoices.${input.action}`);
    }
    return envelope(
      await executeBulk(input.action, input.ids, ({ id }) => {
        if (input.action === "approve") {
          // Bulk approve never carries the credit-check override — the
          // override stays single-row, audited, by design.
          return this.invoices.approve(id, identity.userId, false);
        }
        if (input.action === "post") {
          return this.invoices.post(id, identity.userId);
        }
        return this.invoices.cancel(id, "BULK_VOID", identity.userId);
      }),
    );
  }

  /**
   * PHASE-036 T36-5 (FD-04): the sales-invoice list export (csv/xlsx,
   * server-side, honoring the current filters + visible columns — never a
   * client-side grid dump). E-04: the export itself is audited.
   */
  @Get("sales-invoices/export")
  @RequirePermissions("sales.invoices.view")
  @RequireFeature("platform.list_export")
  async exportInvoices(
    @Req() request: Request,
    @Res() response: Response,
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
    @Query("kind") kind?: string,
    @Query("format") format?: string,
    @Query("columns") columns?: string,
  ) {
    requireIdentity(request);
    const rows = await this.invoices.list({ status, customerId, kind, limit: 2000 });
    const allColumns: ExportColumn[] = [
      { key: "invoiceNo", header: "Invoice No" },
      { key: "invoiceDate", header: "Date" },
      { key: "dueDate", header: "Due" },
      { key: "customerId", header: "Customer" },
      { key: "kind", header: "Kind" },
      { key: "currencyCode", header: "Currency" },
      { key: "totalNet", header: "Net" },
      { key: "totalTax", header: "Tax" },
      { key: "totalGross", header: "Gross" },
      { key: "status", header: "Status" },
    ];
    const selected = (columns ?? "")
      .split(",")
      .map((column) => column.trim())
      .filter((column) => column.length > 0);
    const exportColumns = selected.length > 0
      ? allColumns.filter((column) => selected.includes(column.key))
      : allColumns;
    const sheet = {
      name: "sales-invoices",
      columns: exportColumns,
      rows: rows.map((row) => ({
        invoiceNo: cell(row.invoiceNo),
        invoiceDate: cell(row.invoiceDate),
        dueDate: cell(row.dueDate),
        customerId: cell(row.customerId),
        kind: cell(row.kind),
        currencyCode: cell(row.currencyCode),
        totalNet: cell(row.totalNet),
        totalTax: cell(row.totalTax),
        totalGross: cell(row.totalGross),
        status: cell(row.status),
      })),
    };
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "xlsx") {
      const buffer = await toXlsx([sheet]);
      response.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      response.header("Content-Disposition", `attachment; filename="sales-invoices-${stamp}.xlsx"`);
      response.status(200).send(buffer);
    } else {
      response.header("Content-Type", "text/csv; charset=utf-8");
      response.header("Content-Disposition", `attachment; filename="sales-invoices-${stamp}.csv"`);
      response.status(200).send(toCsv(sheet));
    }
  }

  /**
   * PHASE-036 T36-6 (FD-08): copy-to-new — the invoice's header + lines
   * copied as a fresh DRAFT (never a posted doc; the draft-lifecycle rule).
   * The copy re-prices nothing: lines carry their stored prices; the new
   * document enters the ordinary DRAFT → submit → approve → post chain.
   */
  @Post("sales-invoices/:id/copy-to-new")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("sales.invoices.create")
  async copyInvoiceToNew(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    const source = await this.invoices.findWithLines(id);
    const created = await this.invoices.create({
      branchId: source.branchId,
      customerId: source.customerId,
      salesRepId: source.salesRepId,
      kind: source.kind === "CASH" ? "CASH" : "CREDIT",
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: source.dueDate,
      currencyCode: source.currencyCode,
      exchangeRate: source.exchangeRate,
      // The copy NEVER inherits the delivery/order linkage — a copied
      // document references fresh business state or none (recorded §2).
      orderId: null,
      deliveryId: null,
      warehouseId: source.warehouseId,
      cashAccountId: source.cashAccountId,
      note: source.note,
      noteAr: source.noteAr,
      actorId: identity.userId,
      lines: source.lines.map((line) => ({
        itemId: line.itemId,
        accountId: line.accountId,
        deliveryLineId: null,
        description: line.description,
        descriptionAr: line.descriptionAr,
        qty: line.qty,
        unitPrice: line.unitPrice,
        discountAmount: line.discountAmount,
        taxCodeId: line.taxCodeId,
        batchId: line.batchId,
        serialIds: null,
        note: line.note,
      })),
    });
    return envelope(created);
  }

  // -- credit notes (BR-004; G-04/W-3) ------------------------------------------------

  @Get("credit-notes")
  @RequirePermissions("sales.credit_notes.view")
  listNotes(
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
    @Query("invoiceId") invoiceId?: string,
    @Query("limit") limit?: string,
  ) {
    return envelope(
      this.notes.list({
        status,
        customerId,
        invoiceId,
        limit: z.coerce.number().int().min(1).max(500).parse(limit ?? 100),
      }),
    );
  }

  @Get("credit-notes/:id")
  @RequirePermissions("sales.credit_notes.view")
  getNote(@Param("id") id: string) {
    return envelope(this.notes.findWithLines(id));
  }

  @Post("credit-notes")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("sales.credit_notes.create")
  createNote(@Req() request: Request, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = createCreditSchema.parse(body);
    return envelope(
      this.notes.create({
        ...input,
        salesRepId: input.salesRepId ?? null,
        note: input.note ?? null,
        noteAr: input.noteAr ?? null,
        actorId: identity.userId,
        lines: input.lines.map((line) => ({
          invoiceLineId: line.invoiceLineId,
          qty: line.qty,
          unitPrice: line.unitPrice ?? null,
          discountAmount: line.discountAmount ?? null,
          taxCodeId: line.taxCodeId ?? null,
          returnToStock: line.returnToStock ?? false,
          batchId: line.batchId ?? null,
          serialIds: line.serialIds ?? null,
          description: line.description ?? null,
          descriptionAr: line.descriptionAr ?? null,
          note: line.note ?? null,
        })),
      }),
    );
  }

  @Post("credit-notes/:id/submit")
  @RequirePermissions("sales.credit_notes.create")
  submitNote(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.notes.submit(id, identity.userId));
  }

  @Post("credit-notes/:id/approve")
  @RequirePermissions("sales.credit_notes.approve")
  approveNote(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.notes.approve(id, identity.userId));
  }

  @Post("credit-notes/:id/post")
  @RequirePermissions("sales.credit_notes.post")
  postNote(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.notes.post(id, identity.userId));
  }

  @Post("credit-notes/:id/cancel")
  @RequirePermissions("sales.credit_notes.create")
  cancelNote(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const { reason } = reasonSchema.parse(body);
    return envelope(this.notes.cancel(id, reason, identity.userId));
  }

  // -- AR views (aging/statements/open items; RC-10/INV-009) --------------------------

  @Get("ar/aging")
  @RequirePermissions("sales.invoices.view")
  arAging(@Query("asOf") asOf?: string, @Query("customerId") customerId?: string) {
    const date = asOf ?? new Date().toISOString().slice(0, 10);
    return envelope(this.arQueries.aging({ asOf: date, customerId }));
  }

  @Get("ar/statements/:customerId")
  @RequirePermissions("partners.statements.view")
  arStatement(@Param("customerId") customerId: string, @Query("asOf") asOf?: string) {
    const date = asOf ?? new Date().toISOString().slice(0, 10);
    return envelope(this.arQueries.statement({ customerId, asOf: date }));
  }

  @Get("ar/open-items")
  @RequirePermissions("sales.receipts.view")
  arOpenItems(@Query("customerId") customerId?: string, @Query("limit") limit?: string) {
    return envelope(
      this.arQueries.openItems({
        customerId,
        limit: z.coerce.number().int().min(1).max(500).parse(limit ?? 200),
      }),
    );
  }

  @Get("ar/opening-verification")
  @RequirePermissions("sales.invoices.view")
  arOpeningVerification(@Query("asOf") asOf?: string) {
    const date = asOf ?? new Date().toISOString().slice(0, 10);
    return envelope(this.arQueries.verifyInv009({ asOf: date }));
  }

  @Get("ar/allocations")
  @RequirePermissions("sales.receipts.view")
  arAllocations(
    @Query("receiptId") receiptId?: string,
    @Query("customerId") customerId?: string,
    @Query("limit") limit?: string,
  ) {
    return envelope(
      this.reallocations.list({
        receiptId,
        customerId,
        limit: z.coerce.number().int().min(1).max(500).parse(limit ?? 100),
      }),
    );
  }

  @Post("receipts/:id/reallocate")
  @RequirePermissions("sales.receipts.approve")
  reallocateReceipt(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = reallocationSchema.parse({ ...(body as object), receiptId: id });
    return envelope(
      this.reallocations.execute({
        receiptId: input.receiptId,
        reason: input.reason,
        actorId: identity.userId,
        lines: input.lines.map((line) => ({
          fromOpenItemId: line.fromOpenItemId ?? null,
          toOpenItemId: line.toOpenItemId ?? null,
          amount: line.amount,
        })),
      }),
    );
  }

  @Get("receipts/:id/reallocations")
  @RequirePermissions("sales.receipts.view")
  receiptReallocations(@Param("id") id: string, @Query("limit") limit?: string) {
    return envelope(
      this.reallocations.list({
        receiptId: id,
        limit: z.coerce.number().int().min(1).max(500).parse(limit ?? 100),
      }),
    );
  }

  // -- credit check (BR-001 published preview) -----------------------------------------

  @Post("partners/:id/credit-check")
  @RequirePermissions("sales.invoices.view")
  creditCheck(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    requireIdentity(request);
    const input = creditCheckSchema.parse(body ?? {});
    return envelope(
      creditCheckPreview({ customerId: id, documentAmountBase: input.documentAmount ?? "0.0000" }),
    );
  }

  // -- sales reps (T12) ------------------------------------------------------------------

  @Get("reps")
  @RequirePermissions("sales.reps.manage")
  listReps(@Query("status") status?: string, @Query("limit") limit?: string) {
    return envelope(
      this.reps.list({
        status,
        limit: z.coerce.number().int().min(1).max(500).parse(limit ?? 100),
      }),
    );
  }

  @Post("reps")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("sales.reps.manage")
  createRep(@Req() request: Request, @Body() body: unknown) {
    const identity = requireIdentity(request);
    const input = z
      .object({
        code: z.string().min(1).max(40),
        name: z.string().min(1).max(200),
        nameAr: z.string().min(1).max(200).nullable().optional(),
        email: z.string().min(3).max(254).nullable().optional(),
        phone: z.string().min(3).max(40).nullable().optional(),
        note: z.string().min(1).max(500).nullable().optional(),
        noteAr: z.string().min(1).max(500).nullable().optional(),
      })
      .parse(body);
    return envelope(
      this.reps.create({
        ...input,
        nameAr: input.nameAr ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        note: input.note ?? null,
        noteAr: input.noteAr ?? null,
        actorId: identity.userId,
      }),
    );
  }

  @Post("reps/:id/activate")
  @RequirePermissions("sales.reps.manage")
  activateRep(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.reps.activate(id, identity.userId));
  }

  @Post("reps/:id/deactivate")
  @RequirePermissions("sales.reps.manage")
  deactivateRep(@Req() request: Request, @Param("id") id: string) {
    const identity = requireIdentity(request);
    return envelope(this.reps.deactivate(id, identity.userId));
  }

  // -- jobs (§2.9) ------------------------------------------------------------------------

  @Post("jobs/invoice-overdue/run-scan")
  @RequirePermissions("sales.invoices.view")
  runOverdueScan(@Req() request: Request) {
    const identity = requireIdentity(request);
    return envelope(
      this.overdue.runOverdueScan({ runMode: "ON_DEMAND", checkedBy: identity.userId }),
    );
  }
}

/**
 * The partners-route credit-check surface (PHASE-012 §4): the published
 * service consumed at invoice approval — mounted at the exact spec path
 * `POST /api/v1/partners/partners/{id}/credit-check` (the sales controller
 * keeps its own preview mirror under /api/v1/sales/partners/:id).
 */
@Controller("/api/v1/partners/partners")
export class PartnerCreditCheckController {
  @Post(":id/credit-check")
  @RequirePermissions("sales.invoices.view")
  creditCheck(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
    requireIdentity(request);
    const input = z.object({ documentAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional() }).parse(body ?? {});
    return envelope(
      creditCheckPreview({ customerId: id, documentAmountBase: input.documentAmount ?? "0.0000" }),
    );
  }
}
