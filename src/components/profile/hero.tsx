import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { Flame } from "lucide-react-native";

export interface HeroProps {
  name?: string;
  currentStreak: number;
}

export const Hero = memo(function Hero({
  name = "Student",
  currentStreak = 0,
}: HeroProps) {
  const { colors, semantic, getCourseAccentTint } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textColumn}>
        <Text style={[styles.greeting, { color: colors.textMuted }]}>Welcome back,</Text>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
      </View>

      <View
        style={[
          styles.streakCard,
          {
            backgroundColor: getCourseAccentTint(semantic.gamifyStreak, 0.12),
            borderColor: getCourseAccentTint(semantic.gamifyStreak, 0.25),
          },
        ]}
      >
        <Flame
          size={24}
          color={currentStreak > 0 ? semantic.gamifyStreak : colors.textMuted}
          fill={currentStreak > 0 ? semantic.gamifyStreak : "transparent"}
        />
        <View style={styles.streakTextCol}>
          <Text style={[styles.streakCount, { color: semantic.gamifyStreak }]}>{currentStreak}</Text>
          <Text style={[styles.streakLabel, { color: semantic.gamifyStreak }]}>DAY STREAK</Text>
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
  },
  name: {
    ...TYPOGRAPHY.display,
    fontSize: 24,
    lineHeight: 30,
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
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
    lineHeight: 18,
  },
  streakLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
