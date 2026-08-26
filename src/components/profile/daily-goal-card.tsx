import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { Target } from "lucide-react-native";

export interface DailyGoalCardProps {
  completedPomodoros: number;
  dailyGoalPomodoros?: number;
}

export const DailyGoalCard = memo(function DailyGoalCard({
  completedPomodoros,
  dailyGoalPomodoros = 8,
}: DailyGoalCardProps) {
  const percent = Math.min(100, Math.round((completedPomodoros / dailyGoalPomodoros) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Target size={16} color={THEME_COLORS.semantic.focusAccent} />
            <Text style={styles.title}>Daily Focus Goal</Text>
          </View>
          <Text style={styles.progressText}>
            {completedPomodoros} / {dailyGoalPomodoros} pomodoros
          </Text>
        </View>

        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${percent}%` }]} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
    marginLeft: SPACING.sm,
    fontSize: 14,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: THEME_COLORS.light.textPrimary,
  },
  barBackground: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLORS.light.borderSubtle,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: THEME_COLORS.semantic.focusAccent,
  },
});
