import { create } from "zustand";
import {
  FocusMode,
  FocusStatus,
  FocusTimerState,
  calculateRemainingSeconds,
  calculateSessionProgress,
  handleBackgroundRecovery,
  getNextFocusMode,
  FOCUS_DEFAULTS,
} from "../domain/focus";

export interface FocusUIState {
  activeTaskId: string | null;
  mode: FocusMode;
  status: FocusStatus;
  startedAt: number | null;
  targetAt: number | null;
  pausedAt: number | null;
  remainingSeconds: number;
  progress: number; // 0.0 to 1.0
  completedPomodorosInCycle: number;

  // Actions
  setActiveTask: (taskId: string | null) => void;
  setMode: (mode: FocusMode) => void;
  syncFromPersistentState: (state: FocusTimerState, now?: number) => void;
  handleResumeFromBackground: (now?: number) => boolean; // returns true if timer elapsed during suspension
  tick: (now?: number) => void;
  incrementCyclePomodoros: () => void;
  resetCycle: () => void;
  reset: () => void;
}

export const useFocusStore = create<FocusUIState>((set, get) => ({
  activeTaskId: null,
  mode: "work",
  status: "idle",
  startedAt: null,
  targetAt: null,
  pausedAt: null,
  remainingSeconds: FOCUS_DEFAULTS.POMODORO_MINUTES * 60,
  progress: 0,
  completedPomodorosInCycle: 0,

  setActiveTask: (taskId: string | null) => set({ activeTaskId: taskId }),

  setMode: (mode: FocusMode) => {
    let defaultMinutes: number = FOCUS_DEFAULTS.POMODORO_MINUTES;
    if (mode === "short_break") defaultMinutes = FOCUS_DEFAULTS.SHORT_BREAK_MINUTES;
    else if (mode === "long_break") defaultMinutes = FOCUS_DEFAULTS.LONG_BREAK_MINUTES;

    set({
      mode,
      status: "idle",
      startedAt: null,
      targetAt: null,
      pausedAt: null,
      remainingSeconds: defaultMinutes * 60,
      progress: 0,
    });
  },

  syncFromPersistentState: (persistentState: FocusTimerState, now: number = Date.now()) => {
    const recovery = handleBackgroundRecovery(persistentState, now);
    set({
      activeTaskId: persistentState.taskId ?? null,
      mode: persistentState.mode,
      status: recovery.recoveredState.status,
      startedAt: recovery.recoveredState.startedAt ?? null,
      targetAt: recovery.recoveredState.targetAt ?? null,
      pausedAt: recovery.recoveredState.pausedAt ?? null,
      remainingSeconds: recovery.remainingSeconds,
      progress: recovery.progress,
    });
  },

  handleResumeFromBackground: (now: number = Date.now()) => {
    const state = get();
    const timerState: FocusTimerState = {
      taskId: state.activeTaskId,
      mode: state.mode,
      status: state.status,
      startedAt: state.startedAt,
      targetAt: state.targetAt,
      pausedAt: state.pausedAt,
      updatedAt: now,
    };

    const recovery = handleBackgroundRecovery(timerState, now);
    set({
      status: recovery.recoveredState.status,
      remainingSeconds: recovery.remainingSeconds,
      progress: recovery.progress,
      startedAt: recovery.recoveredState.startedAt ?? null,
      targetAt: recovery.recoveredState.targetAt ?? null,
      pausedAt: recovery.recoveredState.pausedAt ?? null,
    });

    return recovery.isElapsed;
  },

  tick: (now: number = Date.now()) => {
    const state = get();
    if (state.status !== "running" || !state.targetAt) {
      return;
    }

    const remaining = calculateRemainingSeconds(state.targetAt, now);
    const progress = calculateSessionProgress(state.startedAt, state.targetAt, now);

    if (remaining <= 0) {
      set({
        status: "completed",
        remainingSeconds: 0,
        progress: 1.0,
      });
    } else {
      set({
        remainingSeconds: remaining,
        progress,
      });
    }
  },

  incrementCyclePomodoros: () =>
    set((state) => ({
      completedPomodorosInCycle: state.completedPomodorosInCycle + 1,
    })),

  resetCycle: () => set({ completedPomodorosInCycle: 0 }),

  reset: () =>
    set({
      activeTaskId: null,
      mode: "work",
      status: "idle",
      startedAt: null,
      targetAt: null,
      pausedAt: null,
      remainingSeconds: FOCUS_DEFAULTS.POMODORO_MINUTES * 60,
      progress: 0,
      completedPomodorosInCycle: 0,
    }),
}));
