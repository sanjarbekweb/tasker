import { drizzle } from "drizzle-orm/libsql";
import { createClient, Client } from "@libsql/client/web";
import * as schema from "./schema";
import { runMigrations, SqliteRawExecutor } from "./migrations/migrator";
import { DatabaseError } from "./errors";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

export interface DatabaseConfig {
  dbName?: string;
  inMemory?: boolean;
}

let dbInstance: AppDatabase | null = null;
let rawClientInstance: Client | null = null;

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

    // In web environment, use in-memory Web SQL client
    const rawClient = createClient({ url: ":memory:" });

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

    await runMigrations(executor);

    dbInstance = drizzle(rawClient, { schema });
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
    rawClientInstance.close();
    rawClientInstance = null;
    dbInstance = null;
  }
}
