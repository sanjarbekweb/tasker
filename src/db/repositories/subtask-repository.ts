import { eq, and, isNull, asc } from "drizzle-orm";
import { AppDatabase } from "../client";
import { subtasks, Subtask } from "../schema/subtasks";
import { tasks } from "../schema/tasks";
import { createSubtaskSchema, updateSubtaskSchema } from "../validation";
import { DatabaseError, NotFoundError, ValidationError } from "../errors";

export class SubtaskRepository {
  constructor(private db: AppDatabase) {}

  async create(input: unknown): Promise<Subtask> {
    const parseResult = createSubtaskSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid subtask creation data", parseResult.error.flatten());
    }

    const { taskId, title, isCompleted, orderIndex, id } = parseResult.data;
    const now = Date.now();
    const subtaskId = id ?? crypto.randomUUID();

    try {
      const parentTask = await this.db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
        .limit(1);
      if (parentTask.length === 0) {
        throw new NotFoundError(`Parent task with id "${taskId}" not found`, "Task", taskId);
      }

      await this.db.insert(subtasks).values({
        id: subtaskId,
        taskId,
        title,
        isCompleted: isCompleted ?? false,
        orderIndex: orderIndex ?? 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const created = await this.findById(subtaskId);
      if (!created) {
        throw new DatabaseError("Failed to retrieve created subtask");
      }
      return created;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Database error creating subtask", error);
    }
  }

  async findById(id: string): Promise<Subtask | null> {
    try {
      const result = await this.db
        .select()
        .from(subtasks)
        .where(and(eq(subtasks.id, id), isNull(subtasks.deletedAt)))
        .limit(1);
      return result[0] ?? null;
    } catch (error) {
      throw new DatabaseError(`Database error finding subtask ${id}`, error);
    }
  }

  async listByTask(taskId: string): Promise<Subtask[]> {
    try {
      return await this.db
        .select()
        .from(subtasks)
        .where(and(eq(subtasks.taskId, taskId), isNull(subtasks.deletedAt)))
        .orderBy(asc(subtasks.orderIndex));
    } catch (error) {
      throw new DatabaseError(`Database error listing subtasks for task ${taskId}`, error);
    }
  }

  async update(id: string, input: unknown): Promise<Subtask> {
    const parseResult = updateSubtaskSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid subtask update data", parseResult.error.flatten());
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Subtask with id "${id}" not found`, "Subtask", id);
    }

    const now = Date.now();
    try {
      await this.db
        .update(subtasks)
        .set({
          ...parseResult.data,
          updatedAt: now,
        })
        .where(eq(subtasks.id, id));

      const updated = await this.findById(id);
      if (!updated) {
        throw new NotFoundError(`Subtask with id "${id}" not found after update`, "Subtask", id);
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Database error updating subtask ${id}`, error);
    }
  }

  async reorder(taskId: string, subtaskIdsInOrder: string[]): Promise<void> {
    const now = Date.now();
    try {
      await this.db.transaction(async (tx) => {
        for (let i = 0; i < subtaskIdsInOrder.length; i++) {
          const subtaskId = subtaskIdsInOrder[i];
          if (!subtaskId) continue;
          await tx
            .update(subtasks)
            .set({
              orderIndex: i,
              updatedAt: now,
            })
            .where(and(eq(subtasks.id, subtaskId), eq(subtasks.taskId, taskId)));
        }
      });
    } catch (error) {
      throw new DatabaseError(`Database error reordering subtasks for task ${taskId}`, error);
    }
  }

  async listByTaskId(taskId: string): Promise<Subtask[]> {
    return this.listByTask(taskId);
  }

  async toggleComplete(id: string, isCompleted: boolean): Promise<Subtask> {
    return this.update(id, { isCompleted });
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Subtask with id "${id}" not found`, "Subtask", id);
    }

    try {
      await this.db
        .update(subtasks)
        .set({
          deletedAt: Date.now(),
          updatedAt: Date.now(),
        })
        .where(eq(subtasks.id, id));
    } catch (error) {
      throw new DatabaseError(`Database error soft-deleting subtask ${id}`, error);
    }
  }

  async delete(id: string): Promise<void> {
    return this.softDelete(id);
  }
}
