import { MigrationError } from "../errors";

export interface MigrationEntry {
  id: string;
  sql: string[];
}

export const INITIAL_MIGRATION_SQL = [
  `CREATE TABLE IF NOT EXISTS "courses" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "code" text NOT NULL,
    "color" text NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL,
    "deleted_at" integer
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "courses_code_unique" ON "courses" ("code");`,
  `CREATE TABLE IF NOT EXISTS "tasks" (
    "id" text PRIMARY KEY NOT NULL,
    "course_id" text REFERENCES "courses"("id"),
    "title" text NOT NULL,
    "description" text,
    "priority" text DEFAULT 'p4' NOT NULL,
    "is_completed" integer DEFAULT 0 NOT NULL,
    "due_date" text,
    "time_block_start" text,
    "time_block_end" text,
    "estimated_pomodoros" integer DEFAULT 1 NOT NULL,
    "completed_pomodoros" integer DEFAULT 0 NOT NULL,
    "completed_at" integer,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL,
    "deleted_at" integer
  );`,
  `CREATE INDEX IF NOT EXISTS "tasks_due_date_is_completed_order_idx" ON "tasks" ("due_date", "is_completed", "order_index");`,
  `CREATE INDEX IF NOT EXISTS "tasks_course_id_is_completed_idx" ON "tasks" ("course_id", "is_completed");`,
  `CREATE INDEX IF NOT EXISTS "tasks_time_block_start_idx" ON "tasks" ("time_block_start");`,
  `CREATE TABLE IF NOT EXISTS "subtasks" (
    "id" text PRIMARY KEY NOT NULL,
    "task_id" text NOT NULL REFERENCES "tasks"("id"),
    "title" text NOT NULL,
    "is_completed" integer DEFAULT 0 NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL,
    "deleted_at" integer
  );`,
  `CREATE INDEX IF NOT EXISTS "subtasks_task_id_order_idx" ON "subtasks" ("task_id", "order_index");`,
  `CREATE TABLE IF NOT EXISTS "events" (
    "id" text PRIMARY KEY NOT NULL,
    "series_id" text,
    "course_id" text REFERENCES "courses"("id"),
    "title" text NOT NULL,
    "event_type" text DEFAULT 'class' NOT NULL,
    "start_time" integer NOT NULL,
    "end_time" integer NOT NULL,
    "is_recurring" integer DEFAULT 0 NOT NULL,
    "recurrence_rule" text,
    "created_at" integer NOT NULL,
    "updated_at" integer NOT NULL,
    "deleted_at" integer
  );`,
  `CREATE INDEX IF NOT EXISTS "events_start_time_idx" ON "events" ("start_time");`,
  `CREATE INDEX IF NOT EXISTS "events_end_time_idx" ON "events" ("end_time");`,
  `CREATE INDEX IF NOT EXISTS "events_course_id_start_time_idx" ON "events" ("course_id", "start_time");`,
  `CREATE TABLE IF NOT EXISTS "focus_sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "task_id" text REFERENCES "tasks"("id"),
    "duration_minutes" integer NOT NULL,
    "session_type" text NOT NULL,
    "started_at" integer NOT NULL,
    "completed_at" integer NOT NULL,
    "was_completed" integer NOT NULL,
    "created_at" integer NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS "focus_sessions_task_id_idx" ON "focus_sessions" ("task_id");`,
  `CREATE INDEX IF NOT EXISTS "focus_sessions_completed_at_idx" ON "focus_sessions" ("completed_at");`,
  `CREATE TABLE IF NOT EXISTS "focus_state" (
    "id" text PRIMARY KEY NOT NULL,
    "task_id" text REFERENCES "tasks"("id"),
    "mode" text DEFAULT 'work' NOT NULL,
    "started_at" integer,
    "target_at" integer,
    "paused_at" integer,
    "status" text DEFAULT 'idle' NOT NULL,
    "updated_at" integer NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "user_preferences" (
    "key" text PRIMARY KEY NOT NULL,
    "value" text NOT NULL,
    "updated_at" integer NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "statistics_cache" (
    "key" text PRIMARY KEY NOT NULL,
    "value" text NOT NULL,
    "calculated_at" integer NOT NULL
  );`,
];

export const MIGRATIONS: MigrationEntry[] = [
  {
    id: "0001_initial",
    sql: INITIAL_MIGRATION_SQL,
  },
];

export interface SqliteRawExecutor {
  exec(sql: string): void | Promise<void>;
  all<T = unknown>(sql: string): T[] | Promise<T[]>;
  run(sql: string, params?: unknown[]): void | Promise<void>;
}

export async function runMigrations(executor: SqliteRawExecutor): Promise<void> {
  try {
    await executor.run(
      `CREATE TABLE IF NOT EXISTS "_drizzle_migrations" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "hash" text NOT NULL,
        "created_at" integer NOT NULL
      );`
    );

    const rows = await executor.all<{ hash: string }>(
      `SELECT "hash" FROM "_drizzle_migrations"`
    );
    const appliedHashes = new Set(rows.map((r) => r.hash));

    for (const migration of MIGRATIONS) {
      if (!appliedHashes.has(migration.id)) {
        await executor.run("BEGIN TRANSACTION;");
        try {
          for (const statement of migration.sql) {
            await executor.run(statement);
          }
          await executor.run(
            `INSERT INTO "_drizzle_migrations" ("hash", "created_at") VALUES (?, ?);`,
            [migration.id, Date.now()]
          );
          await executor.run("COMMIT;");
        } catch (err) {
          await executor.run("ROLLBACK;");
          throw new MigrationError(
            `Failed to execute migration ${migration.id}`,
            err
          );
        }
      }
    }
  } catch (error) {
    if (error instanceof MigrationError) {
      throw error;
    }
    throw new MigrationError("Failed running database migrations", error);
  }
}

export const runPendingMigrations = runMigrations;
