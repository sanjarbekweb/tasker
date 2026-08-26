import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { TaskFilterType } from "../../stores/task-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";

export interface FilterStripProps {
  activeFilter: TaskFilterType;
  onSelectFilter: (filter: TaskFilterType) => void;
}

const FILTERS: { id: TaskFilterType; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All Tasks" },
  { id: "completed", label: "Completed" },
  { id: "p1", label: "P1 Priority" },
  { id: "p2", label: "P2 Priority" },
  { id: "p3", label: "P3 Priority" },
];

export const FilterStrip = memo(function FilterStrip({
  activeFilter,
  onSelectFilter,
}: FilterStripProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((f) => {
          const isSelected = f.id === activeFilter;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterPill,
                isSelected && styles.filterPillSelected,
              ]}
              onPress={() => onSelectFilter(f.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  isSelected && styles.filterTextSelected,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
    backgroundColor: THEME_COLORS.light.bgCanvas,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: THEME_COLORS.light.borderSubtle,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterPillSelected: {
    backgroundColor: THEME_COLORS.light.textPrimary,
    borderColor: THEME_COLORS.light.textPrimary,
  },
  filterText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: "600",
    color: THEME_COLORS.light.textMuted,
  },
  filterTextSelected: {
    color: THEME_COLORS.dark.textPrimary,
  },
});
