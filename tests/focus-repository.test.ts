import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { FocusStateRepository } from "../src/db/repositories/focus-state-repository";
import { FocusSessionRepository } from "../src/db/repositories/focus-session-repository";
import { TaskRepository } from "../src/db/repositories/task-repository";

describe("FocusStateRepository & FocusSessionRepository", () => {
  let db: AppDatabase;
  let stateRepo: FocusStateRepository;
  let sessionRepo: FocusSessionRepository;
  let taskRepo: TaskRepository;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
    stateRepo = new FocusStateRepository(db);
    sessionRepo = new FocusSessionRepository(db);
    taskRepo = new TaskRepository(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("stores timestamp-driven focus state and transitions mode/status", async () => {
    const initialState = await stateRepo.getState();
    expect(initialState.status).toBe("idle");
    expect(initialState.mode).toBe("work");

    const now = Date.now();
    const target = now + 25 * 60 * 1000;

    const updated = await stateRepo.setState({
      status: "running",
      mode: "work",
      startedAt: now,
      targetAt: target,
    });

    expect(updated.status).toBe("running");
    expect(updated.startedAt).toBe(now);
    expect(updated.targetAt).toBe(target);
  });

  it("atomically and idempotently completes a focus session with task increment guard", async () => {
    const task = await taskRepo.create({
      title: "Focus Task",
      estimatedPomodoros: 4,
    });

    const now = Date.now();
    await stateRepo.setState({
      taskId: task.id,
      status: "running",
      mode: "work",
      startedAt: now - 25 * 60 * 1000,
      targetAt: now,
    });

    // First completion call: should succeed, create session record, and increment task completedPomodoros
    const res1 = await stateRepo.completeSessionAtomic({
      durationMinutes: 25,
      sessionType: "work",
      startedAt: now - 25 * 60 * 1000,
      completedAt: now,
      wasCompleted: true,
    });

    expect(res1.completed).toBe(true);
    expect(res1.session).toBeDefined();
    expect(res1.session?.durationMinutes).toBe(25);
    expect(res1.state.status).toBe("completed");

    const updatedTask = await taskRepo.findById(task.id);
    expect(updatedTask?.completedPomodoros).toBe(1);

    // Second completion call (simulating background notification / foreground race):
    // Status is no longer 'running', so it must NOT double increment or create duplicate session
    const res2 = await stateRepo.completeSessionAtomic({
      durationMinutes: 25,
      sessionType: "work",
      startedAt: now - 25 * 60 * 1000,
      completedAt: now,
      wasCompleted: true,
    });

    expect(res2.completed).toBe(false);
    expect(res2.session).toBeNull();

    const doubleCheckTask = await taskRepo.findById(task.id);
    expect(doubleCheckTask?.completedPomodoros).toBe(1); // STILL 1, NOT 2!
  });
});
