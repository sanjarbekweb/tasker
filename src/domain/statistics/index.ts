import { z } from "zod";

export interface FocusSessionStatsInput {
  id?: string;
  taskId?: string | null;
  durationMinutes: number;
  sessionType: "work" | "short_break" | "long_break";
  startedAt: number;
  completedAt: number;
  wasCompleted: boolean;
}

export interface TaskStatsInput {
  id?: string;
  isCompleted: boolean;
  dueDate?: string | null;
  completedAt?: number | null;
  priority?: "p1" | "p2" | "p3" | "p4";
}

export interface FocusTotals {
  totalMinutes: number;
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  completionRate: number; // 0.0 to 1.0
  minutesByType: {
    work: number;
    short_break: number;
    long_break: number;
  };
}

export interface TaskCompletionSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number; // 0.0 to 1.0
}

function getIsoDateOnly(dateOrTimestamp: string | number | Date): string {
  const d = new Date(dateOrTimestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDateToUtcDays(isoDate: string): number {
  const parts = isoDate.split("-").map(Number);
  const year = parts[0] ?? 1970;
  const month = (parts[1] ?? 1) - 1;
  const day = parts[2] ?? 1;
  return Math.floor(Date.UTC(year, month, day) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates current active streak from an array of activity ISO dates (YYYY-MM-DD).
 * The streak is considered active if the user completed an action today or yesterday.
 */
export function calculateCurrentStreak(
  dates: string[],
  referenceIsoDate: string = getIsoDateOnly(new Date())
): number {
  if (dates.length === 0) return 0;

  // Deduplicate and convert to UTC day numbers
  const uniqueDays = Array.from(new Set(dates.map((d) => getIsoDateOnly(d))))
    .map(parseIsoDateToUtcDays)
    .sort((a, b) => b - a); // Descending

  const todayDay = parseIsoDateToUtcDays(referenceIsoDate);
  const yesterdayDay = todayDay - 1;

  if (uniqueDays.length === 0) return 0;

  const mostRecent = uniqueDays[0]!;
  // If most recent day is older than yesterday, streak is 0
  if (mostRecent < yesterdayDay) {
    return 0;
  }

  let streak = 0;
  let expectedDay = mostRecent;

  for (const day of uniqueDays) {
    if (day === expectedDay) {
      streak++;
      expectedDay--;
    } else if (day < expectedDay) {
      break;
    }
  }

  return streak;
}

/**
 * Calculates the longest historical streak from an array of activity ISO dates (YYYY-MM-DD).
 */
export function calculateLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = Array.from(new Set(dates.map((d) => getIsoDateOnly(d))))
    .map(parseIsoDateToUtcDays)
    .sort((a, b) => a - b); // Ascending

  if (uniqueDays.length === 0) return 0;

  let longest = 0;
  let current = 0;
  let prevDay: number | null = null;

  for (const day of uniqueDays) {
    if (prevDay === null || day === prevDay + 1) {
      current++;
    } else if (day > prevDay + 1) {
      current = 1;
    }
    prevDay = day;
    if (current > longest) {
      longest = current;
    }
  }

  return longest;
}

/**
 * Computes aggregate focus statistics over a collection of session records.
 */
export function calculateFocusTotals(sessions: FocusSessionStatsInput[]): FocusTotals {
  let totalMinutes = 0;
  let completedSessions = 0;
  let abandonedSessions = 0;

  const minutesByType = {
    work: 0,
    short_break: 0,
    long_break: 0,
  };

  for (const session of sessions) {
    totalMinutes += session.durationMinutes;
    if (session.wasCompleted) {
      completedSessions++;
    } else {
      abandonedSessions++;
    }

    if (session.sessionType === "work") {
      minutesByType.work += session.durationMinutes;
    } else if (session.sessionType === "short_break") {
      minutesByType.short_break += session.durationMinutes;
    } else if (session.sessionType === "long_break") {
      minutesByType.long_break += session.durationMinutes;
    }
  }


  const totalSessions = sessions.length;
  const completionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

  return {
    totalMinutes,
    totalSessions,
    completedSessions,
    abandonedSessions,
    completionRate,
    minutesByType,
  };
}

/**
 * Computes task completion statistics and overdue counts.
 */
export function calculateTaskCompletionRate(
  tasks: TaskStatsInput[],
  referenceIsoDate: string = getIsoDateOnly(new Date())
): TaskCompletionSummary {
  const totalTasks = tasks.length;
  let completedTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;

  for (const task of tasks) {
    if (task.isCompleted) {
      completedTasks++;
    } else {
      pendingTasks++;
      if (task.dueDate && task.dueDate < referenceIsoDate) {
        overdueTasks++;
      }
    }
  }

  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionRate,
  };
}

