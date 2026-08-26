import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Task } from "../../db/schema/tasks";
import { Course } from "../../db/schema/courses";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { CoursePill } from "../ui/badge";
import { Target, CheckCircle2, ChevronRight } from "lucide-react-native";

export interface TaskContextProps {
  activeTask: Task | null;
  course?: Course | null;
  onSelectTask?: () => void;
  onCompleteTask?: (task: Task) => void;
}

export const TaskContext = memo(function TaskContext({
  activeTask,
  course,
  onSelectTask,
  onCompleteTask,
}: TaskContextProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onSelectTask}
      activeOpacity={0.7}
    >
      <View style={styles.iconBox}>
        <Target size={18} color={THEME_COLORS.semantic.focusAccent} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.headerLabel}>ACTIVE TASK</Text>
        {activeTask ? (
          <View style={styles.taskInfoRow}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {activeTask.title}
            </Text>
            {course && (
              <CoursePill
                courseCode={course.code}
                courseColor={course.color}
                size="sm"
                style={{ marginLeft: SPACING.xs }}
              />
            )}
          </View>
        ) : (
          <Text style={styles.placeholderText}>Tap to select a task to focus on</Text>
        )}
      </View>

      {activeTask && onCompleteTask ? (
        <TouchableOpacity
          onPress={() => onCompleteTask(activeTask)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.checkBtn}
        >
          <CheckCircle2 size={20} color={THEME_COLORS.semantic.stateSuccess} />
        </TouchableOpacity>
      ) : (
        <ChevronRight size={18} color={THEME_COLORS.light.textMuted} />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    padding: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: THEME_COLORS.light.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  headerLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: "700",
    color: THEME_COLORS.light.textMuted,
    letterSpacing: 0.8,
  },
  taskInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  taskTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
    flexShrink: 1,
  },
  placeholderText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: THEME_COLORS.light.textMuted,
    marginTop: 2,
  },
  checkBtn: {
    padding: SPACING.xs,
  },
});
