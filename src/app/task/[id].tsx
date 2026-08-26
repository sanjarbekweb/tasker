import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  Trash2,
  Plus,
  Square,
  CheckSquare,
  Calendar,
  BookOpen,
} from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { TaskRepository } from "../../db/repositories/task-repository";
import { SubtaskRepository } from "../../db/repositories/subtask-repository";
import { CourseRepository } from "../../db/repositories/course-repository";
import { Task, PriorityLevel } from "../../db/schema/tasks";
import { Subtask } from "../../db/schema/subtasks";
import { Course } from "../../db/schema/courses";
import { useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function TaskDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const taskId = params.id;
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("p2");
  const [dueDate, setDueDate] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadTaskData = useCallback(async () => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      const db = getDatabase();
      const taskRepo = new TaskRepository(db);
      const subtaskRepo = new SubtaskRepository(db);
      const courseRepo = new CourseRepository(db);

      const [loadedTask, loadedSubtasks, activeCourses] = await Promise.all([
        taskRepo.findById(taskId),
        subtaskRepo.listByTaskId(taskId),
        courseRepo.listActive(),
      ]);

      if (loadedTask) {
        setTask(loadedTask);
        setTitle(loadedTask.title);
        setDescription(loadedTask.description || "");
        setPriority(loadedTask.priority);
        setDueDate(loadedTask.dueDate || "");
        setCourseId(loadedTask.courseId);
      }
      setSubtasks(loadedSubtasks);
      setCourses(activeCourses);
    } catch (err) {
      logger.error("TaskDetailScreen", "Failed to load task details", err);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadTaskData();
  }, [loadTaskData]);

  const handleSave = async () => {
    if (!taskId || !title.trim()) return;
    try {
      const db = getDatabase();
      const taskRepo = new TaskRepository(db);
      await taskRepo.update(taskId, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueDate: dueDate.trim() || null,
        courseId: courseId ?? null,
      });
      addToast("Task updated", "success");
      router.back();
    } catch (err) {
      logger.error("TaskDetailScreen", "Failed to update task", err);
      addToast("Failed to save changes", "error");
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    try {
      const db = getDatabase();
      const taskRepo = new TaskRepository(db);
      await taskRepo.delete(taskId);
      addToast("Task deleted", "info");
      router.back();
    } catch (err) {
      logger.error("TaskDetailScreen", "Failed to delete task", err);
      addToast("Failed to delete task", "error");
    }
  };

  const handleAddSubtask = async () => {
    if (!taskId || !newSubtaskTitle.trim()) return;
    try {
      const db = getDatabase();
      const subtaskRepo = new SubtaskRepository(db);
      await subtaskRepo.create({
        taskId,
        title: newSubtaskTitle.trim(),
        orderIndex: subtasks.length,
      });
      setNewSubtaskTitle("");
      const updated = await subtaskRepo.listByTaskId(taskId);
      setSubtasks(updated);
    } catch (err) {
      logger.error("TaskDetailScreen", "Failed to add subtask", err);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      const db = getDatabase();
      const subtaskRepo = new SubtaskRepository(db);
      await subtaskRepo.toggleComplete(subtask.id, !subtask.isCompleted);
      const updated = await subtaskRepo.listByTaskId(taskId);
      setSubtasks(updated);
    } catch (err) {
      logger.error("TaskDetailScreen", "Failed to toggle subtask", err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const db = getDatabase();
      const subtaskRepo = new SubtaskRepository(db);
      await subtaskRepo.delete(subtaskId);
      const updated = await subtaskRepo.listByTaskId(taskId);
      setSubtasks(updated);
    } catch (err) {
      logger.error("TaskDetailScreen", "Failed to delete subtask", err);
    }
  };

  if (isLoading || !task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Task Detail Error">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={THEME_COLORS.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Task</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn} activeOpacity={0.7}>
              <Trash2 size={20} color={THEME_COLORS.semantic.priorityHigh} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
              <Check size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Task Title"
            />
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              multiline
            />
          </View>

          {/* Priority */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(["p1", "p2", "p3"] as PriorityLevel[]).map((p) => {
                const isSelected = priority === p;
                const color =
                  p === "p1"
                    ? THEME_COLORS.semantic.priorityHigh
                    : p === "p2"
                    ? THEME_COLORS.semantic.priorityMedium
                    : THEME_COLORS.semantic.priorityLow;

                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityPill,
                      isSelected && { borderColor: color, backgroundColor: `${color}15` },
                    ]}
                    onPress={() => setPriority(p)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: color }]} />
                    <Text
                      style={[
                        styles.priorityText,
                        isSelected && { color: THEME_COLORS.light.textPrimary, fontWeight: "600" },
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
                <BookOpen size={16} color={THEME_COLORS.light.textMuted} />
                <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs }]}>Course</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.coursePill, courseId === null && styles.coursePillActive]}
                  onPress={() => setCourseId(null)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.coursePillText,
                      courseId === null && styles.coursePillTextActive,
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
                        { borderColor: course.color },
                        isSelected && { backgroundColor: `${course.color}20` },
                      ]}
                      onPress={() => setCourseId(course.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.courseDot, { backgroundColor: course.color }]} />
                      <Text
                        style={[
                          styles.coursePillText,
                          isSelected && { color: THEME_COLORS.light.textPrimary, fontWeight: "600" },
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
              <Calendar size={16} color={THEME_COLORS.light.textMuted} />
              <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs }]}>Due Date</Text>
            </View>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Subtasks Section */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Subtasks ({subtasks.filter((s) => s.isCompleted).length}/{subtasks.length})</Text>
            
            {subtasks.map((st) => (
              <View key={st.id} style={styles.subtaskRow}>
                <TouchableOpacity
                  onPress={() => handleToggleSubtask(st)}
                  style={styles.subtaskCheck}
                  activeOpacity={0.7}
                >
                  {st.isCompleted ? (
                    <CheckSquare size={18} color={THEME_COLORS.semantic.stateSuccess} />
                  ) : (
                    <Square size={18} color={THEME_COLORS.light.textMuted} />
                  )}
                </TouchableOpacity>
                <Text
                  style={[
                    styles.subtaskTitle,
                    st.isCompleted && styles.subtaskCompleted,
                  ]}
                >
                  {st.title}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteSubtask(st.id)}
                  style={styles.subtaskDelete}
                  activeOpacity={0.7}
                >
                  <Trash2 size={15} color={THEME_COLORS.light.textMuted} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add subtask input */}
            <View style={styles.addSubtaskRow}>
              <TextInput
                style={[styles.input, styles.subtaskInput]}
                value={newSubtaskTitle}
                onChangeText={setNewSubtaskTitle}
                placeholder="Add subtask..."
                onSubmitEditing={handleAddSubtask}
              />
              <TouchableOpacity
                onPress={handleAddSubtask}
                style={styles.addSubtaskBtn}
                activeOpacity={0.8}
              >
                <Plus size={18} color="#FFFFFF" />
              </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: THEME_COLORS.light.textPrimary,
    alignItems: "center",
    justifyContent: "center",
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
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.light.borderDefault,
  },
  subtaskCheck: {
    marginRight: SPACING.sm,
  },
  subtaskTitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    flex: 1,
    color: THEME_COLORS.light.textPrimary,
  },
  subtaskCompleted: {
    textDecorationLine: "line-through",
    color: THEME_COLORS.light.textMuted,
  },
  subtaskDelete: {
    padding: SPACING.xs,
  },
  addSubtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  subtaskInput: {
    flex: 1,
  },
  addSubtaskBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: THEME_COLORS.light.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
});
