import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { DailySchedule, ScheduledItem, FreeGap } from "../../domain/scheduling";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { Clock, AlertTriangle } from "lucide-react-native";
import { TimeGapRow } from "../task/time-gap-row";
import { TouchableOpacity } from "react-native";

export interface TimelineScheduleProps {
  schedule: DailySchedule;
  onScheduleInGap?: (gap: FreeGap) => void;
  onPressItem?: (item: ScheduledItem) => void;
}

function formatTimestamp(timestamp: number): string {
  const d = new Date(timestamp);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayH = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayH}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function timestampToMinutes(timestamp: number): number {
  const d = new Date(timestamp);
  return d.getHours() * 60 + d.getMinutes();
}

export const TimelineSchedule = memo(function TimelineSchedule({
  schedule,
  onScheduleInGap,
  onPressItem,
}: TimelineScheduleProps) {
  const { items, collisions, freeGaps } = schedule;

  const collisionItemIds = new Set<string>();
  collisions.forEach((c) => {
    collisionItemIds.add(c.itemAId);
    collisionItemIds.add(c.itemBId);
  });

  return (
    <View style={styles.container}>
      {collisions.length > 0 && (
        <View style={styles.collisionBanner}>
          <AlertTriangle size={14} color={THEME_COLORS.semantic.stateError} />
          <Text style={styles.collisionBannerText}>
            {collisions.length} schedule conflict{collisions.length > 1 ? "s" : ""} detected
          </Text>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={28} color={THEME_COLORS.light.textMuted} />
          <Text style={styles.emptyTitle}>No scheduled events or tasks</Text>
          <Text style={styles.emptySubtitle}>Your day is wide open.</Text>
        </View>
      ) : (
        <View style={styles.timelineList}>
          {items.map((item) => {
            const hasCollision = collisionItemIds.has(item.id);
            const isEvent = item.type === "event";
            const durationMins = Math.round((item.endTime - item.startTime) / (1000 * 60));

            return (
              <View key={item.id} style={styles.itemWrapper}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeStart}>{formatTimestamp(item.startTime)}</Text>
                  <Text style={styles.timeEnd}>{formatTimestamp(item.endTime)}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.itemCard,
                    isEvent ? styles.eventCard : styles.taskCard,
                    hasCollision && styles.itemCardCollision,
                  ]}
                  onPress={() => onPressItem?.(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemTypeTag}>
                      {item.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.durationText}>
                    {durationMins} mins
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Render actionable free gaps */}
          {freeGaps.map((gap, i) => (
            <TimeGapRow
              key={`gap-${i}`}
              startMinutes={timestampToMinutes(gap.startTime)}
              endMinutes={timestampToMinutes(gap.endTime)}
              durationMinutes={gap.durationMinutes}
              onScheduleInGap={() => onScheduleInGap?.(gap)}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
  },
  collisionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: THEME_COLORS.semantic.stateError,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  collisionBannerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: THEME_COLORS.semantic.stateError,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING["3xl"],
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 16,
    color: THEME_COLORS.light.textPrimary,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
    marginTop: 2,
  },
  timelineList: {
    paddingHorizontal: SPACING.lg,
  },
  itemWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  timeColumn: {
    width: 65,
    paddingTop: 2,
  },
  timeStart: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: THEME_COLORS.light.textPrimary,
    fontSize: 11,
  },
  timeEnd: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
    fontSize: 10,
  },
  itemCard: {
    flex: 1,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    padding: SPACING.md,
  },
  eventCard: {
    borderLeftWidth: 4,
    borderLeftColor: THEME_COLORS.semantic.eventClass,
  },
  taskCard: {
    borderLeftWidth: 4,
    borderLeftColor: THEME_COLORS.semantic.priorityLow,
  },
  itemCardCollision: {
    borderColor: THEME_COLORS.semantic.stateError,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  itemTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemTypeTag: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: "700",
    color: THEME_COLORS.light.textMuted,
  },
  durationText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: THEME_COLORS.light.textMuted,
  },
});
