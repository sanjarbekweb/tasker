import { AppState, AppStateStatus } from "react-native";
import {
  FocusMode,
  FocusStatus,
  FocusTimerState,
  FOCUS_DEFAULTS,
  calculateRemainingSeconds,
  calculateTargetTimestamp,
  calculateSessionProgress,
  calculateResumedTargetTimestamp,
  getNextFocusMode,
  handleBackgroundRecovery,
} from "../../domain/focus";
import { FocusStateRepository, CompleteSessionResult } from "../../db/repositories/focus-state-repository";
import { useFocusStore } from "../../stores/focus-store";
import { NotificationService } from "../notifications";

export interface FocusEngineConfig {
  focusStateRepository: FocusStateRepository;
  notificationService?: typeof NotificationService;
  onSessionCompleted?: (result: CompleteSessionResult) => void;
  onModeChanged?: (mode: FocusMode) => void;
}

export class FocusEngine {
  private repository: FocusStateRepository;
  private notificationService: typeof NotificationService;
  private appStateSubscription: { remove: () => void } | null = null;
  private isRecovering = false;
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: FocusEngineConfig) {
    this.repository = config.focusStateRepository;
    this.notificationService = config.notificationService ?? NotificationService;
  }

  /**
   * Initializes the focus engine, recovers persistent state from SQLite,
   * and attaches AppState listeners for background/foreground lifecycle.
   */
  async initialize(now: number = Date.now()): Promise<void> {
    await this.recoverState(now);
    this.attachAppStateListener();
    this.startTickLoop();
  }

  /**
   * Cleans up listeners and intervals.
   */
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.stopTickLoop();
  }

  private startTickLoop(): void {
    this.stopTickLoop();
    this.tickInterval = setInterval(() => {
      const state = useFocusStore.getState();
      if (state.status === "running" && state.targetAt) {
        const now = Date.now();
        if (now >= state.targetAt) {
          // Elapsed in foreground
          this.completeSession(now).catch((err) => {
            console.error("Failed to complete elapsed focus session:", err);
          });
        } else {
          useFocusStore.getState().tick(now);
        }
      }
    }, 500);
  }

  private stopTickLoop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Attaches AppState lifecycle listener to handle foreground/background transitions.
   * Invariant (§28): Recomputes remaining on resume; auto-transitions if already elapsed.
   */
  attachAppStateListener(): void {
    if (this.appStateSubscription) return;

    if (AppState && typeof AppState.addEventListener === "function") {
      this.appStateSubscription = AppState.addEventListener(
        "change",
        (nextState: AppStateStatus) => {
          this.handleAppStateChange(nextState);
        }
      );
    }
  }

  /**
   * Handles React Native AppState changes.
   */
  async handleAppStateChange(
    nextState: AppStateStatus,
    now: number = Date.now()
  ): Promise<void> {
    if (nextState === "active") {
      await this.recoverState(now);
    } else if (nextState === "background" || nextState === "inactive") {
      // Ensure notification is scheduled for active running timer
      const current = useFocusStore.getState();
      if (current.status === "running" && current.targetAt && current.targetAt > now) {
        await this.notificationService.scheduleFocusTimerNotification({
          targetTimestamp: current.targetAt,
          mode: current.mode,
        });
      }
    }
  }

  /**
   * Recovers state from SQLite repository and handles background elapsed timers.
   */
  async recoverState(now: number = Date.now()): Promise<FocusTimerState> {
    if (this.isRecovering) {
      const state = await this.repository.getState();
      return state;
    }

    this.isRecovering = true;
    try {
      const persistentState = await this.repository.getState();
      const domainState: FocusTimerState = {
        id: persistentState.id,
        taskId: persistentState.taskId,
        mode: persistentState.mode,
        status: persistentState.status,
        startedAt: persistentState.startedAt,
        targetAt: persistentState.targetAt,
        pausedAt: persistentState.pausedAt,
        updatedAt: persistentState.updatedAt,
      };

      const recovery = handleBackgroundRecovery(domainState, now);

      if (recovery.isElapsed && domainState.status === "running") {
        // Session elapsed while backgrounded/suspended -> Complete idempotently
        await this.completeSession(now);
        const finalState = await this.repository.getState();
        return finalState;
      }

      // Sync Zustand store
      useFocusStore.getState().syncFromPersistentState(domainState, now);
      return domainState;
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Starts a focus session for a given mode and optional task.
   */
  async startSession(params?: {
    mode?: FocusMode;
    taskId?: string | null;
    durationMinutes?: number;
    now?: number;
  }): Promise<FocusTimerState> {
    const now = params?.now ?? Date.now();
    const mode = params?.mode ?? useFocusStore.getState().mode;
    const taskId = params?.taskId !== undefined ? params.taskId : useFocusStore.getState().activeTaskId;

    let durationMinutes = params?.durationMinutes;
    if (!durationMinutes) {
      if (mode === "short_break") durationMinutes = FOCUS_DEFAULTS.SHORT_BREAK_MINUTES;
      else if (mode === "long_break") durationMinutes = FOCUS_DEFAULTS.LONG_BREAK_MINUTES;
      else durationMinutes = FOCUS_DEFAULTS.POMODORO_MINUTES;
    }

    const startedAt = now;
    const targetAt = calculateTargetTimestamp(durationMinutes, startedAt);

    // 1. Persist to SQLite
    const updated = await this.repository.setState({
      taskId,
      mode,
      status: "running",
      startedAt,
      targetAt,
      pausedAt: null,
    });

    // 2. Schedule OS notification from target timestamp
    await this.notificationService.scheduleFocusTimerNotification({
      targetTimestamp: targetAt,
      mode,
      now,
    });

    // 3. Update Zustand presentation store
    useFocusStore.getState().syncFromPersistentState(
      {
        taskId,
        mode,
        status: "running",
        startedAt,
        targetAt,
        pausedAt: null,
        updatedAt: now,
      },
      now
    );

    return updated;
  }

  /**
   * Pauses the currently running timer.
   */
  async pauseSession(now: number = Date.now()): Promise<FocusTimerState> {
    const current = await this.repository.getState();
    if (current.status !== "running") {
      return current;
    }

    // Cancel OS notification while paused
    await this.notificationService.cancelFocusTimerNotification();

    // Persist paused state
    const updated = await this.repository.setState({
      status: "paused",
      pausedAt: now,
    });

    useFocusStore.getState().syncFromPersistentState(
      {
        ...current,
        status: "paused",
        pausedAt: now,
        updatedAt: now,
      },
      now
    );

    return updated;
  }

  /**
   * Resumes a paused focus session.
   * Adjusts targetAt based on elapsed pause time.
   */
  async resumeSession(now: number = Date.now()): Promise<FocusTimerState> {
    const current = await this.repository.getState();
    if (current.status !== "paused" || !current.targetAt || !current.pausedAt) {
      return current;
    }

    const newTargetAt = calculateResumedTargetTimestamp(current.targetAt, current.pausedAt, now);

    // Persist resumed state
    const updated = await this.repository.setState({
      status: "running",
      targetAt: newTargetAt,
      pausedAt: null,
    });

    // Reschedule OS notification with adjusted targetAt
    await this.notificationService.scheduleFocusTimerNotification({
      targetTimestamp: newTargetAt,
      mode: current.mode,
      now,
    });

    useFocusStore.getState().syncFromPersistentState(
      {
        ...current,
        status: "running",
        targetAt: newTargetAt,
        pausedAt: null,
        updatedAt: now,
      },
      now
    );

    return updated;
  }

  /**
   * Cancels/resets the active focus session.
   */
  async cancelSession(now: number = Date.now()): Promise<FocusTimerState> {
    await this.notificationService.cancelFocusTimerNotification();
    const updated = await this.repository.resetState();
    useFocusStore.getState().reset();
    return updated;
  }

  private inFlightCompletion: Promise<CompleteSessionResult> | null = null;

  /**
   * Completes the session idempotently.
   * Invariants (§10, §30): Wrapped in atomic transaction with status check-and-set guard.
   */
  async completeSession(now: number = Date.now()): Promise<CompleteSessionResult> {
    if (this.inFlightCompletion) {
      return this.inFlightCompletion;
    }

    this.inFlightCompletion = this.executeCompleteSession(now);
    try {
      return await this.inFlightCompletion;
    } finally {
      this.inFlightCompletion = null;
    }
  }

  private async executeCompleteSession(now: number): Promise<CompleteSessionResult> {
    await this.notificationService.cancelFocusTimerNotification();

    const current = await this.repository.getState();
    const startedAt = current.startedAt ?? now;
    const targetAt = current.targetAt ?? now;
    const durationMinutes = Math.max(1, Math.round((targetAt - startedAt) / (60 * 1000)));

    // Atomic transaction execution in SQLite
    const result = await this.repository.completeSessionAtomic({
      durationMinutes,
      sessionType: current.mode,
      startedAt,
      completedAt: now,
      wasCompleted: true,
    });

    if (result.completed) {
      // Transition to next mode
      const currentCycle = useFocusStore.getState().completedPomodorosInCycle;
      const { nextMode, nextDurationMinutes } = getNextFocusMode(
        current.mode,
        currentCycle
      );

      if (current.mode === "work") {
        useFocusStore.getState().incrementCyclePomodoros();
      }

      // Update persistent state for the next mode (idle)
      await this.repository.setState({
        taskId: current.taskId,
        mode: nextMode,
        status: "idle",
        startedAt: null,
        targetAt: null,
        pausedAt: null,
      });

      // Update Zustand UI store
      useFocusStore.getState().setMode(nextMode);
    } else {
      // Race condition handled: sync latest SQLite state
      useFocusStore.getState().syncFromPersistentState(result.state, now);
    }

    return result;
  }
}
