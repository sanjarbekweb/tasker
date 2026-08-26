import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { TaskRepository } from "../src/db/repositories/task-repository";
import { SubtaskRepository } from "../src/db/repositories/subtask-repository";

describe("SubtaskRepository", () => {
  let db: AppDatabase;
  let taskRepo: TaskRepository;
  let subtaskRepo: SubtaskRepository;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
    taskRepo = new TaskRepository(db);
    subtaskRepo = new SubtaskRepository(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("reorders subtasks within a transaction", async () => {
    const task = await taskRepo.create({ title: "Main Task" });

    const s1 = await subtaskRepo.create({ taskId: task.id, title: "Sub 1", orderIndex: 0 });
    const s2 = await subtaskRepo.create({ taskId: task.id, title: "Sub 2", orderIndex: 1 });
    const s3 = await subtaskRepo.create({ taskId: task.id, title: "Sub 3", orderIndex: 2 });

    await subtaskRepo.reorder(task.id, [s3.id, s1.id, s2.id]);

    const ordered = await subtaskRepo.listByTask(task.id);
    expect(ordered.map((s) => s.id)).toEqual([s3.id, s1.id, s2.id]);
    expect(ordered[0]?.orderIndex).toBe(0);
    expect(ordered[1]?.orderIndex).toBe(1);
    expect(ordered[2]?.orderIndex).toBe(2);
  });
});
