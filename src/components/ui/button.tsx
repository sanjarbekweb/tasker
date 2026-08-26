import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from "react-native";
import { Haptics } from "../../utils/haptics";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  onPress?: (event: GestureResponderEvent) => void;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  enableHaptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  children,
  style,
  textStyle,
  enableHaptic = true,
}) => {
  const handlePress = (e: GestureResponderEvent) => {
    if (disabled || loading) return;
    if (enableHaptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = { ...styles.base };

    // Size
    if (size === "sm") {
      base = { ...base, paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.sm, borderRadius: BORDER_RADIUS.lg };
    } else if (size === "lg") {
      base = { ...base, paddingVertical: SPACING.lg, paddingHorizontal: SPACING["2xl"], borderRadius: BORDER_RADIUS["2xl"] };
    } else {
      base = { ...base, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.xl };
    }

    // Variant
    switch (variant) {
      case "primary":
        base.backgroundColor = THEME_COLORS.light.textPrimary;
        break;
      case "secondary":
        base.backgroundColor = THEME_COLORS.light.borderSubtle;
        break;
      case "outline":
        base.backgroundColor = "transparent";
        base.borderWidth = 1;
        base.borderColor = THEME_COLORS.light.borderDefault;
        break;
      case "destructive":
        base.backgroundColor = THEME_COLORS.semantic.stateError;
        break;
      case "ghost":
        base.backgroundColor = "transparent";
        break;
    }

    if (disabled) {
      base.opacity = 0.45;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let baseText: TextStyle = { ...styles.baseText };

    if (size === "sm") {
      baseText = { ...baseText, ...TYPOGRAPHY.caption, fontWeight: "600" };
    } else if (size === "lg") {
      baseText = { ...baseText, ...TYPOGRAPHY.heading, fontSize: 18 };
    } else {
      baseText = { ...baseText, ...TYPOGRAPHY.body, fontWeight: "600" };
    }

    switch (variant) {
      case "primary":
      case "destructive":
        baseText.color = THEME_COLORS.dark.textPrimary;
        break;
      case "secondary":
      case "outline":
      case "ghost":
        baseText.color = THEME_COLORS.light.textPrimary;
        break;
    }

    return baseText;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "destructive" ? "#FFFFFF" : THEME_COLORS.light.textPrimary}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          {title ? (
            <Text style={[getTextStyle(), icon ? { marginLeft: SPACING.sm } : null, textStyle]}>
              {title}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  baseText: {
    textAlign: "center",
  },
});
