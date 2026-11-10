# PHASE-057 — UX Polish & Growth (صقل التجربة والنمو)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W5, tier P3) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §27.1/§27.2 (TB-01, TB-02, TB-04, TB-06, TB-07, TB-12,
> TB-15…TB-23, TB-28) + §20 (UX-03…UX-08, UX-12, H-23) + §28.2 (PP-13, PP-14) +
> §29.4 (DF-36, DF-37, DF-43…DF-48) ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE057.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-057
- **Title:** UX Polish & Growth (صقل التجربة والنمو)
- **Objective:** Close the **experience and commercial-motion gaps** the external
  evaluation grouped as table stakes and growth features: what any 2026 buyer
  expects unasked (dark mode, PWA shell, skeletons/empty states, real global
  search, onboarding wizard, tours, in-app help, notification preferences, daily
  digest) and the motions that turn a product into a business (referrals, partner
  program, self-serve trial, MRR/ARR/churn/health dashboard, adoption analytics,
  announcement banners, feature-request board). The evaluation's sharpest lines
  land here: TB-15 ("لا معالج تهيئة أولي — لا معالج 'أول 10 دقائق'"), TB-12 (⌘K
  searches navigation + customers/items only), and H-23 (`locales = ["ar","en"]`
  hard-coded). This phase delivers **(1)** the polish sweep over the shipped 053
  dashboard widgets (TB-04's *widgets* ship in 053 — 057 owns the polish);
  **(2)** the "first 10 minutes" wizard + tours + help center; **(3)** demo-data +
  one-click sandbox tenants for prospects (AD-36-14, riding 056's tenant kind);
  **(4)** the growth suite with a platform revenue tab on the 035 console; and
  **(5)** the **data-driven i18n loader** (H-23) — locales become registry data,
  with the honest CD-05 note that new locale *content* still requires the
  compliance-matrix rule and **no new locale ships in this phase**.
- **Business value:** trials convert (wizard + demo data + tours answer "what does
  this thing do?"), day-2 retention rises (digest, personalized home,
  preferences), and the operator finally sees revenue/health telemetry instead of
  guessing — the growth loop becomes measurable.
- **Tier / effort:** P3 · ~5 weeks single-stream (migration + contracts + api unit
  suite + web screens + docs + completion report).
- **Source gaps closed:** TB-01, TB-02, TB-04 (the polish over 053's shipped
  widgets), TB-06, TB-07, TB-12, TB-15…TB-23, TB-28, UX-03…UX-08, UX-12 (custom
  form layout — **decision-gated candidate**, §2), PP-13, PP-14, DF-36, DF-37,
  DF-43…DF-48, H-23 (the loader; no new locale content), AD-36-14 (the merged
  TB-19/TB-35/PL-08 deliverable with PHASE-056's sandbox kind).

## 2. Scope

In scope:

1. **Dark mode (TB-01):** the design-token system
   ([DESIGN_TOKENS.md](../../ui/DESIGN_TOKENS.md)) gains a **dark palette** — the
   @erp/ui tokens (the Storybook dark precedent exists; the app itself has zero
   dark usage today, per the evaluation's grep). Persisted per user; **print
   templates unaffected** (print pinned to the light/print palette — an explicit
   invariant).
2. **PWA (TB-02 / DF-13-lite):** installable manifest + a service-worker **shell**
   (offline read of cached pages; online-first). **Honest boundary:** *full*
   offline data work stays with the desktop/mobile clients (Tauri/Expo sync) —
   recorded; the web PWA is a shell, not an offline ERP.
3. **Skeletons + empty states unification (TB-06 / TB-07):** the @erp/ui archetype
   kit ships **default skeleton + guided empty states** (with create/import/sample
   actions per screen family) and the sweep applies them across screens — one
   pattern, not 143 bespoke files (today: skeleton in 2 of ~143 pages, empty
   states in 4).
4. **Global search expansion (TB-12 / UX-08):** ⌘K searches **invoices, journal
   entries, reports, settings pages** — federated per-module search endpoints with
   a rank-merge in the command palette (the palette exists; this extends its
   **providers**; partners/items quick-search joins the federation).
5. **Onboarding wizard (TB-15):** the first-login "first 10 minutes" path —
   company profile → fiscal calendar → CoA choice (template/blank/import) →
   industry template → opening-balances import (the PHASE-037 surface) → first
   invoice — with **progress persistence** (resumable; skippable, skip recorded).
6. **Product tours (TB-16):** spotlight-style guided tours on **5 key screens**
   (dashboard, sales invoice, journal, bank reconciliation, settings) —
   data-driven JSON config (AR/EN steps), no per-screen code.
7. **Help center (TB-17 / UX-03 / UX-04):** an in-app help drawer with a searchable
   AR/EN article set — the repo's docs knowledge **distilled per screen**
   (context-sensitive via the current nav item); versioned bilingual JSON curated
   from docs/ (static, honest — no generated content).
8. **Demo data + sandbox (TB-19 / TB-35 / PL-08 / AD-36-14):** a **deterministic
   demo-data loader** (the ga-fixtures pattern at tenant scale — seeded,
   reproducible volumes across partners/items/invoices/journals) + **one-click
   sandbox tenant** for prospects from the marketing page (rides PHASE-056's
   SANDBOX kind; refreshable; excluded from billing).
9. **System health + what's new (TB-21 / TB-22):** a tenant health panel (jobs
   lag, sync health, quota usage — reading existing surfaces) + an in-app
   changelog feed sourced from the release notes.
10. **Notification preferences (TB-23):** per-user, per-channel (in-app / email /
    WhatsApp / SMS — riding PHASE-052's channels), per-category preferences.
11. **Daily digest (PP-13):** the scheduled morning digest — overdue invoices, low
    stock, expiring documents, approvals waiting — via email/WhatsApp templates
    (channel ports per 052; fake adapters in tests, the no-fabrication rule).
12. **Home personalization (PP-14):** role-based **default home layouts** over the
    053 dashboard widgets + per-user switching/pinning (the 053 widget contract is
    the substrate).
13. **Custom form layout (UX-12 / FD-19) — decision-gated candidate:** a form
    designer over the PHASE-036 custom-fields substrate. **Candidate only** — its
    own decision record precedes implementation (the 036 §2 deferral pointer
    resolves here or stays deferred; nothing else depends on it).
14. **Growth suite (DF-36 / DF-37 / DF-43…DF-48):** referral program (codes applied
    at plan billing; awards on the billing plane); partner/reseller program
    (partner tenants + commission rules; **white-label from PHASE-038 powers it**);
    **self-serve trial signup** (the public register flow gains trial-plan
    self-service on the shipped 035 marketing page); **MRR/ARR/churn/health-score
    platform dashboard** (a revenue tab on the 035 console overview — a
    platform-plane reader over billing data); **feature-adoption analytics**
    (usage counters + adoption events per feature key); **in-app announcement
    banners** (admin-authored, AR/EN, targeted by segment, scheduled).
15. **Feature-request voting (TB-28):** a simple in-app "suggest a feature" +
    voting board — **tenant-scoped** (votes within the tenant; no cross-tenant
    mixing, consistent with the isolation posture).
16. **i18n loader (H-23):** dictionaries become **data-driven** — a `locales`
    registry (code, AR/EN names, RTL flag, status) + JSON dictionaries per locale,
    enabling future locales (ur, fr, …) **without code changes**. **Honest
    boundary, recorded:** new locale *content* still requires the compliance-matrix
    CD-05 rule (jurisdiction packs + marketing-claims gating); **no new locale
    content ships in this phase** — the loader is the deliverable, not a language.

Out of scope (explicit):

- **Web full offline (UX-10 / full DF-13)** — stays with the desktop/mobile
  clients; the PWA here is a shell (recorded).
- **iOS client (UX-11)** — decision-gated (DR-P25-05), untouched.
- **Custom form layout *implementation* (UX-12 / FD-19)** — decision-gated
  candidate (item 13).
- **UX-19 / UX-20 (e-signature, OCR)** — owned by the PHASE-058 proposal
  (decision-gated with it).
- **Pricing decisions (OQ-002 family)** — surfaces ship; prices/copy remain the
  owner's recorded business decision.

## 3. Prerequisites

- **PHASE-052 COMPLETE** (register dependency): notification channels
  (preferences + digest) + usage counters (adoption analytics, quotas).
- **PHASE-053 COMPLETE** (register dependency): dashboard widgets — home
  personalization's substrate; TB-04's widgets ship there, this phase polishes.
- **PHASE-035 COMPLETE** (shipped): the marketing page (sandbox/trial CTAs) + the
  platform console overview (the revenue tab extends it).
- **Soft references:** 036 custom fields (form-designer candidate), 037 imports
  (wizard step), 038 white-label (partner program), 056 sandbox kind (demo
  sandbox). Canonical wave order puts 056 (W4) before 057 (W5); if re-ordered, the
  sandbox CTA degrades to a waitlist flag until 056 ships (recorded, no hard
  failure).
- **Binding decisions:** ADR-0012 (the @erp/ui archetypes carrying the
  skeleton/empty-state/tour slots), the RTL design rules (dark palette passes the
  AR/RTL parity suites), ADR-0009 (money precision on analytics surfaces), CD-05
  (all growth/trial copy governed by the compliance-matrix rule).
- Relevant docs: [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) (§3 command
  menu providers; §9), [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [DESIGN_TOKENS.md](../../ui/DESIGN_TOKENS.md).

## 4. Design Impact

- **Database:** one additive migration `0078_ux_growth.sql` (schema_version 78 —
  the sequential program projection; journal re-anchored at execution): `locales`
  (registry), `user_preferences` (theme, home layout, wizard state — jsonb),
  `notification_preferences` (user; category; channel), `home_layouts` (role
  default / user; widget layout jsonb), `referral_codes` + `referral_awards`,
  `partner_program_accounts` (commission rules; white-label ref),
  `adoption_events` (tenant; user; feature key; action; ts),
  `announcement_banners` (segment; AR/EN; schedule), `feature_requests` +
  `feature_request_votes` (tenant-scoped, one vote per user),
  `demo_data_manifests` (loader provenance). Help articles and tour configs are
  versioned JSON assets, **not tables** (recorded). Tenant-owned + RLS macro +
  UUIDv7; platform-plane growth tables follow the existing platform-reader
  patterns.
- **Feature keys (projection):** `platform.pwa`, `platform.global_search`,
  `platform.onboarding_wizard`, `platform.product_tours`, `platform.help_center`,
  `platform.demo_data` (AD-36-14), `platform.notification_preferences`,
  `platform.daily_digest`, `platform.home_personalization`,
  `platform.feature_requests`, `growth.referrals`, `growth.partners` — **+12 keys,
  the top of the +4–12/phase band** (176 today, 182 after 036; running total
  re-anchored at execution). **No new keys** for dark mode, skeletons/empty
  states, health panel, changelog, or the i18n loader — platform-wide table
  stakes, all plans (recorded). Self-serve trial rides the existing public
  register/plans + TRIAL entitlement; the revenue tab + adoption analytics ride
  the existing platform console keys.
- **Permissions (projection):** `platform.demo_data.execute` (risky — writes demo
  rows; policy-blocked in production tenants), `platform.announcements.manage`,
  `platform.feature_requests.moderate`, `growth.partners.manage` (platform-plane),
  `growth.referrals.manage` (platform-plane), `platform.onboarding.manage`
  (restart/skip on behalf of users) — **+6 keys** (band +4–10/phase; baseline 245
  today, 248 after 036, running total re-anchored at execution) →
  **re-pinned consciously — a named bump**, recorded.
- **API:** additive routes only (search federation per module; preferences; digest
  schedule/config; wizard state; demo-data load; referral/partner surfaces;
  announcements; feature requests; adoption ingest); revenue/health reads extend
  the existing platform console aggregate.
- **Web:** the polish sweep (dark palette, skeletons, empty states), palette
  providers, wizard + tours + help drawer, preferences + digest settings,
  personalized home, feature-request board, announcement banner slot in the shell,
  the marketing page's sandbox/trial CTAs. i18n +~240 keys (AR/EN parity — the
  program's largest intake; the loader itself ships here).
- **Docs:** FEATURE_CATALOG (+12), ENTITY_CATALOG (+~12 entities), NAVIGATION_MODEL
  (§3 providers + §9 rows), AUTHORIZATION_MATRIX (+6), DATA_DICTIONARY (segment/
  channel enums), REPORT_CATALOG (revenue/adoption console views),
  IMPLEMENTATION_STATUS/CHANGELOG.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T57-A | Migration 0078: locales registry + preferences/home/notification + growth tables + RLS + grants | `apps/api/migrations/0078_ux_growth.sql`, `meta/_journal.json` | migrations.spec journal 78 entries (projection); RLS battery covers new tables |
| T57-B | Dark palette on the token system + theme persistence + print-palette invariant; skeleton/empty-state defaults in the archetype kit + sweep | `packages/ui/**`, `apps/web/**` | contrast checks (WCAG AA both palettes); print render pinned light; archetype snapshots |
| T57-C | PWA manifest + service-worker shell; ⌘K federation (per-module search endpoints + rank merge) | `apps/web/**`, `apps/api/src/modules/**` | SW cached-page read; rank-merge unit tests; settings deep links resolve |
| T57-D | Onboarding wizard (resumable) + product tours (JSON-driven, 5 screens) + help drawer (versioned AR/EN JSON, context-sensitive) | `apps/web/**`, `apps/web/src/assets/help/**` | wizard resume/skip persistence; tour i18n parity; help search + nav-context wiring |
| T57-E | Demo-data loader (deterministic, ga-fixtures pattern at tenant scale) + one-click sandbox from the marketing page (056 kind) | `apps/api/src/modules/platform/**`, `apps/web/**` | loader determinism (same seed → identical dataset); sandbox excluded from billing; AD-36-14 acceptance |
| T57-F | Notification preferences + daily digest (channel ports + fakes) + tenant health panel + changelog feed + home personalization over 053 widgets | `apps/api/src/modules/{notifications,platform}/**`, `apps/web/**` | preference matrix honored per channel; digest via fake adapters (no fabrication); layout persistence |
| T57-G | Growth suite: referrals + partner program (white-label ref) + self-serve trial + revenue tab (MRR/ARR/churn/health) + adoption events + banners + feature-request board | `apps/api/src/modules/platform/**`, `apps/web/**` | referral award math (NUMERIC, ADR-0009); platform-plane isolation (no cross-tenant reads); segment targeting; one-vote-per-user |
| T57-H | i18n loader: locales registry + JSON dictionaries + loader refactor; docs sync: catalogs, matrix, nav, dictionary, status, changelog | `apps/web/src/i18n/**`, `docs/**` | loader parity suites green on ar/en; **no-new-locale-content** assertion (CD-05 recorded); `docs:validate` green |

## 6. Verification

- Contracts suite green (preferences/digest/wizard/growth DTOs; no-fabrication
  gates: channel fakes only).
- API unit suite green (search federation, loader determinism, growth math).
- `migrations.spec.ts`: journal 78 entries (sequential projection, re-anchored at
  execution), manifest consistency.
- Permissions drift: N = N after **+6 keys — re-pinned consciously, a named bump**
  (recorded; band +4–10/phase).
- i18n parity ar=en (triple parity) — **and the loader proof**: swapping the
  dictionary source (registry data, not code) requires zero code changes; the
  no-new-locale-content boundary asserted + recorded (CD-05).
- Golden effective-configs: this phase ships **SETTINGS keys** (digest hour,
  banner defaults, sandbox policy) ⇒ **all pins recomputed** with the old→new
  table recorded in agent-ctx (the §18 lesson-5 relay).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke (the full journey): fresh tenant → wizard to first invoice
  (resume mid-way); toggle dark mode (persisted; print stays light); ⌘K an invoice
  number, a journal memo, a report name, a settings page; open the help drawer
  from a screen (AR + EN); load demo data into a sandbox from the marketing page;
  set preferences and receive the morning digest via the fake channel;
  personalize home and switch layouts; create a referral code and see the award
  row; open the console revenue tab (MRR/ARR/churn/health tiles); post a feature
  request and vote; publish a targeted banner; swept screens show skeleton +
  guided empty states.

## 7. Risks and Constraints

- **Sweep fatigue (143 screens):** the skeleton/empty-state sweep is pattern-based
  (archetype defaults), not per-screen code — the risk is drift on bespoke
  screens; the archetype snapshot suite + a tracked checklist in the completion
  report bound it (honest deferrals recorded if any screen misses).
- **Dark-mode contrast debt:** the dark palette must pass accessibility on both
  AR/RTL and EN/LTR — tokens, not per-component overrides (the DESIGN_TOKENS
  discipline); print invariance is an explicit invariant.
- **Growth-plane isolation:** referrals/partners/revenue are platform-plane
  aggregates — the existing platform-reader conventions apply; no tenant reads
  another tenant's adoption/segment data (RLS battery extended to the new tables).
- **Digest/channel honesty:** WhatsApp/SMS remain ports + fakes (no provider
  credentials in repo); live cutover stays a named gate (no fabrication).
- **i18n loader half-step:** the loader enables locales but ships none — the
  temptation to "throw in Urdu" is explicitly refused (CD-05: jurisdiction packs
  and marketing claims gate every new locale; recorded as the follow-up path).

## 8. Completion and Handoff

- Completion report `reports/PHASE-057-COMPLETION.md` with the verification table
  (suites, drift numbers, golden re-pin table, i18n count, sweep checklist,
  browser evidence) + honest deferrals (channel live-cutover gates, form-designer
  candidate status, any unswept screens).
- Handoff obligations: the locale-loader contract documented for every future
  locale intake (registry + dictionary + CD-05 rule); the adoption-event schema
  documented as the substrate for the PHASE-058 proposal's cost/adoption
  metering; the sandbox/demo-data flow documented for sales onboarding; the 053
  widget contract gains the personalization extension notes.
- Next eligible: **PHASE-058 only** — and it is **decision-gated**: the AI
  proposal requires its ADR (formally revisiting SCOPE_AND_NON_GOALS non-goal #9)
  before any implementation; with 057 the *scheduled* program's W5 wave is
  complete per the register's canonical order.
