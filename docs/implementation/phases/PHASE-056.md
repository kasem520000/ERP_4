# PHASE-056 — Enterprise Security, Identity & Governance (أمن المؤسسات والهوية والحوكمة)

> **Status:** PLANNED — NOT STARTED · **Documented:** 2026-11-10 · **Program:**
> [Post-Roadmap Expansion Register v3.0](../../planning/POST_ROADMAP_EXPANSION_REGISTER.md)
> (wave W4 — the parallel ‖ track, tier P2) · **Source:** external gap analysis
> `ERP_FULL_GAP_ANALYSIS.md` §19 (G-01…G-20) + §26.5 (IN-28…IN-32) + §2 (H-19, H-20)
> + §27.3/§27.4 (TB-24, TB-31, TB-32) + §29.4 (DF-50) ·
> **Execution:** begins on the owner's explicit phase order; delivery =
> `ERP_PLATFORM_PHASE056.zip`

## 1. Phase Overview

- **Phase ID:** PHASE-056
- **Title:** Enterprise Security, Identity & Governance (أمن المؤسسات والهوية والحوكمة)
- **Objective:** The external evaluation's verdict — "ممتاز تقنياً، ناقص حوكمةً"
  (78%) — names exactly what this phase closes. The platform already has FORCE RLS,
  attack suites A1–A10, 245=245 permissions, audit events; what it lacks is the
  **enterprise identity layer** (H-20: "عميل مؤسسي يريد Azure AD / Okta = غير
  ممكن") and the **governance layer** (GDPR subject requests, consent, retention,
  field-level audit, a real SoD matrix, internal audit, risk register). This phase
  delivers **(1)** enterprise identity — OIDC + SAML 2.0 SSO with just-in-time
  provisioning, LDAP/AD sync, WebAuthn passkeys, mandatory-MFA policy, IP
  allowlisting; **(2)** the privacy suite — subject requests with an *honest*
  erasure boundary, consent, dry-run-first retention; **(3)** tenant backup/export
  (H-19 — "أعطني بياناتي") with a restore-into-fresh-tenant drill; **(4)** the
  audit upgrades — changed-field diffs, the seeded SoD matrix, the read-only
  internal-audit workspace, the risk register; **(5)** platform governance —
  quotas, sandbox tenants, the public status page + trust center, and the SOC 2/ISO
  decision record.
- **Business value:** the enterprise buyer's security review stops being a wall —
  SSO/MFA/allowlisting answer the identity questions, the export package answers
  the contract/GDPR blocker, and the PL-13 quota layer makes SaaS unit economics
  defensible.
- **Tier / effort:** P2 · ~5 weeks single-stream (two migrations + contracts + api
  unit suite + web screens + docs + completion report).
- **Source gaps closed:** H-19, H-20, G-01, G-02, G-03, G-05, G-06, G-08 (the
  compliance-calendar surface — **shared with PHASE-051**, which owns the tax-filing
  deadline rows; 056 hosts the calendar view fed by 051's rows + 055's asset
  expiries), G-09, G-10, G-18, IN-28, IN-29, IN-31, IN-32 (IN-30 SCIM stays a
  decision-gated candidate), PL-07, PL-08, PL-13, TB-24, TB-31, TB-32, DF-50.
  G-13 (SOC 2/ISO) is addressed by **decision record + evidence checklist only** —
  certification is organizational, honestly not code. G-20 is §19's restatement of
  IN-31 (passkeys) and closes with it.

## 2. Scope

In scope:

1. **SSO — OIDC + SAML 2.0 (H-20 / IN-28):** `identity_provider_configs` per tenant
   (protocol, issuer/metadata, client identity; secrets per the SECRETS_MANAGEMENT
   pattern — never plaintext, never in repo) with Azure AD / Okta / Google shapes
   pre-templated; **just-in-time provisioning** with group→role mapping; per-tenant
   login policy incl. **SSO-only** (password login disabled). **No-fabrication
   rule:** the protocol implementation is fully testable locally with a **fake IdP**
   (signed assertions/metadata round-trips); verification against a *live* IdP is a
   named, verification-gated live-tenant exercise — port + fake + named gate, the
   PHASE-023 pattern.
2. **LDAP / Active Directory (IN-29):** read-only directory sync (scheduled user
   import + group→role mapping) via a directory port; **bind credentials are
   tenant-supplied and gated** (tests run against an in-memory fake directory).
3. **WebAuthn / passkeys (IN-31 / G-20):** registration + login as an MFA factor
   and as **passwordless**; per-tenant policy (off / optional / required); fully
   local-testable with test attestations.
4. **MFA policy (IN-32):** tenant-level mandatory-MFA enforcing the existing TOTP
   factor at login (policy engine on the auth pipeline; exemption list audited).
5. **GDPR/CCPA subject requests (G-01):** `data_subject_requests` (access / export /
   erasure / rectification) with workflow, SLA clock, assigned owner. **The honest
   boundary, stated in-product:** *erasure = anonymization* where retention rules
   permit; financial records are kept per statutory retention and the outcome
   records exactly what was anonymized vs retained-and-flagged (never a silent
   "deleted everything" claim).
6. **Consent records (G-02):** `consent_records` (subject, channel, purpose,
   opt-in/out, timestamp, source) — the marketing-channel surface PHASE-052's
   channels consume when it ships (soft reference).
7. **Retention policies (G-03):** `retention_policies` per entity family (period +
   action ∈ ARCHIVE / ANONYMIZE) + a scheduled job that runs **dry-run report
   first — no destructive default**: execution requires explicit, separately-
   permissioned confirmation with an audit row + preview manifest.
8. **Tenant backup & export (H-19 / PL-07 / TB-31 / TB-32):** the per-tenant export
   package — a **full logical dump**: every tenant row as versioned JSONL per table
   (dependency-ordered, RLS-scoped reader), files manifest (signed URLs), and a
   documented **restore-into-fresh-tenant procedure**; on-demand tenant download
   (portability) + scheduled platform backups unchanged (the existing DR discipline
   in [BACKUP_AND_RECOVERY.md](../../database/BACKUP_AND_RECOVERY.md) extended to
   per-tenant granularity; a restore drill executed + documented).
9. **Field-level audit (G-09):** `audit_events` gains an additive `changed_fields`
   jsonb on update ops (append-only grants unchanged) + the PHASE-036
   record-timeline renders per-field before/after diffs.
10. **SoD matrix (G-10):** `sod_matrix` role-pair conflict rules **seeded with the
    classic pairs** (create-vendor + approve-payment; create-sales-invoice +
    post-journal; manage-users + approve-own-role-changes), assignment-time
    warnings (an operator decision with an audit row — never a silent block), and a
    standing-conflict report. Extends BR-034 `SELF_APPROVAL_BLOCKED` from
    self-approval to the pair-conflict surface.
11. **Internal audit + risk (G-05 / G-06):** an audit-project workspace with
    **curated, read-only sampling checks** (high-value journals; duplicate-payment
    detection; approvals-by-creator exceptions — named seeded check definitions
    over existing tables, no write surface) + `risk_register` with owner/severity/
    review cadence. The workspace also hosts the **compliance calendar** (G-08:
    051 tax deadlines + 055 asset/license expiries on one ladder).
12. **Quotas (PL-13):** per-tenant usage quotas (users, documents, storage, API
    calls — riding PHASE-052's counters; either W4 ordering is legal, the service
    reads whatever counters exist at execution and the delta is recorded) with
    **soft** (warn) / **hard** (block) enforcement + a usage console.
13. **IP allowlisting (G-18):** per-tenant login IP ranges (CIDR list) enforced on
    the auth pipeline; break-glass audited + owner-notified.
14. **Sandbox tenants (PL-08):** `tenants.kind` gains SANDBOX (additive) —
    refreshable, excluded from billing and scheduled backup/export policies by
    kind. **Pairs with PHASE-057's demo-data loader** (AD-36-14: 056 ships the
    *kind*, 057 ships the *content*).
15. **Status page + trust center (TB-24 / DF-50):** a public status page over the
    existing `/health` endpoints + a `/trust` page (security posture, compliance
    roadmap, subprocessor list — **static data**, CD-05-governed copy).
16. **SOC 2 / ISO 27001 (G-13) — decision record + evidence checklist only:**
    certification is organizational (audit engagements, not code); the deliverable
    is the DR with the evidence checklist mapped to what the platform already
    proves (RLS suites, audit trail, backups) — honestly *not* a certification.

Out of scope (explicit):

- **WAF / DDoS (G-16 / G-17)** — edge infrastructure, ops-gated, stays with the
  operations waiver ledger (register §2.6).
- **SCIM (IN-30)** — named candidate behind a decision record; SSO + LDAP sync
  cover the immediate ask.
- **Session management center (G-19)** — `sessions` exist; a center is polish,
  recorded as candidate.
- **Data residency (G-04), pen-test re-run (G-11), bug bounty (G-12), BCP (G-14)**
  — organizational/ops-gated ledger items, not product code.
- **Any change to the frozen accounting core** — everything here is identity,
  governance, or platform-plane; nothing posts.

## 3. Prerequisites

- **PHASE-036** (register §1 dependency): the record-timeline that renders
  changed-field diffs + the SETTINGS-wave/golden-re-pin conventions.
- **Shipped substrate:** identity/tenancy/audit (PHASE-003), TOTP MFA, RLS attack
  suites, the DR/backup discipline, `/health` endpoints.
- **Soft forward references (no hard deps):** 052 (counters for quotas; channels
  for consent), 051 (compliance-calendar tax rows), 055 (asset expiry rows), 057
  (demo-data loader onto the sandbox kind).
- **Binding decisions:** the no-fabrication rule (register §3.4 — fake IdP/fake
  directory, live cutover a named gate), SECRETS_MANAGEMENT (IdP/LDAP credentials),
  ADR-0015 (authentication extension points), BR-034 (the SoD base), CD-05
  (trust-center copy governance).
- Relevant docs: [AUTHORIZATION_MATRIX.md](../../security/AUTHORIZATION_MATRIX.md),
  [FEATURE_CATALOG.md](../../product/FEATURE_CATALOG.md),
  [ENTITY_CATALOG.md](../../database/ENTITY_CATALOG.md),
  [NAVIGATION_MODEL.md](../../ui/NAVIGATION_MODEL.md) §9,
  [IMPLEMENTATION_STATUS.md](../../planning/IMPLEMENTATION_STATUS.md).

## 4. Design Impact

- **Database:** two additive migrations (sequential program projection: 055→0075,
  056→0076/0077 — journal re-anchored at execution):
  - `0076_identity_governance.sql`: `identity_provider_configs`,
    `ldap_directory_configs`, `webauthn_credentials` (+ challenges),
    `tenant_auth_policies` (SSO-only, MFA, passkey), `tenant_ip_allowlist_ranges`,
    `data_subject_requests` (+ event log), `consent_records`,
    `retention_policies`, `sod_matrix` (seeded), `risk_register` (+ reviews),
    `internal_audit_check_defs` (seeded read-only), `audit_projects`,
    `tenants.kind` (additive + SANDBOX flags), `audit_events.changed_fields`
    (additive jsonb column — append-only grants unchanged).
  - `0077_tenant_backup_quotas.sql`: `tenant_export_packages` (manifest jsonb +
    storage ref + status), `tenant_quotas` (metric, soft/hard, period) +
    enforcement hooks.
  All tenant-owned + RLS macro + UUIDv7; platform-plane tables follow the existing
  platform-reader patterns.
- **Feature keys (projection):** `platform.sso`, `platform.directory_sync`,
  `platform.passkeys`, `platform.mfa_policy`, `platform.privacy_requests` (incl.
  consent), `platform.retention_policies`, `platform.tenant_export`,
  `platform.sod_matrix`, `platform.internal_audit` (incl. risk register),
  `platform.quotas`, `platform.ip_allowlist`, `platform.sandbox_tenants` — **+12
  keys, the top of the +4–12/phase band** (176 today, 182 after 036; running total
  re-anchored at execution). Grants: enterprise tier primarily; business for
  quotas/export. Status page + trust center are **public static — no key**.
- **Permissions (projection):** `identity.sso.manage`, `identity.mfa.manage`
  (incl. passkey policy), `identity.ip_allowlist.manage`,
  `platform.privacy.manage`, `platform.retention.manage`,
  `platform.tenant_export.execute` (risky — approval-separated),
  `platform.sod.manage`, `platform.internal_audit.view` (read-only by design),
  `platform.risk.manage`, `platform.quotas.manage` — **+10 keys, the top of the
  +4–10/phase band** (baseline 245 today, 248 after 036, running total re-anchored
  at execution) → **re-pinned consciously — a named bump**, recorded.
  Sandbox provisioning rides the existing tenancy admin keys.
- **API:** additive routes only (IdP/LDAP config, passkey ceremony, policies, DSR
  workflow, consent, retention dry-run/execute, export request/download, SoD
  report, audit checks, risk CRUD, quotas, allowlist); the login pipeline gains
  the policy gates — tenant-policy-scoped, default-off (additive posture).
- **Web:** Settings → identity & governance group, privacy console (DSR + consent
  + retention), audit workspace + risk register, usage/quota console, export
  center; public `/status` + `/trust`; i18n +~220 keys (AR/EN parity).
- **Docs:** FEATURE_CATALOG (+12), ENTITY_CATALOG (+~15 entities),
  AUTHORIZATION_MATRIX (+10), DATA_DICTIONARY (DSR/retention/protocol enums),
  NAVIGATION_MODEL §9, security docs (SoD, retention, export procedure),
  IMPLEMENTATION_STATUS/CHANGELOG; the SOC 2/ISO DR lands in the decision register.

## 5. Implementation Plan

| # | Task | Expected files | Test hook |
|---|------|-----------------|-----------|
| T56-A | Migrations 0076 + 0077: identity/governance + export/quota tables, SoD + audit-check seeds, additive `audit_events.changed_fields` | `apps/api/migrations/0076_identity_governance.sql`, `0077_tenant_backup_quotas.sql`, `meta/_journal.json` | migrations.spec journal 77 entries (projection); RLS battery covers new tables; append-only audit grants re-asserted |
| T56-B | SSO: OIDC + SAML configs, JIT provisioning + role mapping, login policy (SSO-only), **fake IdP** harness | `apps/api/src/modules/identity/**` | signed-assertion round-trips vs fake IdP; role mapping; SSO-only blocks passwords; live-IdP gate named (no fabrication) |
| T56-C | LDAP sync port + fake directory; passkey ceremony (MFA + passwordless) + MFA-required policy + IP allowlist | `apps/api/src/modules/identity/**` | fake-directory sync; WebAuthn test attestations; policy gates fire with audit rows; break-glass audited |
| T56-D | Privacy suite: DSR workflow + SLA + honest erasure boundary, consent records, retention dry-run/execute | `apps/api/src/modules/{platform,identity}/**` | erasure produces recorded dispositions (never a blanket claim); retention executes only after explicit confirmation + audit |
| T56-E | Tenant export package (JSONL per table, manifest) + on-demand download + restore-into-fresh-tenant + drill | `apps/api/src/modules/platform/**`, `docs/database/BACKUP_AND_RECOVERY.md` | export→restore parity (row counts + spot sums per table); drill timings in the completion report |
| T56-F | Governance: changed-fields capture + timeline diffs; SoD matrix (seeds, warnings, standing report); audit workspace (read-only checks) + risk register + compliance calendar | `apps/api/src/modules/{audit,platform}/**`, `apps/web/**` | changed-fields diffs; conflict warning + audit row; every audit check proven read-only (write rejected) |
| T56-G | Quotas (soft/hard + usage console) + sandbox kind + allowlist UI + status page + `/trust` (CD-05-governed copy) | `apps/api/src/modules/platform/**`, `apps/web/**` | quota soft→hard ladder; sandbox excluded from billing/backups; trust copy validated against the compliance matrix (CD-05) |
| T56-H | SOC 2/ISO DR + evidence checklist; docs sync: catalogs, matrix, dictionary, nav, security docs, status, changelog | `docs/**`, decision register | `docs:validate` green (validator v3.0 ranges 001–058); DR registered |

## 6. Verification

- Contracts suite green (IdP/LDAP/policy/DSR/retention/quota DTOs + the
  no-fabrication gates as contracts: fake adapters only, no live credentials in
  repo).
- API unit suite green (identity + governance specs incl. the fake-IdP and
  fake-directory suites).
- `migrations.spec.ts`: journal 77 entries (sequential projection, re-anchored at
  execution); **additive-only proof** — `audit_events` grants/append-only behavior
  re-asserted after the new column.
- Permissions drift: N = N after **+10 keys — re-pinned consciously, a named bump**
  (recorded; band +4–10/phase).
- i18n parity ar=en (triple parity).
- Golden effective-configs: this phase ships **SETTINGS keys** (MFA/retention/
  quota defaults) ⇒ **all pins recomputed** with the old→new table recorded in
  agent-ctx (the §18 lesson-5 relay).
- **Restore-drill evidence:** export→restore-into-fresh-tenant executed locally
  with per-table parity assertions + timings (the DR discipline at per-tenant
  granularity).
- `docs:validate` green; feature-catalog count statements updated.
- Browser smoke: configure the fake IdP and SSO-login with JIT role mapping;
  register a passkey and login passwordless; flip MFA-required and watch the gate;
  file + complete a DSR with recorded dispositions; run the retention dry-run (no
  destruction); request + download a tenant export and restore it into a fresh
  tenant; assign a conflicting role pair and see the SoD warning + audit row; open
  the duplicate-payment check; set a quota and hit soft warn → hard block; open
  `/status` and `/trust`.

## 7. Risks and Constraints

- **Login-pipeline regression risk:** four policy gates (SSO-only, MFA, passkey,
  IP range) sit on the hottest path — every gate default-off, tenant-scoped,
  covered by the auth regression suites + new negative tests; break-glass audited.
- **Honest-boundary load:** erasure, retention, SOC 2 are where a fabricated
  "compliant" claim would be reputationally fatal — the dispositions, dry-run
  default, and DR-only posture are the guard (CD-05 governs every public sentence).
- **Export size/PII:** the JSONL export is RLS-scoped and permissioned
  (`platform.tenant_export.execute`, approval-separated); large tenants run as a
  resumable queued job (the existing job conventions).
- **Wave-ordering sensitivity (W4 ‖):** quotas/consent reference 052 surfaces —
  graceful degradation is specified so either order is legal; the completion
  report records which references were live at execution.

## 8. Completion and Handoff

- Completion report `reports/PHASE-056-COMPLETION.md` with the verification table
  (suites, drift numbers, golden re-pin table, restore-drill evidence, i18n count,
  browser evidence) + the honest ledger: the named live-IdP/LDAP verification gates
  still open (waiver pattern), SCIM/session-center candidates, the SOC 2/ISO DR
  pointer.
- Handoff obligations: the sandbox kind is documented for 057's demo-data loader
  (AD-36-14); the compliance-calendar contract for 051's tax rows + 055's expiries;
  the changed-fields audit feed for every later timeline consumer; the quota
  counters interface for 052 convergence.
- Next eligible: the W4 sequenced tail (051 → 052 → 053) if not yet shipped, then
  the W5 wave (049/054/055/057); **058 stays decision-gated** — never
  auto-scheduled.
