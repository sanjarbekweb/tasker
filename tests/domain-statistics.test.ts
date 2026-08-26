import { describe, it, expect } from "vitest";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateFocusTotals,
  calculateTaskCompletionRate,
  FocusSessionStatsInput,
  TaskStatsInput,
} from "../src/domain/statistics";

describe("Domain Statistics Computations", () => {
  describe("calculateCurrentStreak", () => {
    it("calculates active streak ending today", () => {
      const dates = ["2026-08-25", "2026-08-26", "2026-08-27"];
      const streak = calculateCurrentStreak(dates, "2026-08-27");
      expect(streak).toBe(3);
    });

    it("calculates active streak ending yesterday", () => {
      const dates = ["2026-08-24", "2026-08-25", "2026-08-26"];
      const streak = calculateCurrentStreak(dates, "2026-08-27");
      expect(streak).toBe(3);
    });

    it("returns 0 if last activity was 2 or more days ago", () => {
      const dates = ["2026-08-20", "2026-08-21", "2026-08-22"];
      const streak = calculateCurrentStreak(dates, "2026-08-27");
      expect(streak).toBe(0);
    });

    it("handles multiple completions on the same day without double-counting", () => {
      const dates = [
        "2026-08-26",
        "2026-08-26",
        "2026-08-27",
        "2026-08-27",
        "2026-08-27",
      ];
      const streak = calculateCurrentStreak(dates, "2026-08-27");
      expect(streak).toBe(2);
    });

    it("returns 0 for empty array", () => {
      expect(calculateCurrentStreak([], "2026-08-27")).toBe(0);
    });
  });

  describe("calculateLongestStreak", () => {
    it("calculates historical longest streak across gaps", () => {
      const dates = [
        "2026-08-01",
        "2026-08-02",
        "2026-08-03", // 3 days
        "2026-08-10",
        "2026-08-11",
        "2026-08-12",
        "2026-08-13",
        "2026-08-14", // 5 days (longest)
        "2026-08-20",
        "2026-08-21", // 2 days
      ];

      expect(calculateLongestStreak(dates)).toBe(5);
    });

    it("returns 1 for single activity day", () => {
      expect(calculateLongestStreak(["2026-08-27"])).toBe(1);
    });

    it("returns 0 for empty activity", () => {
      expect(calculateLongestStreak([])).toBe(0);
    });
  });

  describe("calculateFocusTotals", () => {
    it("aggregates focus minutes, sessions, and breakdown by mode", () => {
      const sessions: FocusSessionStatsInput[] = [
        {
          durationMinutes: 25,
          sessionType: "work",
          startedAt: 1000,
          completedAt: 25000,
          wasCompleted: true,
        },
        {
          durationMinutes: 25,
          sessionType: "work",
          startedAt: 30000,
          completedAt: 55000,
          wasCompleted: true,
        },
        {
          durationMinutes: 5,
          sessionType: "short_break",
          startedAt: 60000,
          completedAt: 65000,
          wasCompleted: true,
        },
        {
          durationMinutes: 10,
          sessionType: "work",
          startedAt: 70000,
          completedAt: 80000,
          wasCompleted: false, // Abandoned session
        },
      ];

      const totals = calculateFocusTotals(sessions);

      expect(totals.totalMinutes).toBe(65);
      expect(totals.totalSessions).toBe(4);
      expect(totals.completedSessions).toBe(3);
      expect(totals.abandonedSessions).toBe(1);
      expect(totals.completionRate).toBe(0.75);
      expect(totals.minutesByType.work).toBe(60);
      expect(totals.minutesByType.short_break).toBe(5);
      expect(totals.minutesByType.long_break).toBe(0);
    });
  });

  describe("calculateTaskCompletionRate", () => {
    it("computes task stats, overdue counts, and completion rate", () => {
      const tasks: TaskStatsInput[] = [
        { isCompleted: true, dueDate: "2026-08-25" },
        { isCompleted: true, dueDate: "2026-08-26" },
        { isCompleted: false, dueDate: "2026-08-24" }, // Overdue
        { isCompleted: false, dueDate: "2026-08-28" }, // Upcoming
      ];

      const summary = calculateTaskCompletionRate(tasks, "2026-08-27");

      expect(summary.totalTasks).toBe(4);
      expect(summary.completedTasks).toBe(2);
      expect(summary.pendingTasks).toBe(2);
      expect(summary.overdueTasks).toBe(1);
      expect(summary.completionRate).toBe(0.5);
    });
  });
});
