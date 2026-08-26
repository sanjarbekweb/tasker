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
import { ArrowLeft, Check, Clock, Calendar, BookOpen } from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { TaskRepository } from "../../db/repositories/task-repository";
import { CourseRepository } from "../../db/repositories/course-repository";
import { Course } from "../../db/schema/courses";
import { PriorityLevel } from "../../db/schema/tasks";
import { useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function TaskCreateScreen() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const { colors, semantic } = useTheme();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("p2");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]!);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [estimatedPomodoros, setEstimatedPomodoros] = useState<number>(1);
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
        logger.error("TaskCreateScreen", "Failed to load courses", err);
      }
    }
    loadCourses();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      addToast("Please enter a task title", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const db = getDatabase();
      const repo = new TaskRepository(db);

      await repo.create({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate,
        courseId: courseId ?? undefined,
        estimatedPomodoros,
      });

      addToast("Task created successfully", "success");
      router.back();
    } catch (err) {
      logger.error("TaskCreateScreen", "Failed to create task", err);
      addToast("Failed to create task", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Task Create Error">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderDefault }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Task</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            style={[
              styles.saveBtn,
              { backgroundColor: colors.textPrimary },
              !title.trim() && styles.saveBtnDisabled,
            ]}
            activeOpacity={0.8}
          >
            <Check size={18} color={colors.bgCanvas} />
            <Text style={[styles.saveBtnText, { color: colors.bgCanvas }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Title input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Task Title</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgSurfaceCard,
                  borderColor: colors.borderDefault,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="e.g. Read Physics Chapter 4"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          {/* Description input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Description (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.bgSurfaceCard,
                  borderColor: colors.borderDefault,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Add notes, links, or instructions..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Priority Selection */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Priority</Text>
            <View style={styles.priorityRow}>
              {(["p1", "p2", "p3"] as PriorityLevel[]).map((p) => {
                const isSelected = priority === p;
                const color =
                  p === "p1"
                    ? semantic.priorityHigh
                    : p === "p2"
                    ? semantic.priorityMedium
                    : semantic.priorityLow;

                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityPill,
                      {
                        backgroundColor: colors.bgSurfaceCard,
                        borderColor: colors.borderDefault,
                      },
                      isSelected && { borderColor: color, backgroundColor: `${color}20` },
                    ]}
                    onPress={() => setPriority(p)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: color }]} />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: colors.textMuted },
                        isSelected && { color: colors.textPrimary, fontWeight: "600" },
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Course Association */}
          {courses.length > 0 && (
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithIcon}>
                <BookOpen size={16} color={colors.textMuted} />
                <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs, color: colors.textPrimary }]}>Course</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll}>
                <TouchableOpacity
                  style={[
                    styles.coursePill,
                    {
                      backgroundColor: courseId === null ? colors.textPrimary : colors.bgSurfaceCard,
                      borderColor: courseId === null ? colors.textPrimary : colors.borderDefault,
                    },
                  ]}
                  onPress={() => setCourseId(null)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.coursePillText,
                      { color: courseId === null ? colors.bgCanvas : colors.textPrimary },
                      courseId === null && { fontWeight: "600" },
                    ]}
                  >
                    None
                  </Text>
                </TouchableOpacity>

                {courses.map((course) => {
                  const isSelected = courseId === course.id;
                  return (
                    <TouchableOpacity
                      key={course.id}
                      style={[
                        styles.coursePill,
                        {
                          backgroundColor: isSelected ? `${course.color}20` : colors.bgSurfaceCard,
                          borderColor: course.color,
                        },
                      ]}
                      onPress={() => setCourseId(course.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.courseDot, { backgroundColor: course.color }]} />
                      <Text
                        style={[
                          styles.coursePillText,
                          { color: colors.textPrimary },
                          isSelected && { fontWeight: "600" },
                        ]}
                      >
                        {course.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Due Date */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelWithIcon}>
              <Calendar size={16} color={colors.textMuted} />
              <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs, color: colors.textPrimary }]}>Due Date (YYYY-MM-DD)</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgSurfaceCard,
                  borderColor: colors.borderDefault,
                  color: colors.textPrimary,
                },
              ]}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Estimated Pomodoros */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelWithIcon}>
              <Clock size={16} color={colors.textMuted} />
              <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs, color: colors.textPrimary }]}>
                Estimated Pomodoros (25m sessions)
              </Text>
            </View>
            <View style={styles.pomodoroStepper}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.pomodoroBtn,
                    {
                      backgroundColor: estimatedPomodoros === num ? colors.textPrimary : colors.bgSurfaceCard,
                      borderColor: estimatedPomodoros === num ? colors.textPrimary : colors.borderDefault,
                    },
                  ]}
                  onPress={() => setEstimatedPomodoros(num)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pomodoroBtnText,
                      { color: estimatedPomodoros === num ? colors.bgCanvas : colors.textPrimary },
                      estimatedPomodoros === num && { fontWeight: "600" },
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.light.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    ...TYPOGRAPHY.caption,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING["4xl"],
  },
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: THEME_COLORS.light.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  priorityRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  priorityPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
  },
  priorityText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
  },
  courseScroll: {
    flexDirection: "row",
  },
  coursePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    marginRight: SPACING.sm,
  },
  coursePillActive: {
    backgroundColor: THEME_COLORS.light.textPrimary,
    borderColor: THEME_COLORS.light.textPrimary,
  },
  courseDot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
  },
  coursePillText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textPrimary,
  },
  coursePillTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  pomodoroStepper: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  pomodoroBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
  },
  pomodoroBtnActive: {
    backgroundColor: THEME_COLORS.light.textPrimary,
    borderColor: THEME_COLORS.light.textPrimary,
  },
  pomodoroBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
  },
  pomodoroBtnTextActive: {
    color: "#FFFFFF",
  },
});
