import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { TYPOGRAPHY, THEME_COLORS } from "../../constants/theme";

interface CustomTextProps extends TextProps {
  color?: string;
  muted?: boolean;
}

export const TextDisplay: React.FC<CustomTextProps> = ({
  style,
  color,
  muted,
  children,
  ...props
}) => {
  const textColor =
    color ?? (muted ? THEME_COLORS.light.textMuted : THEME_COLORS.light.textPrimary);
  return (
    <Text style={[styles.display, { color: textColor }, style]} {...props}>
      {children}
    </Text>
  );
};

export const TextHeading: React.FC<CustomTextProps> = ({
  style,
  color,
  muted,
  children,
  ...props
}) => {
  const textColor =
    color ?? (muted ? THEME_COLORS.light.textMuted : THEME_COLORS.light.textPrimary);
  return (
    <Text style={[styles.heading, { color: textColor }, style]} {...props}>
      {children}
    </Text>
  );
};

export const TextBody: React.FC<CustomTextProps> = ({
  style,
  color,
  muted,
  children,
  ...props
}) => {
  const textColor =
    color ?? (muted ? THEME_COLORS.light.textMuted : THEME_COLORS.light.textPrimary);
  return (
    <Text style={[styles.body, { color: textColor }, style]} {...props}>
      {children}
    </Text>
  );
};

export const TextCaption: React.FC<CustomTextProps> = ({
  style,
  color,
  muted,
  children,
  ...props
}) => {
  const textColor =
    color ?? (muted ? THEME_COLORS.light.textMuted : THEME_COLORS.light.textPrimary);
  return (
    <Text style={[styles.caption, { color: textColor }, style]} {...props}>
      {children}
    </Text>
  );
};

export const TextMono: React.FC<CustomTextProps> = ({
  style,
  color,
  muted,
  children,
  ...props
}) => {
  const textColor =
    color ?? (muted ? THEME_COLORS.light.textMuted : THEME_COLORS.light.textPrimary);
  return (
    <Text style={[styles.mono, { color: textColor }, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  display: {
    ...TYPOGRAPHY.display,
  },
  heading: {
    ...TYPOGRAPHY.heading,
  },
  body: {
    ...TYPOGRAPHY.body,
  },
  caption: {
    ...TYPOGRAPHY.caption,
  },
  mono: {
    ...TYPOGRAPHY.mono,
  },
});
