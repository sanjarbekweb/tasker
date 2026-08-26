import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { courses } from "./courses";

export const eventTypeEnum = ["class", "exam", "assignment", "study", "custom"] as const;
export type EventType = (typeof eventTypeEnum)[number];

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    seriesId: text("series_id"),
    courseId: text("course_id").references(() => courses.id),
    title: text("title").notNull(),
    eventType: text("event_type", { enum: eventTypeEnum }).notNull().default("class"),
    startTime: integer("start_time", { mode: "number" }).notNull(),
    endTime: integer("end_time", { mode: "number" }).notNull(),
    isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
    recurrenceRule: text("recurrence_rule"),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "number" }),
  },
  (table) => [
    index("events_start_time_idx").on(table.startTime),
    index("events_end_time_idx").on(table.endTime),
    index("events_course_id_start_time_idx").on(table.courseId, table.startTime),
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
