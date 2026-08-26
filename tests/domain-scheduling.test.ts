import { describe, it, expect } from "vitest";
import {
  detectCollision,
  findCollisions,
  calculateDuration,
  validateTimeRange,
  getFreeGaps,
  generateRecurringEvents,
  rescheduleTask,
  TimeInterval,
} from "../src/domain/scheduling";

describe("Domain Scheduling", () => {
  describe("detectCollision & findCollisions", () => {
    it("detects overlapping intervals correctly (A.start < B.end && A.end > B.start)", () => {
      const a: TimeInterval = { startTime: 1000, endTime: 2000 };
      const b: TimeInterval = { startTime: 1500, endTime: 2500 };
      const c: TimeInterval = { startTime: 2000, endTime: 3000 }; // Contiguous, not overlapping
      const d: TimeInterval = { startTime: 500, endTime: 1000 }; // Contiguous, not overlapping
      const e: TimeInterval = { startTime: 2500, endTime: 3500 }; // Completely separate

      expect(detectCollision(a, b)).toBe(true);
      expect(detectCollision(b, a)).toBe(true);
      expect(detectCollision(a, c)).toBe(false);
      expect(detectCollision(a, d)).toBe(false);
      expect(detectCollision(a, e)).toBe(false);
    });

    it("finds all colliding intervals excluding self", () => {
      const target: TimeInterval = { id: "1", startTime: 1000, endTime: 3000 };
      const candidates: TimeInterval[] = [
        { id: "1", startTime: 1000, endTime: 3000 },
        { id: "2", startTime: 500, endTime: 1500 }, // Overlaps
        { id: "3", startTime: 2000, endTime: 4000 }, // Overlaps
        { id: "4", startTime: 3500, endTime: 5000 }, // No overlap
      ];

      const collisions = findCollisions(target, candidates);
      expect(collisions.map((c) => c.id)).toEqual(["2", "3"]);
    });
  });

  describe("calculateDuration & validateTimeRange", () => {
    it("calculates duration in minutes accurately", () => {
      const start = new Date("2026-08-27T10:00:00Z").getTime();
      const end = new Date("2026-08-27T11:45:00Z").getTime();
      expect(calculateDuration(start, end)).toBe(105);
      expect(calculateDuration(end, start)).toBe(0);
    });

    it("validates time range bounds", () => {
      expect(validateTimeRange(1000, 2000)).toBe(true);
      expect(validateTimeRange(2000, 1000)).toBe(false);
      expect(validateTimeRange(1000, 1000)).toBe(false);
    });
  });

  describe("getFreeGaps", () => {
    it("finds free gaps between scheduled intervals", () => {
      const baseDate = new Date("2026-08-27T08:00:00Z").getTime();
      const windowStart = baseDate; // 08:00
      const windowEnd = baseDate + 8 * 60 * 60 * 1000; // 16:00 (8 hours)

      // Event 1: 09:00 - 10:30 (90 min)
      // Event 2: 12:00 - 13:00 (60 min)
      // Event 3: 13:00 - 14:00 (60 min) - contiguous with Event 2
      const intervals: TimeInterval[] = [
        {
          startTime: baseDate + 1 * 60 * 60 * 1000, // 09:00
          endTime: baseDate + 2.5 * 60 * 60 * 1000, // 10:30
        },
        {
          startTime: baseDate + 4 * 60 * 60 * 1000, // 12:00
          endTime: baseDate + 5 * 60 * 60 * 1000, // 13:00
        },
        {
          startTime: baseDate + 5 * 60 * 60 * 1000, // 13:00
          endTime: baseDate + 6 * 60 * 60 * 1000, // 14:00
        },
      ];

      const gaps = getFreeGaps(intervals, windowStart, windowEnd, 15);
      expect(gaps.length).toBe(3);

      // Gap 1: 08:00 - 09:00 (60 min)
      expect(gaps[0]?.durationMinutes).toBe(60);
      expect(gaps[0]?.startTime).toBe(windowStart);
      expect(gaps[0]?.endTime).toBe(intervals[0]!.startTime);

      // Gap 2: 10:30 - 12:00 (90 min)
      expect(gaps[1]?.durationMinutes).toBe(90);
      expect(gaps[1]?.startTime).toBe(intervals[0]!.endTime);
      expect(gaps[1]?.endTime).toBe(intervals[1]!.startTime);

      // Gap 3: 14:00 - 16:00 (120 min)
      expect(gaps[2]?.durationMinutes).toBe(120);
      expect(gaps[2]?.startTime).toBe(intervals[2]!.endTime);
      expect(gaps[2]?.endTime).toBe(windowEnd);
    });

    it("returns entire window when no intervals exist", () => {
      const start = 10000;
      const end = start + 60 * 60 * 1000; // 60 min
      const gaps = getFreeGaps([], start, end, 10);
      expect(gaps.length).toBe(1);
      expect(gaps[0]?.durationMinutes).toBe(60);
    });

    it("filters out gaps shorter than minDurationMinutes", () => {
      const start = 10000;
      const end = start + 30 * 60 * 1000; // 30 min
      // 4 minute gap
      const intervals: TimeInterval[] = [
        { startTime: start + 4 * 60 * 1000, endTime: end },
      ];
      const gaps = getFreeGaps(intervals, start, end, 5);
      expect(gaps.length).toBe(0);
    });
  });

  describe("generateRecurringEvents", () => {
    it("generates daily recurring event instances", () => {
      const baseStart = new Date("2026-08-27T09:00:00Z").getTime();
      const baseEnd = new Date("2026-08-27T10:00:00Z").getTime();

      const rangeStart = baseStart;
      const rangeEnd = baseStart + 3 * 24 * 60 * 60 * 1000; // 3 days

      const instances = generateRecurringEvents(
        { id: "event-1", startTime: baseStart, endTime: baseEnd },
        { frequency: "daily", interval: 1 },
        rangeStart,
        rangeEnd
      );

      expect(instances.length).toBe(4);
      expect(instances[0]?.instanceIndex).toBe(0);
      expect(instances[1]?.instanceIndex).toBe(1);
      expect(instances[0]?.seriesId).toBe("event-1");
    });

    it("generates weekdays-only recurring instances", () => {
      // 2026-08-28 is Friday
      const friday = new Date("2026-08-28T09:00:00Z").getTime();
      const fridayEnd = new Date("2026-08-28T10:00:00Z").getTime();
      // Range through Tuesday (Friday, Sat, Sun, Mon, Tue)
      const rangeEnd = friday + 4 * 24 * 60 * 60 * 1000;

      const instances = generateRecurringEvents(
        { id: "event-weekdays", startTime: friday, endTime: fridayEnd },
        { frequency: "weekdays" },
        friday,
        rangeEnd
      );

      // Should include Friday, Monday, Tuesday (3 instances, skips Sat & Sun)
      expect(instances.length).toBe(3);
    });
  });

  describe("rescheduleTask", () => {
    it("updates task due date and time block immutably", () => {
      const original = {
        id: "task-1",
        title: "Homework",
        dueDate: "2026-08-27",
        timeBlockStart: "10:00",
        timeBlockEnd: "11:00",
      };

      const rescheduled = rescheduleTask(original, "2026-08-29", {
        start: "14:00",
        end: "15:30",
      });

      expect(rescheduled.dueDate).toBe("2026-08-29");
      expect(rescheduled.timeBlockStart).toBe("14:00");
      expect(rescheduled.timeBlockEnd).toBe("15:30");
      expect(original.dueDate).toBe("2026-08-27"); // original untouched
    });
  });
});
