import { z } from "zod";
import { priorityEnum } from "../schema/tasks";
import { eventTypeEnum } from "../schema/events";
import { focusSessionTypeEnum } from "../schema/focus-sessions";
import { focusModeEnum, focusStatusEnum } from "../schema/focus-state";

export const courseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  color: z.string().min(1, "Course color is required"),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  deletedAt: z.number().int().positive().nullable().optional(),
});

export const createCourseSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  color: z.string().min(1, "Course color is required"),
});

export const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});

export const taskSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1).nullable().optional(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().nullable().optional(),
  priority: z.enum(priorityEnum).default("p4"),
  isCompleted: z.boolean().default(false),
  dueDate: z.string().nullable().optional(),
  timeBlockStart: z.string().nullable().optional(),
  timeBlockEnd: z.string().nullable().optional(),
  estimatedPomodoros: z.number().int().min(1).default(1),
  completedPomodoros: z.number().int().min(0).default(0),
  completedAt: z.number().int().positive().nullable().optional(),
  orderIndex: z.number().int().default(0),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  deletedAt: z.number().int().positive().nullable().optional(),
});

export const createTaskSchema = z.object({
  id: z.string().min(1).optional(),
  courseId: z.string().min(1).nullable().optional(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().nullable().optional(),
  priority: z.enum(priorityEnum).optional().default("p4"),
  isCompleted: z.boolean().optional().default(false),
  dueDate: z.string().nullable().optional(),
  timeBlockStart: z.string().nullable().optional(),
  timeBlockEnd: z.string().nullable().optional(),
  estimatedPomodoros: z.number().int().min(1).optional().default(1),
  completedPomodoros: z.number().int().min(0).optional().default(0),
  orderIndex: z.number().int().optional().default(0),
});

export const updateTaskSchema = z.object({
  courseId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(priorityEnum).optional(),
  isCompleted: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
  timeBlockStart: z.string().nullable().optional(),
  timeBlockEnd: z.string().nullable().optional(),
  estimatedPomodoros: z.number().int().min(1).optional(),
  completedPomodoros: z.number().int().min(0).optional(),
  completedAt: z.number().int().positive().nullable().optional(),
  orderIndex: z.number().int().optional(),
});

export const subtaskSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  title: z.string().min(1, "Subtask title is required"),
  isCompleted: z.boolean().default(false),
  orderIndex: z.number().int().default(0),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  deletedAt: z.number().int().positive().nullable().optional(),
});

export const createSubtaskSchema = z.object({
  id: z.string().min(1).optional(),
  taskId: z.string().min(1),
  title: z.string().min(1, "Subtask title is required"),
  isCompleted: z.boolean().optional().default(false),
  orderIndex: z.number().int().optional().default(0),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  isCompleted: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

export const eventSchema = z.object({
  id: z.string().min(1),
  seriesId: z.string().min(1).nullable().optional(),
  courseId: z.string().min(1).nullable().optional(),
  title: z.string().min(1, "Event title is required"),
  eventType: z.enum(eventTypeEnum).default("class"),
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().nullable().optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  deletedAt: z.number().int().positive().nullable().optional(),
});

export const createEventSchema = z.object({
  id: z.string().min(1).optional(),
  seriesId: z.string().min(1).nullable().optional(),
  courseId: z.string().min(1).nullable().optional(),
  title: z.string().min(1, "Event title is required"),
  eventType: z.enum(eventTypeEnum).optional().default("class"),
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: z.string().nullable().optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: "Start time must be before end time",
  path: ["endTime"],
});

export const updateEventSchema = z.object({
  seriesId: z.string().min(1).nullable().optional(),
  courseId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).optional(),
  eventType: z.enum(eventTypeEnum).optional(),
  startTime: z.number().int().positive().optional(),
  endTime: z.number().int().positive().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().nullable().optional(),
});

export const focusSessionSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1).nullable().optional(),
  durationMinutes: z.number().int().min(1),
  sessionType: z.enum(focusSessionTypeEnum),
  startedAt: z.number().int().positive(),
  completedAt: z.number().int().positive(),
  wasCompleted: z.boolean(),
  createdAt: z.number().int().positive(),
});

export const createFocusSessionSchema = z.object({
  id: z.string().min(1).optional(),
  taskId: z.string().min(1).nullable().optional(),
  durationMinutes: z.number().int().min(1),
  sessionType: z.enum(focusSessionTypeEnum),
  startedAt: z.number().int().positive(),
  completedAt: z.number().int().positive(),
  wasCompleted: z.boolean(),
});

export const focusStateSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1).nullable().optional(),
  mode: z.enum(focusModeEnum),
  startedAt: z.number().int().positive().nullable().optional(),
  targetAt: z.number().int().positive().nullable().optional(),
  pausedAt: z.number().int().positive().nullable().optional(),
  status: z.enum(focusStatusEnum),
  updatedAt: z.number().int().positive(),
});

export const updateFocusStateSchema = z.object({
  taskId: z.string().min(1).nullable().optional(),
  mode: z.enum(focusModeEnum).optional(),
  startedAt: z.number().int().positive().nullable().optional(),
  targetAt: z.number().int().positive().nullable().optional(),
  pausedAt: z.number().int().positive().nullable().optional(),
  status: z.enum(focusStatusEnum).optional(),
});

export const userPreferenceSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  updatedAt: z.number().int().positive(),
});
