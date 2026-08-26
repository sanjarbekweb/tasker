import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const statisticsCache = sqliteTable("statistics_cache", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  calculatedAt: integer("calculated_at", { mode: "number" }).notNull(),
});

export type StatisticsCache = typeof statisticsCache.$inferSelect;
export type NewStatisticsCache = typeof statisticsCache.$inferInsert;
