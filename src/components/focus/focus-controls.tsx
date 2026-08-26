import React, { memo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react-native";
import { FocusStatus } from "../../domain/focus";
import { THEME_COLORS, BORDER_RADIUS, SPACING } from "../../constants/theme";
import * as Haptics from "expo-haptics";

export interface FocusControlsProps {
  status: FocusStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip?: () => void;
}

export const FocusControls = memo(function FocusControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: FocusControlsProps) {
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      if (typeof Haptics.impactAsync === "function") {
        Haptics.impactAsync(style);
      }
    } catch {
      // ignore
    }
  };

  const handleMainAction = () => {
    if (status === "idle" || status === "completed") {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      onStart();
    } else if (status === "running") {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      onPause();
    } else if (status === "paused") {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      onResume();
    }
  };

  const handleReset = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    onReset();
  };

  const handleSkip = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    onSkip?.();
  };

  const isRunning = status === "running";

  return (
    <View style={styles.container}>
      {/* Reset Button */}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={handleReset}
        activeOpacity={0.7}
      >
        <RotateCcw size={20} color={THEME_COLORS.light.textMuted} />
      </TouchableOpacity>

      {/* Main Play / Pause / Resume Button */}
      <TouchableOpacity
        style={[
          styles.mainBtn,
          isRunning && styles.mainBtnRunning,
        ]}
        onPress={handleMainAction}
        activeOpacity={0.8}
      >
        {isRunning ? (
          <Pause size={28} color="#FFFFFF" />
        ) : (
          <Play size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
        )}
      </TouchableOpacity>

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <SkipForward size={20} color={THEME_COLORS.light.textMuted} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SPACING.xl,
  },
  mainBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME_COLORS.light.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mainBtnRunning: {
    backgroundColor: THEME_COLORS.semantic.focusAccent,
  },
  secondaryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME_COLORS.light.borderSubtle,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
});
