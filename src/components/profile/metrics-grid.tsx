import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { CheckCircle2, Clock, Award, Target } from "lucide-react-native";

export interface MetricsGridProps {
  completedTasks: number;
  totalFocusMinutes: number;
  longestStreak: number;
  completionRatePercent: number;
}

export const MetricsGrid = memo(function MetricsGrid({
  completedTasks,
  totalFocusMinutes,
  longestStreak,
  completionRatePercent,
}: MetricsGridProps) {
  const focusHours = (totalFocusMinutes / 60).toFixed(1);

  const metrics = [
    {
      label: "COMPLETED TASKS",
      value: completedTasks.toString(),
      icon: CheckCircle2,
      color: THEME_COLORS.semantic.stateSuccess,
    },
    {
      label: "TOTAL FOCUS",
      value: `${focusHours}h`,
      icon: Clock,
      color: THEME_COLORS.semantic.focusAccent,
    },
    {
      label: "LONGEST STREAK",
      value: `${longestStreak} d`,
      icon: Award,
      color: THEME_COLORS.semantic.gamifyStreak,
    },
    {
      label: "COMPLETION RATE",
      value: `${Math.round(completionRatePercent)}%`,
      icon: Target,
      color: THEME_COLORS.semantic.priorityLow,
    },
  ];

  return (
    <View style={styles.grid}>
      {metrics.map((m, idx) => {
        const IconComp = m.icon;
        return (
          <View key={idx} style={styles.metricCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.label}>{m.label}</Text>
              <IconComp size={16} color={m.color} />
            </View>
            <Text style={styles.value}>{m.value}</Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.lg,
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: "700",
    color: THEME_COLORS.light.textMuted,
    letterSpacing: 0.5,
  },
  value: {
    ...TYPOGRAPHY.heading,
    fontSize: 22,
    fontWeight: "700",
    color: THEME_COLORS.light.textPrimary,
  },
});
