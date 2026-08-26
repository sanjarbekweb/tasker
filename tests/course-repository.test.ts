import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { CourseRepository } from "../src/db/repositories/course-repository";
import { ConflictError, NotFoundError, ValidationError } from "../src/db/errors";

describe("CourseRepository", () => {
  let db: AppDatabase;
  let repo: CourseRepository;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
    repo = new CourseRepository(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("creates and retrieves a course", async () => {
    const course = await repo.create({
      name: "Calculus I",
      code: "MATH101",
      color: "#3B82F6",
    });

    expect(course.id).toBeDefined();
    expect(course.name).toBe("Calculus I");
    expect(course.code).toBe("MATH101");
    expect(course.color).toBe("#3B82F6");
    expect(course.deletedAt).toBeNull();

    const fetched = await repo.findById(course.id);
    expect(fetched).toEqual(course);
  });

  it("enforces unique course code constraint", async () => {
    await repo.create({
      name: "Physics I",
      code: "PHYS101",
      color: "#EF4444",
    });

    await expect(
      repo.create({
        name: "Physics Lab",
        code: "PHYS101",
        color: "#10B981",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("validates input data", async () => {
    await expect(
      repo.create({
        name: "",
        code: "MATH101",
        color: "#3B82F6",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("updates an existing course", async () => {
    const course = await repo.create({
      name: "Chemistry I",
      code: "CHEM101",
      color: "#F59E0B",
    });

    const updated = await repo.update(course.id, {
      name: "General Chemistry I",
      color: "#10B981",
    });

    expect(updated.name).toBe("General Chemistry I");
    expect(updated.color).toBe("#10B981");
    expect(updated.code).toBe("CHEM101");
  });

  it("soft deletes a course and excludes it from active list", async () => {
    const course = await repo.create({
      name: "Biology I",
      code: "BIO101",
      color: "#8B5CF6",
    });

    let active = await repo.listActive();
    expect(active.length).toBe(1);

    await repo.softDelete(course.id);

    active = await repo.listActive();
    expect(active.length).toBe(0);

    const fetched = await repo.findById(course.id);
    expect(fetched).toBeNull();
  });
});
