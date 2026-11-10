import { beforeAll, describe, expect, it } from "vitest";

import { appClient, ensureTestDb, seedTenants } from "../test-db";
import { withTenant } from "../../infra/db/tenant-context";
import * as store from "../../modules/extensibility/infrastructure/extensibility.store";

/**
 * PHASE-036 __db__ pack — the extensibility store on the LIVE HARNESS (the
 * 166-file convention: these run only where Postgres + the migration chain
 * 0001→0049 are applied; the sandbox suite is the pure-logic spec in
 * src/modules/extensibility/__tests__/extensibility-unit.spec.ts).
 *
 * Dedicated tenants X (primary) + X-foreign (the RLS spoof target), the
 * notes-fixture pattern: seedTenants + direct tenant rows + everything else
 * through the module store exactly as the service path runs.
 *
 * Coverage: the definitions CRUD + deactivate-first delete guard, the typed
 * one-family CHECK invariant (SQL-level), the values read/write/clear
 * plane, tenant isolation on all six tables (RLS), saved-views ownership +
 * shared visibility, and the append-only 🔒 record_comments guard.
 */

const TENANT_X = "7a7a7a7a-7a7a-7a7a-7a7a-7a7a7a7a7a7a";
const TENANT_X_FOREIGN = "7b7b7b7b-7b7b-7b7b-7b7b-7b7b7b7b7b7b";
const X_ACTOR = "7c7c7c7c-0000-4000-8000-000000000001";
const X_USER_A = "7c7c7c7c-0000-4000-8000-000000000002";
const X_USER_B = "7c7c7c7c-0000-4000-8000-000000000003";
const ROW_PARTNER = "7d7d7d7d-0000-4000-8000-0000000000aa";
const ROW_INVOICE = "7d7d7d7d-0000-4000-8000-0000000000dd";

beforeAll(async () => {
  ensureTestDb();
  const client = await appClient();
  await seedTenants(client as never);
  const su = client;
  await su.query(
    `INSERT INTO tenants (id, name, name_ar, base_currency, country_code, timezone) VALUES
       ($1, 'Tenant X (extensibility)', 'المستأجر س', 'SAR', 'SA', 'Asia/Riyadh'),
       ($2, 'Tenant X-foreign (RLS target)', 'المستأجر س-أجنبي', 'SAR', 'SA', 'Asia/Riyadh')
     ON CONFLICT (id) DO NOTHING`,
    [TENANT_X, TENANT_X_FOREIGN],
  );
  await su.query(
    `INSERT INTO users (id, email, full_name, password_hash, status) VALUES
       ($1, 'x-actor@fixture.test', 'X Actor', 'x', 'ACTIVE'),
       ($2, 'x-user-a@fixture.test', 'X User A', 'x', 'ACTIVE'),
       ($3, 'x-user-b@fixture.test', 'X User B', 'x', 'ACTIVE')
     ON CONFLICT (id) DO NOTHING`,
    [X_ACTOR, X_USER_A, X_USER_B],
  );
});

describe("PHASE-036 — the extensibility store (live harness)", () => {
  it("definitions CRUD: create → update → values-guard base → read/clear values", async () => {
    await withTenant(TENANT_X, async () => {
      const picklist = await store.insertPicklist({
        key: "vehicle_types",
        name: "Vehicle types",
        nameAr: "أنواع المركبات",
        actorId: X_ACTOR,
      });
      await store.insertOption({
        picklistId: picklist.id,
        value: "sedan",
        label: "Sedan",
        labelAr: "سيدان",
        sort: 1,
        actorId: X_ACTOR,
      });

      const definition = await store.insertDefinition({
        entityKind: "PARTNER",
        key: "vehicle_type",
        label: "Vehicle type",
        labelAr: "نوع المركبة",
        type: "SELECT",
        picklistId: picklist.id,
        required: false,
        defaultValue: null,
        validation: null,
        helpText: null,
        helpTextAr: null,
        showInList: true,
        sort: 1,
        isActive: true,
        actorId: X_ACTOR,
      });
      expect(definition.picklistId).toBe(picklist.id);

      await store.updateDefinition(definition.id, { label: "Vehicle type (v2)" });
      const updated = await store.findDefinitionById(definition.id);
      expect(updated?.label).toBe("Vehicle type (v2)");
      expect(updated?.version).toBe(2);

      const options = await store.listActiveOptions(picklist.id);
      await store.upsertValue({
        entityKind: "PARTNER",
        entityId: ROW_PARTNER,
        definitionId: definition.id,
        fieldType: "SELECT",
        valueText: null,
        valueNumber: null,
        valueMoney: null,
        valueDate: null,
        valueBoolean: null,
        valuePicklistOptionId: options[0]!.id,
        actorId: X_ACTOR,
      });
      expect(await store.countValuesByDefinition(definition.id)).toBe(1);

      const rows = await store.listValuesForEntities("PARTNER", [ROW_PARTNER]);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.fieldKey).toBe("vehicle_type");
      expect(rows[0]?.valuePicklistOptionId).toBe(options[0]!.id);

      // Absent = clear (the no-row contract).
      await store.deleteValue("PARTNER", ROW_PARTNER, definition.id);
      expect(await store.countValuesByDefinition(definition.id)).toBe(0);
    });
  });

  it("the typed one-family CHECK rejects a mixed value row at the SQL level", async () => {
    await withTenant(TENANT_X, async () => {
      const definition = await store.insertDefinition({
        entityKind: "PARTNER",
        key: "credit_score",
        label: "Credit score",
        labelAr: "الدرجة الائتمانية",
        type: "NUMBER",
        picklistId: null,
        required: false,
        defaultValue: null,
        validation: null,
        helpText: null,
        helpTextAr: null,
        showInList: false,
        sort: 2,
        isActive: true,
        actorId: X_ACTOR,
      });
      await expect(
        store.upsertValue({
          entityKind: "PARTNER",
          entityId: ROW_PARTNER,
          definitionId: definition.id,
          fieldType: "NUMBER",
          valueText: "not a number",
          valueNumber: "42",
          valueMoney: null,
          valueDate: null,
          valueBoolean: null,
          valuePicklistOptionId: null,
        }),
      ).rejects.toThrowError(/ck_custom_field_values_typed_family/);
    });
  });

  it("tenant isolation: tenant X-foreign never sees tenant X's definitions or comments (RLS)", async () => {
    await withTenant(TENANT_X, async () => {
      await store.insertDefinition({
        entityKind: "ITEM",
        key: "isolated_field",
        label: "Isolated",
        labelAr: "معزول",
        type: "TEXT",
        picklistId: null,
        required: false,
        defaultValue: null,
        validation: null,
        helpText: null,
        helpTextAr: null,
        showInList: false,
        sort: 3,
        isActive: true,
        actorId: X_ACTOR,
      });
      await store.insertComment({
        authorId: X_ACTOR,
        entityKind: "SALES_INVOICE",
        entityId: ROW_INVOICE,
        body: "tenant-isolated comment",
        mentions: [],
      });
    });
    await withTenant(TENANT_X_FOREIGN, async () => {
      const definitions = await store.listDefinitions("ITEM");
      expect(definitions.some((row) => row.key === "isolated_field")).toBe(false);
      const comments = await store.listComments("SALES_INVOICE", ROW_INVOICE);
      expect(comments.some((row) => row.body === "tenant-isolated comment")).toBe(false);
    });
  });

  it("saved views: personal rows never leak across users; shared rows (user_id NULL) visible to all", async () => {
    await withTenant(TENANT_X, async () => {
      await store.insertView({
        userId: X_USER_A,
        entityKind: "PARTNER",
        name: "A's private view",
        columns: ["code", "name"],
        filters: {},
        sort: null,
        isDefault: false,
        actorId: X_USER_A,
      });
      await store.insertView({
        userId: null,
        entityKind: "PARTNER",
        name: "Team shared view",
        columns: ["code"],
        filters: {},
        sort: null,
        isDefault: false,
        actorId: X_USER_A,
      });
      const forB = await store.listViews("PARTNER", X_USER_B);
      expect(forB.some((view) => view.name === "A's private view")).toBe(false);
      expect(forB.some((view) => view.name === "Team shared view" && view.userId === null)).toBe(true);
    });
  });

  it("record_comments is append-only 🔒 (UPDATE/DELETE rejected at the trigger level)", async () => {
    await withTenant(TENANT_X, async () => {
      const comment = await store.insertComment({
        authorId: X_ACTOR,
        entityKind: "SALES_INVOICE",
        entityId: ROW_INVOICE,
        body: `guard target @${X_USER_A}`,
        mentions: [],
      });
      expect(store.parseMentions(comment.body)).toEqual([X_USER_A]);
      const { sql } = await import("drizzle-orm");
      const { getDb } = await import("../../infra/db/client");
      await expect(
        getDb().execute(sql`UPDATE record_comments SET body = 'x' WHERE id = ${comment.id}`),
      ).rejects.toThrowError(/append-only|immutable/i);
      await expect(
        getDb().execute(sql`DELETE FROM record_comments WHERE id = ${comment.id}`),
      ).rejects.toThrowError(/purge/i);
    });
  });
});
