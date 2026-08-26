import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { TaskRepository } from "../src/db/repositories/task-repository";
import { SubtaskRepository } from "../src/db/repositories/subtask-repository";
import { CourseRepository } from "../src/db/repositories/course-repository";
import { NotFoundError, ValidationError } from "../src/db/errors";

describe("TaskRepository", () => {
  let db: AppDatabase;
  let taskRepo: TaskRepository;
  let subtaskRepo: SubtaskRepository;
  let courseRepo: CourseRepository;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
    taskRepo = new TaskRepository(db);
    subtaskRepo = new SubtaskRepository(db);
    courseRepo = new CourseRepository(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("creates a task with default priority and pomodoros", async () => {
    const task = await taskRepo.create({
      title: "Read Chapter 4",
      dueDate: "2026-08-27",
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe("Read Chapter 4");
    expect(task.priority).toBe("p4");
    expect(task.estimatedPomodoros).toBe(1);
    expect(task.completedPomodoros).toBe(0);
    expect(task.isCompleted).toBe(false);
    expect(task.deletedAt).toBeNull();
  });

  it("queries tasks by due date ordered by orderIndex", async () => {
    await taskRepo.create({
      title: "Task 2",
      dueDate: "2026-08-27",
      orderIndex: 2,
    });
    await taskRepo.create({
      title: "Task 1",
      dueDate: "2026-08-27",
      orderIndex: 1,
    });
    await taskRepo.create({
      title: "Task Tomorrow",
      dueDate: "2026-08-28",
      orderIndex: 0,
    });

    const tasksToday = await taskRepo.listByDate("2026-08-27");
    expect(tasksToday.length).toBe(2);
    expect(tasksToday[0]?.title).toBe("Task 1");
    expect(tasksToday[1]?.title).toBe("Task 2");
  });

  it("atomically completes a task and cascades to active subtasks", async () => {
    const task = await taskRepo.create({
      title: "Math Assignment",
      dueDate: "2026-08-27",
    });

    const sub1 = await subtaskRepo.create({
      taskId: task.id,
      title: "Question 1",
      isCompleted: false,
      orderIndex: 0,
    });

    const sub2 = await subtaskRepo.create({
      taskId: task.id,
      title: "Question 2",
      isCompleted: false,
      orderIndex: 1,
    });

    const completedTask = await taskRepo.completeTaskAtomic(task.id, true);
    expect(completedTask.isCompleted).toBe(true);
    expect(completedTask.completedAt).toBeTypeOf("number");

    const updatedSub1 = await subtaskRepo.findById(sub1.id);
    const updatedSub2 = await subtaskRepo.findById(sub2.id);
    expect(updatedSub1?.isCompleted).toBe(true);
    expect(updatedSub2?.isCompleted).toBe(true);
  });

  it("soft deletes a task and cascades soft delete to subtasks", async () => {
    const task = await taskRepo.create({
      title: "Project Draft",
    });

    const sub = await subtaskRepo.create({
      taskId: task.id,
      title: "Outline",
    });

    await taskRepo.softDelete(task.id);

    const fetchedTask = await taskRepo.findById(task.id);
    expect(fetchedTask).toBeNull();

    const fetchedSub = await subtaskRepo.findById(sub.id);
    expect(fetchedSub).toBeNull();
  });
});
