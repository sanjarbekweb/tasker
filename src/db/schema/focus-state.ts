import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { tasks } from "./tasks";

export const focusModeEnum = ["work", "short_break", "long_break"] as const;
export type FocusMode = (typeof focusModeEnum)[number];

export const focusStatusEnum = ["idle", "running", "paused", "completed"] as const;
export type FocusStatus = (typeof focusStatusEnum)[number];

export const focusState = sqliteTable("focus_state", {
  id: text("id").primaryKey(),
  taskId: text("task_id").references(() => tasks.id),
  mode: text("mode", { enum: focusModeEnum }).notNull().default("work"),
  startedAt: integer("started_at", { mode: "number" }),
  targetAt: integer("target_at", { mode: "number" }),
  pausedAt: integer("paused_at", { mode: "number" }),
  status: text("status", { enum: focusStatusEnum }).notNull().default("idle"),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
});

export type FocusState = typeof focusState.$inferSelect;
export type NewFocusState = typeof focusState.$inferInsert;
