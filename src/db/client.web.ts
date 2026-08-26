import initSqlJs, { Database } from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import * as schema from "./schema";
import { runMigrations, SqliteRawExecutor } from "./migrations/migrator";
import { DatabaseError } from "./errors";

export type AppDatabase = any;

export interface DatabaseConfig {
  dbName?: string;
  inMemory?: boolean;
}

let dbInstance: AppDatabase | null = null;
let rawClientInstance: Database | null = null;

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

    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });

    const rawClient = new SQL.Database();

    const executor: SqliteRawExecutor = {
      async exec(sql: string) {
        rawClient.run(sql);
      },
      async all<T = unknown>(sql: string) {
        const res = rawClient.exec(sql);
        if (!res || res.length === 0 || !res[0]) return [];
        const { columns, values } = res[0];
        return values.map((row) => {
          const obj: Record<string, unknown> = {};
          columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj as unknown as T;
        });
      },
      async run(sql: string, params: unknown[] = []) {
        rawClient.run(sql, (params ?? []) as any[]);
      },
    };

    await runMigrations(executor);

    dbInstance = drizzle(rawClient, { schema }) as any;
    rawClientInstance = rawClient;
    return dbInstance;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError("Failed to initialize web database", error);
  }
}

export function closeDatabase(): void {
  if (rawClientInstance) {
    try {
      rawClientInstance.close();
    } catch {
      // ignore
    }
    rawClientInstance = null;
    dbInstance = null;
  }
}
