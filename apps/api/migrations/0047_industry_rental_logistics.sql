-- PHASE-035 · migration 0047 · industry rental & logistics template
-- (the thirteenth — the CAPABILITY_MATRIX §3 pending-intake set completed)
--
-- Purpose (PHASE-035 §4 T35-T1): industry.rental_logistics registers in the
-- industry_templates seed registry as a versioned CONFIGURATION ARTIFACT over
-- the existing modules, applied and switched through the UNMODIFIED
-- PHASE-015 engine (BR-038 additive-only). The PHASE-019 decision record
-- deferred the rental/logistics shell because its four capability keys were
-- pending FEATURE_CATALOG intake; PHASE-035 completes the §25 intake —
-- crm.rental_contracts / crm.contract_deposits / crm.late_fees /
-- distribution.shipment_tracking are full catalog rows now (FEATURE_DEPS) —
-- so this migration carries:
--
--   T1a · the plan grant wave (the 0027 convention): the four intake keys
--        join business + enterprise (starter does NOT get them — the rental
--        REQUIRED chain classifies the template blocked-on-starter, exactly
--        the tier-4 posture of the 0025/0026/0027/0039/0040 templates);
--   T1b · the manifest seed itself, transcribed VERBATIM from
--        packages/contracts/src/industry/templates.ts (the same source the
--        DB seed, the contracts constant, and the docs mirror keep
--        byte-equivalent under canonicalManifestJson).
--
-- §J report-key reconciliation (the 0025/0027/0039/0040/0044/0046
-- convention): the docs manifest pins partners.ar_aging → ar.aging (the
-- LIVE registry key) and lands the remaining pins on
-- services.contract_revenue_schedule / ar.aging / inventory.valuation —
-- rental.fleet_utilization / rental.late_fee_register /
-- logistics.shipment_status_board have no live report keys, so §J stays
-- closed: zero new report keys. treasury.cash_accounts (docs name) →
-- treasury.accounts (the LIVE catalog key). The navigation's
-- logistics.status_board item merges into the shipments item (one
-- milestone-board capability); capability_prerequisites reconcile to the
-- CAPABILITY_MATRIX §1 RNT column cell-for-cell (the strict
-- reconciliation set joins RNT).
--
-- This is an explicitly CONFIGURATION-ONLY migration on the template side:
-- NO new tables, columns, or posting rules (INV-022's configuration-only
-- posture). The four grant-wave keys are the §25 catalog intake's plan
-- grants (the FEATURE_CATALOG protocol step 3).
--
-- Idempotent upsert on key (SEEDS rule 2); the 0008 index rows converge to
-- the full manifest, is_active = true, status = 'ACTIVE'.
--> statement-breakpoint
SET ROLE erp_migrate;

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- T1a · the PHASE-035 intake plan grants (the 0027 array_cat convention):
-- the four completed-intake keys join business + enterprise. Enterprise
-- already carries none of them (they postdate every base seed); starter
-- does NOT get them. Idempotent, guarded.
--> statement-breakpoint
UPDATE "plans" SET "feature_keys" = array_cat("feature_keys",
  ARRAY['crm.rental_contracts', 'crm.contract_deposits',
        'crm.late_fees', 'distribution.shipment_tracking'])
WHERE "key" IN ('business', 'enterprise')
  AND NOT ('crm.rental_contracts' = ANY("feature_keys"));

--> statement-breakpoint
-- ---------------------------------------------------------------------------
-- T1b · the template registry seed: the PHASE-035 v1.0.0 manifest.
--> statement-breakpoint
INSERT INTO "industry_templates" ("key", "name", "name_ar", "version", "manifest", "is_active", "status") VALUES
  ('industry.rental_logistics', 'Rental & Logistics', 'التأجير والخدمات اللوجستية', '1.0.0',
   {
     "id": "industry.rental_logistics",
     "name": "Rental & Logistics",
     "name_ar": "التأجير والخدمات اللوجستية",
     "version": "1.0.0",
     "required_feature_keys": [
       "industry.template_engine",
       "crm.service_contracts",
       "crm.rental_contracts",
       "crm.contract_deposits",
       "crm.late_fees",
       "crm.recurring_billing",
       "distribution.shipment_tracking",
       "inventory.serial_tracking",
       "items.item_master",
       "partners.statements",
       "treasury.accounts"
     ],
     "default_modules_enabled": [
       "accounting",
       "partners",
       "items",
       "inventory",
       "sales",
       "treasury",
       "tax",
       "reporting",
       "crm",
       "distribution",
       "configuration"
     ],
     "terminology_overrides": {
       "rental.contract": {
         "en": "Rental contract",
         "ar": "عقد الإيجار"
       },
       "rental.reservation": {
         "en": "Reservation",
         "ar": "الحجز"
       },
       "rental.deposit": {
         "en": "Security deposit",
         "ar": "مبلغ التأمين"
       },
       "rental.late_fee": {
         "en": "Late fee",
         "ar": "رسوم التأخير"
       },
       "rental.pickup": {
         "en": "Pickup (check-out)",
         "ar": "الاستلام"
       },
       "rental.return": {
         "en": "Return (check-in)",
         "ar": "الإرجاع"
       },
       "rental.inspection": {
         "en": "Damage inspection",
         "ar": "فحص الأضرار"
       },
       "rental.fleet": {
         "en": "Fleet",
         "ar": "الأسطول"
       },
       "rental.utilization": {
         "en": "Utilization",
         "ar": "نسبة الاستغلال"
       },
       "rental.grace_period": {
         "en": "Grace period",
         "ar": "مدة السماح"
       },
       "logi.shipment": {
         "en": "Shipment",
         "ar": "الشحنة"
       },
       "logi.waybill": {
         "en": "Waybill",
         "ar": "بوليصة الشحن"
       },
       "logi.milestone": {
         "en": "Milestone",
         "ar": "تحديث حالة الشحنة"
       }
     },
     "navigation_manifest": {
       "groups": [
         {
           "id": "rental",
           "label": {
             "en": "Rental",
             "ar": "التأجير"
           },
           "order": 1,
           "items": [
             {
               "id": "reservations",
               "label": {
                 "en": "Reservations",
                 "ar": "الحجوزات"
               },
               "target": "crm.rental_contracts",
               "feature_key": "crm.rental_contracts"
             },
             {
               "id": "contracts",
               "label": {
                 "en": "Rental contracts",
                 "ar": "عقود الإيجار"
               },
               "target": "crm.contracts"
             },
             {
               "id": "fleet",
               "label": {
                 "en": "Fleet & assets",
                 "ar": "الأسطول والأصول"
               },
               "target": "items.item_master"
             },
             {
               "id": "returns",
               "label": {
                 "en": "Returns & inspections",
                 "ar": "الإرجاع والفحص"
               },
               "target": "crm.service_orders",
               "feature_key": "crm.service_orders"
             }
           ]
         },
         {
           "id": "logistics",
           "label": {
             "en": "Logistics",
             "ar": "الخدمات اللوجستية"
           },
           "order": 2,
           "items": [
             {
               "id": "shipments",
               "label": {
                 "en": "Shipments",
                 "ar": "الشحنات"
               },
               "target": "distribution.shipment_tracking",
               "feature_key": "distribution.shipment_tracking"
             }
           ]
         }
       ]
     },
     "workflow_policies": {
       "rental_deposit_required": true,
       "late_fee_after_grace_hours": 3,
       "late_fee_calculation": "daily_rate_based",
       "damage_charge_requires_inspection": true,
       "deposit_release_requires_manager_approval": true,
       "overdue_rental_blocks_new_reservation": true,
       "shipment_milestones_manual": true
     },
     "document_numbering_defaults": {
       "rental_contract": {
         "prefix": "RNT",
         "format": "RNT-{yyyy}-{seq:5}",
         "per_branch": true,
         "reserve_on_approval": true
       },
       "contract_invoice": {
         "prefix": "INV",
         "format": "INV-{yyyy}-{seq:6}",
         "per_branch": false,
         "reserve_on_approval": false
       },
       "receipt": {
         "prefix": "RCP",
         "format": "RCP-{yyyy}-{seq:6}",
         "per_branch": false,
         "reserve_on_approval": false
       },
       "payment": {
         "prefix": "PAY",
         "format": "PAY-{yyyy}-{seq:6}",
         "per_branch": false,
         "reserve_on_approval": false
       },
       "shipment": {
         "prefix": "SHP",
         "format": "SHP-{yyyy}-{seq:6}",
         "per_branch": false,
         "reserve_on_approval": false
       }
     },
     "inventory_policy_defaults": {
       "costing_method": "WAC",
       "default_track_batch": false,
       "default_track_expiry": false,
       "default_track_serial": true,
       "default_imei_tracking": false,
       "fefo_picking": false,
       "allow_negative_stock": false
     },
     "report_defaults": [
       {
         "report_key": "services.contract_revenue_schedule",
         "pinned": true,
         "dashboard": true,
         "default_period": "this_month"
       },
       {
         "report_key": "ar.aging",
         "pinned": true,
         "dashboard": true,
         "default_period": "this_month"
       },
       {
         "report_key": "inventory.valuation",
         "pinned": true,
         "dashboard": false,
         "default_period": "custom"
       }
     ],
     "onboarding_steps": [
       {
         "id": "coa_confirm",
         "title": {
           "en": "Confirm chart of accounts (customer deposits liability)",
           "ar": "تأكيد دليل الحسابات (التزامات تأمينات العملاء)"
         },
         "required": true
       },
       {
         "id": "fleet",
         "title": {
           "en": "Register fleet/assets as serial items",
           "ar": "تسجيل الأسطول/الأصول كأصناف متسلسلة"
         },
         "required": true
       },
       {
         "id": "rate_cards",
         "title": {
           "en": "Rental rate cards",
           "ar": "تعريفات التأجير"
         },
         "required": true
       },
       {
         "id": "customers",
         "title": {
           "en": "Customers & ID documents",
           "ar": "العملاء ووثائق الهوية"
         },
         "required": true
       },
       {
         "id": "deposit_policy",
         "title": {
           "en": "Deposit & late-fee policy",
           "ar": "سياسة التأمين ورسوم التأخير"
         },
         "required": true
       },
       {
         "id": "first_contract",
         "title": {
           "en": "Run first rental contract end-to-end",
           "ar": "تنفيذ أول عقد إيجار كامل"
         },
         "required": false
       },
       {
         "id": "shipments",
         "title": {
           "en": "Configure shipment milestones (logistics)",
           "ar": "تهيئة حالات الشحنات (اللوجستيات)"
         },
         "required": false,
         "feature_key": "distribution.shipment_tracking"
       }
     ],
     "capability_prerequisites": {
       "rental_contracts": {
         "level": "REQUIRED",
         "feature_keys": [
           "crm.rental_contracts"
         ],
         "available_from_phase": "PHASE-035"
       },
       "service_contracts": {
         "level": "REQUIRED",
         "feature_keys": [
           "crm.service_contracts"
         ],
         "available_from_phase": "PHASE-019"
       },
       "recurring_billing": {
         "level": "REQUIRED",
         "feature_keys": [
           "crm.recurring_billing"
         ],
         "available_from_phase": "PHASE-019"
       },
       "deposits_late_fees": {
         "level": "REQUIRED",
         "feature_keys": [
           "crm.contract_deposits",
           "crm.late_fees"
         ],
         "available_from_phase": "PHASE-035"
       },
       "shipment_tracking": {
         "level": "REQUIRED",
         "feature_keys": [
           "distribution.shipment_tracking"
         ],
         "available_from_phase": "PHASE-035"
       },
       "field_collections": {
         "level": "REQUIRED",
         "feature_keys": [
           "treasury.receipts_disbursements"
         ],
         "available_from_phase": "PHASE-017"
       },
       "job_cards": {
         "level": "OPTIONAL",
         "feature_keys": [
           "sales.job_cards"
         ],
         "available_from_phase": "PHASE-017"
       },
       "customer_price_tiers": {
         "level": "OPTIONAL",
         "feature_keys": [
           "items.price_lists",
           "distribution.customer_tiers"
         ],
         "available_from_phase": "PHASE-017"
       },
       "commissions": {
         "level": "OPTIONAL",
         "feature_keys": [
           "sales.commissions"
         ],
         "available_from_phase": "PHASE-017"
       },
       "route_planning": {
         "level": "OPTIONAL",
         "feature_keys": [
           "distribution.routes"
         ],
         "available_from_phase": "PHASE-017"
       },
       "barcode_pos": {
         "level": "OPTIONAL",
         "feature_keys": [
           "pos.terminals",
           "pos.sales",
           "pos.receipts"
         ],
         "available_from_phase": "PHASE-016"
       },
       "cashier_shifts": {
         "level": "OPTIONAL",
         "feature_keys": [
           "treasury.cashier_shifts"
         ],
         "available_from_phase": "PHASE-016"
       },
       "pdc_notes": {
         "level": "OPTIONAL",
         "feature_keys": [
           "notes.received",
           "notes.pdc_calendar"
         ],
         "available_from_phase": "PHASE-027"
       },
       "installment_terms": {
         "level": "OPTIONAL",
         "feature_keys": [
           "installments.plans",
           "installments.late_fees"
         ],
         "available_from_phase": "PHASE-027"
       }
     }
   }   '::jsonb, true, 'ACTIVE')
ON CONFLICT ("key") DO UPDATE
  SET "name" = EXCLUDED."name", "name_ar" = EXCLUDED."name_ar",
      "version" = EXCLUDED."version", "manifest" = EXCLUDED."manifest",
      "is_active" = true, "status" = 'ACTIVE';

--> statement-breakpoint
RESET ROLE;

--> statement-breakpoint
-- Schema-state marker for /health/ready (mirrors the migration manifest).
INSERT INTO erp._schema_state (key, value) VALUES ('schema_version', 47)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, at = now();
