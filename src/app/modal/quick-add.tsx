import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Sparkles, Plus, Calendar, Clock, Tag } from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { TaskRepository } from "../../db/repositories/task-repository";
import { CourseRepository } from "../../db/repositories/course-repository";
import { Course } from "../../db/schema/courses";
import { parseQuickAdd, draftToCreateTaskInput } from "../../domain/quick-add";
import { useTaskStore } from "../../stores/task-store";
import { useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function QuickAddModalRoute() {
  const router = useRouter();
  const selectedDate = useTaskStore((s) => s.selectedDate);
  const addToast = useUIStore((s) => s.addToast);

  const [rawText, setRawText] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        const db = getDatabase();
        const repo = new CourseRepository(db);
        const active = await repo.listActive();
        setCourses(active);
      } catch (err) {
        logger.error("QuickAddModalRoute", "Failed to load courses", err);
      }
    }
    loadCourses();
  }, []);

  const draft = parseQuickAdd(rawText);

  const handleAdd = async () => {
    if (!draft.title.trim()) {
      addToast("Please enter a task title", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const courseMapByCode = new Map(courses.map((c) => [c.code.toLowerCase(), c.id]));
      const input = draftToCreateTaskInput(draft, (tag) => courseMapByCode.get(tag.toLowerCase()));
      if (!input.dueDate) {
        input.dueDate = selectedDate;
      }

      const db = getDatabase();
      const repo = new TaskRepository(db);
      await repo.create(input);

      addToast("Task created via Quick-Add", "success");
      router.back();
    } catch (err) {
      logger.error("QuickAddModalRoute", "Failed to create task", err);
      addToast("Failed to create task", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Quick Add Error">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={THEME_COLORS.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Add</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.promptBox}>
            <Sparkles size={18} color={THEME_COLORS.semantic.focusAccent} />
            <Text style={styles.promptText}>
              Natural language capture: dates, times, priority (p1/p2/p3), tags (#cs101), pomodoros (~2p).
            </Text>
          </View>

          {/* Natural Language Input */}
          <TextInput
            style={styles.input}
            placeholder="e.g. Finish Math HW tomorrow 4pm p1 #math ~3p"
            placeholderTextColor={THEME_COLORS.light.textMuted}
            value={rawText}
            onChangeText={setRawText}
            autoFocus
            multiline
          />

          {/* Live Preview Chips */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Detected Fields</Text>
            <View style={styles.chipRow}>
              {draft.title ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>Title: {draft.title}</Text>
                </View>
              ) : null}

              {draft.dueDate ? (
                <View style={styles.chip}>
                  <Calendar size={13} color={THEME_COLORS.light.textPrimary} />
                  <Text style={[styles.chipText, { marginLeft: 4 }]}>{draft.dueDate}</Text>
                </View>
              ) : null}

              {draft.timeBlockStart ? (
                <View style={styles.chip}>
                  <Clock size={13} color={THEME_COLORS.light.textPrimary} />
                  <Text style={[styles.chipText, { marginLeft: 4 }]}>{draft.timeBlockStart}</Text>
                </View>
              ) : null}

              {draft.priority ? (
                <View style={[styles.chip, styles.chipPriority]}>
                  <Text style={styles.chipPriorityText}>{draft.priority.toUpperCase()}</Text>
                </View>
              ) : null}

              {draft.courseTag ? (
                <View style={styles.chip}>
                  <Tag size={13} color={THEME_COLORS.light.textPrimary} />
                  <Text style={[styles.chipText, { marginLeft: 4 }]}>#{draft.courseTag}</Text>
                </View>
              ) : null}

              {draft.estimatedPomodoros ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>~{draft.estimatedPomodoros} pomodoros</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            onPress={handleAdd}
            disabled={!draft.title.trim() || isSubmitting}
            style={[styles.submitBtn, !draft.title.trim() && styles.btnDisabled]}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>Add Task</Text>
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
  promptBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${THEME_COLORS.semantic.focusAccent}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: `${THEME_COLORS.semantic.focusAccent}20`,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  promptText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: THEME_COLORS.light.textPrimary,
    flex: 1,
  },
  input: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    height: 100,
    textAlignVertical: "top",
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.lg,
  },
  previewContainer: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    marginBottom: SPACING.xl,
  },
  previewTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: THEME_COLORS.light.textMuted,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    fontSize: 11,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.light.bgCanvas,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: THEME_COLORS.light.textPrimary,
  },
  chipPriority: {
    backgroundColor: `${THEME_COLORS.semantic.priorityHigh}15`,
    borderColor: THEME_COLORS.semantic.priorityHigh,
  },
  chipPriorityText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: "700",
    color: THEME_COLORS.semantic.priorityHigh,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME_COLORS.light.textPrimary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
