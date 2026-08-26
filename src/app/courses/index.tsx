import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Trash2, BookOpen, Check } from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { CourseRepository } from "../../db/repositories/course-repository";
import { Course } from "../../db/schema/courses";
import { useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

export default function CoursesScreen() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]!);
  const [isLoading, setIsLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = getDatabase();
      const repo = new CourseRepository(db);
      const active = await repo.listActive();
      setCourses(active);
    } catch (err) {
      logger.error("CoursesScreen", "Failed to load courses", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCreateCourse = async () => {
    if (!newCode.trim() || !newName.trim()) {
      addToast("Please provide course code and name", "error");
      return;
    }

    try {
      const db = getDatabase();
      const repo = new CourseRepository(db);
      await repo.create({
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        color: newColor,
      });

      addToast("Course added", "success");
      setNewCode("");
      setNewName("");
      setIsCreating(false);
      loadCourses();
    } catch (err) {
      logger.error("CoursesScreen", "Failed to create course", err);
      addToast("Failed to create course (code may be duplicate)", "error");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const db = getDatabase();
      const repo = new CourseRepository(db);
      await repo.delete(courseId);
      addToast("Course deleted", "info");
      loadCourses();
    } catch (err) {
      logger.error("CoursesScreen", "Failed to delete course", err);
      addToast("Failed to delete course", "error");
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Courses View Error">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={THEME_COLORS.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Management</Text>
          <TouchableOpacity
            onPress={() => setIsCreating(!isCreating)}
            style={styles.addBtn}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Create Course Accordion Form */}
          {isCreating && (
            <View style={styles.createCard}>
              <Text style={styles.createTitle}>Add New Course</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Course Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. CS101"
                  value={newCode}
                  onChangeText={setNewCode}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Course Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Intro to Computer Science"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Accent Color</Text>
                <View style={styles.colorPalette}>
                  {PRESET_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        newColor === c && styles.colorSwatchActive,
                      ]}
                      onPress={() => setNewColor(c)}
                      activeOpacity={0.8}
                    >
                      {newColor === c && <Check size={14} color="#FFFFFF" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.createActions}>
                <TouchableOpacity
                  onPress={() => setIsCreating(false)}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateCourse}
                  style={styles.submitBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>Add Course</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Courses List */}
          <Text style={styles.sectionTitle}>Active Courses ({courses.length})</Text>

          {courses.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <BookOpen size={36} color={THEME_COLORS.light.textMuted} />
              <Text style={styles.emptyTitle}>No courses added yet</Text>
              <Text style={styles.emptySubtitle}>Tap the + button above to create your first course.</Text>
            </View>
          ) : (
            courses.map((course) => (
              <View key={course.id} style={styles.courseItem}>
                <View style={[styles.courseColorIndicator, { backgroundColor: course.color }]} />
                <View style={styles.courseInfo}>
                  <Text style={styles.courseCode}>{course.code}</Text>
                  <Text style={styles.courseName}>{course.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteCourse(course.id)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color={THEME_COLORS.light.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
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
  addBtn: {
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
  createCard: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    marginBottom: SPACING.xl,
  },
  createTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 16,
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.md,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: THEME_COLORS.light.bgCanvas,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: THEME_COLORS.light.textPrimary,
  },
  colorPalette: {
    flexDirection: "row",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: THEME_COLORS.light.textPrimary,
  },
  createActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  cancelBtnText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
  },
  submitBtn: {
    backgroundColor: THEME_COLORS.light.textPrimary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  submitBtnText: {
    ...TYPOGRAPHY.caption,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 15,
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.md,
  },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    marginBottom: SPACING.sm,
  },
  courseColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    ...TYPOGRAPHY.heading,
    fontSize: 15,
    color: THEME_COLORS.light.textPrimary,
  },
  courseName: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: SPACING.xs,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING["3xl"],
  },
  emptyTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 16,
    color: THEME_COLORS.light.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
});
