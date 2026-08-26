import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "../src/utils/logger";

describe("Structured Logger", () => {
  beforeEach(() => {
    logger.setMinLevel("debug");
    vi.restoreAllMocks();
  });

  it("filters logs based on minimum level", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.setMinLevel("warn");
    logger.debug("TestTag", "Debug message");
    logger.info("TestTag", "Info message");

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("TestTag", "Warn message");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("sanitizes sensitive keys in log payloads", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.setMinLevel("info");
    logger.info("Auth", "User payload", {
      username: "user1",
      password: "secretpassword123",
      authToken: "bearer 999",
      nested: {
        databaseKey: "mysecretkey",
        normalField: "hello",
      },
    });

    expect(infoSpy).toHaveBeenCalled();
    const loggedArg = infoSpy.mock.calls[0]?.[1] as any;
    expect(loggedArg.username).toBe("user1");
    expect(loggedArg.password).toBe("[REDACTED]");
    expect(loggedArg.authToken).toBe("[REDACTED]");
    expect(loggedArg.nested.databaseKey).toBe("[REDACTED]");
    expect(loggedArg.nested.normalField).toBe("hello");
  });
});
