import { eq, and, sql } from "drizzle-orm";
import { AppDatabase } from "../client";
import { focusState, FocusState, FocusMode, FocusStatus } from "../schema/focus-state";
import { focusSessions, FocusSession } from "../schema/focus-sessions";
import { tasks } from "../schema/tasks";
import { updateFocusStateSchema } from "../validation";
import { DatabaseError, ValidationError } from "../errors";

export const SINGLETON_FOCUS_STATE_ID = "active_focus_state";

export interface CompleteSessionAtomicParams {
  sessionId?: string;
  durationMinutes: number;
  sessionType: "work" | "short_break" | "long_break";
  startedAt: number;
  completedAt: number;
  wasCompleted: boolean;
}

export interface CompleteSessionResult {
  completed: boolean;
  session: FocusSession | null;
  state: FocusState;
}

export class FocusStateRepository {
  constructor(private db: AppDatabase) {}

  async getState(): Promise<FocusState> {
    try {
      const existing = await this.db
        .select()
        .from(focusState)
        .where(eq(focusState.id, SINGLETON_FOCUS_STATE_ID))
        .limit(1);

      if (existing[0]) {
        return existing[0];
      }

      // Initialize default state if not exists
      const now = Date.now();
      await this.db.insert(focusState).values({
        id: SINGLETON_FOCUS_STATE_ID,
        taskId: null,
        mode: "work",
        startedAt: null,
        targetAt: null,
        pausedAt: null,
        status: "idle",
        updatedAt: now,
      });

      const created = await this.db
        .select()
        .from(focusState)
        .where(eq(focusState.id, SINGLETON_FOCUS_STATE_ID))
        .limit(1);

      if (!created[0]) {
        throw new DatabaseError("Failed to initialize default focus state");
      }
      return created[0];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError("Database error getting focus state", error);
    }
  }

  async setState(input: unknown): Promise<FocusState> {
    const parseResult = updateFocusStateSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid focus state data", parseResult.error.flatten());
    }

    const current = await this.getState();
    const now = Date.now();

    try {
      await this.db
        .update(focusState)
        .set({
          ...parseResult.data,
          updatedAt: now,
        })
        .where(eq(focusState.id, current.id));

      return await this.getState();
    } catch (error) {
      throw new DatabaseError("Database error updating focus state", error);
    }
  }

  async resetState(): Promise<FocusState> {
    const now = Date.now();
    try {
      await this.db
        .update(focusState)
        .set({
          taskId: null,
          mode: "work",
          startedAt: null,
          targetAt: null,
          pausedAt: null,
          status: "idle",
          updatedAt: now,
        })
        .where(eq(focusState.id, SINGLETON_FOCUS_STATE_ID));

      return await this.getState();
    } catch (error) {
      throw new DatabaseError("Database error resetting focus state", error);
    }
  }

  /**
   * Idempotent focus session completion:
   * 1. Status check-and-set (focus_state.status: 'running' -> 'completed') in a transaction.
   * 2. Only inserts session and increments task's completed_pomodoros if update affected a row.
   */
  async completeSessionAtomic(params: CompleteSessionAtomicParams): Promise<CompleteSessionResult> {
    const now = Date.now();
    const sessionId = params.sessionId ?? crypto.randomUUID();

    try {
      let createdSession: FocusSession | null = null;
      let wasTransitioned = false;

      await this.db.transaction(async (tx) => {
        // Step 1: Check-and-set status from 'running' to 'completed'
        const current = await tx
          .select()
          .from(focusState)
          .where(
            and(
              eq(focusState.id, SINGLETON_FOCUS_STATE_ID),
              eq(focusState.status, "running")
            )
          )
          .limit(1);

        if (current.length === 0) {
          // Status was not 'running' (already completed, cancelled, or idle)
          wasTransitioned = false;
          return;
        }

        const activeTask = current[0]?.taskId;

        // Perform status update
        await tx
          .update(focusState)
          .set({
            status: "completed",
            updatedAt: now,
          })
          .where(
            and(
              eq(focusState.id, SINGLETON_FOCUS_STATE_ID),
              eq(focusState.status, "running")
            )
          );

        // Step 2: Record focus session
        await tx.insert(focusSessions).values({
          id: sessionId,
          taskId: activeTask ?? null,
          durationMinutes: params.durationMinutes,
          sessionType: params.sessionType,
          startedAt: params.startedAt,
          completedAt: params.completedAt,
          wasCompleted: params.wasCompleted,
          createdAt: now,
        });

        // Step 3: Increment task pomodoros if task attached and session was completed
        if (activeTask && params.wasCompleted && params.sessionType === "work") {
          await tx
            .update(tasks)
            .set({
              completedPomodoros: sql`${tasks.completedPomodoros} + 1`,
              updatedAt: now,
            })
            .where(eq(tasks.id, activeTask));
        }

        wasTransitioned = true;
      });

      const updatedState = await this.getState();

      if (wasTransitioned) {
        const sessionRecord = await this.db
          .select()
          .from(focusSessions)
          .where(eq(focusSessions.id, sessionId))
          .limit(1);
        createdSession = sessionRecord[0] ?? null;
      }

      return {
        completed: wasTransitioned,
        session: createdSession,
        state: updatedState,
      };
    } catch (error) {
      throw new DatabaseError("Database error during atomic focus completion", error);
    }
  }
}
