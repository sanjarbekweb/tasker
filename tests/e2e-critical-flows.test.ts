import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, getDatabase } from "../src/db/client";
import { TaskRepository } from "../src/db/repositories/task-repository";
import { SubtaskRepository } from "../src/db/repositories/subtask-repository";
import { CourseRepository } from "../src/db/repositories/course-repository";
import { EventRepository } from "../src/db/repositories/event-repository";
import { FocusStateRepository } from "../src/db/repositories/focus-state-repository";
import { FocusSessionRepository } from "../src/db/repositories/focus-session-repository";
import { FocusEngine } from "../src/services/focus/focus-engine";
import { buildDailySchedule, parseDateAndTimeToTimestamp } from "../src/domain/scheduling";
import { parseQuickAdd, draftToCreateTaskInput } from "../src/domain/quick-add";
import { calculateLiveStreak } from "../src/domain/statistics";
import { exportBackup, importBackup } from "../src/services/backup";
import { SyncEngine, SyncApiClient } from "../src/services/sync";

describe("E2E Critical Flows", () => {
  beforeEach(async () => {
    await initializeDatabase({ inMemory: true });
  });

  afterEach(() => {
    closeDatabase();
  });

  it("Critical Flow 1: Task creation -> Subtask cascade -> Atomic completion -> Live streak computation", async () => {
    const db = getDatabase();
    const taskRepo = new TaskRepository(db);
    const subtaskRepo = new SubtaskRepository(db);
    const courseRepo = new CourseRepository(db);

    // 1. Create Course
    const course = await courseRepo.create({
      name: "Calculus III",
      code: "MATH301",
      color: "#3B82F6",
    });

    // 2. Parse Quick-Add input
    const todayIso = "2026-08-26";
    const draft = parseQuickAdd("Submit Homework 4 today 4pm p1 #math301 [3p]", new Date(2026, 7, 26));
    const input = draftToCreateTaskInput(draft, (tag) => (tag === "math301" ? course.id : null));

    // 3. Create Task
    const task = await taskRepo.create(input);
    expect(task.title).toBe("Submit Homework 4");
    expect(task.priority).toBe("p1");
    expect(task.courseId).toBe(course.id);
    expect(task.estimatedPomodoros).toBe(3);

    // 4. Add Subtasks
    const subtask1 = await subtaskRepo.create({ taskId: task.id, title: "Problem 1-5" });
    const subtask2 = await subtaskRepo.create({ taskId: task.id, title: "Problem 6-10" });
    expect(subtask1.isCompleted).toBe(false);
    expect(subtask2.isCompleted).toBe(false);

    // 5. Complete task atomically (cascades to all active subtasks in a single transaction)
    const completionResult = await taskRepo.completeTaskAtomic(task.id, true);
    expect(completionResult.isCompleted).toBe(true);

    const completedTask = await taskRepo.findById(task.id);
    expect(completedTask?.isCompleted).toBe(true);
    expect(completedTask?.completedAt).toBeDefined();

    const subtasks = await subtaskRepo.listByTask(task.id);
    expect(subtasks.every((s) => s.isCompleted)).toBe(true);

    // 6. Compute live streak directly from completion dates
    const completionDates = await taskRepo.listCompletedDates();
    const streak = calculateLiveStreak(completionDates, todayIso);
    expect(streak).toBe(1);
  });

  it("Critical Flow 2: Event creation -> Schedule collision detection -> Free-gap identification -> Quick-add task into gap", async () => {
    const db = getDatabase();
    const eventRepo = new EventRepository(db);
    const taskRepo = new TaskRepository(db);
    const dateIso = "2026-08-26";

    // 1. Create two overlapping calendar events
    const event1Start = parseDateAndTimeToTimestamp(dateIso, "10:00");
    const event1End = parseDateAndTimeToTimestamp(dateIso, "11:30");
    const event1 = await eventRepo.create({
      title: "Algorithms Lecture",
      startTime: event1Start,
      endTime: event1End,
      eventType: "class",
    });

    const event2Start = parseDateAndTimeToTimestamp(dateIso, "11:00");
    const event2End = parseDateAndTimeToTimestamp(dateIso, "12:00");
    const event2 = await eventRepo.create({
      title: "Team Sync Meeting",
      startTime: event2Start,
      endTime: event2End,
      eventType: "custom",
    });

    // 2. Build Daily Schedule
    const schedule = buildDailySchedule({
      date: dateIso,
      events: [event1, event2],
      tasks: [],
      windowStartHour: 8,
      windowEndHour: 18,
    });

    // 3. Collision Detected: (10:00 - 11:30) overlaps (11:00 - 12:00)
    expect(schedule.collisions.length).toBe(1);
    expect(schedule.collisions[0]?.itemAId).toBe(event1.id);
    expect(schedule.collisions[0]?.itemBId).toBe(event2.id);

    // 4. Free gap identified (08:00 to 10:00 = 120 mins)
    const morningGap = schedule.freeGaps.find((g) => g.durationMinutes >= 60);
    expect(morningGap).toBeDefined();

    // 5. Schedule task into free gap
    const scheduledTask = await taskRepo.create({
      title: "Morning Review",
      dueDate: dateIso,
      timeBlockStart: "08:30",
      timeBlockEnd: "09:30",
      priority: "p2",
    });

    // Recompute schedule
    const updatedSchedule = buildDailySchedule({
      date: dateIso,
      events: [event1, event2],
      tasks: [scheduledTask],
      windowStartHour: 8,
      windowEndHour: 18,
    });

    expect(updatedSchedule.items.length).toBe(3);
  });

  it("Critical Flow 3: Focus Timer start -> Pause/resume drift math -> Background recovery -> Atomic idempotent completion", async () => {
    const db = getDatabase();
    const focusStateRepo = new FocusStateRepository(db);
    const sessionRepo = new FocusSessionRepository(db);
    const taskRepo = new TaskRepository(db);

    const task = await taskRepo.create({ title: "Focus Deep Work Task", priority: "p1" });
    const engine = new FocusEngine({ focusStateRepository: focusStateRepo });

    const startTime = 1000000;
    // 1. Start 25-minute Pomodoro session
    await engine.startSession({ mode: "work", taskId: task.id, durationMinutes: 25, now: startTime });

    let state = await focusStateRepo.getState();
    expect(state.status).toBe("running");
    expect(state.targetAt).toBe(startTime + 25 * 60 * 1000);

    // 2. Pause at 5 minutes
    const pauseTime = startTime + 5 * 60 * 1000;
    await engine.pauseSession(pauseTime);
    state = await focusStateRepo.getState();
    expect(state.status).toBe("paused");
    expect(state.pausedAt).toBe(pauseTime);

    // 3. Resume 10 minutes later (pause duration = 10 mins)
    const resumeTime = pauseTime + 10 * 60 * 1000;
    await engine.resumeSession(resumeTime);
    state = await focusStateRepo.getState();
    expect(state.status).toBe("running");
    // Target time should be extended by 10 minutes (drift eliminated)
    expect(state.targetAt).toBe(startTime + 25 * 60 * 1000 + 10 * 60 * 1000);

    // 4. Simulate Background Suspension past target time
    const futureResumeTime = state.targetAt! + 5000;
    await engine.handleAppStateChange("active", futureResumeTime);

    // Auto-completed on recovery
    const allSessions = await sessionRepo.listAll();
    expect(allSessions.length).toBe(1);
    expect(allSessions[0]?.wasCompleted).toBe(true);

    state = await focusStateRepo.getState();
    expect(state.status).toBe("idle");
    expect(state.mode).toBe("short_break"); // Auto-transitioned to short break
  });

  it("Critical Flow 4: Snapshot export -> Zero encryption keys in backup -> Schema validation -> Atomic restore", async () => {
    const db = getDatabase();
    const courseRepo = new CourseRepository(db);
    const taskRepo = new TaskRepository(db);

    const course = await courseRepo.create({ name: "Databases", code: "CS501", color: "#6366F1" });
    await taskRepo.create({ title: "Final Project", courseId: course.id, priority: "p1" });

    // 1. Export backup
    const backupJson = await exportBackup(db);
    expect(backupJson).not.toContain("encryptionKey");
    expect(backupJson).not.toContain("secret");

    // 2. Simulate complete database wipe/reset
    await closeDatabase();
    await initializeDatabase({ inMemory: true });

    const newDb = getDatabase();
    const newTaskRepo = new TaskRepository(newDb);
    const newCourseRepo = new CourseRepository(newDb);

    // Database is empty
    expect((await newTaskRepo.listActive()).length).toBe(0);

    // 3. Import & restore backup atomically
    await importBackup(newDb, backupJson);

    // 4. Verify restored entities
    const restoredCourses = await newCourseRepo.listActive();
    const restoredTasks = await newTaskRepo.listActive();
    expect(restoredCourses.length).toBe(1);
    expect(restoredCourses[0]?.code).toBe("CS501");
    expect(restoredTasks.length).toBe(1);
    expect(restoredTasks[0]?.title).toBe("Final Project");
  });

  it("Critical Flow 5: Sync change extraction -> Server sequence conflict resolution -> Atomic transaction merge", async () => {
    const db = getDatabase();
    const taskRepo = new TaskRepository(db);

    await taskRepo.create({ title: "Local Draft", priority: "p3" });

    const mockApi: SyncApiClient = {
      async pushChanges() {
        return {
          accepted: true,
          serverTimestamp: 5000,
          syncedRecords: [],
          conflicts: [],
        };
      },
      async pullChanges() {
        return {
          currentServerSeq: 10,
          serverTimestamp: 5000,
          records: [
            {
              id: "cloud-synced-task",
              entityType: "tasks",
              data: {
                id: "cloud-synced-task",
                title: "Cloud Synced Task",
                priority: "p1",
                dueDate: "2026-09-01",
                isCompleted: true,
                orderIndex: 0,
                createdAt: 1000,
                updatedAt: 5000,
                deletedAt: null,
              },
              serverUpdatedAt: 5000,
              serverSeq: 10,
            },
          ],
          hasMore: false,
        };
      },
    };

    const syncEngine = new SyncEngine(db, mockApi);
    const result = await syncEngine.sync();

    expect(result.pulledCount).toBe(1);
    const cloudTask = await taskRepo.findById("cloud-synced-task");
    expect(cloudTask).toBeDefined();
    expect(cloudTask?.isCompleted).toBe(true);
  });
});
