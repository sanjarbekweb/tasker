import { z } from "zod";
import { AppDatabase } from "../../db/client";
import { courses } from "../../db/schema/courses";
import { tasks } from "../../db/schema/tasks";
import { subtasks } from "../../db/schema/subtasks";
import { events } from "../../db/schema/events";
import { focusSessions } from "../../db/schema/focus-sessions";
import { userPreferences } from "../../db/schema/preferences";
import { DatabaseError, ValidationError } from "../../db/errors";
import { logger } from "../../utils/logger";

export const backupSchema = z.object({
  schemaVersion: z.number().int().positive(),
  appVersion: z.string(),
  exportedAt: z.string(),
  courses: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      color: z.string(),
      createdAt: z.number(),
      updatedAt: z.number(),
      deletedAt: z.number().nullable().optional(),
    })
  ),
  tasks: z.array(
    z.object({
      id: z.string(),
      courseId: z.string().nullable().optional(),
      title: z.string(),
      description: z.string().nullable().optional(),
      priority: z.enum(["p1", "p2", "p3", "p4"]),
      isCompleted: z.boolean(),
      dueDate: z.string().nullable().optional(),
      timeBlockStart: z.string().nullable().optional(),
      timeBlockEnd: z.string().nullable().optional(),
      estimatedPomodoros: z.number().int(),
      completedPomodoros: z.number().int(),
      completedAt: z.number().nullable().optional(),
      orderIndex: z.number().int(),
      createdAt: z.number(),
      updatedAt: z.number(),
      deletedAt: z.number().nullable().optional(),
    })
  ),
  subtasks: z.array(
    z.object({
      id: z.string(),
      taskId: z.string(),
      title: z.string(),
      isCompleted: z.boolean(),
      orderIndex: z.number().int(),
      createdAt: z.number(),
      updatedAt: z.number(),
      deletedAt: z.number().nullable().optional(),
    })
  ),
  events: z.array(
    z.object({
      id: z.string(),
      seriesId: z.string().nullable().optional(),
      courseId: z.string().nullable().optional(),
      title: z.string(),
      eventType: z.enum(["custom", "class", "exam", "assignment", "study"]),
      startTime: z.number(),
      endTime: z.number(),
      isRecurring: z.boolean(),
      recurrenceRule: z.string().nullable().optional(),
      createdAt: z.number(),
      updatedAt: z.number(),
      deletedAt: z.number().nullable().optional(),
    })
  ),
  focusSessions: z.array(
    z.object({
      id: z.string(),
      taskId: z.string().nullable().optional(),
      durationMinutes: z.number().int(),
      sessionType: z.enum(["work", "short_break", "long_break"]),
      startedAt: z.number(),
      completedAt: z.number(),
      wasCompleted: z.boolean(),
      createdAt: z.number(),
    })
  ),
  preferences: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      updatedAt: z.number(),
    })
  ),
});

export type BackupData = z.infer<typeof backupSchema>;

export async function exportBackup(db: AppDatabase): Promise<string> {
  try {
    const allCourses = await db.select().from(courses);
    const allTasks = await db.select().from(tasks);
    const allSubtasks = await db.select().from(subtasks);
    const allEvents = await db.select().from(events);
    const allSessions = await db.select().from(focusSessions);
    const allPrefs = await db.select().from(userPreferences);

    const payload: BackupData = {
      schemaVersion: 1,
      appVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      courses: allCourses,
      tasks: allTasks,
      subtasks: allSubtasks,
      events: allEvents,
      focusSessions: allSessions,
      preferences: allPrefs,
    };

    return JSON.stringify(payload, null, 2);
  } catch (err) {
    logger.error("BackupService", "Export failed", err);
    throw new DatabaseError("Failed to export local data", err);
  }
}

export async function importBackup(db: AppDatabase, jsonString: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new ValidationError("Invalid JSON format for backup file", err);
  }

  const result = backupSchema.safeParse(parsed);
  if (!result.success) {
    throw new ValidationError("Backup schema validation failed", result.error.flatten());
  }

  const data = result.data;

  try {
    await db.transaction(async (tx) => {
      // Upsert courses
      for (const c of data.courses) {
        await tx.insert(courses).values(c).onConflictDoUpdate({
          target: courses.id,
          set: c,
        });
      }
      // Upsert tasks
      for (const t of data.tasks) {
        await tx.insert(tasks).values(t).onConflictDoUpdate({
          target: tasks.id,
          set: t,
        });
      }
      // Upsert subtasks
      for (const s of data.subtasks) {
        await tx.insert(subtasks).values(s).onConflictDoUpdate({
          target: subtasks.id,
          set: s,
        });
      }
      // Upsert events
      for (const e of data.events) {
        await tx.insert(events).values(e).onConflictDoUpdate({
          target: events.id,
          set: e,
        });
      }
      // Upsert focus sessions
      for (const fs of data.focusSessions) {
        await tx.insert(focusSessions).values(fs).onConflictDoUpdate({
          target: focusSessions.id,
          set: fs,
        });
      }
      // Upsert preferences
      for (const p of data.preferences) {
        await tx.insert(userPreferences).values(p).onConflictDoUpdate({
          target: userPreferences.key,
          set: p,
        });
      }
    });

    logger.info("BackupService", "Successfully imported backup");
  } catch (err) {
    logger.error("BackupService", "Import failed during database transaction", err);
    throw new DatabaseError("Failed to import backup data", err);
  }
}
