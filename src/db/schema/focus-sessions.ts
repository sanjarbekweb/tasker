import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { tasks } from "./tasks";

export const focusSessionTypeEnum = ["work", "short_break", "long_break"] as const;
export type FocusSessionType = (typeof focusSessionTypeEnum)[number];

export const focusSessions = sqliteTable(
  "focus_sessions",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id").references(() => tasks.id),
    durationMinutes: integer("duration_minutes", { mode: "number" }).notNull(),
    sessionType: text("session_type", { enum: focusSessionTypeEnum }).notNull(),
    startedAt: integer("started_at", { mode: "number" }).notNull(),
    completedAt: integer("completed_at", { mode: "number" }).notNull(),
    wasCompleted: integer("was_completed", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("focus_sessions_task_id_idx").on(table.taskId),
    index("focus_sessions_completed_at_idx").on(table.completedAt),
  ]
);

export type FocusSession = typeof focusSessions.$inferSelect;
export type NewFocusSession = typeof focusSessions.$inferInsert;
