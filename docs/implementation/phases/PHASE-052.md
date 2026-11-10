# PHASE-052 — Integration Fabric: API Keys, Webhooks & Notifications (نسيج التكامل: المفاتيح والويبهوك والإشعارات)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W4, tier P1) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §17 (N-06…N-08, N-11, N-12, N-19, N-21) + §26
> (IN-02, IN-03, IN-09, IN-13…IN-15, IN-19…IN-21) + §2 (H-21, H-22) + §16 (W-12) +
> §27 (TB-05) + §20 (UX-07) + the evaluation's F-9 surface ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE052.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-052
- **Title:** Integration Fabric: API Keys, Webhooks & Notifications (نسيج التكامل:
  المفاتيح والويبهوك والإشعارات)
- **Objective:** attack the platform's weakest axis — التكاملات at **22%**
  ("أضعف محور") — with the fabric every later integration hangs on (`api_key = 0 ·
  webhook_out = 0`). This phase delivers **(1)** API keys (H-21/IN-20) — hashed
  secrets, scopes, rate limits, rotation, per-use audit; **(2)** generated OpenAPI
  docs (N-21/IN-19) from the route-permissions registry; **(3)** outbound webhooks
  (N-11/W-12/IN-21) with retry ladder + dead-letter; **(4)** the communication ports
  the Arab market runs on — WhatsApp Business (IN-13/H-22), SMS (IN-14/N-07),
  multi-provider mail (N-08/IN-15) — each **port + fake adapter + honest credential
  gate**, never a fabricated send; **(5)** payment-link providers (IN-02/IN-03) as a
  gated port + the F-9 payout reconciliation console; **(6)** realtime notifications
  over SSE (TB-05/UX-07); **(7)** label/peripheral notes over WebUSB/WebSerial
  (N-19/IN-12); and **(8)** iPaaS readiness (N-12/IN-22) as documented contracts.
- **Business value:** technical customers stop hitting a wall ("لا يمكن ربط النظام
  بأي شيء خارجي برمجياً" — H-21); WhatsApp/SMS notification channels make the
  product feel native in a market where "WhatsApp = قناة العمل الأساسية"; and the
  integrations axis starts its climb from 22% with fabric rather than one-off
  adapters.
- **Tier / effort:** P1 · ~5 weeks single-stream (migration + contracts + api unit
  suite + web screens + docs + completion report).
- **Source gaps closed:** H-21, H-22, H-09 (the payout-reconciliation surface note —
  the production cutover stays DR-002-gated), F-9 (the implementation over the
  existing payout tables; 037 shipped the DEFERRED record, this ships the code per
  the register footnote), N-06…N-08, N-11, N-12, N-19, N-21, IN-02, IN-03, IN-09
  (gated carrier-adapter shapes — 049's ShippingPort gains live-shaped siblings,
  still gated), IN-13…IN-15, IN-19…IN-21, TB-05, UX-07, W-12.

## 2. Scope

In scope:

1. **API keys (H-21/IN-20):** `api_keys` — hashed secret (argon2id), scopes per
   module/permission-set, rate limits, last-used, expiry, optional IP allowlist. An
   **ApiKeyGuard** resolves the tenant, enforces scoped permissions (a key never
   widens beyond its owner's grants — a contracts assertion), writes a per-use audit
   row; rotation with grace period. The REST surface becomes key-accessible
   **read-mostly + a whitelisted write-endpoint set**, enumerated in the docs.
2. **OpenAPI generation (N-21/IN-19):** a generator that reads the
   **route-permissions registry** (method + path + permission already encoded — the
   drift battery's own source) and emits a versioned `openapi.json`; a public
   `/docs` explorer page; a changelog of the surface per release.
3. **Outbound webhooks (N-11/W-12/IN-21):** `webhook_endpoints` (URL, subscribed
   events, HMAC secret, active) + `webhook_deliveries` (attempt log with an
   exponential-backoff retry ladder and a dead-letter state, versioned payloads).
   Events come from the **039 workflow/event catalog** plus entity lifecycle events
   (posted/approved/voided). A test-delivery console sends a sample payload on
   demand.
4. **WhatsApp Business port (IN-13/H-22):** a `WhatsAppCloudApi` port + a
   **FakeWhatsApp** adapter; a template-message registry (invoice-share, statement,
   dunning — the 038 email-template pattern generalized); opt-in + **consent log per
   number**; sandbox refuses real sends without GATE-1 credentials · GATE-2 Meta
   sandbox evidence · GATE-3 template-approval proof · GATE-4 legal/consent review —
   refuse-to-send asserted in tests, the zatca-stub pattern restated.
5. **SMS port (IN-14/N-07):** `SmsPort` + `FakeSms` + a provider registry with
   Unifonic/Msegat/Twilio **shapes** as unverified adapters — credential-gated, no
   live send until the gates pass.
6. **Mail providers (N-08/IN-15):** `MailPort` extraction from the current single
   adapter + SendGrid/SES/Mailgun adapter **shapes** under the same gate; the
   existing mailpit dev path keeps working unchanged.
7. **Payment-link providers (IN-02/IN-03):** a PayLink-style port — invoice →
   payment link + status webhook back into payments (verified-signature consumer).
   Moyasar/HyperPay/Tap ship as gated adapter shapes; Tamara/Tabby BNPL is
   read-only (IN-04 note — display + reconcile, no financing logic). **The H-09
   production cutover stays DR-002-gated** — what ships is the link-generation port
   + fake + the F-9 **payout reconciliation console** over the existing
   `billing_payouts` tables (050's report is the accounting half, per the split).
8. **Realtime notifications (TB-05/UX-07):** an SSE channel (per-user event stream;
   the in-app notification center becomes live). **SSE over WebSocket, chosen
   deliberately:** proxy-friendly, unidirectional fits the use case, no sticky
   sessions; message types versioned like webhook payloads.
9. **Label/peripheral notes (N-19/IN-12):** label-printer and POS-peripheral
   (cash drawer, customer display, thermal printer) support via **WebUSB/WebSerial**
   browser APIs — device-shaped modules that degrade gracefully where the browser
   lacks capability; recorded as browser-capability-gated, not server features.
10. **iPaaS readiness (N-12/IN-22):** webhook payload contracts documented +
    Zapier/Make-compatible examples in the docs — documentation riding #3, no new
    code.

Out of scope (explicit):

- **Any live external send or charge:** WhatsApp/SMS/mail/payment-link live
  adapters require credentials + evidence gates; until then every adapter is a
  fake that refuses (asserted) — the no-fabrication rule, restated.
- **The production payment cutover (H-09 proper)** — DR-002 stays OPEN; this phase
  ships port + fake + console, never a live charge.
- **Commerce/marketplace integrations (IN-07/IN-08), open banking (IN-01), calendar/
  contacts sync (IN-17/IN-18), SSO (IN-28+, 056's row), OCR/AI (058's proposal).**
- **A marketplace/app platform** — standing SCOPE non-goal.
- **Any posting-capable integration:** API-key write endpoints are whitelisted
  existing services only; webhooks are outbound projections and inbound payment
  callbacks reconcile through existing services (INV-033, §4).

## 3. Prerequisites

- **PHASE-039** (workflow event catalog) — the webhook event source + notification
  rules surface (the register's listed dependency); **PHASE-036** — the list
  conventions the console reuses; **PHASE-038** — the email-template pattern the
  message-template registry generalizes.
- **049 adjacency (not a dependency):** ShippingPort/FakeCarrier is the pattern and
  event source for carrier-shaped adapters; IN-09's close here means gated adapter
  shapes + delivery events, not a live carrier.
- **Binding decisions:** product DR-002 (payment provider — OPEN, respected for the
  cutover), the no-fabrication rule (register §3.4), ADR-0002 (monorepo), the
  PHASE-024 rate-limiting conventions.
- Relevant docs: [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md) (new
  `platform.*`/`integrations.*` rows), [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) (developer console group),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [IMPLEMENTATION_STATUS.md](../../planning/IMPLEMENTATION_STATUS.md).

## 4. Design Impact

- **Database:** one additive migration `0072_integration_fabric.sql`
  (schema_version 72): `api_keys`, `webhook_endpoints`, `webhook_deliveries`
  (append-only attempt log), `message_templates` (+ channel kind),
  `channel_consents` (per-number opt-in evidence), `payment_links`. All tenant-owned
  + RLS macro + UUIDv7 + append-only grants; secrets stored hashed, never
  recoverable. Journal → **72 entries**.
- **New invariant (INV-033 candidate — re-pinned if earlier waves consumed the
  numbers):** *integration surfaces never widen authority and never post directly* —
  an API key's effective permissions ⊆ its owner's grants; webhook/SSE payloads are
  read-only projections carrying no secrets; inbound payment callbacks reconcile
  through the existing payments services only. Machine-checked by guard tests over
  the ApiKeyGuard and the payload serializer (forbidden-field stems).
- **No new goldens** — this phase posts nothing; the payment callback path reuses
  the existing payment posting services unchanged.
- **Feature keys (projection):** `platform.api_keys`, `platform.webhooks`,
  `platform.openapi_docs`, `integrations.whatsapp`, `integrations.sms`,
  `integrations.mail_providers`, `integrations.payment_links`,
  `platform.realtime_notifications` — +8 keys (projection ≈306 program total; the
  delta is the binding figure, the total re-pinned at execution). Plan grants:
  business + enterprise for keys/webhooks/openapi; integrations channels
  enterprise-tier posture.
- **Permissions (projection):** `platform.api_keys.manage`,
  `platform.webhooks.manage`, `platform.developer_console.view`,
  `integrations.channels.manage`, `integrations.payment_links.manage`,
  `notifications.preferences.manage` — +6 keys, a named bump (projection ≈355;
  re-pinned consciously at delivery).
- **API:** a new `apps/api/src/modules/integrations/**` module + an ApiKeyGuard
   middleware in the identity path; the OpenAPI generator reads the
   route-permissions registry (single source of truth — the drift battery and the
   public docs can never disagree); SSE endpoint with per-user auth; every
   state-changing endpoint Idempotency-Key per API_CONVENTIONS §6.
- **Web:** developer console (keys, webhooks, delivery log, test events),
   notification channel preferences per user (ties TB-23 — 057's row, cross-referenced
   here: the preference surface ships now, the polish lands with 057), message
   template manager. i18n +~160 keys (AR/EN parity from day one).
- **Docs:** FEATURE_CATALOG (+8), ENTITY_CATALOG (+6 entities — re-pinned),
  DATA_DICTIONARY, NAVIGATION_MODEL, AUTHORIZATION_MATRIX (+6), the API surface
  changelog convention, IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T52-A | Migration 0072: api_keys, webhook endpoints/deliveries, message templates, channel consents, payment links | `apps/api/migrations/0072_integration_fabric.sql`, `meta/_journal.json` | migrations.spec journal 72 entries; RLS battery |
| T52-B | Contracts: key/webhook/template/consent/link DTOs + INV-033 guard tests (scope narrowing, forbidden payload fields) | `packages/contracts/src/integrations/**` (+ index exports) | contracts suite green (baseline grows; re-pinned) |
| T52-C | ApiKeyGuard middleware: tenant resolution, scoped permission checks, rate limits, per-use audit, rotation with grace | `apps/api/src/modules/identity/**`, `apps/api/src/modules/integrations/**` | unit: key cannot exceed owner grants (asserted); rate-limit + last-used + audit rows; rotation grace |
| T52-D | OpenAPI generator from the route-permissions registry + `/docs` explorer + surface changelog | `apps/api/src/modules/integrations/**`, `apps/web/**` | generated spec covers the registry exactly (count + paths assertion — no drift by construction) |
| T52-E | Webhook engine: endpoint registry, event fan-out from the 039 catalog + lifecycle events, HMAC signing, retry ladder + dead-letter, test-delivery console | `apps/api/src/modules/integrations/**` | unit: signature verifies; backoff ladder + dead-letter transitions; payload version pinning |
| T52-F | Communication ports: WhatsAppCloudApi port + FakeWhatsApp (refuses without gates — asserted), SmsPort + FakeSms, MailPort extraction + provider shapes, message-template registry, consent log | `apps/api/src/modules/integrations/**`, `packages/contracts/src/integrations/**` | unit: every adapter refuses real sends without credentials (the zatca-stub pattern); consent required before any send path; template render bilingual |
| T52-G | Payment-link port + fake + status webhook consumer (signature-verified) into payments + the F-9 payout reconciliation console over `billing_payouts` | `apps/api/src/modules/integrations/**`, `apps/api/src/modules/payments/**` (existing services) | unit: link generation + callback reconciliation through existing services; DR-002 boundary asserted (no live charge path exists) |
| T52-H | Realtime SSE channel: per-user event stream, versioned message types, notification-center liveness; per-user channel preferences | `apps/api/src/modules/notifications/**`, `apps/web/**` | unit: event stream auth + isolation between users; reconnect semantics; browser smoke of live notification arrival |
| T52-I | Peripheral notes: WebUSB/WebSerial label-printer + POS-peripheral modules (degrade gracefully) + iPaaS payload-contract docs with Zapier/Make examples | `apps/web/**`, `docs/**` | capability detection tests (no-op without device); docs:validate green |
| T52-J | Web: developer console + template manager + notification preferences + i18n | `apps/web/**`, `packages/ui/**` | web typecheck; browser smoke of the console |

## 6. Verification

- Contracts suite green (new DTOs + INV-033 guard tests); API unit suite green (the
  479-test baseline grows with the integrations specs; re-pinned at delivery).
- `migrations.spec.ts`: journal 72 entries, manifest consistency.
- Permissions drift: projected 355 = 355 (re-pinned consciously — a named bump,
  recorded).
- i18n parity ar=en (triple parity).
- Golden effective-configs: this phase seeds SETTINGS keys (rate limits, retry
  posture) ⇒ **all pins recomputed** with the old→new table recorded.
- **Refusal evidence:** every gated adapter (WhatsApp/SMS/mail providers/payment
  links) demonstrably refuses without credentials — asserted in tests and shown in
  the completion report (the no-fabrication proof).
- OpenAPI spec ↔ route-permissions registry equality check (generated, never
  hand-maintained).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: API key created → read call (audit row written) → webhook test
  delivery fired → live notification over SSE → WhatsApp template through the fake
  → payment link through the fake → payout reconciliation console opened.

## 7. Risks and Constraints

- **The no-fabrication line is the product here:** the headline risk is pressure to
  "demo live WhatsApp/payments" — the gates are named, the fakes refuse, and the
  docs state the boundary in both languages; a fabricated send would poison the
  repo's documented honesty (the evaluation's "✅ 10 صدق هندسي" asset).
- **Key hygiene:** hashed-at-rest secrets, short rotation grace, per-use audit
  growth (partitioning as an ops follow-up), IP allowlist option — leaked-key blast
  radius is the design driver.
- **Webhook semantics + SSE at scale:** retries idempotent by delivery id; payloads
  are notifications, not ledgers (authoritative state is read back through the
  API); proxy buffering and connection limits documented — any future
  bidirectional need reopens the WebSocket decision by ADR, not by drift.
- **Scope creep into live integrations:** every "just one real adapter" request
  routes to a decision record + gates; the port/fake/console trio is the
  deliverable.

## 8. Completion and Handoff

- Completion report `reports/PHASE-052-COMPLETION.md` with the verification table
  (suites, drift numbers, i18n count, refusal evidence, browser evidence) + honest
  deferrals (all live adapters gated; H-09 cutover still DR-002-OPEN; IN-04 BNPL
  read-only).
- Handoff obligations: the event-catalog fan-out is the sanctioned surface for
  053's scheduled-report channels; the message-template registry is the mandated
  home for outbound copy; the OpenAPI output is the public contract every external
  consumer (and 053's BI feeds) authenticates against.
- Next eligible: **PHASE-053** (BI & scheduled reporting v2 — depends on 036+052)
  per the W4 sequence; 056 (enterprise identity) may run in parallel (‖).
