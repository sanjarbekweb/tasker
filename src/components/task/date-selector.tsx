import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";

import { useTheme } from "../../hooks/use-theme";

export interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  daysRange?: number; // default +/- 7 days
}

function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DateSelector = memo(function DateSelector({
  selectedDate,
  onSelectDate,
  daysRange = 14,
}: DateSelectorProps) {
  const { colors, semantic } = useTheme();
  const dates: { iso: string; dayNum: number; dayName: string; isToday: boolean }[] = [];
  const todayIso = formatDateToIso(new Date());

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 3); // Start 3 days before today

  for (let i = 0; i < daysRange; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const iso = formatDateToIso(d);
    dates.push({
      iso,
      dayNum: d.getDate(),
      dayName: DAY_NAMES[d.getDay()] ?? "Mon",
      isToday: iso === todayIso,
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((item) => {
          const isSelected = item.iso === selectedDate;
          return (
            <TouchableOpacity
              key={item.iso}
              style={[
                styles.dateButton,
                {
                  backgroundColor: isSelected ? colors.textPrimary : colors.bgSurfaceCard,
                  borderColor: isSelected ? colors.textPrimary : colors.borderDefault,
                },
              ]}
              onPress={() => onSelectDate(item.iso)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: isSelected ? colors.bgCanvas : colors.textMuted },
                  item.isToday && !isSelected && { color: semantic.eventClass, fontWeight: "700" },
                ]}
              >
                {item.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  { color: isSelected ? colors.bgCanvas : colors.textPrimary },
                  item.isToday && !isSelected && { color: semantic.eventClass },
                ]}
              >
                {item.dayNum}
              </Text>
              {item.isToday && (
                <View
                  style={[
                    styles.todayDot,
                    { backgroundColor: isSelected ? colors.bgCanvas : semantic.eventClass },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  dateButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 64,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  dayName: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    marginBottom: 2,
  },
  dayNum: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    fontSize: 16,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
