import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { CourseRepository } from "../src/db/repositories/course-repository";
import { TaskRepository } from "../src/db/repositories/task-repository";
import { EventRepository } from "../src/db/repositories/event-repository";
import {
  DatabaseError,
  ValidationError,
  ConflictError,
  NotFoundError,
  MigrationError,
  SyncError,
  PermissionError,
} from "../src/db/errors";

describe("Error Taxonomy and Validation", () => {
  let db: AppDatabase;
  let courseRepo: CourseRepository;
  let taskRepo: TaskRepository;
  let eventRepo: EventRepository;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
    courseRepo = new CourseRepository(db);
    taskRepo = new TaskRepository(db);
    eventRepo = new EventRepository(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("throws ValidationError with issue details on invalid course schema input", async () => {
    try {
      await courseRepo.create({ name: "", code: "", color: "" });
      expect.fail("Should have thrown ValidationError");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const valErr = err as ValidationError;
      expect(valErr.code).toBe("VALIDATION_ERROR");
      expect(valErr.issues).toBeDefined();
    }
  });

  it("throws NotFoundError when updating non-existent entity", async () => {
    try {
      await taskRepo.update("non-existent-task-id", { title: "New Title" });
      expect.fail("Should have thrown NotFoundError");
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
      const notFound = err as NotFoundError;
      expect(notFound.code).toBe("NOT_FOUND_ERROR");
      expect(notFound.entityName).toBe("Task");
      expect(notFound.entityId).toBe("non-existent-task-id");
    }
  });

  it("throws ConflictError on unique constraint violation", async () => {
    await courseRepo.create({ name: "Physics", code: "PHYS", color: "#FF0000" });
    try {
      await courseRepo.create({ name: "Physics 2", code: "PHYS", color: "#00FF00" });
      expect.fail("Should have thrown ConflictError");
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictError);
      const confErr = err as ConflictError;
      expect(confErr.code).toBe("CONFLICT_ERROR");
    }
  });

  it("verifies error taxonomy classes instantiate with correct codes", () => {
    expect(new DatabaseError("db failed").code).toBe("DATABASE_ERROR");
    expect(new MigrationError("mig failed").code).toBe("MIGRATION_ERROR");
    expect(new SyncError("sync failed").code).toBe("SYNC_ERROR");
    expect(new PermissionError("perm failed").code).toBe("PERMISSION_ERROR");
  });
});
