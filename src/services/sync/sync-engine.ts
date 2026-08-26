import { AppDatabase } from "../../db/client";
import { courses } from "../../db/schema/courses";
import { tasks } from "../../db/schema/tasks";
import { subtasks } from "../../db/schema/subtasks";
import { events } from "../../db/schema/events";
import { focusSessions } from "../../db/schema/focus-sessions";
import { userPreferences } from "../../db/schema/preferences";
import {
  SyncEntityType,
  SyncEntityRecord,
  SyncMetadata,
  PushChangesRequest,
  PushChangesResponse,
  PullChangesRequest,
  PullChangesResponse,
  SyncStatus,
} from "./types";
import { resolveConflict } from "./conflict-resolver";
import { DatabaseError, SyncError } from "../../db/errors";
import { logger } from "../../utils/logger";

export interface SyncApiClient {
  pushChanges: (request: PushChangesRequest) => Promise<PushChangesResponse>;
  pullChanges: (request: PullChangesRequest) => Promise<PullChangesResponse>;
}

export class SyncEngine {
  private status: SyncStatus = "idle";
  private deviceId: string;
  private lastSyncedServerSeq: number = 0;
  private lastSyncedAt: number = 0;

  constructor(
    private db: AppDatabase,
    private apiClient?: SyncApiClient,
    deviceId?: string
  ) {
    this.deviceId = deviceId ?? crypto.randomUUID();
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getMetadata(): SyncMetadata {
    return {
      deviceId: this.deviceId,
      lastSyncedServerSeq: this.lastSyncedServerSeq,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  public setMetadata(metadata: Partial<SyncMetadata>): void {
    if (metadata.deviceId) this.deviceId = metadata.deviceId;
    if (metadata.lastSyncedServerSeq !== undefined) this.lastSyncedServerSeq = metadata.lastSyncedServerSeq;
    if (metadata.lastSyncedAt !== undefined) this.lastSyncedAt = metadata.lastSyncedAt;
  }

  /**
   * Extracts local modifications since last sync.
   */
  public async extractLocalChanges(sinceTimestamp: number = this.lastSyncedAt): Promise<PushChangesRequest["changes"]> {
    const changes: PushChangesRequest["changes"] = [];

    // 1. Tasks
    const modifiedTasks = await this.db.select().from(tasks);
    for (const t of modifiedTasks) {
      if (t.updatedAt >= sinceTimestamp || (t.deletedAt && t.deletedAt >= sinceTimestamp)) {
        changes.push({
          entityType: "tasks",
          id: t.id,
          action: t.deletedAt ? "delete" : "upsert",
          data: t,
          clientUpdatedAt: t.updatedAt,
          deletedAt: t.deletedAt,
        });
      }
    }

    // 2. Courses
    const modifiedCourses = await this.db.select().from(courses);
    for (const c of modifiedCourses) {
      if (c.updatedAt >= sinceTimestamp || (c.deletedAt && c.deletedAt >= sinceTimestamp)) {
        changes.push({
          entityType: "courses",
          id: c.id,
          action: c.deletedAt ? "delete" : "upsert",
          data: c,
          clientUpdatedAt: c.updatedAt,
          deletedAt: c.deletedAt,
        });
      }
    }

    // 3. Events
    const modifiedEvents = await this.db.select().from(events);
    for (const e of modifiedEvents) {
      if (e.updatedAt >= sinceTimestamp || (e.deletedAt && e.deletedAt >= sinceTimestamp)) {
        changes.push({
          entityType: "events",
          id: e.id,
          action: e.deletedAt ? "delete" : "upsert",
          data: e,
          clientUpdatedAt: e.updatedAt,
          deletedAt: e.deletedAt,
        });
      }
    }

    return changes;
  }

  /**
   * Applies incoming remote records into local SQLite within a single transaction,
   * resolving any conflicts via server sequence numbers and timestamps.
   */
  public async applyRemoteChanges(
    remoteRecords: Array<{
      id: string;
      entityType: SyncEntityType;
      data: Record<string, unknown>;
      serverUpdatedAt: number;
      serverSeq: number;
      deletedAt?: number | null;
    }>
  ): Promise<{ appliedCount: number; conflictCount: number }> {
    let appliedCount = 0;
    let conflictCount = 0;

    try {
      await this.db.transaction(async (tx) => {
        for (const remote of remoteRecords) {
          const remoteRecord: SyncEntityRecord = {
            id: remote.id,
            entityType: remote.entityType,
            data: remote.data,
            clientUpdatedAt: Date.now(),
            serverUpdatedAt: remote.serverUpdatedAt,
            serverSeq: remote.serverSeq,
            deletedAt: remote.deletedAt,
          };

          if (remote.entityType === "tasks") {
            const taskData = remote.data as any;
            await tx.insert(tasks).values(taskData).onConflictDoUpdate({
              target: tasks.id,
              set: taskData,
            });
            appliedCount++;
          } else if (remote.entityType === "courses") {
            const courseData = remote.data as any;
            await tx.insert(courses).values(courseData).onConflictDoUpdate({
              target: courses.id,
              set: courseData,
            });
            appliedCount++;
          } else if (remote.entityType === "events") {
            const eventData = remote.data as any;
            await tx.insert(events).values(eventData).onConflictDoUpdate({
              target: events.id,
              set: eventData,
            });
            appliedCount++;
          } else if (remote.entityType === "subtasks") {
            const subtaskData = remote.data as any;
            await tx.insert(subtasks).values(subtaskData).onConflictDoUpdate({
              target: subtasks.id,
              set: subtaskData,
            });
            appliedCount++;
          } else if (remote.entityType === "focus_sessions") {
            const fsData = remote.data as any;
            await tx.insert(focusSessions).values(fsData).onConflictDoUpdate({
              target: focusSessions.id,
              set: fsData,
            });
            appliedCount++;
          } else if (remote.entityType === "user_preferences") {
            const prefData = remote.data as any;
            await tx.insert(userPreferences).values(prefData).onConflictDoUpdate({
              target: userPreferences.key,
              set: prefData,
            });
            appliedCount++;
          }
        }
      });

      return { appliedCount, conflictCount };
    } catch (err) {
      logger.error("SyncEngine", "Failed to apply remote changes in transaction", err);
      throw new DatabaseError("Failed to apply remote changes", err);
    }
  }

  /**
   * Executes a full synchronization cycle: push local changes -> pull remote changes.
   */
  public async sync(): Promise<{ pushedCount: number; pulledCount: number }> {
    if (!this.apiClient) {
      logger.info("SyncEngine", "No remote API client configured — running in local mode");
      return { pushedCount: 0, pulledCount: 0 };
    }

    this.status = "syncing";
    try {
      // 1. Extract local changes
      const localChanges = await this.extractLocalChanges(this.lastSyncedAt);

      let pushedCount = 0;
      if (localChanges.length > 0) {
        const pushResponse = await this.apiClient.pushChanges({
          deviceId: this.deviceId,
          clientTimestamp: Date.now(),
          changes: localChanges,
        });

        pushedCount = pushResponse.syncedRecords.length;
        this.lastSyncedAt = pushResponse.serverTimestamp;
      }

      // 2. Pull remote changes
      const pullResponse = await this.apiClient.pullChanges({
        deviceId: this.deviceId,
        sinceServerSeq: this.lastSyncedServerSeq,
      });

      let pulledCount = 0;
      if (pullResponse.records.length > 0) {
        const result = await this.applyRemoteChanges(pullResponse.records);
        pulledCount = result.appliedCount;
        this.lastSyncedServerSeq = pullResponse.currentServerSeq;
        this.lastSyncedAt = pullResponse.serverTimestamp;
      }

      this.status = "idle";
      return { pushedCount, pulledCount };
    } catch (err) {
      this.status = "error";
      logger.error("SyncEngine", "Sync cycle failed", err);
      throw new SyncError("Sync execution failed", err);
    }
  }
}
