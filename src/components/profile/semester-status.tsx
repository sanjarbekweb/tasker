import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Course } from "../../db/schema/courses";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING, getCourseAccentTint } from "../../constants/theme";
import { CoursePill } from "../ui/badge";

export interface CourseStatItem {
  course: Course;
  totalTasks: number;
  completedTasks: number;
}

export interface SemesterStatusProps {
  courseStats: CourseStatItem[];
}

export const SemesterStatus = memo(function SemesterStatus({
  courseStats,
}: SemesterStatusProps) {
  if (courseStats.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>SEMESTER COURSES</Text>

      <View style={styles.card}>
        {courseStats.map((item, idx) => {
          const percent =
            item.totalTasks > 0
              ? Math.round((item.completedTasks / item.totalTasks) * 100)
              : 0;

          return (
            <View
              key={item.course.id}
              style={[
                styles.courseRow,
                idx > 0 && styles.courseRowBorder,
              ]}
            >
              <View style={styles.courseInfo}>
                <CoursePill
                  courseCode={item.course.code}
                  courseColor={item.course.color}
                  size="sm"
                />
                <Text style={styles.courseName} numberOfLines={1}>
                  {item.course.name}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.taskCount}>
                  {item.completedTasks}/{item.totalTasks}
                </Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${percent}%`,
                        backgroundColor: item.course.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: "700",
    color: THEME_COLORS.light.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
  },
  courseRowBorder: {
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.light.borderSubtle,
  },
  courseInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SPACING.md,
  },
  courseName: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: THEME_COLORS.light.textPrimary,
    marginLeft: SPACING.sm,
    flexShrink: 1,
  },
  progressContainer: {
    alignItems: "flex-end",
    width: 80,
  },
  taskCount: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: THEME_COLORS.light.textMuted,
    marginBottom: 4,
  },
  progressBarBg: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME_COLORS.light.borderSubtle,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
});
