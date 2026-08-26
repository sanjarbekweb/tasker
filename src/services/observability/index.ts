import { logger } from "../../utils/logger";

export interface PerformanceMetrics {
  coldStartMs?: number;
  warmStartMs?: number;
  taskQueryMs?: number;
  dbWriteMs?: number;
  screenRenderMs?: number;
  focusRecoveryMs?: number;
  sessionDurationMs?: number;
}

export interface SessionHealth {
  sessionId: string;
  startedAt: number;
  endedAt?: number;
  crashes: number;
  totalInteractions: number;
}

class ObservabilityService {
  private metrics: Record<string, number[]> = {};
  private activeTimers: Map<string, number> = new Map();
  private currentSession: SessionHealth | null = null;
  private totalSessionsCount = 0;
  private crashedSessionsCount = 0;

  /**
   * Starts a named duration measurement.
   */
  public startTimer(timerKey: string): void {
    this.activeTimers.set(timerKey, performanceNow());
  }

  /**
   * Stops a named duration measurement, records metric, and logs telemetry.
   */
  public stopTimer(timerKey: string): number {
    const startTime = this.activeTimers.get(timerKey);
    if (!startTime) return 0;

    const elapsedMs = Math.round(performanceNow() - startTime);
    this.activeTimers.delete(timerKey);
    this.recordMetric(timerKey, elapsedMs);
    return elapsedMs;
  }

  /**
   * Measures the execution time of an asynchronous operation.
   */
  public async measureAsync<T>(metricName: string, fn: () => Promise<T>): Promise<T> {
    const start = performanceNow();
    try {
      const result = await fn();
      const elapsed = Math.round(performanceNow() - start);
      this.recordMetric(metricName, elapsed);
      return result;
    } catch (err) {
      const elapsed = Math.round(performanceNow() - start);
      this.recordMetric(`${metricName}_error`, elapsed);
      throw err;
    }
  }

  /**
   * Records a scalar performance metric.
   */
  public recordMetric(key: string, valueMs: number): void {
    if (!this.metrics[key]) {
      this.metrics[key] = [];
    }
    this.metrics[key]!.push(valueMs);

    if (valueMs > 200) {
      logger.warn("Observability", `High latency on [${key}]: ${valueMs}ms`);
    } else {
      logger.debug("Observability", `Metric [${key}]: ${valueMs}ms`);
    }
  }

  /**
   * Returns average latency for a given metric.
   */
  public getAverageMetric(key: string): number {
    const values = this.metrics[key];
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / values.length);
  }

  /**
   * Returns all aggregated metrics.
   */
  public getAllMetrics(): Record<string, { count: number; avgMs: number; minMs: number; maxMs: number }> {
    const summary: Record<string, { count: number; avgMs: number; minMs: number; maxMs: number }> = {};
    for (const [key, values] of Object.entries(this.metrics)) {
      if (values.length > 0) {
        const sum = values.reduce((acc, v) => acc + v, 0);
        summary[key] = {
          count: values.length,
          avgMs: Math.round(sum / values.length),
          minMs: Math.min(...values),
          maxMs: Math.max(...values),
        };
      }
    }
    return summary;
  }

  /**
   * Starts a new user session.
   */
  public startSession(): SessionHealth {
    this.totalSessionsCount++;
    const session: SessionHealth = {
      sessionId: crypto.randomUUID(),
      startedAt: Date.now(),
      crashes: 0,
      totalInteractions: 0,
    };
    this.currentSession = session;
    return session;
  }

  /**
   * Records a crash event.
   */
  public recordCrash(error: unknown): void {
    this.crashedSessionsCount++;
    if (this.currentSession) {
      this.currentSession.crashes++;
    }
    logger.error("Observability", "Crash recorded in active session", error);
  }

  /**
   * Calculates crash-free session rate (0.0 to 1.0).
   */
  public getCrashFreeSessionRate(): number {
    if (this.totalSessionsCount === 0) return 1.0;
    const successfulSessions = Math.max(0, this.totalSessionsCount - this.crashedSessionsCount);
    return successfulSessions / this.totalSessionsCount;
  }

  /**
   * Resets all in-memory telemetry (used in testing).
   */
  public reset(): void {
    this.metrics = {};
    this.activeTimers.clear();
    this.currentSession = null;
    this.totalSessionsCount = 0;
    this.crashedSessionsCount = 0;
  }
}

function performanceNow(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

export const observability = new ObservabilityService();
