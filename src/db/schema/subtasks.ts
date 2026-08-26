import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { tasks } from "./tasks";

export const subtasks = sqliteTable(
  "subtasks",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id),
    title: text("title").notNull(),
    isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
    orderIndex: integer("order_index", { mode: "number" }).notNull().default(0),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "number" }),
  },
  (table) => [
    index("subtasks_task_id_order_idx").on(table.taskId, table.orderIndex),
  ]
);

export type Subtask = typeof subtasks.$inferSelect;
export type NewSubtask = typeof subtasks.$inferInsert;
