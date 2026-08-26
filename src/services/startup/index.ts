import { initializeDatabase } from "../../db/client";
import { PreferenceRepository } from "../../db/repositories/preference-repository";
import { observability } from "../observability";
import { logger } from "../../utils/logger";
import { useUIStore } from "../../stores/ui-store";

export interface StartupResult {
  coldStartDurationMs: number;
  initialPreferences: Record<string, string>;
}

export class StartupManager {
  private static isInitialized = false;

  /**
   * Executes the critical startup sequence:
   * 1. Initialize SQLite Database & Run pending migrations
   * 2. Read minimal user preferences needed for theme/first-paint
   * 3. Record cold_start_ms telemetry
   * 4. Return immediately to allow Tasks Screen to mount
   */
  public static async executeCriticalStartup(): Promise<StartupResult> {
    observability.startTimer("cold_start_ms");
    observability.startSession();

    logger.info("StartupManager", "Starting critical launch sequence");

    // 1. DB Init + Migrations
    const db = await observability.measureAsync("db_startup_init_ms", async () => {
      return await initializeDatabase();
    });

    // 2. Minimal Preferences
    const initialPreferences = await observability.measureAsync("pref_startup_load_ms", async () => {
      const repo = new PreferenceRepository(db);
      return await repo.getAll();
    });

    if (
      initialPreferences.themeMode === "dark" ||
      initialPreferences.themeMode === "light" ||
      initialPreferences.themeMode === "system"
    ) {
      useUIStore.getState().setThemePreference(initialPreferences.themeMode as any);
    }

    const coldStartDurationMs = observability.stopTimer("cold_start_ms");
    logger.info("StartupManager", `Critical startup sequence completed in ${coldStartDurationMs}ms`);

    StartupManager.isInitialized = true;

    // 3. Defer non-critical background jobs
    StartupManager.scheduleDeferredJobs();

    return {
      coldStartDurationMs,
      initialPreferences,
    };
  }

  /**
   * Schedules non-critical jobs to execute asynchronously after the UI is interactive.
   */
  private static scheduleDeferredJobs(): void {
    setTimeout(() => {
      try {
        logger.debug("StartupManager", "Executing deferred non-critical background jobs");
        // Non-critical: Telemetry flush, background cache audit, sync polling
      } catch (err) {
        logger.warn("StartupManager", "Deferred job warning", err);
      }
    }, 1500);
  }

  public static isReady(): boolean {
    return StartupManager.isInitialized;
  }
}
