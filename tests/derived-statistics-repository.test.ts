import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { FocusSessionRepository } from "../src/db/repositories/focus-session-repository";
import { TaskRepository } from "../src/db/repositories/task-repository";
import { calculateCurrentStreak, calculateLongestStreak } from "../src/domain/statistics";

describe("Derived Statistics Database Queries", () => {
  let db: AppDatabase;
  let focusRepo: FocusSessionRepository;
  let taskRepo: TaskRepository;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
    focusRepo = new FocusSessionRepository(db);
    taskRepo = new TaskRepository(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("queries focus aggregate stats directly without caching in preferences", async () => {
    const baseTime = new Date("2026-08-27T10:00:00Z").getTime();

    // Session 1: 25m work completed
    await focusRepo.create({
      durationMinutes: 25,
      sessionType: "work",
      startedAt: baseTime,
      completedAt: baseTime + 25 * 60 * 1000,
      wasCompleted: true,
    });

    // Session 2: 5m short break completed
    await focusRepo.create({
      durationMinutes: 5,
      sessionType: "short_break",
      startedAt: baseTime + 30 * 60 * 1000,
      completedAt: baseTime + 35 * 60 * 1000,
      wasCompleted: true,
    });

    // Session 3: 15m work abandoned
    await focusRepo.create({
      durationMinutes: 15,
      sessionType: "work",
      startedAt: baseTime + 40 * 60 * 1000,
      completedAt: baseTime + 55 * 60 * 1000,
      wasCompleted: false,
    });

    const stats = await focusRepo.getAggregateStats();
    expect(stats.totalSessions).toBe(3);
    expect(stats.completedSessions).toBe(2);
    expect(stats.totalMinutes).toBe(45);
    expect(stats.workMinutes).toBe(40);
    expect(stats.shortBreakMinutes).toBe(5);
  });

  it("queries distinct completion dates and computes live streaks", async () => {
    // Complete tasks across three consecutive days
    await taskRepo.create({
      title: "Task 1",
      isCompleted: true,
      dueDate: "2026-08-25",
      completedAt: new Date("2026-08-25T15:00:00Z").getTime(),
    });

    await taskRepo.create({
      title: "Task 2",
      isCompleted: true,
      dueDate: "2026-08-26",
      completedAt: new Date("2026-08-26T15:00:00Z").getTime(),
    });

    await taskRepo.create({
      title: "Task 3",
      isCompleted: true,
      dueDate: "2026-08-27",
      completedAt: new Date("2026-08-27T15:00:00Z").getTime(),
    });

    const completedDates = await taskRepo.listCompletedDates();
    expect(completedDates.length).toBe(3);

    const currentStreak = calculateCurrentStreak(completedDates, "2026-08-27");
    const longestStreak = calculateLongestStreak(completedDates);

    expect(currentStreak).toBe(3);
    expect(longestStreak).toBe(3);
  });

  it("queries task stats summary directly from active tasks", async () => {
    await taskRepo.create({
      title: "Completed Task",
      isCompleted: true,
      dueDate: "2026-08-26",
    });

    await taskRepo.create({
      title: "Overdue Pending Task",
      isCompleted: false,
      dueDate: "2026-08-26", // Due yesterday relative to 2026-08-27
    });

    await taskRepo.create({
      title: "Future Pending Task",
      isCompleted: false,
      dueDate: "2026-08-28",
    });

    const summary = await taskRepo.getTaskStatsSummary("2026-08-27");
    expect(summary.totalTasks).toBe(3);
    expect(summary.completedTasks).toBe(1);
    expect(summary.pendingTasks).toBe(2);
    expect(summary.overdueTasks).toBe(1);
  });
});
