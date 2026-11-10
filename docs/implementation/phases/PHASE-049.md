# PHASE-049 — Foreign Trade & Logistics (التجارة الخارجية واللوجستيات)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W5, tier P3) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §14 (L-01…L-14) + §2 (H-08) + §4 (S-13) + §26 (IN-09) ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE049.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-049
- **Title:** Foreign Trade & Logistics (التجارة الخارجية واللوجستيات)
- **Objective:** close the external evaluation's worst-scored axis — التجارة الخارجية at
  **10% ("شبه غائب تماماً")**, with the code proof `letter_of_credit = 0 · incoterm = 0 ·
  bill_of_lading = 0 · hs_code = 0` (H-08). This phase delivers the importer/exporter
  backbone: **(1)** the Incoterms registry feeding landed-cost cost-responsibility;
  **(2)** the import cluster — shipments → customs declarations (HS-coded lines,
  customs value, frozen FX snapshot) → duties/import-VAT computed into the
  **existing** landed-cost engine; **(3)** letters of credit with amendment history
  and bank-charge capture; **(4)** documentary collections (D/P + D/A) on the notes
  module's PDC cycle; **(5)** origin/conformity certificates printed through 038;
  **(6)** shipment tracking — the ShippingPort reserved in PHASE-023 gets its first
  real read-model + FakeCarrier (live carrier APIs stay port-gated); and **(7)** the
  export flow with multi-modal (sea/air/land) as a data dimension.
- **Business value:** an importer or exporter in Yemen or the GCC can run LC-backed
  purchases, clear customs with HS-classified declarations whose duty lines land in
  real landed cost, and give customers a tracking status — the operations the
  evaluation called "العمليات الأساسية غير مدعومة" for this whole segment. The
  foreign-trade axis moves from 10% toward the L4 core band.
- **Tier / effort:** P3 · ~5 weeks single-stream (migration + contracts + api unit
  suite + web screens + docs + completion report).
- **Source gaps closed:** H-08, L-01…L-12, S-13, IN-09 (port shape only — live
  carrier APIs remain behind the PHASE-023 no-fabrication gate; see §2 item 6).
  L-13 lands inside the same export cluster as the multi-modal dimension; the L-12
  close is the **duty-data prerequisite** — the drawback recovery workflow and L-14
  bonded-warehouse status stay behind decision records (§2 item 8), never silently
  claimed.

## 2. Scope

In scope:

1. **Incoterms registry (L-03):** `incoterms` dictionary (EXW/FCA/FOB/CFR/CIF/DAP/DDP…,
   AR/EN labels per the bilingual dictionary convention) + `incoterm` column on POs
   and import orders; each term carries cost-responsibility metadata (who bears
   freight/insurance/duty at which leg) that the landed-cost allocation reads when
   proposing which cost lines belong to the importer.
2. **Import orders cluster (L-04…L-08):**
   - `import_shipments`: supplier/PO linkage, bill-of-lading or AWB references (L-04),
     packing-list summary (L-05), container/MSD details, vessel/flight, ports,
     ETA/ATA, incoterm.
   - `customs_declarations` + lines: declaration number, broker, customs value, and a
     **frozen exchange-rate snapshot** (NUMERIC(19,4) per ADR-0009 — immutable
     evidence, never re-floated); lines reference PO lines and carry the item
     `hs_code` (L-07 — the additive `items.hs_code` column, partial index).
   - Duties and import taxes (L-08) become additional cost lines in the **existing
     landed-cost allocation** (customs-duty + VAT-on-imports with reverse-charge
     handling). Rates resolve through the tax engine's jurisdiction packs —
     unverified rates keep the `REQUIRES_VERIFICATION` posture verbatim; this phase
     never guesses a customs or reverse-charge rate.
3. **Letters of credit (L-01/H-08):** `letters_of_credit` — issuing/advising/negotiating
   bank parties resolved to treasury accounts (the account-level bank fields are 050's
   T-04 columns; if 049 executes first its migration carries them as the
   prerequisite-lite — they land exactly once, guarded `ADD COLUMN IF NOT EXISTS`),
   amount + tolerance, latest shipment date, expiry, document-requirements checklist;
   state machine ISSUED → AMENDED → UTILIZED → SETTLED with full amendment history
   (`lc_amendments`); bank charges post as treasury bank-charge lines through the
   engine (never a direct journal write — the frozen-core rule).
4. **Documentary collection (L-02):** `documentary_collections` — D/P (documents
   against payment) and D/A (documents against acceptance), documents checklist, and
   maturity tied to the **notes module's existing PDC cycle** (acceptance creates a
   notes-payable row; the 11-service notes machinery — deposit/discount/dishonor —
   applies unchanged).
5. **Certificates (L-09/L-10):** `shipment_certificates` — certificate of origin and
   conformity certificates per shipment with chamber/commercial marks data; printing
   through the 038 template engine (A4 document family), batch printing included.
6. **Shipment tracking (L-11/S-13/IN-09):** `shipment_events` timeline (manual events
   always; carrier events through the **ShippingPort** reserved in PHASE-023 — its
   first real read-model + a `FakeCarrier` adapter). Live carrier APIs
   (Aramex/SMSA/DHL/Naqel/Bosta) stay **port-gated** behind GATE-1 published API
   terms · GATE-2 sandbox credentials · GATE-3 sample-payload verification · GATE-4
   legal review — the zatca-stub refuse-to-submit pattern, restated for carriers.
   Tracking number lands on sales delivery notes and invoices; customer-facing
   tracking status renders from the event timeline.
7. **Export flow (L-13):** `export_declarations` + export invoices with origin
   certificates; transport mode (sea/air/land) is a data dimension on both import and
   export shipments — multi-modal support means the dimension and its per-mode field
   set, not a booking engine.
8. **Decision-gated candidates (recorded, not auto-scheduled):** duty drawback (L-12
   recovery workflow — the duty-data prerequisite ships above) and bonded warehouse
   (L-14 — a stock-status family that must reconcile with 043's quarantine bins).
   Both require a decision record before implementation; the candidates and their
   data prerequisites are recorded honestly.

Out of scope (explicit):

- **Live carrier integration** — port + FakeCarrier only; the live adapters are
  decision-gated behind the four named gates (§2 item 6).
- **Customs-portal submission of any kind** — external portals are never fabricated;
  declarations are internal legal documents until an authority integration is
  ordered by decision record (compliance DR discipline).
- **Duty drawback workflow, bonded warehouse (§2 item 8), trade financing beyond
  LC/collection** (bank guarantees are 050's T-03; FX hedging is S-19, unassigned).
- **Any new posting path outside the existing landed-cost + notes + treasury engines**
  — the accounting core stays frozen (INV-029, §4).

## 3. Prerequisites

- **PHASE-041** (procurement & sourcing) — import orders hang off the purchasing
  wave's PO depth; **PHASE-038** — certificate and customs-document printing.
- **PHASE-023 pattern** — the ShippingPort reservation and the port + fake-adapter +
  honest-gate discipline instantiated here for carriers; **notes module** (PDC cycle)
  for collection maturity; **tax jurisdiction packs** for reverse-charge verification.
- **Binding decisions:** ADR-0009 (money = NUMERIC(19,4)/decimal.js), the frozen
  accounting core (register §O safeguards), register §3.4 (no-fabrication rule).
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) (new
  `trade.*` family rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [DATA_DICTIONARY.md](../../database/DATA_DICTIONARY.md) (new types/enums),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) (trade group),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [JOURNAL_RULES.md](../../accounting/JOURNAL_RULES.md) (G-35/G-36 candidates).

## 4. Design Impact

- **Database:** one additive migration `0068_foreign_trade.sql` (schema_version 68):
  `incoterms`, `import_shipments`, `customs_declarations` (+ lines),
  `letters_of_credit`, `lc_amendments`, `documentary_collections`,
  `shipment_certificates`, `shipment_events`, `export_declarations` (+ lines) — all
  tenant-owned + RLS macro + UUIDv7 + append-only grants per the repo convention;
  additive columns `purchase_orders.incoterm`, `sales_invoices.tracking_no`,
  `delivery_notes.tracking_no`, `items.hs_code` (partial index); the 050-lite bank
  columns on treasury accounts if 050 has not shipped (§2 item 3). Journal → **68
  entries**.
- **New invariant (INV-029 candidate):** *trade documents never post directly* — LC,
  collection, shipment, and declaration rows are metadata; every financial effect
  flows exclusively through the existing landed-cost allocation, notes, and treasury
  bank-charge engines. Machine-checked by a contracts test over the posting-engine
  DTO surface (the INV-027 forbidden-property stem pattern).
- **Goldens (G-35, G-36 candidates — continuing the G-33+ program sequence from
  G-32; numbers re-pinned at execution):** **G-35** customs-duty landed-cost posting
  (duty allocates into item cost via the existing engine) and **G-36** LC
  bank-charge posting (DR `BANK_CHARGES` · CR bank — mirroring the G-26 fee leg).
- **Feature keys (projection):** `trade.incoterms`, `trade.import_shipments`,
  `trade.customs_declarations`, `trade.letters_of_credit`,
  `trade.documentary_collections`, `trade.shipment_certificates`,
  `trade.shipment_tracking`, `trade.export_documents` — +8 keys (projection ≈277
  program total at this phase; the delta is the binding figure, the running total is
  re-pinned at execution). Plan grants: business + enterprise (tier-4 posture).
- **Permissions (projection):** `trade.imports.manage`, `trade.customs.manage`,
  `trade.lc.manage`, `trade.collections.manage`, `trade.certificates.manage`,
  `trade.shipments.manage`, `trade.exports.manage`, `trade.tracking.view` — +8 keys,
  a named bump (projection ≈331; re-pinned consciously at delivery).
- **API:** a new `apps/api/src/modules/trade/**` module per boundaries — additive
  routes only (shipments, declarations, LC, collections, certificates, tracking
  events); duty computation calls the existing landed-cost service (no duplicated
  costing logic); Idempotency-Key per API_CONVENTIONS §6 on state transitions.
- **Web:** import-console workspace (the shipment → declaration → landed cost →
  invoices chain on one screen), LC register with amendment history, shipment
  tracker timeline, certificate print dialogs — on the @erp/ui archetypes; i18n
  +~170 keys (AR/EN parity from day one, the triple-parity rule).
- **Docs:** FEATURE_CATALOG (+8), ENTITY_CATALOG (+9 entities + 4 additive columns —
  counts re-pinned at execution), DATA_DICTIONARY, NAVIGATION_MODEL (trade group),
  AUTHORIZATION_MATRIX (+8), IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T49-A | Migration 0068: the 9 trade tables + additive columns + RLS + grants + the tracking-visibility and duty-tolerance SETTINGS seeds | `apps/api/migrations/0068_foreign_trade.sql`, `meta/_journal.json` | migrations.spec journal 68 entries; RLS battery picks up the new tables |
| T49-B | Contracts: incoterm/shipment/declaration/LC/collection/certificate/event DTOs + the INV-029 forbidden-surface test | `packages/contracts/src/trade/**` (+ index exports) | contracts suite green (the 56-baseline grows; re-pinned at delivery) |
| T49-C | Incoterms registry + PO/import-order incoterm metadata + cost-responsibility mapping consumed by the landed-cost proposal | `apps/api/src/modules/trade/**`, `apps/api/src/modules/purchasing/**` | unit: each incoterm's cost-responsibility flags produce the correct allocation-proposal line set |
| T49-D | Import shipments + customs declarations (HS lines, frozen FX snapshot) + duty/import-VAT lines into the EXISTING landed-cost allocation + goldens G-35/G-36 | `apps/api/src/modules/trade/**`, landed-cost service extension | golden runs (customs-duty allocation; reverse-charge line flagged REQUIRES_VERIFICATION where the pack is unverified); FX snapshot immutability test |
| T49-E | Letters of credit: full state machine + amendment history + document checklist + bank-charge capture through treasury; documentary collections D/P + D/A with notes-module maturity tie | `apps/api/src/modules/trade/**`, `apps/api/src/modules/notes/**` | unit: ISSUED→AMENDED→UTILIZED→SETTLED transitions; G-36 golden; D/A acceptance creates the note and reuses the PDC services unchanged |
| T49-F | Certificates registry (origin + conformity) + 038 template printing + chamber/commercial marks data | `apps/api/src/modules/trade/**`, template payloads | print payload shape assertions; bilingual template render smoke |
| T49-G | Shipment tracking: `shipment_events` timeline + ShippingPort read-model + FakeCarrier adapter (port-gated; live adapters refuse without GATE-1..4) + tracking number on delivery notes/invoices + customer-facing status | `apps/api/src/modules/trade/adapters/**`, `apps/api/src/modules/sales/**` | unit: FakeCarrier event ingestion; adapter refuses real submission without gates (asserted, the zatca-stub pattern); tracking status renders from events |
| T49-H | Export flow: export declarations + export invoices with origin-cert linkage + multi-modal dimension on both directions | `apps/api/src/modules/trade/**` | unit: export chain integrity; mode dimension validated |
| T49-I | Web: import console, LC register, shipment tracker, certificate print + i18n | `apps/web/**`, `packages/ui/**` | web typecheck; browser smoke of the import chain |
| T49-J | Docs sync: catalogs, matrix, dictionary, nav, status, changelog | `docs/**` | `docs:validate` green (validator v3.0: phase range 001–058, 58 phase docs) |

## 6. Verification

- Contracts suite green (new DTOs + the INV-029 forbidden-surface test).
- API unit suite green (the 479-test baseline grows with the trade module's specs;
  count re-pinned at delivery).
- `migrations.spec.ts`: journal 68 entries, manifest consistency.
- Permissions drift: projected 331 = 331 (re-pinned consciously — a named bump,
  recorded in the completion report).
- i18n parity ar=en (triple parity: TS types + runtime + CI script).
- Golden effective-configs: this phase seeds SETTINGS keys ⇒ **all pins recomputed**
  with the old→new table recorded (the §18 lesson-5 relay); goldens G-35/G-36 land
  in JOURNAL_RULES with engine-run evidence.
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: incoterm → import shipment (B/L refs) → customs declaration (HS
  lines, frozen FX) → landed cost with duty + reverse-charge lines → LC amend +
  settle with a bank charge → FakeCarrier tracking timeline → origin-certificate
  print → export declaration.

## 7. Risks and Constraints

- **Rate honesty (the dominant risk):** customs-duty and import-VAT reverse-charge
  rates are jurisdiction data this repo refuses to guess. Unverified rates surface as
  `REQUIRES_VERIFICATION` exactly like the ten VAT packs; the declaration UI states
  what is unverified. A fabricated rate would be a compliance lie, not a feature.
- **Carrier no-fabrication:** the FakeCarrier adapter is the only shipped adapter;
  real carriers require the four named gates and stay decision-gated. The tracking
  read-model is designed so a live adapter changes transport, not schema.
- **Frozen FX + landed-cost coupling:** the declaration rate is evidence (re-valuation
  of open items is 050's A-03 engine, never a silent re-float); duty lines allocate
  through the existing engine with zero changes to its mathematics (the INV-022
  principle — configuration selects, never alters, accounting).
- **050 column adjacency:** the bank-field columns land exactly once (first executor
  carries them; the other phase's migration is guarded) — both phase docs record the
  shared handoff so the journal never double-adds.

## 8. Completion and Handoff

- Completion report `reports/PHASE-049-COMPLETION.md` with the verification table
  (suites, drift numbers, golden re-pin table, i18n count, browser evidence) + honest
  deferrals (L-12 recovery and L-14 stay recorded as open candidates, not closed).
- Handoff obligations: ShippingPort/FakeCarrier is the mandated pattern for later
  carrier adapters; shipment events feed 052's webhook catalog; the certificate
  pattern templates 054's COA/COC; `items.hs_code` is the duty-automation substrate.
- Next eligible: the register's W5 siblings — **PHASE-054** (QMS, after 044) and
  **PHASE-055** (CMMS) — or any not-yet-executed earlier wave per the owner's order
  (W5 pulls forward only via decision record, register §3.2). W5's gate:
  "differentiated, not just complete".
