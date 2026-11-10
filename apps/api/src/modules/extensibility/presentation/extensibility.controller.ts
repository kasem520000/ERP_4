import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, Req, Delete } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";

import { identityOf, type SessionContext } from "../../../infra/context/session-context";
import { UnauthenticatedError } from "../../identity/api/identity";
import { RequirePermissions } from "../../../infra/auth/require-permissions.decorator";
import { RequireFeature } from "../../../infra/auth/require-feature.decorator";
import { envelope } from "../../../infra/http/envelope";
import {
  customFieldCreatePayloadSchema,
  customFieldUpdatePayloadSchema,
  customFieldValuesWritePayloadSchema,
  customPicklistCreatePayloadSchema,
  recordCommentCreatePayloadSchema,
  savedViewCreatePayloadSchema,
  isCustomFieldEntityKind,
} from "@erp/contracts";

import { ExtensibilityService } from "../application/extensibility-service";
import { SavedViewsService } from "../application/saved-views-service";
import { CommentsService } from "../application/comments-service";

/**
 * Extensibility routes (PHASE-036 §4; matrix §3.16): the custom-fields
 * definitions manager + picklists + values plane + saved views + comments
 * + timeline.
 *
 * Permission mapping (the §3.16 set + the self planes):
 *   - definitions/values PICKLISTS reads + values writes: every
 *     authenticated member (the notifications self-plane pattern — forms
 *     render for everyone; the matrix carries no key);
 *   - definitions/picklists management: settings.custom_fields.manage /
 *     settings.picklists.manage + the platform.custom_fields /
 *     platform.custom_picklists feature keys (BR-039 both layers);
 *   - saved views: personal = self plane; the SHARED flag additionally
 *     requires settings.views.share (checked route-side AND service-side —
 *     defense in depth);
 *   - comments/timeline: every authenticated member (tenant-scoped data).
 *
 * The bulk + export routes live on their owning modules' controllers (the
 * surface owns its lifecycle permissions); this controller owns the shared
 * conventions they call.
 */

function requireIdentity(request: Request): SessionContext {
  const identity = identityOf(request);
  if (identity === undefined) {
    throw new UnauthenticatedError();
  }
  return identity;
}

const UUID = z.string().uuid();
const ENTITY = z.string().refine((value) => isCustomFieldEntityKind(value), {
  message: "unknown custom-field entity kind",
});

@Controller("api/v1")
export class ExtensibilityController {
  constructor(
    private readonly extensibility: ExtensibilityService,
    private readonly views: SavedViewsService,
    private readonly comments: CommentsService,
  ) {}

  // -- custom-field definitions ---------------------------------------------------

  @Get("settings/custom-fields")
  async listDefinitions(@Query("entity") entity?: string): Promise<unknown> {
    return envelope(await this.extensibility.listDefinitions(entity));
  }

  @Post("settings/custom-fields")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("settings.custom_fields.manage")
  @RequireFeature("platform.custom_fields")
  async createDefinition(@Req() request: Request, @Body() body: unknown): Promise<unknown> {
    const identity = requireIdentity(request);
    const input = customFieldCreatePayloadSchema.parse(body);
    return envelope(await this.extensibility.createDefinition(identity.userId, input));
  }

  @Patch("settings/custom-fields/:id")
  @RequirePermissions("settings.custom_fields.manage")
  @RequireFeature("platform.custom_fields")
  async updateDefinition(@Req() request: Request, @Param("id") id: string, @Body() body: unknown): Promise<unknown> {
    const identity = requireIdentity(request);
    const patch = customFieldUpdatePayloadSchema.parse(body);
    return envelope(await this.extensibility.updateDefinition(identity.userId, id, patch));
  }

  @Delete("settings/custom-fields/:id")
  @RequirePermissions("settings.custom_fields.manage")
  @RequireFeature("platform.custom_fields")
  async deleteDefinition(@Req() request: Request, @Param("id") id: string): Promise<unknown> {
    const identity = requireIdentity(request);
    await this.extensibility.deleteDefinition(identity.userId, id);
    return envelope({ deleted: true });
  }

  // -- custom-field values (the batch read + write plane) --------------------------

  @Get("settings/custom-fields/values")
  async readValues(
    @Query("entity") entity: string,
    @Query("ids") ids: string,
  ): Promise<unknown> {
    ENTITY.parse(entity);
    const idList = ids
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .slice(0, 200);
    for (const id of idList) {
      UUID.parse(id);
    }
    return envelope(await this.extensibility.readValues(entity, idList));
  }

  @Put("settings/custom-fields/values")
  async writeValues(@Req() request: Request, @Body() body: unknown): Promise<unknown> {
    const identity = requireIdentity(request);
    const input = customFieldValuesWritePayloadSchema.parse(body);
    await this.extensibility.writeValues(identity.userId, input);
    return envelope({ written: Object.keys(input.values).length });
  }

  // -- picklists (FD-20) -------------------------------------------------------------

  @Get("settings/picklists")
  async listPicklists(): Promise<unknown> {
    return envelope(await this.extensibility.listPicklists());
  }

  @Post("settings/picklists")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("settings.picklists.manage")
  @RequireFeature("platform.custom_picklists")
  async createPicklist(@Req() request: Request, @Body() body: unknown): Promise<unknown> {
    const identity = requireIdentity(request);
    const input = customPicklistCreatePayloadSchema.parse(body);
    const picklist = await this.extensibility.createPicklist(identity.userId, {
      key: input.key,
      name: input.name,
      nameAr: input.nameAr,
    });
    for (const option of input.options) {
      await this.extensibility.addOption(identity.userId, picklist.id, {
        value: option.value,
        label: option.label,
        labelAr: option.labelAr,
        sort: option.sort,
      });
    }
    return envelope(picklist);
  }

  @Patch("settings/picklists/:id")
  @RequirePermissions("settings.picklists.manage")
  @RequireFeature("platform.custom_picklists")
  async updatePicklist(@Req() request: Request, @Param("id") id: string, @Body() body: unknown): Promise<unknown> {
    const identity = requireIdentity(request);
    const patch = z
      .object({
        name: z.string().min(1).max(120).optional(),
        nameAr: z.string().min(1).max(120).optional(),
        isActive: z.boolean().optional(),
      })
      .strict()
      .parse(body);
    await this.extensibility.updatePicklist(identity.userId, id, patch);
    return envelope({ updated: true });
  }

  @Delete("settings/picklists/:id")
  @RequirePermissions("settings.picklists.manage")
  @RequireFeature("platform.custom_picklists")
  async deletePicklist(@Req() request: Request, @Param("id") id: string): Promise<unknown> {
    const identity = requireIdentity(request);
    await this.extensibility.deletePicklist(identity.userId, id);
    return envelope({ deleted: true });
  }

  @Post("settings/picklists/:id/options")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("settings.picklists.manage")
  @RequireFeature("platform.custom_picklists")
  async addOption(@Req() request: Request, @Param("id") id: string, @Body() body: unknown): Promise<unknown> {
    const identity = requireIdentity(request);
    const input = z
      .object({
        value: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,59}$/),
        label: z.string().min(1).max(120),
        labelAr: z.string().min(1).max(120),
        sort: z.number().int().default(0),
      })
      .strict()
      .parse(body);
    return envelope(await this.extensibility.addOption(identity.userId, id, input));
  }

  @Delete("settings/picklists/options/:id")
  @RequirePermissions("settings.picklists.manage")
  @RequireFeature("platform.custom_picklists")
  async deleteOption(@Req() request: Request, @Param("id") id: string): Promise<unknown> {
    const identity = requireIdentity(request);
    await this.extensibility.deleteOption(identity.userId, id);
    return envelope({ deleted: true });
  }

  // -- saved views (FD-02/FD-03) -----------------------------------------------------

  @Get("settings/views")
  async listViews(@Req() request: Request, @Query("entity") entity: string): Promise<unknown> {
    const identity = requireIdentity(request);
    ENTITY.parse(entity);
    return envelope(await this.views.list(entity, identity.userId));
  }

  @Post("settings/views")
  @HttpCode(HttpStatus.CREATED)
  async createView(@Req() request: Request, @Body() body: unknown): Promise<unknown> {
    const identity = requireIdentity(request);
    const input = savedViewCreatePayloadSchema.parse(body);
    return envelope(
      await this.views.create(identity.userId, {
        userId: identity.userId,
        entityKind: input.entityKind,
        name: input.name,
        columns: input.columns,
        filters: input.filters,
        sort: input.sort ?? null,
        isDefault: input.isDefault,
        shared: input.shared,
        canShare: identity.permissions?.has("settings.views.share") === true,
      }),
    );
  }

  @Patch("settings/views/:id")
  async updateView(@Req() request: Request, @Param("id") id: string, @Body() body: unknown): Promise<unknown> {
    const identity = requireIdentity(request);
    const patch = z
      .object({
        name: z.string().min(1).max(120).optional(),
        columns: z.array(z.string()).max(60).optional(),
        filters: z.record(z.string(), z.unknown()).optional(),
        sort: z
          .array(z.object({ column: z.string(), dir: z.enum(["asc", "desc"]) }))
          .max(6)
          .nullable()
          .optional(),
        isDefault: z.boolean().optional(),
      })
      .strict()
      .parse(body);
    await this.views.update(id, {
      ...patch,
      canShare: identity.permissions?.has("settings.views.share") === true,
    });
    return envelope({ updated: true });
  }

  @Delete("settings/views/:id")
  async deleteView(@Req() request: Request, @Param("id") id: string): Promise<unknown> {
    const identity = requireIdentity(request);
    await this.views.delete(
      id,
      identity.userId,
      identity.permissions?.has("settings.views.share") === true,
    );
    return envelope({ deleted: true });
  }

  // -- comments + timeline (FD-14/FD-15) ----------------------------------------------

  @Get("extensibility/timeline")
  async timeline(
    @Req() request: Request,
    @Query("entity") entity: string,
    @Query("id") id: string,
    @Query("limit") limit?: string,
  ): Promise<unknown> {
    requireIdentity(request);
    ENTITY.parse(entity);
    UUID.parse(id);
    const parsedLimit = limit === undefined ? 100 : z.coerce.number().int().min(1).max(500).parse(limit);
    return envelope(await this.comments.timeline(entity, id, parsedLimit));
  }

  @Get("extensibility/comments")
  async listComments(@Query("entity") entity: string, @Query("id") id: string): Promise<unknown> {
    ENTITY.parse(entity);
    UUID.parse(id);
    return envelope(await this.comments.listComments(entity, id));
  }

  @Post("extensibility/comments")
  @HttpCode(HttpStatus.CREATED)
  async createComment(@Req() request: Request, @Body() body: unknown): Promise<unknown> {
    const identity = requireIdentity(request);
    const input = recordCommentCreatePayloadSchema.parse(body);
    return envelope(await this.comments.create(identity.userId, input));
  }
}
