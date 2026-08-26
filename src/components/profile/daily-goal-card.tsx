import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { Target } from "lucide-react-native";

export interface DailyGoalCardProps {
  completedPomodoros: number;
  dailyGoalPomodoros?: number;
}

export const DailyGoalCard = memo(function DailyGoalCard({
  completedPomodoros,
  dailyGoalPomodoros = 8,
}: DailyGoalCardProps) {
  const { colors, semantic } = useTheme();
  const percent = Math.min(100, Math.round((completedPomodoros / dailyGoalPomodoros) * 100));

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Target size={16} color={semantic.focusAccent} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>Daily Focus Goal</Text>
          </View>
          <Text style={[styles.progressText, { color: colors.textPrimary }]}>
            {completedPomodoros} / {dailyGoalPomodoros} pomodoros
          </Text>
        </View>

        <View style={[styles.barBackground, { backgroundColor: colors.bgSurfaceElevated }]}>
          <View
            style={[
              styles.barFill,
              { width: `${percent}%`, backgroundColor: semantic.focusAccent },
            ]}
          />
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
    borderRadius: BORDER_RADIUS["2xl"],
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
    marginLeft: SPACING.sm,
    fontSize: 14,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
  },
  barBackground: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
});
