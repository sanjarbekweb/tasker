import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, getCourseAccentTint } from "../../constants/theme";
import { FocusMode, FocusStatus, formatTimeRemaining } from "../../domain/focus";

export interface TimerProps {
  remainingSeconds: number;
  progress: number; // 0.0 to 1.0
  mode: FocusMode;
  status: FocusStatus;
}

export const Timer = memo(function Timer({
  remainingSeconds,
  progress,
  mode,
  status,
}: TimerProps) {
  const isBreak = mode === "short_break" || mode === "long_break";
  const accentColor = isBreak
    ? THEME_COLORS.semantic.eventPersonal
    : THEME_COLORS.semantic.focusAccent;

  const formattedTime = formatTimeRemaining(remainingSeconds);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.outerRing,
          {
            borderColor: getCourseAccentTint(accentColor, 0.25),
            backgroundColor: getCourseAccentTint(accentColor, 0.04),
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            status === "running" && {
              borderColor: accentColor,
              shadowColor: accentColor,
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 4,
            },
          ]}
        >
          <Text style={[styles.timerDigits, { color: THEME_COLORS.light.textPrimary }]}>
            {formattedTime}
          </Text>
          <Text style={[styles.modeLabel, { color: accentColor }]}>
            {mode === "work" ? "FOCUS" : mode === "short_break" ? "SHORT BREAK" : "LONG BREAK"}
          </Text>
          {status === "paused" && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedText}>PAUSED</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
  },
  outerRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
  },
  innerCircle: {
    width: 228,
    height: 228,
    borderRadius: 114,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderWidth: 2,
    borderColor: THEME_COLORS.light.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  timerDigits: {
    ...TYPOGRAPHY.timerLarge,
    fontSize: 52,
    lineHeight: 60,
    textAlign: "center",
  },
  modeLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: SPACING.xs,
  },
  pausedBadge: {
    backgroundColor: THEME_COLORS.light.borderSubtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  pausedText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: "700",
    color: THEME_COLORS.light.textMuted,
  },
});
