import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userPreferences = sqliteTable("user_preferences", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
