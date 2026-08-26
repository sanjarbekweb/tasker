import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FocusMode } from "../../domain/focus";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { Haptics } from "../../utils/haptics";

export interface ModeSelectorProps {
  mode: FocusMode;
  disabled?: boolean;
  onSelectMode: (mode: FocusMode) => void;
}

const MODES: { id: FocusMode; label: string }[] = [
  { id: "work", label: "Pomodoro" },
  { id: "short_break", label: "Short Break" },
  { id: "long_break", label: "Long Break" },
];

export const ModeSelector = memo(function ModeSelector({
  mode,
  disabled = false,
  onSelectMode,
}: ModeSelectorProps) {
  const { colors } = useTheme();

  const handleSelect = (m: FocusMode) => {
    if (disabled) return;
    Haptics.selectionAsync();
    onSelectMode(m);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSurfaceElevated }]}>
      {MODES.map((m) => {
        const isSelected = m.id === mode;
        return (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.modeBtn,
              isSelected && [styles.modeBtnSelected, { backgroundColor: colors.bgSurfaceCard }],
              disabled && styles.modeBtnDisabled,
            ]}
            onPress={() => handleSelect(m.id)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modeText,
                { color: isSelected ? colors.textPrimary : colors.textMuted },
                isSelected && styles.modeTextSelected,
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.xl,
    padding: 3,
    marginHorizontal: SPACING.xl,
    marginVertical: SPACING.md,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.lg,
  },
  modeBtnSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeBtnDisabled: {
    opacity: 0.5,
  },
  modeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
  },
  modeTextSelected: {
    fontWeight: "700",
  },
});
