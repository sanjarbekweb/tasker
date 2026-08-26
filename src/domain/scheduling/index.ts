import { z } from "zod";

export interface TimeInterval {
  id?: string;
  startTime: number; // Unix timestamp in milliseconds
  endTime: number; // Unix timestamp in milliseconds
  title?: string;
  type?: "event" | "task" | "block";
}

export interface FreeGap {
  startTime: number;
  endTime: number;
  durationMinutes: number;
}

export const timeRangeSchema = z
  .object({
    startTime: z.number().int().positive(),
    endTime: z.number().int().positive(),
  })
  .refine((range) => range.startTime < range.endTime, {
    message: "Start time must be strictly before end time",
    path: ["endTime"],
  });

/**
 * Checks whether two time intervals overlap.
 * Invariant: A.start < B.end AND A.end > B.start
 */
export function detectCollision(a: TimeInterval, b: TimeInterval): boolean {
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

/**
 * Finds all intervals from a candidate list that collide with the given target interval.
 */
export function findCollisions(
  target: TimeInterval,
  intervals: TimeInterval[]
): TimeInterval[] {
  return intervals.filter(
    (item) => item.id !== target.id && detectCollision(target, item)
  );
}

/**
 * Calculates duration in minutes between two timestamps.
 */
export function calculateDuration(startTime: number, endTime: number): number {
  if (endTime <= startTime) return 0;
  return Math.round((endTime - startTime) / (1000 * 60));
}

/**
 * Validates whether a time range is well-formed.
 */
export function validateTimeRange(startTime: number, endTime: number): boolean {
  return Number.isFinite(startTime) && Number.isFinite(endTime) && startTime < endTime;
}

/**
 * Computes available free-time gaps between scheduled intervals within a given time window.
 * Intervals are sorted and overlapping intervals are merged before finding gaps.
 * Gaps smaller than `minDurationMinutes` (default 5 min) are omitted.
 */
export function getFreeGaps(
  intervals: TimeInterval[],
  windowStart: number,
  windowEnd: number,
  minDurationMinutes: number = 5
): FreeGap[] {
  if (windowEnd <= windowStart) return [];

  // Filter intervals within or overlapping the window and clamp to window bounds
  const clampedIntervals: { start: number; end: number }[] = [];
  for (const interval of intervals) {
    if (interval.endTime <= windowStart || interval.startTime >= windowEnd) {
      continue;
    }
    clampedIntervals.push({
      start: Math.max(windowStart, interval.startTime),
      end: Math.min(windowEnd, interval.endTime),
    });
  }

  if (clampedIntervals.length === 0) {
    const duration = calculateDuration(windowStart, windowEnd);
    if (duration >= minDurationMinutes) {
      return [{ startTime: windowStart, endTime: windowEnd, durationMinutes: duration }];
    }
    return [];
  }

  // Sort by start time
  clampedIntervals.sort((a, b) => a.start - b.start);

  // Merge overlapping or contiguous intervals
  const merged: { start: number; end: number }[] = [clampedIntervals[0]!];
  for (let i = 1; i < clampedIntervals.length; i++) {
    const current = clampedIntervals[i]!;
    const previous = merged[merged.length - 1]!;

    if (current.start <= previous.end) {
      previous.end = Math.max(previous.end, current.end);
    } else {
      merged.push({ start: current.start, end: current.end });
    }
  }

  const gaps: FreeGap[] = [];
  let cursor = windowStart;

  for (const block of merged) {
    if (block.start > cursor) {
      const duration = calculateDuration(cursor, block.start);
      if (duration >= minDurationMinutes) {
        gaps.push({
          startTime: cursor,
          endTime: block.start,
          durationMinutes: duration,
        });
      }
    }
    cursor = Math.max(cursor, block.end);
  }

  if (cursor < windowEnd) {
    const duration = calculateDuration(cursor, windowEnd);
    if (duration >= minDurationMinutes) {
      gaps.push({
        startTime: cursor,
        endTime: windowEnd,
        durationMinutes: duration,
      });
    }
  }

  return gaps;
}

export type RecurrenceFrequency = "daily" | "weekdays" | "weekly" | "custom";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g. every 1 week, every 2 weeks (default 1)
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  until?: number; // End timestamp
  count?: number; // Max occurrences
}

export interface GeneratedEventInstance {
  seriesId: string;
  originalEventId: string;
  startTime: number;
  endTime: number;
  instanceIndex: number;
}

/**
 * Pure generator of recurring event timestamps within a given date range.
 */
export function generateRecurringEvents(
  baseEvent: {
    id: string;
    seriesId?: string | null;
    startTime: number;
    endTime: number;
    recurrenceRule?: string | null;
  },
  rule: RecurrenceRule,
  rangeStart: number,
  rangeEnd: number
): GeneratedEventInstance[] {
  const duration = baseEvent.endTime - baseEvent.startTime;
  if (duration <= 0 || rangeEnd <= rangeStart) return [];

  const instances: GeneratedEventInstance[] = [];
  const seriesId = baseEvent.seriesId ?? baseEvent.id;
  const interval = Math.max(1, rule.interval ?? 1);
  const maxCount = rule.count ?? 500;

  const baseStartDate = new Date(baseEvent.startTime);
  const baseStartHour = baseStartDate.getHours();
  const baseStartMinute = baseStartDate.getMinutes();
  const baseStartSecond = baseStartDate.getSeconds();
  const baseStartMs = baseStartDate.getMilliseconds();

  let occurrenceCount = 0;
  // Step through days from base event date
  const currentDay = new Date(baseEvent.startTime);
  currentDay.setHours(0, 0, 0, 0);

  const endLimitDate = new Date(rule.until ? Math.min(rule.until, rangeEnd) : rangeEnd);

  while (currentDay.getTime() <= endLimitDate.getTime() && occurrenceCount < maxCount) {
    const dayOfWeek = currentDay.getDay(); // 0-6

    let matchesRule = false;

    if (rule.frequency === "daily") {
      const diffDays = Math.floor(
        (currentDay.getTime() - new Date(baseEvent.startTime).setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays % interval === 0) {
        matchesRule = true;
      }
    } else if (rule.frequency === "weekdays") {
      matchesRule = dayOfWeek >= 1 && dayOfWeek <= 5;
    } else if (rule.frequency === "weekly" || rule.frequency === "custom") {
      const allowedDays =
        rule.daysOfWeek && rule.daysOfWeek.length > 0
          ? rule.daysOfWeek
          : [new Date(baseEvent.startTime).getDay()];

      if (allowedDays.includes(dayOfWeek)) {
        matchesRule = true;
      }
    }

    if (matchesRule) {
      const instanceStart = new Date(currentDay);
      instanceStart.setHours(baseStartHour, baseStartMinute, baseStartSecond, baseStartMs);
      const startTimestamp = instanceStart.getTime();
      const endTimestamp = startTimestamp + duration;

      if (startTimestamp >= baseEvent.startTime && endTimestamp <= (rule.until ?? Infinity)) {
        if (endTimestamp >= rangeStart && startTimestamp <= rangeEnd) {
          instances.push({
            seriesId,
            originalEventId: baseEvent.id,
            startTime: startTimestamp,
            endTime: endTimestamp,
            instanceIndex: occurrenceCount,
          });
        }
        occurrenceCount++;
      }
    }

    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }

  return instances;
}

/**
 * Reschedules a task to a new due date and optional time block.
 */
export function rescheduleTask<
  T extends {
    dueDate?: string | null;
    timeBlockStart?: string | null;
    timeBlockEnd?: string | null;
  }
>(
  task: T,
  newDueDate: string,
  newTimeBlock?: { start: string; end: string } | null
): T & { dueDate: string; timeBlockStart: string | null; timeBlockEnd: string | null } {
  return {
    ...task,
    dueDate: newDueDate,
    timeBlockStart: newTimeBlock?.start ?? null,
    timeBlockEnd: newTimeBlock?.end ?? null,
  };
}

export interface ScheduledItem {
  id: string;
  type: "event" | "task";
  title: string;
  startTime: number;
  endTime: number;
  hasCollision: boolean;
  collidingWithIds: string[];
}

export interface CollisionPair {
  itemAId: string;
  itemBId: string;
}

export interface DailySchedule {
  date: string; // YYYY-MM-DD
  items: ScheduledItem[];
  collisions: CollisionPair[];
  freeGaps: FreeGap[];
  totalScheduledMinutes: number;
  totalFreeMinutes: number;
}

/**
 * Parses "HH:mm" time string against a reference "YYYY-MM-DD" date into Unix timestamp in ms.
 */
export function parseDateAndTimeToTimestamp(dateIso: string, timeStr: string): number {
  const [year, month, day] = dateIso.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0, 0, 0);
  return date.getTime();
}

/**
 * Combines fixed-time events and time-blocked tasks for a given date,
 * performs interval collision detection, and computes actionable free gaps.
 */
export function buildDailySchedule(params: {
  date: string; // YYYY-MM-DD
  events: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    dueDate?: string | null;
    timeBlockStart?: string | null;
    timeBlockEnd?: string | null;
    estimatedPomodoros?: number;
  }>;
  windowStartHour?: number; // Default 8 (08:00)
  windowEndHour?: number; // Default 22 (22:00)
  minGapMinutes?: number; // Default 5
}): DailySchedule {
  const {
    date,
    events,
    tasks,
    windowStartHour = 8,
    windowEndHour = 22,
    minGapMinutes = 5,
  } = params;

  const windowStart = parseDateAndTimeToTimestamp(date, `${String(windowStartHour).padStart(2, "0")}:00`);
  const windowEnd = parseDateAndTimeToTimestamp(date, `${String(windowEndHour).padStart(2, "0")}:00`);

  const rawItems: Array<{
    id: string;
    type: "event" | "task";
    title: string;
    startTime: number;
    endTime: number;
  }> = [];

  // Add events
  for (const event of events) {
    if (event.endTime > windowStart && event.startTime < windowEnd) {
      rawItems.push({
        id: event.id,
        type: "event",
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
      });
    }
  }

  // Add tasks with time blocks on this date
  for (const task of tasks) {
    if (task.dueDate === date && task.timeBlockStart) {
      const startMs = parseDateAndTimeToTimestamp(date, task.timeBlockStart);
      let endMs: number;

      if (task.timeBlockEnd) {
        endMs = parseDateAndTimeToTimestamp(date, task.timeBlockEnd);
      } else {
        // Fallback: duration based on estimated pomodoros (25m each) + 5m breaks
        const pomos = task.estimatedPomodoros ?? 1;
        const durationMinutes = pomos * 25 + Math.max(0, pomos - 1) * 5;
        endMs = startMs + durationMinutes * 60 * 1000;
      }

      if (endMs > windowStart && startMs < windowEnd) {
        rawItems.push({
          id: task.id,
          type: "task",
          title: task.title,
          startTime: startMs,
          endTime: endMs,
        });
      }
    }
  }

  // Sort by start time
  rawItems.sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime);

  // Detect collisions
  const collisionPairs: CollisionPair[] = [];
  const collidingMap = new Map<string, string[]>();

  for (let i = 0; i < rawItems.length; i++) {
    for (let j = i + 1; j < rawItems.length; j++) {
      const a = rawItems[i]!;
      const b = rawItems[j]!;

      if (detectCollision(a, b)) {
        collisionPairs.push({ itemAId: a.id, itemBId: b.id });

        const listA = collidingMap.get(a.id) ?? [];
        listA.push(b.id);
        collidingMap.set(a.id, listA);

        const listB = collidingMap.get(b.id) ?? [];
        listB.push(a.id);
        collidingMap.set(b.id, listB);
      }
    }
  }

  const items: ScheduledItem[] = rawItems.map((item) => ({
    ...item,
    hasCollision: (collidingMap.get(item.id)?.length ?? 0) > 0,
    collidingWithIds: collidingMap.get(item.id) ?? [],
  }));

  // Free gaps
  const intervals: TimeInterval[] = rawItems.map((item) => ({
    id: item.id,
    startTime: item.startTime,
    endTime: item.endTime,
    title: item.title,
    type: item.type,
  }));

  const freeGaps = getFreeGaps(intervals, windowStart, windowEnd, minGapMinutes);

  const totalFreeMinutes = freeGaps.reduce((acc, g) => acc + g.durationMinutes, 0);
  const totalScheduledMinutes = Math.max(0, calculateDuration(windowStart, windowEnd) - totalFreeMinutes);

  return {
    date,
    items,
    collisions: collisionPairs,
    freeGaps,
    totalScheduledMinutes,
    totalFreeMinutes,
  };
}


