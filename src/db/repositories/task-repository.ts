import { eq, and, isNull, asc } from "drizzle-orm";
import { AppDatabase } from "../client";
import { tasks, Task } from "../schema/tasks";
import { subtasks } from "../schema/subtasks";
import { courses } from "../schema/courses";
import { createTaskSchema, updateTaskSchema } from "../validation";
import { DatabaseError, NotFoundError, ValidationError } from "../errors";

export class TaskRepository {
  constructor(private db: AppDatabase) {}

  async create(input: unknown): Promise<Task> {
    const parseResult = createTaskSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid task creation data", parseResult.error.flatten());
    }

    const {
      title,
      description,
      priority,
      isCompleted,
      dueDate,
      timeBlockStart,
      timeBlockEnd,
      estimatedPomodoros,
      completedPomodoros,
      orderIndex,
      courseId,
      id,
    } = parseResult.data;

    const now = Date.now();
    const taskId = id ?? crypto.randomUUID();

    try {
      if (courseId) {
        const course = await this.db
          .select()
          .from(courses)
          .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)))
          .limit(1);
        if (course.length === 0) {
          throw new NotFoundError(`Referenced course ${courseId} not found`, "Course", courseId);
        }
      }

      await this.db.insert(tasks).values({
        id: taskId,
        courseId: courseId ?? null,
        title,
        description: description ?? null,
        priority: priority ?? "p4",
        isCompleted: isCompleted ?? false,
        dueDate: dueDate ?? null,
        timeBlockStart: timeBlockStart ?? null,
        timeBlockEnd: timeBlockEnd ?? null,
        estimatedPomodoros: estimatedPomodoros ?? 1,
        completedPomodoros: completedPomodoros ?? 0,
        completedAt: isCompleted ? now : null,
        orderIndex: orderIndex ?? 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const created = await this.findById(taskId);
      if (!created) {
        throw new DatabaseError("Failed to retrieve created task");
      }
      return created;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Database error while creating task", error);
    }
  }

  async findById(id: string): Promise<Task | null> {
    try {
      const result = await this.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
        .limit(1);
      return result[0] ?? null;
    } catch (error) {
      throw new DatabaseError(`Database error finding task by id ${id}`, error);
    }
  }

  async listByDate(dueDate: string): Promise<Task[]> {
    try {
      return await this.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.dueDate, dueDate), isNull(tasks.deletedAt)))
        .orderBy(asc(tasks.orderIndex));
    } catch (error) {
      throw new DatabaseError(`Database error listing tasks for date ${dueDate}`, error);
    }
  }

  async listByCourse(courseId: string): Promise<Task[]> {
    try {
      return await this.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.courseId, courseId), isNull(tasks.deletedAt)))
        .orderBy(asc(tasks.orderIndex));
    } catch (error) {
      throw new DatabaseError(`Database error listing tasks for course ${courseId}`, error);
    }
  }

  async listActive(): Promise<Task[]> {
    try {
      return await this.db
        .select()
        .from(tasks)
        .where(isNull(tasks.deletedAt))
        .orderBy(asc(tasks.orderIndex));
    } catch (error) {
      throw new DatabaseError("Database error listing active tasks", error);
    }
  }

  async update(id: string, input: unknown): Promise<Task> {
    const parseResult = updateTaskSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid task update data", parseResult.error.flatten());
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Task with id "${id}" not found`, "Task", id);
    }

    const now = Date.now();
    try {
      if (parseResult.data.courseId) {
        const course = await this.db
          .select()
          .from(courses)
          .where(and(eq(courses.id, parseResult.data.courseId), isNull(courses.deletedAt)))
          .limit(1);
        if (course.length === 0) {
          throw new NotFoundError(`Referenced course ${parseResult.data.courseId} not found`, "Course", parseResult.data.courseId);
        }
      }

      const isCompleted = parseResult.data.isCompleted;
      let completedAt = parseResult.data.completedAt;
      if (isCompleted !== undefined) {
        completedAt = isCompleted ? (completedAt ?? now) : null;
      }

      await this.db
        .update(tasks)
        .set({
          ...parseResult.data,
          completedAt,
          updatedAt: now,
        })
        .where(eq(tasks.id, id));

      const updated = await this.findById(id);
      if (!updated) {
        throw new NotFoundError(`Task with id "${id}" not found after update`, "Task", id);
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Database error updating task ${id}`, error);
    }
  }

  /**
   * Atomic multi-table mutation: completes task and cascades completion to all active subtasks.
   */
  async completeTaskAtomic(id: string, cascadeSubtasks: boolean = true): Promise<Task> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Task with id "${id}" not found`, "Task", id);
    }

    const now = Date.now();

    try {
      await this.db.transaction(async (tx) => {
        await tx
          .update(tasks)
          .set({
            isCompleted: true,
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(tasks.id, id));

        if (cascadeSubtasks) {
          await tx
            .update(subtasks)
            .set({
              isCompleted: true,
              updatedAt: now,
            })
            .where(and(eq(subtasks.taskId, id), isNull(subtasks.deletedAt)));
        }
      });

      const updated = await this.findById(id);
      if (!updated) {
        throw new DatabaseError(`Failed to find task ${id} after completion`);
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Database error completing task ${id} atomically`, error);
    }
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Task with id "${id}" not found`, "Task", id);
    }

    const now = Date.now();
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .update(tasks)
          .set({
            deletedAt: now,
            updatedAt: now,
          })
          .where(eq(tasks.id, id));

        await tx
          .update(subtasks)
          .set({
            deletedAt: now,
            updatedAt: now,
          })
          .where(and(eq(subtasks.taskId, id), isNull(subtasks.deletedAt)));
      });
    } catch (error) {
      throw new DatabaseError(`Database error soft-deleting task ${id}`, error);
    }
  }
}
