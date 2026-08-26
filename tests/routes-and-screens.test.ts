import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { TaskRepository } from "../src/db/repositories/task-repository";
import { SubtaskRepository } from "../src/db/repositories/subtask-repository";
import { CourseRepository } from "../src/db/repositories/course-repository";
import { EventRepository } from "../src/db/repositories/event-repository";
import { PreferenceRepository } from "../src/db/repositories/preference-repository";
import { exportBackup, importBackup } from "../src/services/backup";
import { parseQuickAdd, draftToCreateTaskInput } from "../src/domain/quick-add";
import { parseDateAndTimeToTimestamp } from "../src/domain/scheduling";

describe("Sub-routes, Course Management & Settings Workflows", () => {
  let db: AppDatabase;
  let taskRepo: TaskRepository;
  let subtaskRepo: SubtaskRepository;
  let courseRepo: CourseRepository;
  let eventRepo: EventRepository;
  let prefRepo: PreferenceRepository;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });

    taskRepo = new TaskRepository(db);
    subtaskRepo = new SubtaskRepository(db);
    courseRepo = new CourseRepository(db);
    eventRepo = new EventRepository(db);
    prefRepo = new PreferenceRepository(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("Course Management: creates, lists, updates, and soft-deletes courses cleanly", async () => {
    const course = await courseRepo.create({
      code: "CS201",
      name: "Data Structures & Algorithms",
      color: "#3B82F6",
    });
    expect(course.id).toBeDefined();
    expect(course.code).toBe("CS201");
    expect(course.color).toBe("#3B82F6");

    const activeList = await courseRepo.listActive();
    expect(activeList.length).toBe(1);
    expect(activeList[0]!.code).toBe("CS201");

    await courseRepo.update(course.id, { name: "Advanced Data Structures" });
    const updated = await courseRepo.findById(course.id);
    expect(updated?.name).toBe("Advanced Data Structures");

    await courseRepo.delete(course.id);
    const afterDelete = await courseRepo.listActive();
    expect(afterDelete.length).toBe(0);

    const deletedRecord = await courseRepo.findById(course.id);
    expect(deletedRecord?.deletedAt).not.toBeNull();
  });

  it("Task & Subtask Detail Flow: adds subtasks, toggles completion, and respects cascade", async () => {
    const task = await taskRepo.create({
      title: "Write Research Paper",
      priority: "p1",
      dueDate: "2026-09-01",
    });

    const st1 = await subtaskRepo.create({
      taskId: task.id,
      title: "Literature Review",
      orderIndex: 0,
    });
    const st2 = await subtaskRepo.create({
      taskId: task.id,
      title: "Methodology",
      orderIndex: 1,
    });

    let subtasks = await subtaskRepo.listByTaskId(task.id);
    expect(subtasks.length).toBe(2);
    expect(subtasks[0]!.isCompleted).toBe(false);

    // Toggle subtask 1 complete
    await subtaskRepo.toggleComplete(st1.id, true);
    subtasks = await subtaskRepo.listByTaskId(task.id);
    expect(subtasks.find((s) => s.id === st1.id)?.isCompleted).toBe(true);
    expect(subtasks.find((s) => s.id === st2.id)?.isCompleted).toBe(false);

    // Atomic task completion cascades to all remaining subtasks
    await taskRepo.completeTaskAtomic(task.id);
    subtasks = await subtaskRepo.listByTaskId(task.id);
    expect(subtasks.every((s) => s.isCompleted)).toBe(true);

    const completedTask = await taskRepo.findById(task.id);
    expect(completedTask?.isCompleted).toBe(true);
    expect(completedTask?.completedAt).not.toBeNull();
  });

  it("Event Series Flow: manages series identity and occurrence dates", async () => {
    const startMs = parseDateAndTimeToTimestamp("2026-09-01", "09:00");
    const endMs = parseDateAndTimeToTimestamp("2026-09-01", "10:30");

    const event = await eventRepo.create({
      title: "Algorithms Lab",
      eventType: "class",
      startTime: startMs,
      endTime: endMs,
      isRecurring: true,
      recurrenceRule: "RRULE:FREQ=WEEKLY;BYDAY=TU,TH",
    });

    expect(event.id).toBeDefined();
    expect(event.isRecurring).toBe(true);
    expect(event.recurrenceRule).toBe("RRULE:FREQ=WEEKLY;BYDAY=TU,TH");

    // Soft delete single event
    await eventRepo.delete(event.id);
    const activeEvents = await eventRepo.listInRange(startMs - 1000, endMs + 1000);
    expect(activeEvents.length).toBe(0);
  });

  it("Appearance & Focus Preferences: persists user configuration in PreferenceRepository", async () => {
    await prefRepo.set("themeMode", "dark");
    await prefRepo.set("workDurationMinutes", "30");
    await prefRepo.set("shortBreakDurationMinutes", "6");
    await prefRepo.set("autoStartBreaks", "true");
    await prefRepo.set("notificationsEnabled", "true");

    const all = await prefRepo.getAll();
    expect(all["themeMode"]).toBe("dark");
    expect(all["workDurationMinutes"]).toBe("30");
    expect(all["shortBreakDurationMinutes"]).toBe("6");
    expect(all["autoStartBreaks"]).toBe("true");
    expect(all["notificationsEnabled"]).toBe("true");
  });

  it("Modal Quick-Add Pipeline: parses natural input and commits to repository", async () => {
    const course = await courseRepo.create({
      code: "PHYS101",
      name: "Physics I",
      color: "#EF4444",
    });

    const parsed = parseQuickAdd("Lab Report 1 tomorrow 4pm p1 #phys101 ~3p");
    expect(parsed.title).toBe("Lab Report 1");
    expect(parsed.priority).toBe("p1");
    expect(parsed.courseTag).toBe("phys101");
    expect(parsed.estimatedPomodoros).toBe(3);

    const input = draftToCreateTaskInput(parsed, (tag) => (tag === "phys101" ? course.id : undefined));
    input.dueDate = "2026-09-02";

    const created = await taskRepo.create(input);
    expect(created.title).toBe("Lab Report 1");
    expect(created.priority).toBe("p1");
    expect(created.courseId).toBe(course.id);
    expect(created.estimatedPomodoros).toBe(3);
  });

  it("Backup Settings Flow: exports full state and restores into fresh database atomically", async () => {
    const course = await courseRepo.create({
      code: "MATH101",
      name: "Calculus I",
      color: "#10B981",
    });

    await taskRepo.create({
      title: "Problem Set 1",
      courseId: course.id,
      priority: "p2",
    });

    await prefRepo.set("themeMode", "dark");

    const backupJson = await exportBackup(db);
    expect(backupJson).toContain('"schemaVersion": 1');
    expect(backupJson).toContain('"MATH101"');
    expect(backupJson).toContain('"Problem Set 1"');

    // Fresh database
    closeDatabase();
    const freshDb = await initializeDatabase({ inMemory: true });

    await importBackup(freshDb, backupJson);

    const restoredCourseRepo = new CourseRepository(freshDb);
    const restoredTaskRepo = new TaskRepository(freshDb);
    const restoredPrefRepo = new PreferenceRepository(freshDb);

    const restoredCourses = await restoredCourseRepo.listActive();
    expect(restoredCourses.length).toBe(1);
    expect(restoredCourses[0]!.code).toBe("MATH101");

    const restoredTasks = await restoredTaskRepo.listActive();
    expect(restoredTasks.length).toBe(1);
    expect(restoredTasks[0]!.title).toBe("Problem Set 1");

    const restoredTheme = await restoredPrefRepo.get("themeMode");
    expect(restoredTheme).toBe("dark");
  });
});
