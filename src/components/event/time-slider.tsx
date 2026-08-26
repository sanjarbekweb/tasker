import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

export interface TimeSliderProps {
  label: string;
  valueMinutes: number; // minutes from midnight (0 - 1439)
  onChangeMinutes: (minutes: number) => void;
  stepMinutes?: number; // default 15
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  label,
  valueMinutes,
  onChangeMinutes,
  stepMinutes = 15,
}) => {
  const handleDecrement = () => {
    const next = Math.max(0, valueMinutes - stepMinutes);
    triggerHaptic();
    onChangeMinutes(next);
  };

  const handleIncrement = () => {
    const next = Math.min(23 * 60 + 45, valueMinutes + stepMinutes);
    triggerHaptic();
    onChangeMinutes(next);
  };

  const triggerHaptic = () => {
    try {
      if (typeof Haptics.selectionAsync === "function") {
        Haptics.selectionAsync();
      }
    } catch {
      // ignore haptic error
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={handleDecrement}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color={THEME_COLORS.light.textPrimary} />
        </TouchableOpacity>

        <View style={styles.valueBox}>
          <Text style={styles.valueText}>{formatMinutes(valueMinutes)}</Text>
        </View>

        <TouchableOpacity
          style={styles.stepBtn}
          onPress={handleIncrement}
          activeOpacity={0.7}
        >
          <ChevronRight size={18} color={THEME_COLORS.light.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: THEME_COLORS.light.textMuted,
    marginBottom: SPACING.xs,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.light.borderSubtle,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    padding: 3,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  valueBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    ...TYPOGRAPHY.mono,
    fontSize: 15,
    fontWeight: "700",
    color: THEME_COLORS.light.textPrimary,
  },
});
