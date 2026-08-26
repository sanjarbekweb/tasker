import { eq, and, isNull } from "drizzle-orm";
import { AppDatabase } from "../client";
import { courses, Course } from "../schema/courses";
import { createCourseSchema, updateCourseSchema } from "../validation";
import { ConflictError, DatabaseError, NotFoundError, ValidationError } from "../errors";

export class CourseRepository {
  constructor(private db: AppDatabase) {}

  async create(input: unknown): Promise<Course> {
    const parseResult = createCourseSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid course creation data", parseResult.error.flatten());
    }

    const { name, code, color, id } = parseResult.data;
    const now = Date.now();
    const courseId = id ?? crypto.randomUUID();

    try {
      const existing = await this.findByCode(code);
      if (existing) {
        throw new ConflictError(`Course with code "${code}" already exists`);
      }

      await this.db.insert(courses).values({
        id: courseId,
        name,
        code,
        color,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const created = await this.findById(courseId);
      if (!created) {
        throw new DatabaseError("Failed to retrieve created course");
      }
      return created;
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Database error while creating course", error);
    }
  }

  async findById(id: string): Promise<Course | null> {
    try {
      const result = await this.db
        .select()
        .from(courses)
        .where(and(eq(courses.id, id), isNull(courses.deletedAt)))
        .limit(1);
      return result[0] ?? null;
    } catch (error) {
      throw new DatabaseError(`Database error finding course by id ${id}`, error);
    }
  }

  async findByCode(code: string): Promise<Course | null> {
    try {
      const result = await this.db
        .select()
        .from(courses)
        .where(and(eq(courses.code, code), isNull(courses.deletedAt)))
        .limit(1);
      return result[0] ?? null;
    } catch (error) {
      throw new DatabaseError(`Database error finding course by code ${code}`, error);
    }
  }

  async listActive(): Promise<Course[]> {
    try {
      return await this.db
        .select()
        .from(courses)
        .where(isNull(courses.deletedAt));
    } catch (error) {
      throw new DatabaseError("Database error listing active courses", error);
    }
  }

  async update(id: string, input: unknown): Promise<Course> {
    const parseResult = updateCourseSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid course update data", parseResult.error.flatten());
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Course with id "${id}" not found`, "Course", id);
    }

    const now = Date.now();
    try {
      if (parseResult.data.code && parseResult.data.code !== existing.code) {
        const duplicate = await this.findByCode(parseResult.data.code);
        if (duplicate && duplicate.id !== id) {
          throw new ConflictError(`Course with code "${parseResult.data.code}" already exists`);
        }
      }

      await this.db
        .update(courses)
        .set({
          ...parseResult.data,
          updatedAt: now,
        })
        .where(eq(courses.id, id));

      const updated = await this.findById(id);
      if (!updated) {
        throw new NotFoundError(`Course with id "${id}" not found after update`, "Course", id);
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError(`Database error updating course ${id}`, error);
    }
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Course with id "${id}" not found`, "Course", id);
    }

    try {
      await this.db
        .update(courses)
        .set({
          deletedAt: Date.now(),
          updatedAt: Date.now(),
        })
        .where(eq(courses.id, id));
    } catch (error) {
      throw new DatabaseError(`Database error soft-deleting course ${id}`, error);
    }
  }
}
