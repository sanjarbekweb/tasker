import { z } from "zod";

export type FocusMode = "work" | "short_break" | "long_break";
export type FocusStatus = "idle" | "running" | "paused" | "completed";

export const FOCUS_DEFAULTS = {
  POMODORO_MINUTES: 25,
  SHORT_BREAK_MINUTES: 5,
  LONG_BREAK_MINUTES: 15,
  LONG_BREAK_INTERVAL: 4, // Every 4 completed pomodoros
} as const;

export const focusTimerStateSchema = z.object({
  id: z.string().optional(),
  taskId: z.string().nullable().optional(),
  mode: z.enum(["work", "short_break", "long_break"]),
  status: z.enum(["idle", "running", "paused", "completed"]),
  startedAt: z.number().int().positive().nullable().optional(),
  targetAt: z.number().int().positive().nullable().optional(),
  pausedAt: z.number().int().positive().nullable().optional(),
  updatedAt: z.number().int().positive(),
});

export type FocusTimerState = z.infer<typeof focusTimerStateSchema>;

/**
 * Derives remaining seconds from target timestamp and current time.
 * Invariant: Never decrement a counter in persistent state.
 */
export function calculateRemainingSeconds(
  targetAt: number | null | undefined,
  now: number = Date.now()
): number {
  if (!targetAt) return 0;
  const diffMs = targetAt - now;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 1000);
}

/**
 * Calculates target timestamp given a duration in minutes and start timestamp.
 */
export function calculateTargetTimestamp(
  durationMinutes: number,
  startedAt: number = Date.now()
): number {
  return startedAt + durationMinutes * 60 * 1000;
}

/**
 * Derives the fraction of the session completed (0.0 to 1.0).
 */
export function calculateSessionProgress(
  startedAt: number | null | undefined,
  targetAt: number | null | undefined,
  now: number = Date.now()
): number {
  if (!startedAt || !targetAt || targetAt <= startedAt) return 0;
  if (now >= targetAt) return 1.0;
  if (now <= startedAt) return 0.0;
  return (now - startedAt) / (targetAt - startedAt);
}

/**
 * Recovers focus state after backgrounding/suspension.
 * If targetAt <= now while running, reports elapsed session.
 */
export interface BackgroundRecoveryResult {
  isElapsed: boolean;
  remainingSeconds: number;
  progress: number;
  recoveredState: FocusTimerState;
}

export function handleBackgroundRecovery(
  state: FocusTimerState,
  now: number = Date.now()
): BackgroundRecoveryResult {
  if (state.status !== "running" || !state.targetAt) {
    const remaining = state.pausedAt && state.targetAt
      ? calculateRemainingSeconds(state.targetAt, state.pausedAt)
      : calculateRemainingSeconds(state.targetAt, now);

    return {
      isElapsed: false,
      remainingSeconds: remaining,
      progress: calculateSessionProgress(state.startedAt, state.targetAt, state.pausedAt ?? now),
      recoveredState: state,
    };
  }

  const remainingSeconds = calculateRemainingSeconds(state.targetAt, now);
  const isElapsed = remainingSeconds <= 0;

  if (isElapsed) {
    return {
      isElapsed: true,
      remainingSeconds: 0,
      progress: 1.0,
      recoveredState: {
        ...state,
        status: "completed",
        updatedAt: now,
      },
    };
  }

  return {
    isElapsed: false,
    remainingSeconds,
    progress: calculateSessionProgress(state.startedAt, state.targetAt, now),
    recoveredState: state,
  };
}

/**
 * Determines the next focus mode and whether it's a long break or short break.
 */
export function getNextFocusMode(
  currentMode: FocusMode,
  completedPomodorosInCycle: number,
  longBreakInterval: number = FOCUS_DEFAULTS.LONG_BREAK_INTERVAL
): { nextMode: FocusMode; nextDurationMinutes: number } {
  if (currentMode === "work") {
    const nextCompleted = completedPomodorosInCycle + 1;
    if (nextCompleted % longBreakInterval === 0) {
      return {
        nextMode: "long_break",
        nextDurationMinutes: FOCUS_DEFAULTS.LONG_BREAK_MINUTES,
      };
    }
    return {
      nextMode: "short_break",
      nextDurationMinutes: FOCUS_DEFAULTS.SHORT_BREAK_MINUTES,
    };
  }

  // From any break, return to work
  return {
    nextMode: "work",
    nextDurationMinutes: FOCUS_DEFAULTS.POMODORO_MINUTES,
  };
}

/**
 * Adjusts targetAt when resuming a paused session.
 */
export function calculateResumedTargetTimestamp(
  targetAt: number,
  pausedAt: number,
  resumeAt: number = Date.now()
): number {
  const remainingMs = Math.max(0, targetAt - pausedAt);
  return resumeAt + remainingMs;
}


