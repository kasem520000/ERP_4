/**
 * PHASE-036 golden re-pin helper (the §18 lesson-5 relay; run once per
 * SETTINGS-key wave, then the output lands in the spec + agent-ctx table):
 * prints every case's resolved_hash in the spec's GOLDEN order.
 *
 * Run: cd apps/api && npx tsx scripts/compute-goldens.ts
 */
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
} from "@erp/contracts";

import { composeTenantStaticConfig } from "../src/modules/configuration/application/resolve/compose";
import { layerInputsFixture, type PlanKey } from "../src/modules/configuration/__tests__/layer-fixtures";

type Template = Parameters<typeof composeTenantStaticConfig>[0]["template"];

const CASES: readonly [string, Template, PlanKey][] = [
  ["industry.retail × starter", RETAIL_MANIFEST, "starter"],
  ["industry.retail × business", RETAIL_MANIFEST, "business"],
  ["industry.retail × enterprise", RETAIL_MANIFEST, "enterprise"],
  ["industry.grocery × starter", GROCERY_MANIFEST, "starter"],
  ["industry.grocery × business", GROCERY_MANIFEST, "business"],
  ["industry.grocery × enterprise", GROCERY_MANIFEST, "enterprise"],
  ["industry.restaurant × starter", RESTAURANT_MANIFEST, "starter"],
  ["industry.restaurant × business", RESTAURANT_MANIFEST, "business"],
  ["industry.restaurant × enterprise", RESTAURANT_MANIFEST, "enterprise"],
  ["industry.automotive × starter", AUTOMOTIVE_TEMPLATE_MANIFEST, "starter"],
  ["industry.automotive × business", AUTOMOTIVE_TEMPLATE_MANIFEST, "business"],
  ["industry.automotive × enterprise", AUTOMOTIVE_TEMPLATE_MANIFEST, "enterprise"],
  ["industry.distribution × starter", DISTRIBUTION_TEMPLATE_MANIFEST, "starter"],
  ["industry.distribution × business", DISTRIBUTION_TEMPLATE_MANIFEST, "business"],
  ["industry.distribution × enterprise", DISTRIBUTION_TEMPLATE_MANIFEST, "enterprise"],
  ["industry.food_manufacturing × starter", FOOD_MANUFACTURING_TEMPLATE_MANIFEST, "starter"],
  ["industry.food_manufacturing × business", FOOD_MANUFACTURING_TEMPLATE_MANIFEST, "business"],
  ["industry.food_manufacturing × enterprise", FOOD_MANUFACTURING_TEMPLATE_MANIFEST, "enterprise"],
  ["industry.professional_services × starter", PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST, "starter"],
  ["industry.professional_services × business", PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST, "business"],
  ["industry.professional_services × enterprise", PROFESSIONAL_SERVICES_TEMPLATE_MANIFEST, "enterprise"],
  ["industry.education × starter", EDUCATION_TEMPLATE_MANIFEST, "starter"],
  ["industry.education × business", EDUCATION_TEMPLATE_MANIFEST, "business"],
  ["industry.education × enterprise", EDUCATION_TEMPLATE_MANIFEST, "enterprise"],
  ["industry.agriculture × starter", AGRICULTURE_TEMPLATE_MANIFEST, "starter"],
  ["industry.agriculture × business", AGRICULTURE_TEMPLATE_MANIFEST, "business"],
  ["industry.agriculture × enterprise", AGRICULTURE_TEMPLATE_MANIFEST, "enterprise"],
  ["industry.wholesale × starter", WHOLESALE_TEMPLATE_MANIFEST, "starter"],
  ["industry.wholesale × business", WHOLESALE_TEMPLATE_MANIFEST, "business"],
  ["industry.wholesale × enterprise", WHOLESALE_TEMPLATE_MANIFEST, "enterprise"],
  ["industry.electronics × starter", ELECTRONICS_TEMPLATE_MANIFEST, "starter"],
  ["industry.electronics × business", ELECTRONICS_TEMPLATE_MANIFEST, "business"],
  ["industry.electronics × enterprise", ELECTRONICS_TEMPLATE_MANIFEST, "enterprise"],
  ["industry.healthcare × starter", HEALTHCARE_TEMPLATE_MANIFEST, "starter"],
  ["industry.healthcare × business", HEALTHCARE_TEMPLATE_MANIFEST, "business"],
  ["industry.healthcare × enterprise", HEALTHCARE_TEMPLATE_MANIFEST, "enterprise"],
  ["industry.rental_logistics × starter", RENTAL_LOGISTICS_TEMPLATE_MANIFEST, "starter"],
  ["industry.rental_logistics × business", RENTAL_LOGISTICS_TEMPLATE_MANIFEST, "business"],
  ["industry.rental_logistics × enterprise", RENTAL_LOGISTICS_TEMPLATE_MANIFEST, "enterprise"],
  ["no-template × starter", null, "starter"],
  ["no-template × business", null, "business"],
  ["no-template × enterprise", null, "enterprise"],
];

for (const [name, template, plan] of CASES) {
  const config = composeTenantStaticConfig(layerInputsFixture({ template, plan }));
  console.log(`${name} ${config.resolved_hash}`);
}
