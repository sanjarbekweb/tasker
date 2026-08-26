import { drizzle } from "drizzle-orm/op-sqlite";
import { open } from "@op-engineering/op-sqlite";
import * as schema from "./schema";
import { runMigrations, SqliteRawExecutor } from "./migrations/migrator";
import { DatabaseError } from "./errors";

export interface MobileDatabaseConfig {
  dbName?: string;
  encryptionKey?: string;
}

export async function initializeMobileDatabase(config: MobileDatabaseConfig = {}) {
  try {
    const dbName = config.dbName ?? "numo.sqlite";
    const opsqliteDb = open({
      name: dbName,
      encryptionKey: config.encryptionKey,
    });

    // Apply SQLite Pragmas conditionally
    try {
      await opsqliteDb.execute("PRAGMA foreign_keys = ON;");
      await opsqliteDb.execute("PRAGMA journal_mode = WAL;");
      await opsqliteDb.execute("PRAGMA synchronous = NORMAL;");
      await opsqliteDb.execute("PRAGMA busy_timeout = 5000;");
    } catch (e) {
      console.warn("OP-SQLite pragma configuration warning:", e);
    }

    const executor: SqliteRawExecutor = {
      async exec(sql: string) {
        await opsqliteDb.execute(sql);
      },
      async all<T = unknown>(sql: string) {
        const res = await opsqliteDb.execute(sql);
        return (res.rows?._array ?? res.res ?? []) as T[];
      },
      async run(sql: string, params: unknown[] = []) {
        await opsqliteDb.execute(sql, params as any[]);
      },
    };

    await runMigrations(executor);

    return drizzle(opsqliteDb, { schema });
  } catch (error) {
    throw new DatabaseError("Failed to initialize mobile OP-SQLite database", error);
  }
}
