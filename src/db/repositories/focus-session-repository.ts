import { eq, and, gte, lte, asc } from "drizzle-orm";
import { AppDatabase } from "../client";
import { focusSessions, FocusSession } from "../schema/focus-sessions";
import { tasks } from "../schema/tasks";
import { createFocusSessionSchema } from "../validation";
import { DatabaseError, NotFoundError, ValidationError } from "../errors";

export class FocusSessionRepository {
  constructor(private db: AppDatabase) {}

  async create(input: unknown): Promise<FocusSession> {
    const parseResult = createFocusSessionSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid focus session creation data", parseResult.error.flatten());
    }

    const {
      taskId,
      durationMinutes,
      sessionType,
      startedAt,
      completedAt,
      wasCompleted,
      id,
    } = parseResult.data;

    const now = Date.now();
    const sessionId = id ?? crypto.randomUUID();

    try {
      if (taskId) {
        const task = await this.db
          .select()
          .from(tasks)
          .where(eq(tasks.id, taskId))
          .limit(1);
        if (task.length === 0) {
          throw new NotFoundError(`Referenced task ${taskId} not found`, "Task", taskId);
        }
      }

      await this.db.insert(focusSessions).values({
        id: sessionId,
        taskId: taskId ?? null,
        durationMinutes,
        sessionType,
        startedAt,
        completedAt,
        wasCompleted,
        createdAt: now,
      });

      const created = await this.findById(sessionId);
      if (!created) {
        throw new DatabaseError("Failed to retrieve created focus session");
      }
      return created;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Database error while creating focus session", error);
    }
  }

  async findById(id: string): Promise<FocusSession | null> {
    try {
      const result = await this.db
        .select()
        .from(focusSessions)
        .where(eq(focusSessions.id, id))
        .limit(1);
      return result[0] ?? null;
    } catch (error) {
      throw new DatabaseError(`Database error finding focus session ${id}`, error);
    }
  }

  async listByTask(taskId: string): Promise<FocusSession[]> {
    try {
      return await this.db
        .select()
        .from(focusSessions)
        .where(eq(focusSessions.taskId, taskId))
        .orderBy(asc(focusSessions.startedAt));
    } catch (error) {
      throw new DatabaseError(`Database error listing focus sessions for task ${taskId}`, error);
    }
  }

  async listByDateRange(startTime: number, endTime: number): Promise<FocusSession[]> {
    try {
      return await this.db
        .select()
        .from(focusSessions)
        .where(
          and(
            gte(focusSessions.startedAt, startTime),
            lte(focusSessions.completedAt, endTime)
          )
        )
        .orderBy(asc(focusSessions.startedAt));
    } catch (error) {
      throw new DatabaseError("Database error listing focus sessions in date range", error);
    }
  }
}
