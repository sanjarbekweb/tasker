import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveConflict } from "../src/services/sync/conflict-resolver";
import { SyncEngine, SyncApiClient } from "../src/services/sync/sync-engine";
import { SyncEntityRecord, PushChangesRequest, PushChangesResponse, PullChangesRequest, PullChangesResponse } from "../src/services/sync/types";
import { initializeDatabase, closeDatabase, getDatabase } from "../src/db/client";
import { TaskRepository } from "../src/db/repositories/task-repository";
import { CourseRepository } from "../src/db/repositories/course-repository";

describe("Sync Conflict Resolution (Problem 1 Fix: Server-Assigned Ingestion)", () => {
  it("resolves conflict in favor of higher server sequence regardless of client timestamp", () => {
    // Device A has a modified/fast local clock (12:00 PM), but lower server sequence (seq 10)
    const localRecord: SyncEntityRecord = {
      id: "task-1",
      entityType: "tasks",
      data: { title: "Draft by Device A with fast clock" },
      clientUpdatedAt: 1700005000000,
      serverSeq: 10,
      serverUpdatedAt: 1700001000000,
    };

    // Device B has a slower/accurate local clock (10:00 AM), but higher server sequence (seq 15)
    const remoteRecord: SyncEntityRecord = {
      id: "task-1",
      entityType: "tasks",
      data: { title: "Draft by Device B with higher server seq" },
      clientUpdatedAt: 1700002000000,
      serverSeq: 15,
      serverUpdatedAt: 1700002000000,
    };

    const resolution = resolveConflict(localRecord, remoteRecord);
    expect(resolution.winner).toBe("remote");
    expect(resolution.resolvedRecord.data.title).toBe("Draft by Device B with higher server seq");
    expect(resolution.reason).toContain("Remote server sequence (15) is greater than local (10)");
  });

  it("resolves conflict in favor of newer server ingestion timestamp when sequence numbers are identical", () => {
    const localRecord: SyncEntityRecord = {
      id: "course-1",
      entityType: "courses",
      data: { name: "Older Server Ingestion" },
      clientUpdatedAt: 9999999999999, // Fake fast client clock
      serverSeq: 5,
      serverUpdatedAt: 1000,
    };

    const remoteRecord: SyncEntityRecord = {
      id: "course-1",
      entityType: "courses",
      data: { name: "Newer Server Ingestion" },
      clientUpdatedAt: 1000,
      serverSeq: 5,
      serverUpdatedAt: 2000,
    };

    const resolution = resolveConflict(localRecord, remoteRecord);
    expect(resolution.winner).toBe("remote");
    expect(resolution.resolvedRecord.data.name).toBe("Newer Server Ingestion");
  });

  it("gives precedence to remote deletion tombstone when timestamps match", () => {
    const localRecord: SyncEntityRecord = {
      id: "task-2",
      entityType: "tasks",
      data: { title: "Active task" },
      clientUpdatedAt: 1000,
      serverSeq: 1,
      serverUpdatedAt: 1000,
      deletedAt: null,
    };

    const remoteRecord: SyncEntityRecord = {
      id: "task-2",
      entityType: "tasks",
      data: { title: "Deleted task" },
      clientUpdatedAt: 1000,
      serverSeq: 1,
      serverUpdatedAt: 1000,
      deletedAt: 1000, // Tombstone
    };

    const resolution = resolveConflict(localRecord, remoteRecord);
    expect(resolution.winner).toBe("remote");
    expect(resolution.reason).toContain("Remote deletion tombstone takes precedence");
  });

  it("performs deterministic tie-breaking when all sequence metadata is identical", () => {
    const localRecord: SyncEntityRecord = {
      id: "task-3",
      entityType: "tasks",
      data: { title: "A" },
      clientUpdatedAt: 1000,
      serverSeq: 1,
      serverUpdatedAt: 1000,
    };

    const remoteRecord: SyncEntityRecord = {
      id: "task-3",
      entityType: "tasks",
      data: { title: "B" },
      clientUpdatedAt: 1000,
      serverSeq: 1,
      serverUpdatedAt: 1000,
    };

    const resolution = resolveConflict(localRecord, remoteRecord);
    expect(resolution.winner).toBe("remote");
  });
});

describe("SyncEngine Integration", () => {
  beforeEach(async () => {
    await initializeDatabase({ inMemory: true });
  });

  afterEach(() => {
    closeDatabase();
  });

  it("extracts local modifications and applies remote records atomically", async () => {
    const db = getDatabase();
    const taskRepo = new TaskRepository(db);
    const courseRepo = new CourseRepository(db);

    const course = await courseRepo.create({
      name: "Distributed Systems",
      code: "CS401",
      color: "#10B981",
    });

    await taskRepo.create({
      title: "Sync Test Task",
      courseId: course.id,
      priority: "p1",
    });

    let pushCalled = false;
    let pullCalled = false;

    const mockApiClient: SyncApiClient = {
      async pushChanges(req: PushChangesRequest): Promise<PushChangesResponse> {
        pushCalled = true;
        expect(req.changes.length).toBeGreaterThan(0);
        return {
          accepted: true,
          serverTimestamp: Date.now(),
          syncedRecords: req.changes.map((c, i) => ({
            id: c.id,
            entityType: c.entityType,
            serverUpdatedAt: Date.now(),
            serverSeq: i + 1,
          })),
          conflicts: [],
        };
      },
      async pullChanges(req: PullChangesRequest): Promise<PullChangesResponse> {
        pullCalled = true;
        return {
          currentServerSeq: 2,
          serverTimestamp: Date.now(),
          records: [
            {
              id: "remote-task-99",
              entityType: "tasks",
              data: {
                id: "remote-task-99",
                title: "Remote Task Synced from Server",
                priority: "p2",
                dueDate: "2026-08-30",
                isCompleted: false,
                orderIndex: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                deletedAt: null,
              },
              serverUpdatedAt: Date.now(),
              serverSeq: 2,
            },
          ],
          hasMore: false,
        };
      },
    };

    const syncEngine = new SyncEngine(db, mockApiClient);
    const result = await syncEngine.sync();

    expect(pushCalled).toBe(true);
    expect(pullCalled).toBe(true);
    expect(result.pushedCount).toBeGreaterThan(0);
    expect(result.pulledCount).toBe(1);

    // Verify remote task exists in local SQLite
    const fetched = await taskRepo.findById("remote-task-99");
    expect(fetched).toBeDefined();
    expect(fetched?.title).toBe("Remote Task Synced from Server");
  });
});
