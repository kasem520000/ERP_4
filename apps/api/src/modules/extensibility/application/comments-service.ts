import { Inject, Injectable } from "@nestjs/common";

import { AuditService } from "../../audit/api/audit";
import {
  isCustomFieldEntityKind,
  type RecordComment,
  type TimelineEntry,
} from "@erp/contracts";

import { CommentBodyInvalidError } from "../domain/extensibility-errors";
import * as store from "../infrastructure/extensibility.store";

/**
 * Comments + timeline service (PHASE-036 T36-3, FD-14/FD-15): the
 * per-record collaboration thread (record_comments — append-only 🔒 at the
 * SQL level) composed with the EXISTING audit_events trail into one
 * newest-first timeline (the evaluation's "audit exists but no screen
 * shows it"). Mentions are parsed from the body as @uuid tokens and stored
 * data-only — notification delivery rides PHASE-052's fabric (no
 * fabrication).
 */

@Injectable()
export class CommentsService {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  async listComments(entityKind: string, entityId: string): Promise<readonly RecordComment[]> {
    const rows = await store.listComments(entityKind, entityId);
    return rows.map(toDto);
  }

  async create(
    actorId: string,
    input: { entityKind: string; entityId: string; body: string },
  ): Promise<RecordComment> {
    if (!isCustomFieldEntityKind(input.entityKind)) {
      throw new CommentBodyInvalidError();
    }
    const mentions = store.parseMentions(input.body);
    const row = await store.insertComment({
      authorId: actorId,
      entityKind: input.entityKind,
      entityId: input.entityId,
      body: input.body,
      mentions,
    });
    // The comment itself is the audit substrate (append-only 🔒); an audit
    // row per comment would duplicate the thread — the timeline composes
    // both stores instead. (Recorded in the phase §2 design.)
    return toDto(row);
  }

  /**
   * The timeline (FD-14): audit_events + record_comments for one record,
   * newest-first, capped (the UI drawer's feed). Audit rows carry the
   * actor + action + after-snapshot; comments carry the body + mentions.
   */
  async timeline(entityKind: string, entityId: string, limit = 100): Promise<readonly TimelineEntry[]> {
    const [auditRows, commentRows] = await Promise.all([
      this.audit.list({ entityType: entityKind.toLowerCase(), entityId, limit }),
      store.listComments(entityKind, entityId, limit),
    ]);
    const entries: TimelineEntry[] = [];
    for (const row of auditRows) {
      entries.push({
        kind: "audit",
        id: row.id,
        at: row.at,
        actorId: row.actorId ?? null,
        action: row.action,
        after: row.after ?? null,
      });
    }
    for (const row of commentRows) {
      entries.push({
        kind: "comment",
        id: row.id,
        at: row.createdAt,
        actorId: row.authorId,
        body: row.body,
        mentions: row.mentions ?? [],
      });
    }
    entries.sort((left, right) => (left.at < right.at ? 1 : left.at > right.at ? -1 : 0));
    return entries.slice(0, limit);
  }
}

function toDto(row: store.RecordCommentRow): RecordComment {
  return {
    id: row.id,
    entityKind: row.entityKind as RecordComment["entityKind"],
    entityId: row.entityId,
    authorId: row.authorId,
    authorName: row.authorName,
    body: row.body,
    mentions: row.mentions ?? [],
    createdAt: row.createdAt,
  };
}
