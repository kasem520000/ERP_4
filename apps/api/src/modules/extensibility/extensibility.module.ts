import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { ExtensibilityService } from "./application/extensibility-service";
import { SavedViewsService } from "./application/saved-views-service";
import { CommentsService } from "./application/comments-service";
import { ExtensibilityController } from "./presentation/extensibility.controller";

/**
 * Extensibility module (PHASE-036): the custom-fields engine + picklists +
 * saved views + record comments/timeline — the extensibility backbone the
 * later phases (workflow, RMA, HR) build on.
 *
 * Dependencies (DEPENDENCY_RULES §2): audit (the timeline composes the
 * audit trail; comments are their own append-only 🔒 store). NO posting-
 * engine dependency — INV-027: custom fields are DATA dimensions only.
 *
 * The bulk-actions + list-export conventions are exported as plain
 * functions (application/bulk-actions.ts + application/list-export.ts) —
 * the owning modules' controllers import them directly (no cross-module
 * service coupling; the convention is the contract, the surface owns the
 * lifecycle).
 */
@Module({
  imports: [AuditModule],
  controllers: [ExtensibilityController],
  providers: [ExtensibilityService, SavedViewsService, CommentsService],
  exports: [ExtensibilityService, SavedViewsService, CommentsService],
})
export class ExtensibilityModule {}
