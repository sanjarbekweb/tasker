import { drizzle } from "drizzle-orm/op-sqlite";
import { open, DB } from "@op-engineering/op-sqlite";
import * as schema from "./schema";
import { runMigrations, SqliteRawExecutor } from "./migrations/migrator";
import { DatabaseError } from "./errors";
import { SecurityService } from "../services/security";
import { logger } from "../utils/logger";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

export interface DatabaseConfig {
  dbName?: string;
  encryptionKey?: string;
  inMemory?: boolean;
}

let dbInstance: AppDatabase | null = null;
let rawDbInstance: DB | null = null;

export function getDatabaseInstance(): AppDatabase {
  if (!dbInstance) {
    throw new DatabaseError("Database has not been initialized. Call initializeDatabase() first.");
  }
  return dbInstance;
}

export const getDatabase = getDatabaseInstance;

export async function initializeDatabase(config: DatabaseConfig = {}): Promise<AppDatabase> {
  try {
    if (dbInstance) {
      return dbInstance;
    }

    const dbName = config.dbName ?? "numo.sqlite";

    let encryptionKey = config.encryptionKey;
    if (!encryptionKey) {
      try {
        encryptionKey = (await SecurityService.getDatabaseKey()) ?? undefined;
      } catch (err) {
        logger.warn("client.native", "Failed to retrieve encryption key from SecureStore", err);
      }
    }

    const opsqliteDb = open({
      name: dbName,
      encryptionKey,
    });

    try {
      await opsqliteDb.execute("PRAGMA foreign_keys = ON;");
      await opsqliteDb.execute("PRAGMA journal_mode = WAL;");
      await opsqliteDb.execute("PRAGMA synchronous = NORMAL;");
      await opsqliteDb.execute("PRAGMA busy_timeout = 5000;");
    } catch (e) {
      logger.warn("client.native", "SQLite pragma configuration warning", e);
    }

    const executor: SqliteRawExecutor = {
      async exec(sql: string) {
        await opsqliteDb.execute(sql);
      },
      async all<T = unknown>(sql: string) {
        const res = await opsqliteDb.execute(sql);
        return ((res as any).rows?._array ?? (res as any).res ?? []) as T[];
      },
      async run(sql: string, params: unknown[] = []) {
        await opsqliteDb.execute(sql, params as any[]);
      },
    };

    await runMigrations(executor);

    dbInstance = drizzle(opsqliteDb, { schema });
    rawDbInstance = opsqliteDb;
    return dbInstance;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError("Failed to initialize mobile OP-SQLite database", error);
  }
}

export function closeDatabase(): void {
  if (rawDbInstance) {
    try {
      rawDbInstance.close();
    } catch {
      // ignore
    }
    rawDbInstance = null;
    dbInstance = null;
  }
}
