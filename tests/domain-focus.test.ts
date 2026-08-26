import { describe, it, expect } from "vitest";
import {
  calculateRemainingSeconds,
  calculateTargetTimestamp,
  calculateSessionProgress,
  handleBackgroundRecovery,
  getNextFocusMode,
  calculateResumedTargetTimestamp,
  FocusTimerState,
} from "../src/domain/focus";

describe("Domain Focus Timer Calculations", () => {
  it("derives remaining seconds from target timestamp without decrementing persistent state", () => {
    const now = 1000000;
    const targetAt = now + 25 * 60 * 1000; // 25 min in future (1500 sec)

    expect(calculateRemainingSeconds(targetAt, now)).toBe(1500);
    expect(calculateRemainingSeconds(targetAt, now + 10 * 1000)).toBe(1490);
    expect(calculateRemainingSeconds(targetAt, targetAt)).toBe(0);
    expect(calculateRemainingSeconds(targetAt, targetAt + 5000)).toBe(0);
    expect(calculateRemainingSeconds(null, now)).toBe(0);
  });

  it("calculates target timestamp from duration minutes", () => {
    const start = 1000000;
    const target = calculateTargetTimestamp(25, start);
    expect(target).toBe(start + 25 * 60 * 1000);
  });

  it("calculates session progress fraction", () => {
    const start = 1000;
    const target = 2000;

    expect(calculateSessionProgress(start, target, 1000)).toBe(0.0);
    expect(calculateSessionProgress(start, target, 1500)).toBe(0.5);
    expect(calculateSessionProgress(start, target, 2000)).toBe(1.0);
    expect(calculateSessionProgress(start, target, 3000)).toBe(1.0);
    expect(calculateSessionProgress(start, target, 500)).toBe(0.0);
  });

  describe("handleBackgroundRecovery", () => {
    it("returns remaining seconds when timer is still running after background resume", () => {
      const startedAt = 1000000;
      const targetAt = startedAt + 25 * 60 * 1000; // 1500s total
      const state: FocusTimerState = {
        mode: "work",
        status: "running",
        startedAt,
        targetAt,
        pausedAt: null,
        updatedAt: startedAt,
      };

      // Resumed 5 minutes later (300s elapsed, 1200s remaining)
      const resumeTime = startedAt + 5 * 60 * 1000;
      const recovery = handleBackgroundRecovery(state, resumeTime);

      expect(recovery.isElapsed).toBe(false);
      expect(recovery.remainingSeconds).toBe(1200);
      expect(recovery.recoveredState.status).toBe("running");
    });

    it("detects elapsed timer and marks completed when resuming after targetAt", () => {
      const startedAt = 1000000;
      const targetAt = startedAt + 25 * 60 * 1000;
      const state: FocusTimerState = {
        mode: "work",
        status: "running",
        startedAt,
        targetAt,
        pausedAt: null,
        updatedAt: startedAt,
      };

      // Resumed 30 minutes later (5 min after target elapsed)
      const resumeTime = startedAt + 30 * 60 * 1000;
      const recovery = handleBackgroundRecovery(state, resumeTime);

      expect(recovery.isElapsed).toBe(true);
      expect(recovery.remainingSeconds).toBe(0);
      expect(recovery.progress).toBe(1.0);
      expect(recovery.recoveredState.status).toBe("completed");
    });

    it("preserves paused state accurately across recovery", () => {
      const startedAt = 1000000;
      const targetAt = startedAt + 25 * 60 * 1000;
      const pausedAt = startedAt + 10 * 60 * 1000; // paused with 15m remaining
      const state: FocusTimerState = {
        mode: "work",
        status: "paused",
        startedAt,
        targetAt,
        pausedAt,
        updatedAt: pausedAt,
      };

      const resumeTime = startedAt + 60 * 60 * 1000; // 1 hour later
      const recovery = handleBackgroundRecovery(state, resumeTime);

      expect(recovery.isElapsed).toBe(false);
      expect(recovery.remainingSeconds).toBe(15 * 60); // Still 15 minutes remaining
      expect(recovery.recoveredState.status).toBe("paused");
    });
  });

  describe("getNextFocusMode", () => {
    it("transitions work -> short_break for sessions 1, 2, 3", () => {
      expect(getNextFocusMode("work", 0)).toEqual({
        nextMode: "short_break",
        nextDurationMinutes: 5,
      });
      expect(getNextFocusMode("work", 1)).toEqual({
        nextMode: "short_break",
        nextDurationMinutes: 5,
      });
      expect(getNextFocusMode("work", 2)).toEqual({
        nextMode: "short_break",
        nextDurationMinutes: 5,
      });
    });

    it("transitions work -> long_break on 4th completed pomodoro", () => {
      expect(getNextFocusMode("work", 3)).toEqual({
        nextMode: "long_break",
        nextDurationMinutes: 15,
      });
    });

    it("transitions any break -> work", () => {
      expect(getNextFocusMode("short_break", 1)).toEqual({
        nextMode: "work",
        nextDurationMinutes: 25,
      });
      expect(getNextFocusMode("long_break", 4)).toEqual({
        nextMode: "work",
        nextDurationMinutes: 25,
      });
    });
  });

  describe("calculateResumedTargetTimestamp", () => {
    it("shifts target timestamp forward by paused duration", () => {
      const targetAt = 10000;
      const pausedAt = 8000; // 2000ms remaining
      const resumeAt = 15000;

      const newTarget = calculateResumedTargetTimestamp(targetAt, pausedAt, resumeAt);
      expect(newTarget).toBe(17000);
      expect(newTarget - resumeAt).toBe(2000);
    });
  });
});
