import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";

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
    <View style={styles.container}>
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
                isSelected && styles.dateButtonSelected,
              ]}
              onPress={() => onSelectDate(item.iso)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayNameSelected,
                  item.isToday && !isSelected && styles.dayNameToday,
                ]}
              >
                {item.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  isSelected && styles.dayNumSelected,
                  item.isToday && !isSelected && styles.dayNumToday,
                ]}
              >
                {item.dayNum}
              </Text>
              {item.isToday && <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />}
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
    backgroundColor: THEME_COLORS.light.bgCanvas,
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
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    marginRight: SPACING.sm,
  },
  dateButtonSelected: {
    backgroundColor: THEME_COLORS.light.textPrimary,
    borderColor: THEME_COLORS.light.textPrimary,
  },
  dayName: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: THEME_COLORS.light.textMuted,
    marginBottom: 2,
  },
  dayNameSelected: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  dayNameToday: {
    color: THEME_COLORS.semantic.eventClass,
    fontWeight: "700",
  },
  dayNum: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    fontSize: 16,
    color: THEME_COLORS.light.textPrimary,
  },
  dayNumSelected: {
    color: "#FFFFFF",
  },
  dayNumToday: {
    color: THEME_COLORS.semantic.eventClass,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME_COLORS.semantic.eventClass,
    marginTop: 2,
  },
  todayDotSelected: {
    backgroundColor: "#FFFFFF",
  },
});
