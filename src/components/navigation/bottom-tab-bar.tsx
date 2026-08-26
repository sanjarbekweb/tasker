import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AppTab, useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { CheckSquare, Calendar, Target, User, Plus } from "lucide-react-native";
import { Haptics } from "../../utils/haptics";

export interface BottomTabBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onQuickAddPress?: () => void;
}

const TABS: { id: AppTab; label: string; icon: typeof CheckSquare }[] = [
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "events", label: "Events", icon: Calendar },
  { id: "focus", label: "Focus", icon: Target },
  { id: "profile", label: "Profile", icon: User },
];

export const BottomTabBar = memo(function BottomTabBar({
  activeTab,
  onSelectTab,
  onQuickAddPress,
}: BottomTabBarProps) {
  const handleTabPress = (tab: AppTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectTab(tab);
  };

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onQuickAddPress?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isSelected = tab.id === activeTab;
          const IconComp = tab.icon;
          const isFocus = tab.id === "focus";

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <IconComp
                size={20}
                color={
                  isSelected
                    ? isFocus
                      ? THEME_COLORS.semantic.focusAccent
                      : THEME_COLORS.light.textPrimary
                    : THEME_COLORS.light.textMuted
                }
                strokeWidth={isSelected ? 2.5 : 2}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isSelected && styles.tabLabelSelected,
                  isSelected && isFocus && { color: THEME_COLORS.semantic.focusAccent },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.light.borderDefault,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs + 2,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  tabLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: "600",
    color: THEME_COLORS.light.textMuted,
    marginTop: 2,
  },
  tabLabelSelected: {
    color: THEME_COLORS.light.textPrimary,
    fontWeight: "700",
  },
});
