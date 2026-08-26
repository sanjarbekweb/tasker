import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Plus, Clock } from "lucide-react-native";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";

export interface TimeGapRowProps {
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  onScheduleInGap?: (startMinutes: number, endMinutes: number) => void;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export const TimeGapRow = memo(function TimeGapRow({
  startMinutes,
  endMinutes,
  durationMinutes,
  onScheduleInGap,
}: TimeGapRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.borderDefault }]} />
      <TouchableOpacity
        style={[styles.gapPill, { backgroundColor: colors.bgSurfaceElevated }]}
        onPress={() => onScheduleInGap?.(startMinutes, endMinutes)}
        activeOpacity={0.7}
      >
        <Clock size={12} color={colors.textMuted} />
        <Text style={[styles.gapText, { color: colors.textMuted }]}>
          {durationMinutes} min free ({formatMinutes(startMinutes)} - {formatMinutes(endMinutes)})
        </Text>
        {onScheduleInGap && <Plus size={12} color={colors.textPrimary} style={{ marginLeft: 4 }} />}
      </TouchableOpacity>
      <View style={[styles.line, { backgroundColor: colors.borderDefault }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.6,
  },
  gapPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    marginHorizontal: SPACING.sm,
  },
  gapText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    marginLeft: 4,
  },
});
