import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { DailySchedule, ScheduledItem, FreeGap } from "../../domain/scheduling";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
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
  const { colors, semantic } = useTheme();
  const { items, collisions, freeGaps } = schedule;

  const collisionItemIds = new Set<string>();
  collisions.forEach((c) => {
    collisionItemIds.add(c.itemAId);
    collisionItemIds.add(c.itemBId);
  });

  return (
    <View style={styles.container}>
      {collisions.length > 0 && (
        <View style={[styles.collisionBanner, { backgroundColor: `${semantic.stateError}15`, borderColor: semantic.stateError }]}>
          <AlertTriangle size={14} color={semantic.stateError} />
          <Text style={[styles.collisionBannerText, { color: semantic.stateError }]}>
            {collisions.length} schedule conflict{collisions.length > 1 ? "s" : ""} detected
          </Text>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={28} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No scheduled events or tasks</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Your day is wide open.</Text>
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
                  <Text style={[styles.timeStart, { color: colors.textPrimary }]}>{formatTimestamp(item.startTime)}</Text>
                  <Text style={[styles.timeEnd, { color: colors.textMuted }]}>{formatTimestamp(item.endTime)}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: colors.bgSurfaceCard,
                      borderColor: colors.borderDefault,
                    },
                    isEvent
                      ? [styles.eventCard, { borderLeftColor: semantic.eventClass }]
                      : [styles.taskCard, { borderLeftColor: semantic.priorityLow }],
                    hasCollision && [styles.itemCardCollision, { borderColor: semantic.stateError }],
                  ]}
                  onPress={() => onPressItem?.(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.itemTypeTag, { color: colors.textMuted }]}>
                      {item.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.durationText, { color: colors.textMuted }]}>
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
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  collisionBannerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
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
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.caption,
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
    fontSize: 11,
  },
  timeEnd: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
  },
  itemCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
  },
  eventCard: {
    borderLeftWidth: 4,
  },
  taskCard: {
    borderLeftWidth: 4,
  },
  itemCardCollision: {
    borderWidth: 1.5,
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
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemTypeTag: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: "700",
  },
  durationText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
  },
});
