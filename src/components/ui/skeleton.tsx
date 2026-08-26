import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { THEME_COLORS, BORDER_RADIUS } from "../../constants/theme";

export interface SkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height,
  borderRadius = BORDER_RADIUS.lg,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: THEME_COLORS.light.borderDefault,
  },
});
