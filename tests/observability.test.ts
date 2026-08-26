import { describe, it, expect, beforeEach } from "vitest";
import { observability } from "../src/services/observability";

describe("Observability & Performance Telemetry", () => {
  beforeEach(() => {
    observability.reset();
  });

  it("measures asynchronous function latency and records metric", async () => {
    const result = await observability.measureAsync("test_query_ms", async () => {
      // Simulate quick work
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });

    expect(result).toBe(499500);

    const metrics = observability.getAllMetrics();
    expect(metrics["test_query_ms"]).toBeDefined();
    expect(metrics["test_query_ms"]?.count).toBe(1);
    expect(metrics["test_query_ms"]?.avgMs).toBeGreaterThanOrEqual(0);
  });

  it("starts and stops named timers accurately", () => {
    observability.startTimer("cold_start_ms");
    const duration = observability.stopTimer("cold_start_ms");
    expect(duration).toBeGreaterThanOrEqual(0);

    const avg = observability.getAverageMetric("cold_start_ms");
    expect(avg).toBe(duration);
  });

  it("tracks sessions and computes crash-free session rate", () => {
    // Session 1: Clean
    observability.startSession();

    // Session 2: Crashed
    observability.startSession();
    observability.recordCrash(new Error("Test crash"));

    // Session 3: Clean
    observability.startSession();

    // Session 4: Clean
    observability.startSession();

    const crashFreeRate = observability.getCrashFreeSessionRate();
    // 3 clean sessions out of 4 total = 0.75 (75%)
    expect(crashFreeRate).toBe(0.75);
  });
});
