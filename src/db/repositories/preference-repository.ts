import { eq } from "drizzle-orm";
import { AppDatabase } from "../client";
import { userPreferences } from "../schema/preferences";
import { DatabaseError } from "../errors";

export class PreferenceRepository {
  constructor(private db: AppDatabase) {}

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.key, key))
        .limit(1);
      return result[0]?.value ?? null;
    } catch (error) {
      throw new DatabaseError(`Database error getting preference for key "${key}"`, error);
    }
  }

  async set(key: string, value: string): Promise<void> {
    const now = Date.now();
    try {
      const existing = await this.get(key);
      if (existing !== null) {
        await this.db
          .update(userPreferences)
          .set({ value, updatedAt: now })
          .where(eq(userPreferences.key, key));
      } else {
        await this.db.insert(userPreferences).values({
          key,
          value,
          updatedAt: now,
        });
      }
    } catch (error) {
      throw new DatabaseError(`Database error setting preference for key "${key}"`, error);
    }
  }

  async getAll(): Promise<Record<string, string>> {
    try {
      const rows = await this.db.select().from(userPreferences);
      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.key] = row.value;
      }
      return result;
    } catch (error) {
      throw new DatabaseError("Database error getting all preferences", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.db
        .delete(userPreferences)
        .where(eq(userPreferences.key, key));
    } catch (error) {
      throw new DatabaseError(`Database error deleting preference for key "${key}"`, error);
    }
  }
}
