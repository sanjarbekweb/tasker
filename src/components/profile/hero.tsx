import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING, getCourseAccentTint } from "../../constants/theme";
import { Flame } from "lucide-react-native";

export interface HeroProps {
  name?: string;
  currentStreak: number;
}

export const Hero = memo(function Hero({
  name = "Student",
  currentStreak = 0,
}: HeroProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textColumn}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{name}</Text>
      </View>

      <View style={styles.streakCard}>
        <Flame
          size={24}
          color={currentStreak > 0 ? THEME_COLORS.semantic.gamifyStreak : THEME_COLORS.light.textMuted}
          fill={currentStreak > 0 ? THEME_COLORS.semantic.gamifyStreak : "transparent"}
        />
        <View style={styles.streakTextCol}>
          <Text style={styles.streakCount}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>DAY STREAK</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  textColumn: {
    flex: 1,
  },
  greeting: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    color: THEME_COLORS.light.textMuted,
  },
  name: {
    ...TYPOGRAPHY.display,
    fontSize: 24,
    lineHeight: 30,
    color: THEME_COLORS.light.textPrimary,
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: getCourseAccentTint(THEME_COLORS.semantic.gamifyStreak, 0.12),
    borderColor: getCourseAccentTint(THEME_COLORS.semantic.gamifyStreak, 0.25),
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS["2xl"],
  },
  streakTextCol: {
    marginLeft: SPACING.sm,
    alignItems: "flex-start",
  },
  streakCount: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    fontSize: 16,
    color: THEME_COLORS.semantic.gamifyStreak,
    lineHeight: 18,
  },
  streakLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: "700",
    color: THEME_COLORS.semantic.gamifyStreak,
    letterSpacing: 0.5,
  },
});
