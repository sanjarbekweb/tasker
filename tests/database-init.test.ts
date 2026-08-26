import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, getDatabaseInstance, createNodeDatabase, AppDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrations/migrator";

describe("Database Initialization and Migrations", () => {
  let db: AppDatabase;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
  });

  afterEach(() => {
    closeDatabase();
  });

  it("initializes in-memory database and applies all migrations", () => {
    expect(db).toBeDefined();
    expect(getDatabaseInstance()).toBe(db);
  });

  it("is idempotent when running migrations multiple times", async () => {
    const { rawClient, executor, tempFile } = createNodeDatabase({ inMemory: true });
    try {
      await runMigrations(executor);
      await expect(runMigrations(executor)).resolves.not.toThrow();
    } finally {
      rawClient.close();
      if (tempFile) {
        try {
          const fs = await import("node:fs");
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch {}
      }
    }
  });
});
