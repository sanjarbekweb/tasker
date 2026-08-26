import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AppTab, useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { CheckSquare, Calendar, Target, User } from "lucide-react-native";
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
}: BottomTabBarProps) {
  const { colors, semantic } = useTheme();

  const handleTabPress = (tab: AppTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectTab(tab);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSurfaceCard, borderTopColor: colors.borderDefault }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isSelected = tab.id === activeTab;
          const IconComp = tab.icon;
          const isFocus = tab.id === "focus";

          const activeColor = isFocus ? semantic.focusAccent : colors.textPrimary;
          const inactiveColor = colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <IconComp
                size={20}
                color={isSelected ? activeColor : inactiveColor}
                strokeWidth={isSelected ? 2.5 : 2}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isSelected ? activeColor : inactiveColor },
                  isSelected && styles.tabLabelSelected,
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
    borderTopWidth: 1,
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
    marginTop: 2,
  },
  tabLabelSelected: {
    fontWeight: "700",
  },
});
