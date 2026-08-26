import { describe, it, expect } from "vitest";
import {
  sortTasks,
  filterTasks,
  calculateSubtaskProgress,
  isTaskOverdue,
} from "../src/domain/tasks";
import {
  sortEventsByStartTime,
  filterEvents,
  isEventOngoing,
  formatEventTimeRange,
} from "../src/domain/events";
import { Task } from "../src/db/schema/tasks";
import { Subtask } from "../src/db/schema/subtasks";
import { Event } from "../src/db/schema/events";

describe("Domain Tasks & Events Utilities", () => {
  describe("Task Utilities", () => {
    it("sorts tasks by completion (incomplete first), orderIndex, priority, and dueDate", () => {
      const now = Date.now();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Done Task",
          isCompleted: true,
          priority: "p1",
          orderIndex: 0,
          dueDate: "2026-08-27",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          courseId: null,
          description: null,
          timeBlockStart: null,
          timeBlockEnd: null,
          estimatedPomodoros: 1,
          completedPomodoros: 1,
          completedAt: now,
        },
        {
          id: "2",
          title: "P3 Task",
          isCompleted: false,
          priority: "p3",
          orderIndex: 1,
          dueDate: "2026-08-27",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          courseId: null,
          description: null,
          timeBlockStart: null,
          timeBlockEnd: null,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          completedAt: null,
        },
        {
          id: "3",
          title: "P1 Task",
          isCompleted: false,
          priority: "p1",
          orderIndex: 0,
          dueDate: "2026-08-27",
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          courseId: null,
          description: null,
          timeBlockStart: null,
          timeBlockEnd: null,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          completedAt: null,
        },
      ];

      const sorted = sortTasks(mockTasks);
      expect(sorted.map((t) => t.id)).toEqual(["3", "2", "1"]);
    });

    it("filters tasks by search query, course, priority, and overdue status", () => {
      const now = Date.now();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Math Homework 1",
          courseId: "course-math",
          priority: "p1",
          isCompleted: false,
          dueDate: "2026-08-26", // Overdue relative to 2026-08-27
          orderIndex: 0,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          description: "Chapter 1-3",
          timeBlockStart: null,
          timeBlockEnd: null,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          completedAt: null,
        },
        {
          id: "2",
          title: "Physics Lab",
          courseId: "course-phys",
          priority: "p2",
          isCompleted: false,
          dueDate: "2026-08-28",
          orderIndex: 1,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          description: null,
          timeBlockStart: null,
          timeBlockEnd: null,
          estimatedPomodoros: 2,
          completedPomodoros: 0,
          completedAt: null,
        },
      ];

      // Filter by search
      expect(filterTasks(mockTasks, { searchQuery: "math" }).map((t) => t.id)).toEqual(["1"]);
      // Filter by course
      expect(filterTasks(mockTasks, { courseId: "course-phys" }).map((t) => t.id)).toEqual(["2"]);
      // Filter overdue
      expect(filterTasks(mockTasks, { overdueOnly: true }, "2026-08-27").map((t) => t.id)).toEqual(["1"]);
    });

    it("calculates subtask progress accurately", () => {
      const now = Date.now();
      const subtasks: Subtask[] = [
        { id: "1", taskId: "t1", title: "Sub 1", isCompleted: true, orderIndex: 0, createdAt: now, updatedAt: now, deletedAt: null },
        { id: "2", taskId: "t1", title: "Sub 2", isCompleted: false, orderIndex: 1, createdAt: now, updatedAt: now, deletedAt: null },
        { id: "3", taskId: "t1", title: "Sub 3 (deleted)", isCompleted: true, orderIndex: 2, createdAt: now, updatedAt: now, deletedAt: now },
      ];

      const progress = calculateSubtaskProgress(subtasks);
      expect(progress.total).toBe(2);
      expect(progress.completed).toBe(1);
      expect(progress.progress).toBe(0.5);
    });

    it("checks if task is overdue", () => {
      const now = Date.now();
      const task: Task = {
        id: "1",
        title: "Test",
        dueDate: "2026-08-26",
        isCompleted: false,
        priority: "p4",
        orderIndex: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        courseId: null,
        description: null,
        timeBlockStart: null,
        timeBlockEnd: null,
        estimatedPomodoros: 1,
        completedPomodoros: 0,
        completedAt: null,
      };

      expect(isTaskOverdue(task, "2026-08-27")).toBe(true);
      expect(isTaskOverdue(task, "2026-08-26")).toBe(false);
      expect(isTaskOverdue({ ...task, isCompleted: true }, "2026-08-27")).toBe(false);
    });
  });

  describe("Event Utilities", () => {
    it("sorts events by start time", () => {
      const now = Date.now();
      const events: Event[] = [
        { id: "1", title: "Later", eventType: "class", startTime: 3000, endTime: 4000, isRecurring: false, recurrenceRule: null, courseId: null, seriesId: null, createdAt: now, updatedAt: now, deletedAt: null },
        { id: "2", title: "Earlier", eventType: "study", startTime: 1000, endTime: 2000, isRecurring: false, recurrenceRule: null, courseId: null, seriesId: null, createdAt: now, updatedAt: now, deletedAt: null },
      ];

      const sorted = sortEventsByStartTime(events);
      expect(sorted.map((e) => e.id)).toEqual(["2", "1"]);
    });

    it("detects ongoing event at given timestamp", () => {
      const now = Date.now();
      const event: Event = {
        id: "1",
        title: "Class",
        eventType: "class",
        startTime: 10000,
        endTime: 20000,
        isRecurring: false,
        recurrenceRule: null,
        courseId: null,
        seriesId: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      expect(isEventOngoing(event, 15000)).toBe(true);
      expect(isEventOngoing(event, 5000)).toBe(false);
      expect(isEventOngoing(event, 25000)).toBe(false);
    });
  });
});
