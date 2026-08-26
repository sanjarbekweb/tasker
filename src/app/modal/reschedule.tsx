import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Check } from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { TaskRepository } from "../../db/repositories/task-repository";
import { useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function RescheduleModalRoute() {
  const params = useLocalSearchParams<{ taskId?: string }>();
  const taskId = params.taskId;
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const formatDate = (d: Date) => d.toISOString().split("T")[0]!;

  const [selectedDate, setSelectedDate] = useState(formatDate(tomorrow));

  const options = [
    { label: "Today", value: formatDate(today) },
    { label: "Tomorrow", value: formatDate(tomorrow) },
    { label: "Next Week", value: formatDate(nextWeek) },
  ];

  const handleConfirm = async () => {
    if (!taskId) {
      addToast("No task specified for rescheduling", "error");
      router.back();
      return;
    }

    try {
      const db = getDatabase();
      const repo = new TaskRepository(db);
      await repo.update(taskId, { dueDate: selectedDate });
      addToast("Task rescheduled successfully", "success");
      router.back();
    } catch (err) {
      logger.error("RescheduleModalRoute", "Failed to reschedule task", err);
      addToast("Failed to reschedule task", "error");
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Reschedule Error">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={THEME_COLORS.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reschedule Task</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Select New Due Date</Text>

          <View style={styles.optionsGroup}>
            {options.map((opt) => {
              const isSelected = selectedDate === opt.value;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.optionRow, isSelected && styles.optionRowActive]}
                  onPress={() => setSelectedDate(opt.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconBox}>
                    <Calendar size={18} color={THEME_COLORS.light.textPrimary} />
                  </View>
                  <View style={styles.textBox}>
                    <Text style={styles.optionLabel}>{opt.label}</Text>
                    <Text style={styles.optionValue}>{opt.value}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            style={styles.confirmBtn}
            activeOpacity={0.8}
          >
            <Check size={18} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>Confirm Reschedule</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.light.bgCanvas,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.light.borderDefault,
  },
  iconBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading,
    color: THEME_COLORS.light.textPrimary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: "600",
    color: THEME_COLORS.light.textMuted,
    textTransform: "uppercase",
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  optionsGroup: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    overflow: "hidden",
    marginBottom: SPACING.xl,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.light.borderDefault,
  },
  optionRowActive: {
    backgroundColor: `${THEME_COLORS.light.textPrimary}05`,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: THEME_COLORS.light.bgCanvas,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  textBox: {
    flex: 1,
  },
  optionLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
  },
  optionValue: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
    marginTop: 2,
    fontSize: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME_COLORS.light.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME_COLORS.light.textPrimary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  confirmBtnText: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
