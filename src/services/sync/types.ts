import { z } from "zod";

export type SyncEntityType =
  | "courses"
  | "tasks"
  | "subtasks"
  | "events"
  | "focus_sessions"
  | "user_preferences";

export type SyncStatus = "idle" | "syncing" | "paused" | "error";

export interface SyncEntityRecord {
  id: string;
  entityType: SyncEntityType;
  data: Record<string, unknown>;
  clientUpdatedAt: number;
  serverUpdatedAt?: number;
  serverSeq?: number;
  deletedAt?: number | null;
}

export interface PushChangesRequest {
  deviceId: string;
  clientTimestamp: number;
  changes: Array<{
    entityType: SyncEntityType;
    id: string;
    action: "upsert" | "delete";
    data: Record<string, unknown>;
    clientUpdatedAt: number;
    deletedAt?: number | null;
  }>;
}

export interface PushChangesResponse {
  accepted: boolean;
  serverTimestamp: number;
  syncedRecords: Array<{
    id: string;
    entityType: SyncEntityType;
    serverUpdatedAt: number;
    serverSeq: number;
  }>;
  conflicts: Array<{
    id: string;
    entityType: SyncEntityType;
    winningRecord: Record<string, unknown>;
    serverSeq: number;
    serverUpdatedAt: number;
  }>;
}

export interface PullChangesRequest {
  deviceId: string;
  sinceServerSeq: number;
  limit?: number;
}

export interface PullChangesResponse {
  currentServerSeq: number;
  serverTimestamp: number;
  records: Array<{
    id: string;
    entityType: SyncEntityType;
    data: Record<string, unknown>;
    serverUpdatedAt: number;
    serverSeq: number;
    deletedAt?: number | null;
  }>;
  hasMore: boolean;
}

export interface SyncMetadata {
  lastSyncedServerSeq: number;
  lastSyncedAt: number;
  deviceId: string;
}

export const syncMetadataSchema = z.object({
  lastSyncedServerSeq: z.number().int().nonnegative(),
  lastSyncedAt: z.number().int().nonnegative(),
  deviceId: z.string(),
});
