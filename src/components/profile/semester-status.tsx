import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Course } from "../../db/schema/courses";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { CoursePill } from "../ui/badge";

export interface CourseStatItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  color: string;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}

export interface SemesterStatusProps {
  courseStats: CourseStatItem[];
}

export const SemesterStatus = memo(function SemesterStatus({
  courseStats,
}: SemesterStatusProps) {
  const { colors } = useTheme();
  if (courseStats.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SEMESTER COURSES</Text>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault },
        ]}
      >
        {courseStats.map((item, idx) => {
          return (
            <View
              key={item.courseId}
              style={[
                styles.courseRow,
                idx > 0 && [styles.courseRowBorder, { borderTopColor: colors.borderSubtle }],
              ]}
            >
              <View style={styles.courseInfo}>
                <CoursePill
                  courseCode={item.courseCode}
                  courseColor={item.color}
                  size="sm"
                />
                <Text style={[styles.courseName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.courseName}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <Text style={[styles.taskCount, { color: colors.textMuted }]}>
                  {item.completedTasks}/{item.totalTasks}
                </Text>
                <View style={[styles.progressBarBg, { backgroundColor: colors.bgSurfaceElevated }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${item.progressPercent}%`,
                        backgroundColor: item.color,
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
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  card: {
    borderRadius: BORDER_RADIUS["2xl"],
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
    marginBottom: 4,
  },
  progressBarBg: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
});
