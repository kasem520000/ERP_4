import { describe, expect, it } from "vitest";

import {
  AGRICULTURE_TEMPLATE_MANIFEST,
  AUTOMOTIVE_TEMPLATE_MANIFEST,
  DISTRIBUTION_TEMPLATE_MANIFEST,
  EDUCATION_TEMPLATE_MANIFEST,
  ELECTRONICS_TEMPLATE_MANIFEST,
  FOOD_MANUFACTURING_TEMPLATE_MANIFEST,
  GROCERY_MANIFEST,
  HEALTHCARE_TEMPLATE_MANIFEST,
  PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST,
  RENTAL_LOGISTICS_TEMPLATE_MANIFEST,
  RESTAURANT_MANIFEST,
  RETAIL_MANIFEST,
  WHOLESALE_TEMPLATE_MANIFEST,
  hashManifestJson,
  type IndustryTemplateManifest,
} from "@erp/contracts";

import { composeTenantStaticConfig } from "../application/resolve/compose";
import { PLAN_KEYS, layerInputsFixture, l1Of, type PlanKey } from "./layer-fixtures";

/**
 * PHASE-015 §6 golden effective-configs (CONFIGURATION_ENGINE §10 #2):
 * one pinned, hashed effective config per shipped template × plan ×
 * jurisdiction example — the twelve v1.0.0 manifests (retail / grocery /
 * restaurant + the PHASE-017 automotive / distribution pair + the
 * PHASE-018 food manufacturing template + the PHASE-019 professional
 * services template + the PHASE-032 education template + the PHASE-033
 * agriculture template + the PHASE-030 wholesale / electronics pair +
 * the PHASE-031 healthcare commercial shell — the two lineages' template
 * sets united by the restoration merge) × the plan seeds
 * (migration 0008/0021/0024/0025/0026/0027 + the PHASE-027 0038 grants)
 * × the SA jurisdiction seed (migration 0013, pack 1.0.0-baseline, VAT in
 * force, registered tenant).
 *
 * A resolution change that alters any golden hash fails CI unless the
 * change is a reviewed decision — that is this spec's entire job. The
 * structural assertions beside each pin exist so a mismatch is debuggable,
 * not so they can substitute for the pin.
 *
 * PHASE-017 review note: the business/enterprise pins were re-pinned with
 * the 0025 plan grants (sales.job_cards + the distribution/commission set
 * + inventory.reservations on business) — the L4 layer is part of the
 * hashed content, so the reviewed seed change moves exactly those pins.
 *
 * PHASE-018 review note: every pin moved — the 0026 plan grants added the
 * seven manufacturing keys to business (enterprise already had them;
 * starter untouched), and the four manufacturing SETTINGS_REGISTRY keys
 * (qc_gate/scrap_reason_required/fg_batch_expiry_from_shelf_life/
 * consumption_variance_threshold_pct) land in every tenant's policy map
 * as platform defaults (SETTINGS_REGISTRY defaults are the lowest rung of
 * the hashed §5 policies). The three new food_manufacturing rows pin with
 * the rest.
 *
 * PHASE-019 review note: every pin moved again — the 0027 plan grants
 * added the six CRM+projects keys to business (enterprise already had
 * them; starter untouched), and the SEVEN new SETTINGS_REGISTRY keys (the
 * six crm.* policy keys + the platform-only crm.defer_advance_recognition)
 * land in every tenant's policy map as platform defaults (the §5 policies
 * map is part of the hashed content). The old→new table is recorded in
 * agent-ctx/T43-2-template.md; the three new professional_services rows
 * pin with the rest.
 *
 * PHASE-028 review note (restored lineage): every pin moved again — the
 * two SETTINGS_REGISTRY budgeting control keys (budgeting.controls.mode +
 * budgeting.controls.warn_threshold_percent, BR-051 — advisory-by-default
 * policy) land in every tenant's policy map as platform defaults, so all
 * pins re-pinned in-phase (the P28-A settings-key wave; the migration
 * 0042 plan grants add the six budgeting feature keys to business+
 * enterprise, moving those pins a second notch). Starter carries only the
 * policy-default shift (no new grants). Recorded in
 * agent-ctx/P28-B-budgeting-core.md.
 *
 * PHASE-029 review note (restored lineage): every pin moved again — the
 * four SETTINGS_REGISTRY payroll policy keys (payroll.loans.max_deduction_
 * percent / payroll.loans.control_account_id / payroll.eos.enabled /
 * payroll.eos.accrual_days_per_service_year, BR-054/BR-055) land in every
 * tenant's policy map as platform defaults, so all pins re-pinned
 * in-phase (the P29-A settings-key wave; the migration 0043 plan grants
 * add the eight payroll feature keys to business+enterprise, moving those
 * pins a second notch — the same two-notch pattern as 028). Starter
 * carries only the policy-default shift (no new grants). Recorded in
 * agent-ctx/P29-B-payroll-core.md.
 *
 * PHASE-030 review note (restored lineage): the fifteen business/
 * enterprise pins (7 templates × business + 7 × enterprise + the
 * no-template business row) moved — the layer fixtures mirror the 0038
 * notes + installments grant wave (twelve keys → business + enterprise,
 * transcribed because the wholesale template's REQUIRED pdc_notes chain
 * consumes it; the P28/P29 grant waves stay un-mirrored per the recorded
 * posture). Starter rows unchanged. The six new wholesale/electronics
 * rows pin with the 0044 seeds. The old→new table is recorded in
 * agent-ctx/P30-A-contracts-migration.md.
 *
 * PHASE-032 review note: the fifteen business/enterprise pins + the
 * no-template row moved — the fixtures now transcribe the PHASE-027 0038
 * plan grants (the twelve notes/installments keys → business + enterprise,
 * migration 0038's own UPDATE; starter untouched — its seven pins are
 * byte-stable) because the education template's REQUIRED chain
 * (installments.plans/collections/late_fees) and OPTIONAL pdc_notes entry
 * resolve through exactly those grants; the 0035/0037 grant blocks stay
 * untranscribed (no shipped template consumes them). The six new
 * education POLICY_REGISTRY keys carry NO settingsKey mapping (the
 * deliberate no-SETTINGS_REGISTRY-surface choice — the L1 manifest
 * defaults land under their raw policy-key names, so non-education
 * tenants' policy maps and pins are byte-stable). The three new education
 * rows pin with the rest; every pin below was recomputed by running the
 * compose pipeline over the updated fixtures (recorded in the
 * PHASE-032-COMPLETION report; the old→new table lives in
 * agent-ctx/P32-T5-golden-pins.md).
 *
 * PHASE-033 review note: ZERO existing pins move — the first shipped
 * template whose REQUIRED chain resolves ENTIRELY through the
 * already-transcribed grants (manufacturing.bom/production_orders @ the
 * 0026 block, inventory.batch_tracking + accounting.cost_centers @ the
 * 0008 base, purchasing/sales @ the starter base, accounting.projects @
 * the 0027 block), so layer-fixtures is byte-identical to the PHASE-032
 * transcription; and the four new agriculture POLICY_REGISTRY keys carry
 * NO settingsKey mapping (the 0039 precedent), so non-agriculture
 * tenants' policy maps are untouched. All 25 existing pins re-verified
 * byte-stable by re-running the compose pipeline (the education ×
 * business spot check: 29e14755…f7cbc unchanged); the three new
 * agriculture rows pin with the rest (recorded in the
 * PHASE-033-COMPLETION report; the reviewed table lives in
 * agent-ctx/P33-T5-golden-pins.md).
 *
 * THE RESTORATION-MERGE review note: the stage-9/10 siblings 028–031
 * (budgeting / payroll / wholesale+electronics / healthcare) were
 * restored from the uploaded PHASE-031 archive and merged onto PHASE-034
 * — the twelve-template set is the union of the two lineages' rows (the
 * surviving lineage's education/agriculture rows + the restored
 * lineage's wholesale/electronics/healthcare rows), and the merged
 * SETTINGS_REGISTRY now carries the six 028/029 policy keys, so EVERY
 * pin (including the surviving lineage's 28) was recomputed by re-running
 * the compose pipeline over the merged fixtures — the same two-notch
 * 028/029 pattern the restored lineage recorded for its own rows, now
 * applied honestly to the united set. The wholesale/electronics/
 * healthcare pins carried over from the restored lineage are re-derived
 * under the merged tree (byte-identical inputs ⇒ byte-identical pins —
 * the cross-lineage consistency check); the education/agriculture pins
 * moved by exactly the six new platform policy defaults.
 *
 * PHASE-035 review note: the fifteen business/enterprise pins + the
 * no-template row moved — the fixtures transcribe the PHASE-035 0047
 * intake grants (the four rental keys: crm.rental_contracts /
 * crm.contract_deposits / crm.late_fees / distribution.shipment_tracking
 * → business + enterprise, starter untouched — its thirteen starter pins
 * are byte-stable) because the rental template's REQUIRED chain consumes
 * exactly those grants. The seven new rental POLICY_REGISTRY keys carry
 * NO settingsKey mapping (the 0039/0040 posture), so non-rental tenants'
 * policy maps stay byte-stable. The three new rental_logistics rows pin
 * with the rest; every pin below was recomputed by running the compose
 * pipeline over the updated fixtures (recorded in the PHASE-035 gap-
 * closure completion report).
 *
 * PHASE-036 review note: every pin moved again — the ONE new
 * SETTINGS_REGISTRY key (purchasing.duplicate_invoice_tolerance_pct,
 * AD-36-10's duplicate-detection tolerance, the 028/029 wave pattern)
 * lands in EVERY tenant's policy map as a platform default (the §5
 * policies map is part of the hashed content), so all 40 pins were
 * recomputed in-phase by re-running the compose pipeline
 * (apps/api/scripts/compute-goldens.ts — the §18 lesson-5 relay tool,
 * now a checked-in script). The six platform.* feature-key plan grants
 * (custom_fields/picklists/saved_views/list_export/bulk_actions/
 * record_timeline → business + enterprise) move those 26 pins a second
 * notch; starter carries only the policy-default shift. The old→new
 * table is recorded in agent-ctx/P36-goldens-repin.md.
 */

const GOLDEN: Readonly<
  Record<string, { readonly template: IndustryTemplateManifest | null; readonly hash: string }>
> = Object.freeze({
  "industry.retail × starter": {
    template: RETAIL_MANIFEST,
    hash: "sha256:473f672f17df6b42ea6b7aee60f92dbfffa7b689e498110224429f69d73b60b7",
  },
  "industry.retail × business": {
    template: RETAIL_MANIFEST,
    hash: "sha256:6d222ca084bf3f783c9f7a24382e282ef0446367e0a8d207bc7eda955ab8194a",
  },
  "industry.retail × enterprise": {
    template: RETAIL_MANIFEST,
    hash: "sha256:23af27016db8d43fba05403d5d9d70db7eec39d1fdcb233b16d3ca65d1b56311",
  },
  "industry.grocery × starter": {
    template: GROCERY_MANIFEST,
    hash: "sha256:43f26bb7b963691456624041d06845ace69e6f1fcdf325032cbca7c7279ba451",
  },
  "industry.grocery × business": {
    template: GROCERY_MANIFEST,
    hash: "sha256:d3ee4bc1ac4e24a08462728290e1a415630002d4bcfed7df888060b082f29683",
  },
  "industry.grocery × enterprise": {
    template: GROCERY_MANIFEST,
    hash: "sha256:1d93d23695faa7638c21e49821479711673015f1db8aa82919539ab777e40de8",
  },
  "industry.restaurant × starter": {
    template: RESTAURANT_MANIFEST,
    hash: "sha256:5508289829299563ce372c1c19b030a869ca5dfc0f75be345b655200dccf131e",
  },
  "industry.restaurant × business": {
    template: RESTAURANT_MANIFEST,
    hash: "sha256:0446502bd8098198033bbb1e36857816fda96c6de611bf3cdf12fa12817d2f3b",
  },
  "industry.restaurant × enterprise": {
    template: RESTAURANT_MANIFEST,
    hash: "sha256:9ace3c3901e001468b6bd126841900f91547c76d9eaead7302a8b95fe1561643",
  },
  // -- PHASE-017 pair (migration 0025 seeds; starter = degraded back-office)
  "industry.automotive × starter": {
    template: AUTOMOTIVE_TEMPLATE_MANIFEST,
    hash: "sha256:22dcca3ccbdd5137e4bab5fb961e9df13bcd4b860cd5be4c6cc629aa50508af5",
  },
  "industry.automotive × business": {
    template: AUTOMOTIVE_TEMPLATE_MANIFEST,
    hash: "sha256:e0c31d1db3d3a943ae3740e472ccbad809b407e1427b494b7e40654b5d22efd4",
  },
  "industry.automotive × enterprise": {
    template: AUTOMOTIVE_TEMPLATE_MANIFEST,
    hash: "sha256:95bc56e9a6135131f5ba2c13b92588c82c24d65709b91aab2be1a1171c2977be",
  },
  "industry.distribution × starter": {
    template: DISTRIBUTION_TEMPLATE_MANIFEST,
    hash: "sha256:0ce0f3318a7520b5597d05e154ff5fbabff285c3770cd0ff1391a31ec5d19ea2",
  },
  "industry.distribution × business": {
    template: DISTRIBUTION_TEMPLATE_MANIFEST,
    hash: "sha256:acd2de7b7fa3a0a31e94ed00bc7f11130858c6b4f2130852101ae6d96969d7d7",
  },
  "industry.distribution × enterprise": {
    template: DISTRIBUTION_TEMPLATE_MANIFEST,
    hash: "sha256:42642ab25c5938dddf0df3e74ed1457377dead6fa830ab4aa15fe1ae18f6feae",
  },
  // -- PHASE-018 (migration 0026 seed; starter = degraded back-office)
  "industry.food_manufacturing × starter": {
    template: FOOD_MANUFACTURING_TEMPLATE_MANIFEST,
    hash: "sha256:e5441548a261f0dc522ad60f23596a8d9df460505c803b844b54e41ce63368de",
  },
  "industry.food_manufacturing × business": {
    template: FOOD_MANUFACTURING_TEMPLATE_MANIFEST,
    hash: "sha256:1522ffb9e3a679aeb63f89ef94c311522576dda7a5716578d7a71f62db9f551d",
  },
  "industry.food_manufacturing × enterprise": {
    template: FOOD_MANUFACTURING_TEMPLATE_MANIFEST,
    hash: "sha256:6cb3c52ca8cb84459eb1bbc3701d0add9198e1eb1d1d2a3d715b1a35e72d0a8a",
  },
  // -- PHASE-019 (migration 0027 seed; starter = degraded back-office)
  "industry.professional_services × starter": {
    template: PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST,
    hash: "sha256:53f9eb7d4eb772123e701c9d03a4e1f9a36f6990049e5d15652a306506b6da52",
  },
  "industry.professional_services × business": {
    template: PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST,
    hash: "sha256:abc97635227a74f5f276874b5e39bad2773e0005e218b5296b4ca59f7ed35577",
  },
  "industry.professional_services × enterprise": {
    template: PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST,
    hash: "sha256:1f6131f2889a0d77280b9c30b389d55b388387ffc8d4eee9d038716335fc66cf",
  },
  // -- PHASE-032 (migration 0039 seed; starter = degraded back-office —
  // the installments/crm REQUIRED chain is ungranted there, exactly the
  // tier-4 posture of the 0025/0026/0027 templates before it)
  "industry.education × starter": {
    template: EDUCATION_TEMPLATE_MANIFEST,
    hash: "sha256:a9f31038a96a27f277ec49e126f71529e1d6d3609547a78419dd1745f190e8bf",
  },
  "industry.education × business": {
    template: EDUCATION_TEMPLATE_MANIFEST,
    hash: "sha256:71645b724e60d364c1d33554a6e7d189ecacba7deccc935746bea22f7c0d8cf4",
  },
  "industry.education × enterprise": {
    template: EDUCATION_TEMPLATE_MANIFEST,
    hash: "sha256:7dcee42154c38abb2367f42ef008014918f453d738a99412b7b3acc402ada0af",
  },
  // -- PHASE-033 (migration 0040 seed; starter = degraded back-office —
  // the manufacturing/batch/projects REQUIRED chain is ungranted there,
  // exactly the tier-4 posture of the 0025/0026/0027/0039 templates
  // before it; ZERO existing pins move — see the review note above)
  "industry.agriculture × starter": {
    template: AGRICULTURE_TEMPLATE_MANIFEST,
    hash: "sha256:e22a8eaf3fa5f84d72654d22a97842ec7fda9072a30f2c2eed2dafd8ca8c072e",
  },
  "industry.agriculture × business": {
    template: AGRICULTURE_TEMPLATE_MANIFEST,
    hash: "sha256:6ea140666ee87ce47aa1a93c8e8bd1828707f91f67940a77f762bbb652d6ff88",
  },
  "industry.agriculture × enterprise": {
    template: AGRICULTURE_TEMPLATE_MANIFEST,
    hash: "sha256:34dfdc704fefd8d923971c2660fa3949ee66543f084e1e8d33650f622c9ab6fe",
  },
  // -- PHASE-030 (migration 0044 seeds; starter = degraded back-office —
  // the notes chain + POS/service-order sets are business+enterprise)
  "industry.wholesale × starter": {
    template: WHOLESALE_TEMPLATE_MANIFEST,
    hash: "sha256:3789bcd60cd3392b59da24c5ba0379462389c1039d9b52b0c02750d16d9b1342",
  },
  "industry.wholesale × business": {
    template: WHOLESALE_TEMPLATE_MANIFEST,
    hash: "sha256:84e05a3f923d382df16dfb4bc778a1908e6808df208b4e2200f49ebdd9119151",
  },
  "industry.wholesale × enterprise": {
    template: WHOLESALE_TEMPLATE_MANIFEST,
    hash: "sha256:18b7dfc0ed5b45518ba8084925db3194a1bd091828c508e8b189190ac5ccf89d",
  },
  "industry.electronics × starter": {
    template: ELECTRONICS_TEMPLATE_MANIFEST,
    hash: "sha256:5b2230200542a7320039819c5239ddc80653e512412962f3ebc43a9770671454",
  },
  "industry.electronics × business": {
    template: ELECTRONICS_TEMPLATE_MANIFEST,
    hash: "sha256:1850ea7b17b8ef6451f320fa415c491d426b49168530c96fb6e13e5fdf39a232",
  },
  "industry.electronics × enterprise": {
    template: ELECTRONICS_TEMPLATE_MANIFEST,
    hash: "sha256:3a2552285eb34424667eb019af3b2ad32bc3c45061d8bf1de221f6390df34d5c",
  },
  "industry.healthcare × starter": {
    template: HEALTHCARE_TEMPLATE_MANIFEST,
    hash: "sha256:da3119398eae3f3e7ac1ccfbf4556092733804fcbf0db2d6ae42504931d4ec54",
  },
  "industry.healthcare × business": {
    template: HEALTHCARE_TEMPLATE_MANIFEST,
    hash: "sha256:0733cac98e119872f7bf5594beed44c5d2494fc723bfd1d95f2a47b6ca632516",
  },
  "industry.healthcare × enterprise": {
    template: HEALTHCARE_TEMPLATE_MANIFEST,
    hash: "sha256:bf139926deeeb14f6e85108bb3d1f3c21d29382e629b315411b5d1ac6700b591",
  },
  // -- PHASE-035 (migration 0047 seed; starter = blocked back-office —
  // the rental/crm intake chain is ungranted there, exactly the tier-4
  // posture of the 0025/0026/0027/0039/0040 templates before it)
  "industry.rental_logistics × starter": {
    template: RENTAL_LOGISTICS_TEMPLATE_MANIFEST,
    hash: "sha256:c6bb7c3d0dbc571c4d900fef159adb58229f047ef7c14dc9ed0b8d0b1605824f",
  },
  "industry.rental_logistics × business": {
    template: RENTAL_LOGISTICS_TEMPLATE_MANIFEST,
    hash: "sha256:ac34aadf700feb17647db74f0c9a66588e0f224afbbc3f08f173c61a700e0fce",
  },
  "industry.rental_logistics × enterprise": {
    template: RENTAL_LOGISTICS_TEMPLATE_MANIFEST,
    hash: "sha256:7b2f7d15fdb677b292e479f82f6741b4e09dc53e0c0059424f47b180abacf1b0",
  },
  // The platform-default tenant (no template applied — L1 neutral).
  "(no template) × business": {
    template: null,
    hash: "sha256:549459a64be39fa2a633379b10bcb38faeada91c687c309c7ff1d489ae2c2b94",
  },
});

const PLANS: Readonly<Record<string, PlanKey>> = Object.freeze({
  starter: "starter",
  business: "business",
  enterprise: "enterprise",
});

function planOf(caseName: string): PlanKey {
  const plan = caseName.split("×")[1]?.trim() as PlanKey | undefined;
  return PLANS[plan ?? ""] ?? "business";
}

describe("golden effective-configs: template × plan × jurisdiction SA (pinned hashes)", () => {
  for (const [caseName, golden] of Object.entries(GOLDEN)) {
    it(`${caseName} resolves to the pinned resolved_hash`, () => {
      const config = composeTenantStaticConfig(
        layerInputsFixture({ template: golden.template, plan: planOf(caseName) }),
      );
      // The pin: any resolution change that alters this hash fails CI
      // unless reviewed (§10 #2).
      expect(config.resolved_hash).toBe(golden.hash);
      // Re-composing is byte-stable.
      const again = composeTenantStaticConfig(
        layerInputsFixture({ template: golden.template, plan: planOf(caseName) }),
      );
      expect(again.resolved_hash).toBe(golden.hash);
      expect(again).toEqual(config);
    });
  }

  it("every golden fixture carries the §5 shape", () => {
    for (const [caseName, golden] of Object.entries(GOLDEN)) {
      const config = composeTenantStaticConfig(
        layerInputsFixture({ template: golden.template, plan: planOf(caseName) }),
      );
      expect(config.config_version).toBe(3);
      expect(config.tenant).toMatchObject({
        id: "01920000-0000-7000-8000-000000000001",
        jurisdiction: "SA",
        base_currency: "SAR",
      });
      expect(config.layers.l2_jurisdiction_pack).toMatchObject({
        country_code: "SA",
        pack_version: "1.0.0-baseline",
        vat_status: "VAT_IN_FORCE",
        tenant_registration: "REGISTERED",
      });
      expect(config.layers.l3_plan?.key).toBe(planOf(caseName));
      expect(config.layers.l3_plan?.limits).toMatchObject({
        users: { starter: 3, business: 10, enterprise: 50 }[planOf(caseName)],
      });
      expect(config.layers.l4_entitlements.active).toEqual(
        [...PLAN_KEYS[planOf(caseName)]].sort(),
      );
      expect(config.invariants_note).toContain("INV-022");
      // L1 block shape + manifest-hash provenance.
      if (golden.template === null) {
        expect(config.layers.l1_template).toBeNull();
        expect(config.tenant.industry_template).toBeNull();
      } else {
        expect(config.layers.l1_template).toEqual({
          key: golden.template.id,
          version: "1.0.0",
          terminology_overrides: Object.keys(golden.template.terminology_overrides).length,
        });
        expect(l1Of(golden.template).manifestHash).toBe(hashManifestJson(golden.template));
        // The retail/grocery/restaurant L1 defaults all auto-post cash
        // sales; the PHASE-017 pair (back-office workshop / van sales, not
        // POS-first) deliberately leaves the platform default in place.
        // PHASE-030 (restored): electronics auto-posts its counter cash sales
        // (POS-first like retail); wholesale is credit-first trading and
        // leaves the platform default in place.
        if (
          golden.template.id === "industry.retail" ||
          golden.template.id === "industry.grocery" ||
          golden.template.id === "industry.restaurant" ||
          golden.template.id === "industry.electronics"
        ) {
          expect(config.policies["sales.cash_autopost"]).toBe(true);
        } else {
          expect(config.policies["sales.cash_autopost"]).toBe(false);
        }
      }
    }
  });

  it("per-template golden structure (debuggability anchors beside the pins)", () => {
    // The platform-default tenant (no template) — computed once; the
    // manufacturing platform defaults anchor sits at the end of this test.
    const noTemplate = composeTenantStaticConfig(layerInputsFixture({ template: null }));
    expect(noTemplate.tenant.industry_template).toBeNull();

    // Retail on business: full closure, POS visible, no phase gates.
    const retail = composeTenantStaticConfig(
      layerInputsFixture({ template: RETAIL_MANIFEST, plan: "business" }),
    );
    expect(retail.layers.l4_entitlements.missing).toEqual([]);
    expect(retail.ui.navigation).toEqual(["selling", "stock"]);
    expect(retail.ui.emphasis).toEqual(["selling", "stock"]);
    expect(retail.ui.terminology["pos.terminal"]).toEqual({ en: "Terminal", ar: "الطرفية" });
    expect(retail.policies["inventory.fefo_for_expiry_items"]).toBe(false);

    // Grocery on starter: degraded (no POS, no batch tracking, no tiers).
    const grocery = composeTenantStaticConfig(
      layerInputsFixture({ template: GROCERY_MANIFEST, plan: "starter" }),
    );
    expect(grocery.layers.l4_entitlements.missing).toEqual([
      "distribution.customer_tiers",
      "industry.template_engine",
      "inventory.batch_tracking",
      "inventory.stock_counts",
      "pos.barcode_scanning",
      "pos.offline_queue",
      "pos.receipts",
      "pos.sales",
      "pos.terminals",
      "treasury.cashier_shifts",
    ]);
    // "selling" survives on the ungated tiers item (POS hides); "expiry"
    // items are all ungated core screens.
    expect(grocery.ui.navigation).toEqual(["selling", "expiry"]);
    expect(grocery.policies["inventory.fefo_for_expiry_items"]).toBe(true);
    expect(grocery.policies["expiry_writeoff_requires_approval"]).toBe(true);

    // Restaurant on business (PHASE-016 flipped): the floor entries are
    // LIVE (intake keys granted by the plan), nothing missing, RC combos on.
    const restaurant = composeTenantStaticConfig(
      layerInputsFixture({ template: RESTAURANT_MANIFEST, plan: "business" }),
    );
    expect(restaurant.layers.l4_entitlements.missing).toEqual([]);
    expect(restaurant.ui.navigation).toEqual(["floor", "day"]);
    expect(
      restaurant.ui.navigation_tree[0]?.items.filter((item) => item.phase_gated === "PHASE-016")
        .length,
    ).toBe(0);
    expect(restaurant.policies["numbering.purchase_order.assign_at"]).toBe("approval");
    expect(restaurant.policies["combo_explosion_at_posting"]).toBe(true);
    expect(restaurant.policies["service_charge_default_rate"]).toBe(0);

    // Automotive on business (PHASE-017): full closure on the 0025 plan
    // grants — the workshop set resolves LIVE (job cards included), the
    // workshop/parts navigation derives, and the job-card policies land.
    const automotive = composeTenantStaticConfig(
      layerInputsFixture({ template: AUTOMOTIVE_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(automotive.layers.l4_entitlements.missing).toEqual([]);
    expect(automotive.ui.navigation).toEqual(["workshop", "parts"]);
    const workshop = automotive.ui.navigation_tree.find((group) => group.id === "workshop")!;
    expect(workshop.items.map((item) => item.id)).toEqual(["job_cards", "vehicles", "quotes"]);
    expect(workshop.items.every((item) => item.phase_gated === undefined)).toBe(true);
    const parts = automotive.ui.navigation_tree.find((group) => group.id === "parts")!;
    expect(parts.items.map((item) => item.id)).toEqual(["parts_stock", "purchasing", "counter"]);
    // Terminology: AR + EN workshop labels (template > glossary).
    expect(automotive.ui.terminology["svc.job_card"]).toEqual({
      en: "Job card",
      ar: "بطاقة عمل",
    });
    expect(automotive.ui.terminology["svc.labor"]).toEqual({ en: "Labor", ar: "أجور العمل" });
    expect(automotive.ui.terminology["vehicle.chassis_no"]).toEqual({
      en: "Chassis number (VIN)",
      ar: "رقم الهيكل",
    });
    // Workflow policies + numbering (PO reserved at approval).
    expect(automotive.policies["job_card_parts_issue_mode"]).toBe("reserve");
    expect(automotive.policies["job_card_labor_rate_source"]).toBe("price_list");
    expect(automotive.policies["quotation_validity_days"]).toBe(7);
    expect(automotive.policies["warranty_credit_note_requires_original_invoice"]).toBe(true);
    expect(automotive.policies["numbering.job_card.assign_at"]).toBe("posting");
    expect(automotive.policies["numbering.purchase_order.assign_at"]).toBe("approval");
    expect(automotive.policies["inventory.fefo_for_expiry_items"]).toBe(false);

    // Distribution on business (PHASE-017): the field/settle groups resolve
    // with the full distribution module enabled, tier + settlement policies
    // land, and the van-sales terminology carries the Arabic field labels.
    const distribution = composeTenantStaticConfig(
      layerInputsFixture({ template: DISTRIBUTION_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(distribution.layers.l4_entitlements.missing).toEqual([]);
    expect(distribution.ui.navigation).toEqual(["field", "settle"]);
    expect(
      distribution.ui.navigation_tree.find((group) => group.id === "field")!.items.map(
        (item) => item.id,
      ),
    ).toEqual(["routes", "van_stock", "collections"]);
    expect(
      distribution.ui.navigation_tree.find((group) => group.id === "settle")!.items.map(
        (item) => item.id,
      ),
    ).toEqual(["rep_settlements", "commissions"]);
    expect(distribution.ui.terminology["route.route"]).toEqual({ en: "Route", ar: "خط السير" });
    expect(distribution.ui.terminology["van.load_out"]).toEqual({
      en: "Load-out",
      ar: "التحميل الصباحي",
    });
    expect(distribution.ui.terminology["settlement.rep_settlement"]).toEqual({
      en: "Rep settlement",
      ar: "تسوية المندوب",
    });
    expect(distribution.ui.terminology["hr.field_rep"]).toEqual({
      en: "Sales rep (van)",
      ar: "مندوب التوزيع",
    });
    expect(distribution.policies["van_loadout_requires_transfer"]).toBe(true);
    expect(distribution.policies["settlement_required_daily"]).toBe(true);
    expect(distribution.policies["tier_price_automatic_by_partner"]).toBe(true);
    expect(distribution.policies["free_goods_require_reason_code"]).toBe(true);
    expect(distribution.policies["inventory.fefo_for_expiry_items"]).toBe(true);
    expect(distribution.layers.l8_installed.distribution).toBe(true);

    // Food manufacturing on business (PHASE-018): the full manufacturing
    // set resolves LIVE on the 0026 grants — the production/trace groups
    // derive with the manufacturing module enabled, and the four §6
    // workflow policies land as L1 defaults (qc_gate required).
    const food = composeTenantStaticConfig(
      layerInputsFixture({ template: FOOD_MANUFACTURING_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(food.layers.l4_entitlements.missing).toEqual([]);
    expect(food.ui.navigation).toEqual(["production", "trace"]);
    const production = food.ui.navigation_tree.find((group) => group.id === "production")!;
    expect(production.items.map((item) => item.id)).toEqual(["recipes", "orders", "qc"]);
    expect(
      food.ui.navigation_tree.find((group) => group.id === "trace")!.items.map(
        (item) => item.id,
      ),
    ).toEqual(["genealogy", "expiry"]);
    expect(food.ui.terminology["mfg.recipe"]).toEqual({
      en: "Recipe (BOM)",
      ar: "الوصفة (قائمة المواد)",
    });
    expect(food.ui.terminology["mfg.qc_gate"]).toEqual({
      en: "QC gate",
      ar: "بوابة فحص الجودة",
    });
    expect(food.policies["manufacturing.qc_gate"]).toBe("required"); // L1 manifest default
    expect(food.policies["manufacturing.scrap_reason_required"]).toBe(true);
    expect(food.policies["manufacturing.fg_batch_expiry_from_shelf_life"]).toBe(true);
    expect(food.policies["manufacturing.consumption_variance_threshold_pct"]).toBe(5);
    expect(food.policies["inventory.fefo_for_expiry_items"]).toBe(true);
    expect(food.layers.l8_installed.manufacturing).toBe(true);

    // Professional services on business (PHASE-019): the full CRM+projects
    // set resolves LIVE on the 0027 grants — the practice/billing groups
    // derive with the crm module enabled, the §9 workflow policies land as
    // L1 defaults (contract_billing_mode retainer_or_milestones), and the
    // crm module installs (L8 from default_modules_enabled).
    const services = composeTenantStaticConfig(
      layerInputsFixture({ template: PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(services.layers.l4_entitlements.missing).toEqual([]);
    expect(services.ui.navigation).toEqual(["practice", "billing"]);
    const practiceGroup = services.ui.navigation_tree.find((group) => group.id === "practice")!;
    expect(practiceGroup.items.map((item) => item.id)).toEqual(["cases", "timesheets", "contracts"]);
    expect(
      services.ui.navigation_tree.find((group) => group.id === "billing")!.items.map(
        (item) => item.id,
      ),
    ).toEqual(["recurring", "invoices", "statements"]);
    expect(services.ui.terminology["svc.case"]).toEqual({
      en: "Case / Matter",
      ar: "القضية / الملف",
    });
    expect(services.ui.terminology["doc.contract"]).toEqual({
      en: "Service contract",
      ar: "عقد الخدمات",
    });
    expect(services.policies["crm.contract_billing_mode"]).toBe("retainer_or_milestones"); // L1 manifest default
    expect(services.policies["crm.time_entries_require_case"]).toBe(true);
    expect(services.policies["crm.unbilled_time_review_before_invoice"]).toBe(true);
    expect(services.policies["crm.invoice_approval_required"]).toBe(true);
    expect(services.policies["crm.invoice_numbering_per_series"]).toBe(false);
    expect(services.policies["crm.narrative_required_on_time_billing"]).toBe(true);
    expect(services.policies["inventory.fefo_for_expiry_items"]).toBe(false);
    expect(services.layers.l8_installed.crm).toBe(true);

    // Education on business (PHASE-032): the tuition chain resolves LIVE on
    // the 0038 grants — the enrollment/billing groups derive with the crm +
    // installments modules enabled, the six education workflow policies land
    // as L1 defaults under their raw registry keys (no settingsKey mapping —
    // the deliberate 0039 choice), and invoice_approval_required reuses the
    // PHASE-019 crm key.
    const education = composeTenantStaticConfig(
      layerInputsFixture({ template: EDUCATION_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(education.layers.l4_entitlements.missing).toEqual([]);
    expect(education.ui.navigation).toEqual(["enrollment", "billing"]);
    const enrollmentGroup = education.ui.navigation_tree.find(
      (group) => group.id === "enrollment",
    )!;
    expect(enrollmentGroup.items.map((item) => item.target)).toEqual([
      "crm.contracts",
      "partners.directory",
      "items.price_lists",
    ]);
    const tuitionGroup = education.ui.navigation_tree.find((group) => group.id === "billing")!;
    expect(tuitionGroup.items.map((item) => item.target)).toEqual([
      "installments.plans",
      "sales.invoices",
      "installments.collections",
      "treasury.receipts",
    ]);
    expect(enrollmentGroup.items.every((item) => item.phase_gated === undefined)).toBe(true);
    expect(tuitionGroup.items.every((item) => item.phase_gated === undefined)).toBe(true);
    expect(education.ui.terminology["partner.student"]).toEqual({
      en: "Student (financial file)",
      ar: "الطالب (الملف المالي)",
    });
    expect(education.ui.terminology["partner.guardian"]).toEqual({
      en: "Guardian (payer)",
      ar: "ولي الأمر (الدافع)",
    });
    expect(education.ui.terminology["doc.enrollment_contract"]).toEqual({
      en: "Enrollment contract",
      ar: "عقد الالتحاق",
    });
    expect(education.ui.terminology["billing.installment_plan"]).toEqual({
      en: "Installment plan",
      ar: "خطة الأقساط",
    });
    expect(education.policies["guardian_is_paying_partner"]).toBe(true); // L1 manifest default
    expect(education.policies["tuition_invoice_from_contract"]).toBe(true);
    expect(education.policies["installment_schedule_immutable_after_activation"]).toBe(true);
    expect(education.policies["late_fee_policy_per_plan"]).toBe(true);
    expect(education.policies["sibling_discount_line_level"]).toBe(true);
    expect(education.policies["dunning_cycle_before_late_fee"]).toBe(true);
    expect(education.policies["crm.invoice_approval_required"]).toBe(true); // the PHASE-019 reuse
    expect(education.policies["sales.cash_autopost"]).toBe(false); // back-office, never POS-first
    expect(education.policies["inventory.fefo_for_expiry_items"]).toBe(false);
    expect(education.layers.l8_installed.installments).toBe(true);
    expect(education.layers.l8_installed.crm).toBe(true);

    // Education on starter: degraded back-office — the tier-4 posture (the
    // 0038 grants skip starter exactly like the 0025/0026/0027 sets before
    // them): the installments + crm REQUIRED chain is uncovered.
    const educationStarter = composeTenantStaticConfig(
      layerInputsFixture({ template: EDUCATION_TEMPLATE_MANIFEST, plan: "starter" }),
    );
    expect(educationStarter.layers.l4_entitlements.missing).toEqual([
      "crm.service_contracts",
      "industry.template_engine",
      "installments.collections",
      "installments.late_fees",
      "installments.plans",
    ]);
    // The nav groups stay (ungated core targets render; the feature-keyed
    // items hide at the navigation-pruning layer, config-resolution.spec).

    // Agriculture on business (PHASE-033): the season chain resolves LIVE
    // entirely on the already-transcribed grants — the season/harvest groups
    // derive with the manufacturing module enabled, the four agriculture
    // workflow policies land as L1 defaults under their raw registry keys
    // (no settingsKey mapping — the 0039 precedent), and the two reused
    // PHASE-018 manufacturing keys carry the manifest values (crop loss
    // reason-coded; the 5% variance threshold — both identical to the
    // platform defaults, the template asserting the posture).
    const agriculture = composeTenantStaticConfig(
      layerInputsFixture({ template: AGRICULTURE_TEMPLATE_MANIFEST, plan: "business" }),
    );
    expect(agriculture.layers.l4_entitlements.missing).toEqual([]);
    expect(agriculture.ui.navigation).toEqual(["season", "harvest"]);
    const seasonGroup = agriculture.ui.navigation_tree.find((group) => group.id === "season")!;
    expect(seasonGroup.items.map((item) => item.target)).toEqual([
      "accounting.projects",
      "manufacturing.bom",
      "manufacturing.orders",
    ]);
    const harvestGroup = agriculture.ui.navigation_tree.find((group) => group.id === "harvest")!;
    expect(harvestGroup.items.map((item) => item.target)).toEqual([
      "inventory.batches",
      "sales.invoices",
      "inventory.serials",
    ]);
    expect(seasonGroup.items.every((item) => item.phase_gated === undefined)).toBe(true);
    expect(harvestGroup.items.every((item) => item.phase_gated === undefined)).toBe(true);
    expect(agriculture.ui.terminology["crop.item"]).toEqual({
      en: "Crop",
      ar: "المحصول",
    });
    expect(agriculture.ui.terminology["crop.cycle"]).toEqual({
      en: "Crop cycle",
      ar: "الدورة الزراعية",
    });
    expect(agriculture.ui.terminology["mfg.recipe"]).toEqual({
      en: "Crop-cycle recipe (BOM)",
      ar: "وصفة الدورة الزراعية (قائمة المواد)",
    });
    expect(agriculture.ui.terminology["harvest.batch"]).toEqual({
      en: "Harvest batch",
      ar: "دفعة الحصاد",
    });
    expect(agriculture.ui.terminology["farm.field"]).toEqual({
      en: "Farm / Field",
      ar: "المزرعة / الحقل",
    });
    expect(agriculture.ui.terminology["livestock.head"]).toEqual({
      en: "Livestock head",
      ar: "رأس",
    });
    expect(agriculture.ui.terminology["mfg.scrap"]).toEqual({
      en: "Crop loss",
      ar: "الفاقد",
    });
    expect(agriculture.policies["cycle_order_per_field_project"]).toBe(true); // L1 manifest default
    expect(agriculture.policies["harvest_batch_genealogy_enabled"]).toBe(true);
    expect(agriculture.policies["field_cost_center_mandatory_on_cycle"]).toBe(true);
    expect(agriculture.policies["livestock_serial_per_head"]).toBe(true);
    expect(agriculture.policies["manufacturing.scrap_reason_required"]).toBe(true); // the PHASE-018 reuse
    expect(agriculture.policies["manufacturing.consumption_variance_threshold_pct"]).toBe(5); // the PHASE-018 reuse
    expect(agriculture.policies["numbering.production_order.assign_at"]).toBe("approval"); // CYC reserved at release
    expect(agriculture.policies["sales.cash_autopost"]).toBe(false); // back-office, never POS-first
    expect(agriculture.policies["inventory.fefo_for_expiry_items"]).toBe(true); // FEFO produce picking
    expect(agriculture.layers.l8_installed.manufacturing).toBe(true);

    // Agriculture on starter: degraded back-office — the tier-4 posture (no
    // 0040 grants: the manufacturing/batch/projects REQUIRED chain is
    // uncovered, exactly the 0025/0026/0027/0039 posture). The nav groups
    // stay (the ungated fields + produce-sales targets render; the
    // feature-keyed recipes/cycles/batches/livestock items hide).
    const agricultureStarter = composeTenantStaticConfig(
      layerInputsFixture({ template: AGRICULTURE_TEMPLATE_MANIFEST, plan: "starter" }),
    );
    expect(agricultureStarter.layers.l4_entitlements.missing).toEqual([
      "accounting.cost_centers",
      "accounting.projects",
      "industry.template_engine",
      "inventory.batch_tracking",
      "manufacturing.bom",
      "manufacturing.production_orders",
    ]);
    expect(
      agricultureStarter.ui.navigation_tree.find((group) => group.id === "season")!.items.map(
        (item) => item.target,
      ),
    ).toEqual(["accounting.projects"]);
    expect(
      agricultureStarter.ui.navigation_tree.find((group) => group.id === "harvest")!.items.map(
        (item) => item.target,
      ),
    ).toEqual(["sales.invoices"]);

    // The platform defaults (no template): the four manufacturing keys ride
    // the SETTINGS_REGISTRY defaults into every tenant's policy map — the
    // manufacturing services read them via resolved config (PHASE-018 §6);
    // likewise the SEVEN PHASE-019 keys (§18 lesson 5: ALL golden rows move
    // because these land in every tenant's policies map).
    expect(noTemplate.policies["manufacturing.qc_gate"]).toBe("off");
    expect(noTemplate.policies["manufacturing.scrap_reason_required"]).toBe(true);
    expect(noTemplate.policies["manufacturing.fg_batch_expiry_from_shelf_life"]).toBe(true);
    expect(noTemplate.policies["manufacturing.consumption_variance_threshold_pct"]).toBe(5);
    expect(noTemplate.policies["crm.contract_billing_mode"]).toBe("retainer_or_milestones");
    expect(noTemplate.policies["crm.time_entries_require_case"]).toBe(true);
    expect(noTemplate.policies["crm.unbilled_time_review_before_invoice"]).toBe(true);
    expect(noTemplate.policies["crm.invoice_approval_required"]).toBe(true);
    expect(noTemplate.policies["crm.invoice_numbering_per_series"]).toBe(false);
    expect(noTemplate.policies["crm.narrative_required_on_time_billing"]).toBe(true);
    expect(noTemplate.policies["crm.defer_advance_recognition"]).toBe(false); // platform-only key
  });

  it("distinct inputs produce distinct pins (the pins are content, not form)", () => {
    const hashes = new Set(Object.values(GOLDEN).map((golden) => golden.hash));
    expect(hashes.size).toBe(Object.keys(GOLDEN).length);
  });

  it("a reviewed change updates exactly its pin (retail × business differs from starter)", () => {
    const starter = composeTenantStaticConfig(
      layerInputsFixture({ template: RETAIL_MANIFEST, plan: "starter" }),
    );
    expect(starter.resolved_hash).not.toBe(GOLDEN["industry.retail × business"]?.hash);
    expect(starter.resolved_hash).toBe(GOLDEN["industry.retail × starter"]?.hash);
  });
});
