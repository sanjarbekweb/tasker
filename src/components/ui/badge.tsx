import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import {
  THEME_COLORS,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SPACING,
  getCourseAccentTint,
} from "../../constants/theme";

export type PriorityLevel = "p1" | "p2" | "p3" | "p4";

export interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: "sm" | "md";
  style?: ViewStyle;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = "md", style }) => {
  const getPriorityColor = () => {
    switch (priority) {
      case "p1":
        return THEME_COLORS.semantic.priorityHigh;
      case "p2":
        return THEME_COLORS.semantic.priorityMedium;
      case "p3":
        return THEME_COLORS.semantic.priorityLow;
      case "p4":
      default:
        return THEME_COLORS.semantic.priorityNone;
    }
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case "p1":
        return "P1";
      case "p2":
        return "P2";
      case "p3":
        return "P3";
      case "p4":
      default:
        return "P4";
    }
  };

  const color = getPriorityColor();
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.pillBase,
        {
          backgroundColor: getCourseAccentTint(color, 0.15),
          borderColor: getCourseAccentTint(color, 0.3),
        },
        isSm ? styles.pillSm : styles.pillMd,
        style,
      ]}
    >
      <Text style={[styles.pillText, { color }, isSm && styles.pillTextSm]}>
        {getPriorityLabel()}
      </Text>
    </View>
  );
};

export interface CoursePillProps {
  courseCode: string;
  courseColor?: string;
  size?: "sm" | "md";
  style?: ViewStyle;
}

export const CoursePill: React.FC<CoursePillProps> = ({
  courseCode,
  courseColor = THEME_COLORS.semantic.eventClass,
  size = "md",
  style,
}) => {
  const isSm = size === "sm";
  return (
    <View
      style={[
        styles.pillBase,
        {
          backgroundColor: getCourseAccentTint(courseColor, 0.12),
          borderColor: getCourseAccentTint(courseColor, 0.25),
        },
        isSm ? styles.pillSm : styles.pillMd,
        style,
      ]}
    >
      <Text style={[styles.pillText, { color: courseColor }, isSm && styles.pillTextSm]}>
        {courseCode}
      </Text>
    </View>
  );
};

export interface TagProps {
  label: string;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  color = THEME_COLORS.light.textMuted,
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.tagBase, style]}>
      <Text style={[styles.tagText, { color }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pillBase: {
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillMd: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  pillSm: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
  },
  pillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
  },
  pillTextSm: {
    fontSize: 10,
  },
  tagBase: {
    backgroundColor: THEME_COLORS.light.borderSubtle,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
});
