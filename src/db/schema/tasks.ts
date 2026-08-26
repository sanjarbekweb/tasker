import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { courses } from "./courses";

export const priorityEnum = ["p1", "p2", "p3", "p4"] as const;
export type Priority = (typeof priorityEnum)[number];

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id").references(() => courses.id),
    title: text("title").notNull(),
    description: text("description"),
    priority: text("priority", { enum: priorityEnum }).notNull().default("p4"),
    isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
    dueDate: text("due_date"),
    timeBlockStart: text("time_block_start"),
    timeBlockEnd: text("time_block_end"),
    estimatedPomodoros: integer("estimated_pomodoros", { mode: "number" }).notNull().default(1),
    completedPomodoros: integer("completed_pomodoros", { mode: "number" }).notNull().default(0),
    completedAt: integer("completed_at", { mode: "number" }),
    orderIndex: integer("order_index", { mode: "number" }).notNull().default(0),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "number" }),
  },
  (table) => [
    index("tasks_due_date_is_completed_order_idx").on(table.dueDate, table.isCompleted, table.orderIndex),
    index("tasks_course_id_is_completed_idx").on(table.courseId, table.isCompleted),
    index("tasks_time_block_start_idx").on(table.timeBlockStart),
  ]
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
