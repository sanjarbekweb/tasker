import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { FocusStateRepository } from "../src/db/repositories/focus-state-repository";
import { TaskRepository } from "../src/db/repositories/task-repository";
import { FocusEngine } from "../src/services/focus/focus-engine";
import { NotificationService } from "../src/services/notifications";
import { useFocusStore } from "../src/stores/focus-store";

describe("FocusEngine", () => {
  let db: AppDatabase;
  let stateRepo: FocusStateRepository;
  let taskRepo: TaskRepository;
  let focusEngine: FocusEngine;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
    stateRepo = new FocusStateRepository(db);
    taskRepo = new TaskRepository(db);
    useFocusStore.getState().reset();
    await NotificationService.cancelFocusTimerNotification();

    focusEngine = new FocusEngine({
      focusStateRepository: stateRepo,
      notificationService: NotificationService,
    });
  });

  afterEach(() => {
    focusEngine.destroy();
    closeDatabase();
  });

  it("starts a focus session, schedules OS notification and syncs Zustand store", async () => {
    const task = await taskRepo.create({
      title: "Write Research Paper",
      estimatedPomodoros: 2,
    });

    const startTime = 1700000000000;
    const targetTime = startTime + 25 * 60 * 1000;

    await focusEngine.startSession({
      taskId: task.id,
      mode: "work",
      durationMinutes: 25,
      now: startTime,
    });

    // 1. Check SQLite state
    const persistent = await stateRepo.getState();
    expect(persistent.status).toBe("running");
    expect(persistent.mode).toBe("work");
    expect(persistent.taskId).toBe(task.id);
    expect(persistent.startedAt).toBe(startTime);
    expect(persistent.targetAt).toBe(targetTime);

    // 2. Check OS notification scheduling
    expect(NotificationService.getScheduledTimestamp()).toBe(targetTime);

    // 3. Check Zustand UI store
    const uiState = useFocusStore.getState();
    expect(uiState.status).toBe("running");
    expect(uiState.mode).toBe("work");
    expect(uiState.activeTaskId).toBe(task.id);
  });

  it("pauses and resumes a focus session, adjusting target timestamp without drift", async () => {
    const startTime = 1700000000000;
    await focusEngine.startSession({
      mode: "work",
      durationMinutes: 25,
      now: startTime,
    });

    // Pause after 10 minutes (15 min remaining)
    const pauseTime = startTime + 10 * 60 * 1000;
    await focusEngine.pauseSession(pauseTime);

    let persistent = await stateRepo.getState();
    expect(persistent.status).toBe("paused");
    expect(persistent.pausedAt).toBe(pauseTime);
    expect(NotificationService.getScheduledTimestamp()).toBeNull();

    // Resume 5 minutes later
    const resumeTime = pauseTime + 5 * 60 * 1000;
    await focusEngine.resumeSession(resumeTime);

    persistent = await stateRepo.getState();
    expect(persistent.status).toBe("running");
    expect(persistent.pausedAt).toBeNull();
    // New targetAt should be resumeTime + 15 minutes remaining
    const expectedNewTarget = resumeTime + 15 * 60 * 1000;
    expect(persistent.targetAt).toBe(expectedNewTarget);
    expect(NotificationService.getScheduledTimestamp()).toBe(expectedNewTarget);
  });

  it("recovers from background and auto-completes session when elapsed during suspension", async () => {
    const task = await taskRepo.create({
      title: "Algebra Problem Set",
      estimatedPomodoros: 2,
    });

    const startTime = 1700000000000;
    await focusEngine.startSession({
      taskId: task.id,
      mode: "work",
      durationMinutes: 25,
      now: startTime,
    });

    // App backgrounded, 30 minutes pass (targetAt was +25m, so 5m overdue)
    const resumeTime = startTime + 30 * 60 * 1000;
    await focusEngine.handleAppStateChange("active", resumeTime);

    // Task pomodoros should be incremented to 1
    const updatedTask = await taskRepo.findById(task.id);
    expect(updatedTask?.completedPomodoros).toBe(1);

    // Focus state should have transitioned to short_break in idle status
    const persistent = await stateRepo.getState();
    expect(persistent.status).toBe("idle");
    expect(persistent.mode).toBe("short_break");

    // Zustand store should reflect the transition
    const ui = useFocusStore.getState();
    expect(ui.mode).toBe("short_break");
    expect(ui.completedPomodorosInCycle).toBe(1);
  });

  it("recovers from background correctly when session is still running", async () => {
    const startTime = 1700000000000;
    await focusEngine.startSession({
      mode: "work",
      durationMinutes: 25,
      now: startTime,
    });

    // App resumed after 10 minutes (15 min remaining)
    const resumeTime = startTime + 10 * 60 * 1000;
    await focusEngine.handleAppStateChange("active", resumeTime);

    const persistent = await stateRepo.getState();
    expect(persistent.status).toBe("running");

    const ui = useFocusStore.getState();
    expect(ui.status).toBe("running");
    expect(ui.remainingSeconds).toBe(15 * 60);
    expect(ui.progress).toBeCloseTo(10 / 25, 2);
  });

  it("cancelling a session resets SQLite and Zustand state and cancels notifications", async () => {
    await focusEngine.startSession({
      mode: "work",
      durationMinutes: 25,
    });

    await focusEngine.cancelSession();

    const persistent = await stateRepo.getState();
    expect(persistent.status).toBe("idle");
    expect(NotificationService.getScheduledTimestamp()).toBeNull();

    const ui = useFocusStore.getState();
    expect(ui.status).toBe("idle");
  });

  it("guards against double session completions under concurrent race conditions and sequential replays", async () => {
    const task = await taskRepo.create({
      title: "Concurrent Task",
      estimatedPomodoros: 4,
    });

    const startTime = 1700000000000;
    await focusEngine.startSession({
      taskId: task.id,
      mode: "work",
      durationMinutes: 25,
      now: startTime,
    });

    const completeTime = startTime + 25 * 60 * 1000;

    // 1. Parallel completion triggers (e.g. notification handler + UI event fired at the exact same tick)
    const [res1, res2] = await Promise.all([
      focusEngine.completeSession(completeTime),
      focusEngine.completeSession(completeTime),
    ]);

    // In-flight deduplication guarantees single underlying transaction execution
    expect(res1).toBe(res2);
    expect(res1.completed).toBe(true);

    let taskRecord = await taskRepo.findById(task.id);
    expect(taskRecord?.completedPomodoros).toBe(1);

    // 2. Sequential replay (e.g. background notification fired earlier, now app opens and triggers completeSession again)
    const res3 = await focusEngine.completeSession(completeTime + 1000);
    expect(res3.completed).toBe(false);
    expect(res3.session).toBeNull();

    // Task completedPomodoros must strictly remain 1, never double-incremented
    taskRecord = await taskRepo.findById(task.id);
    expect(taskRecord?.completedPomodoros).toBe(1);
  });
});
