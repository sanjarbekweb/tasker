/**
 * Structured Logger for Numo
 * Supports levels (debug, info, warn, error), production filtering, and sensitive data sanitization.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SENSITIVE_PATTERNS = [
  /key/i,
  /secret/i,
  /password/i,
  /token/i,
  /auth/i,
  /bearer/i,
];

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") {
    if (data.length > 500) {
      return `${data.substring(0, 500)}... [TRUNCATED]`;
    }
    return data;
  }
  if (typeof data === "object") {
    if (Array.isArray(data)) {
      return data.map(sanitize);
    }
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
        sanitizedObj[key] = "[REDACTED]";
      } else {
        sanitizedObj[key] = sanitize(value);
      }
    }
    return sanitizedObj;
  }
  return data;
}

class Logger {
  private minLevel: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  public getMinLevel(): LogLevel {
    return this.minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private formatMessage(level: LogLevel, tag: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${tag}]: ${message}`;
  }

  public debug(tag: string, message: string, data?: unknown): void {
    if (!this.shouldLog("debug")) return;
    if (data !== undefined) {
      console.debug(this.formatMessage("debug", tag, message), sanitize(data));
    } else {
      console.debug(this.formatMessage("debug", tag, message));
    }
  }

  public info(tag: string, message: string, data?: unknown): void {
    if (!this.shouldLog("info")) return;
    if (data !== undefined) {
      console.info(this.formatMessage("info", tag, message), sanitize(data));
    } else {
      console.info(this.formatMessage("info", tag, message));
    }
  }

  public warn(tag: string, message: string, data?: unknown): void {
    if (!this.shouldLog("warn")) return;
    if (data !== undefined) {
      console.warn(this.formatMessage("warn", tag, message), sanitize(data));
    } else {
      console.warn(this.formatMessage("warn", tag, message));
    }
  }

  public error(tag: string, message: string, error?: unknown): void {
    if (!this.shouldLog("error")) return;
    if (error !== undefined) {
      console.error(this.formatMessage("error", tag, message), sanitize(error));
    } else {
      console.error(this.formatMessage("error", tag, message));
    }
  }
}

export const logger = new Logger();
