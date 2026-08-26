import { drizzle } from "drizzle-orm/libsql";
import { createClient, Client } from "@libsql/client";
import * as schema from "./schema";
import { runMigrations, SqliteRawExecutor } from "./migrations/migrator";
import { DatabaseError } from "./errors";
import fs from "node:fs";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

export interface DatabaseConfig {
  dbName?: string;
  inMemory?: boolean;
}

let dbInstance: AppDatabase | null = null;
let rawClientInstance: Client | null = null;
let tempDbFile: string | null = null;

export function getDatabaseInstance(): AppDatabase {
  if (!dbInstance) {
    throw new DatabaseError("Database has not been initialized. Call initializeDatabase() first.");
  }
  return dbInstance;
}

export function createNodeDatabase(config: DatabaseConfig = {}): {
  db: AppDatabase;
  rawClient: Client;
  executor: SqliteRawExecutor;
  tempFile?: string;
} {
  let url: string;
  let tempFile: string | undefined;

  if (config.inMemory) {
    const cacheDir = "node_modules/.cache/drizzle-tests";
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    tempFile = `${cacheDir}/test_${crypto.randomUUID()}.db`;
    url = `file:${tempFile}`;
  } else {
    url = `file:${config.dbName ?? "numo.db"}`;
  }

  const rawClient = createClient({ url });

  const executor: SqliteRawExecutor = {
    async exec(sql: string) {
      await rawClient.executeMultiple(sql);
    },
    async all<T = unknown>(sql: string) {
      const res = await rawClient.execute(sql);
      return res.rows as unknown as T[];
    },
    async run(sql: string, params: unknown[] = []) {
      await rawClient.execute({ sql, args: (params ?? []) as any });
    },
  };

  const db = drizzle(rawClient, { schema });
  return { db, rawClient, executor, tempFile };
}

export async function initializeDatabase(config: DatabaseConfig = {}): Promise<AppDatabase> {
  try {
    const { db, rawClient, executor, tempFile } = createNodeDatabase(config);
    if (tempFile) {
      tempDbFile = tempFile;
    }

    // Apply pragmas
    try {
      await executor.run("PRAGMA foreign_keys = ON;");
      if (!config.inMemory) {
        await executor.run("PRAGMA journal_mode = WAL;");
        await executor.run("PRAGMA synchronous = NORMAL;");
        await executor.run("PRAGMA busy_timeout = 5000;");
      }
    } catch (err) {
      throw new DatabaseError("Failed to apply SQLite pragmas", err);
    }

    await runMigrations(executor);
    dbInstance = db;
    rawClientInstance = rawClient;
    return db;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError("Failed to initialize database", error);
  }
}

export function closeDatabase(): void {
  if (rawClientInstance) {
    rawClientInstance.close();
    rawClientInstance = null;
    dbInstance = null;
  }
  if (tempDbFile) {
    try {
      if (fs.existsSync(tempDbFile)) {
        fs.unlinkSync(tempDbFile);
      }
    } catch {
      // Ignore unlink errors in cleanup
    }
    tempDbFile = null;
  }
}
