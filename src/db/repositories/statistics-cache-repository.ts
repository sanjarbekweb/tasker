import { eq } from "drizzle-orm";
import { AppDatabase } from "../client";
import { statisticsCache } from "../schema/statistics-cache";
import { DatabaseError } from "../errors";

export interface CacheEntry {
  key: string;
  value: string;
  calculatedAt: number;
}

export class StatisticsCacheRepository {
  constructor(private db: AppDatabase) {}

  async get(key: string): Promise<CacheEntry | null> {
    try {
      const result = await this.db
        .select()
        .from(statisticsCache)
        .where(eq(statisticsCache.key, key))
        .limit(1);
      return result[0] ?? null;
    } catch (error) {
      throw new DatabaseError(`Database error getting cache for key "${key}"`, error);
    }
  }

  async set(key: string, value: string): Promise<void> {
    const now = Date.now();
    try {
      const existing = await this.get(key);
      if (existing) {
        await this.db
          .update(statisticsCache)
          .set({ value, calculatedAt: now })
          .where(eq(statisticsCache.key, key));
      } else {
        await this.db.insert(statisticsCache).values({
          key,
          value,
          calculatedAt: now,
        });
      }
    } catch (error) {
      throw new DatabaseError(`Database error setting cache for key "${key}"`, error);
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      await this.db
        .delete(statisticsCache)
        .where(eq(statisticsCache.key, key));
    } catch (error) {
      throw new DatabaseError(`Database error invalidating cache for key "${key}"`, error);
    }
  }

  async invalidateAll(): Promise<void> {
    try {
      await this.db.delete(statisticsCache);
    } catch (error) {
      throw new DatabaseError("Database error clearing statistics cache", error);
    }
  }
}
