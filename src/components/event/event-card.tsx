import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Event } from "../../db/schema/events";
import { Course } from "../../db/schema/courses";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING, getCourseAccentTint } from "../../constants/theme";
import { CoursePill } from "../ui/badge";
import { Repeat, AlertTriangle } from "lucide-react-native";

export interface EventCardProps {
  event: Event;
  course?: Course | null;
  hasCollision?: boolean;
  onPress?: (event: Event) => void;
  style?: ViewStyle;
}

function formatTimestamp(timestamp: number): string {
  const d = new Date(timestamp);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayH = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayH}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

export const EventCard = memo(function EventCard({
  event,
  course,
  hasCollision,
  onPress,
  style,
}: EventCardProps) {
  const isClass = event.eventType === "class";
  const accentColor = isClass
    ? (course?.color ?? THEME_COLORS.semantic.eventClass)
    : THEME_COLORS.semantic.eventPersonal;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderLeftColor: accentColor,
          borderLeftWidth: 4,
        },
        hasCollision && styles.collisionBorder,
        style,
      ]}
      onPress={() => onPress?.(event)}
      activeOpacity={0.75}
    >
      <View style={styles.headerRow}>
        <Text style={styles.timeText}>
          {formatTimestamp(event.startTime)} – {formatTimestamp(event.endTime)}
        </Text>
        <View style={styles.badgesRow}>
          {hasCollision && (
            <View style={styles.collisionBadge}>
              <AlertTriangle size={11} color={THEME_COLORS.semantic.stateError} />
              <Text style={styles.collisionText}>Overlap</Text>
            </View>
          )}
          {course && (
            <CoursePill
              courseCode={course.code}
              courseColor={course.color}
              size="sm"
            />
          )}
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {event.title}
      </Text>

      <View style={styles.footerRow}>
        {event.isRecurring || event.recurrenceRule ? (
          <View style={styles.metaItem}>
            <Repeat size={12} color={THEME_COLORS.light.textMuted} />
            <Text style={styles.metaText}>Repeats</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.lg,
  },
  collisionBorder: {
    borderColor: THEME_COLORS.semantic.stateError,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  timeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: THEME_COLORS.light.textMuted,
    fontSize: 12,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  collisionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: getCourseAccentTint(THEME_COLORS.semantic.stateError, 0.15),
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
  },
  collisionText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: "700",
    color: THEME_COLORS.semantic.stateError,
    marginLeft: 3,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.xs,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: THEME_COLORS.light.textMuted,
    marginLeft: 3,
  },
});
