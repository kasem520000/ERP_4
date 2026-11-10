import { Injectable } from "@nestjs/common";

import { type SavedView } from "@erp/contracts";

import {
  SavedViewNameTakenError,
  SavedViewNotFoundError,
  SavedViewNotYoursError,
} from "../domain/extensibility-errors";
import * as store from "../infrastructure/extensibility.store";

/**
 * Saved-views service (PHASE-036 T36-3, FD-02/FD-03): per-user list views
 * (columns/filters/sort snapshots) + the SHARED tenant views (user_id
 * NULL — publishing requires the settings.views.share permission; the
 * CONTROLLER enforces it before this service runs, exactly the matrix
 * layer-1 rule).
 */

@Injectable()
export class SavedViewsService {
  /** A user's usable views: their own + every shared view (shared first). */
  async list(entityKind: string, userId: string): Promise<readonly SavedView[]> {
    const rows = await store.listViews(entityKind, userId);
    return rows.map(toDto);
  }

  async create(
    actorId: string,
    input: {
      userId: string;
      entityKind: string;
      name: string;
      columns: string[];
      filters: Record<string, unknown>;
      sort: { column: string; dir: "asc" | "desc" }[] | null;
      isDefault: boolean;
      shared: boolean;
      canShare: boolean;
    },
  ): Promise<SavedView> {
    if (input.shared && !input.canShare) {
      // The permission gate re-checked at the service edge (defense in
      // depth — the controller already guarded the route).
      throw new SavedViewNotYoursError("new");
    }
    const ownerUserId = input.shared ? null : input.userId;
    const existing = await store.listViews(input.entityKind, input.userId);
    const sameOwner = existing.find(
      (view) => view.name === input.name
        && ((view.userId ?? null) === ownerUserId),
    );
    if (sameOwner !== undefined) {
      throw new SavedViewNameTakenError(input.name);
    }
    if (input.isDefault) {
      await store.clearDefaultView(input.entityKind, ownerUserId);
    }
    const row = await store.insertView({
      userId: ownerUserId,
      entityKind: input.entityKind,
      name: input.name,
      columns: input.columns,
      filters: input.filters,
      sort: input.sort,
      isDefault: input.isDefault,
      actorId,
    });
    return toDto(row);
  }

  async update(
    id: string,
    patch: {
      name?: string;
      columns?: string[];
      filters?: Record<string, unknown>;
      sort?: { column: string; dir: "asc" | "desc" }[] | null;
      isDefault?: boolean;
      canShare: boolean;
    },
  ): Promise<void> {
    const existing = await store.findViewById(id);
    if (existing === undefined) {
      throw new SavedViewNotFoundError(id);
    }
    if (patch.name !== undefined && patch.name !== existing.name) {
      throw new SavedViewNameTakenError(patch.name);
    }
    if (existing.userId === null && !patch.canShare) {
      throw new SavedViewNotYoursError(id);
    }
    if (patch.isDefault === true) {
      await store.clearDefaultView(existing.entityKind, existing.userId);
    }
    await store.updateView(id, patch);
  }

  async delete(id: string, userId: string, canShare: boolean): Promise<void> {
    const existing = await store.findViewById(id);
    if (existing === undefined) {
      throw new SavedViewNotFoundError(id);
    }
    if (existing.userId !== null && existing.userId !== userId && !canShare) {
      throw new SavedViewNotYoursError(id);
    }
    await store.deleteView(id);
  }
}

function toDto(row: store.SavedViewRow): SavedView {
  return {
    id: row.id,
    entityKind: row.entityKind as SavedView["entityKind"],
    userId: row.userId,
    name: row.name,
    columns: row.columns,
    filters: row.filters,
    sort: row.sort,
    isDefault: row.isDefault,
  };
}
