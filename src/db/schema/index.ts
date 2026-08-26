import { relations } from "drizzle-orm";
import { courses } from "./courses";
import { tasks } from "./tasks";
import { subtasks } from "./subtasks";
import { events } from "./events";
import { focusSessions } from "./focus-sessions";
import { focusState } from "./focus-state";
import { userPreferences } from "./preferences";
import { statisticsCache } from "./statistics-cache";

export * from "./courses";
export * from "./tasks";
export * from "./subtasks";
export * from "./events";
export * from "./focus-sessions";
export * from "./focus-state";
export * from "./preferences";
export * from "./statistics-cache";

export const coursesRelations = relations(courses, ({ many }) => ({
  tasks: many(tasks),
  events: many(events),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  course: one(courses, {
    fields: [tasks.courseId],
    references: [courses.id],
  }),
  subtasks: many(subtasks),
  focusSessions: many(focusSessions),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  course: one(courses, {
    fields: [events.courseId],
    references: [courses.id],
  }),
}));

export const focusSessionsRelations = relations(focusSessions, ({ one }) => ({
  task: one(tasks, {
    fields: [focusSessions.taskId],
    references: [tasks.id],
  }),
}));

export const focusStateRelations = relations(focusState, ({ one }) => ({
  task: one(tasks, {
    fields: [focusState.taskId],
    references: [tasks.id],
  }),
}));
