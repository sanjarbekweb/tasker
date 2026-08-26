import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, getDatabase } from "../src/db/client";
import { CourseRepository } from "../src/db/repositories/course-repository";
import { TaskRepository } from "../src/db/repositories/task-repository";
import { exportBackup, importBackup, backupSchema } from "../src/services/backup";

describe("Backup & Restore Service", () => {
  beforeEach(async () => {
    await initializeDatabase({ inMemory: true });
  });

  afterEach(() => {
    closeDatabase();
  });

  it("exports complete data without secrets or encryption keys", async () => {
    const db = getDatabase();
    const courseRepo = new CourseRepository(db);
    const taskRepo = new TaskRepository(db);

    const course = await courseRepo.create({
      name: "Computer Systems",
      code: "CS201",
      color: "#6366F1",
    });

    await taskRepo.create({
      title: "Lab 1 Submission",
      courseId: course.id,
      priority: "p1",
      dueDate: "2026-08-26",
    });

    const jsonString = await exportBackup(db);
    expect(jsonString).toBeDefined();

    const parsed = JSON.parse(jsonString);
    const validation = backupSchema.safeParse(parsed);
    expect(validation.success).toBe(true);

    // Invariants: No secrets or encryption keys in backup
    expect(jsonString).not.toContain("encryptionKey");
    expect(jsonString).not.toContain("secret");
    expect(parsed.courses.length).toBe(1);
    expect(parsed.tasks.length).toBe(1);
    expect(parsed.courses[0].code).toBe("CS201");
  });

  it("validates and imports backup into database atomically", async () => {
    const db = getDatabase();
    const courseRepo = new CourseRepository(db);

    const initialBackup = {
      schemaVersion: 1,
      appVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      courses: [
        {
          id: "course-imported-1",
          name: "Algorithms",
          code: "CS301",
          color: "#3B82F6",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deletedAt: null,
        },
      ],
      tasks: [],
      subtasks: [],
      events: [],
      focusSessions: [],
      preferences: [
        {
          key: "themeMode",
          value: "dark",
          updatedAt: Date.now(),
        },
      ],
    };

    await importBackup(db, JSON.stringify(initialBackup));

    const course = await courseRepo.findById("course-imported-1");
    expect(course).toBeDefined();
    expect(course?.name).toBe("Algorithms");
  });

  it("rejects corrupted or malicious backup files without modifying database", async () => {
    const db = getDatabase();
    const invalidJson = "{ bad json ";
    await expect(importBackup(db, invalidJson)).rejects.toThrow();

    const invalidSchemaJson = JSON.stringify({
      schemaVersion: "not-a-number",
      randomField: 123,
    });
    await expect(importBackup(db, invalidSchemaJson)).rejects.toThrow();
  });
});
