import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { THEME_COLORS, BORDER_RADIUS, SPACING } from "../../constants/theme";

export interface CardProps extends ViewProps {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ style, elevated, children, ...props }) => {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
