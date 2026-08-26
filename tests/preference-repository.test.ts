import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { PreferenceRepository } from "../src/db/repositories/preference-repository";
import { StatisticsCacheRepository } from "../src/db/repositories/statistics-cache-repository";

describe("PreferenceRepository & StatisticsCacheRepository", () => {
  let db: AppDatabase;
  let prefRepo: PreferenceRepository;
  let statsRepo: StatisticsCacheRepository;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
    prefRepo = new PreferenceRepository(db);
    statsRepo = new StatisticsCacheRepository(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("sets and gets user preferences", async () => {
    await prefRepo.set("theme", "dark");
    await prefRepo.set("auto_start_break", "true");

    const theme = await prefRepo.get("theme");
    expect(theme).toBe("dark");

    const all = await prefRepo.getAll();
    expect(all).toEqual({
      theme: "dark",
      auto_start_break: "true",
    });
  });

  it("manages statistics cache and invalidation", async () => {
    await statsRepo.set("daily_summary_2026-08-27", JSON.stringify({ pomodoros: 6, tasksCompleted: 4 }));

    const cached = await statsRepo.get("daily_summary_2026-08-27");
    expect(cached).toBeDefined();
    expect(JSON.parse(cached!.value)).toEqual({ pomodoros: 6, tasksCompleted: 4 });

    await statsRepo.invalidate("daily_summary_2026-08-27");
    const invalidated = await statsRepo.get("daily_summary_2026-08-27");
    expect(invalidated).toBeNull();
  });
});
