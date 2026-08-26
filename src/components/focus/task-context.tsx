import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Task } from "../../db/schema/tasks";
import { Course } from "../../db/schema/courses";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
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
  const { colors, semantic } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault },
      ]}
      onPress={onSelectTask}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.bgSurfaceElevated }]}>
        <Target size={18} color={semantic.focusAccent} />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.headerLabel, { color: colors.textMuted }]}>ACTIVE TASK</Text>
        {activeTask ? (
          <View style={styles.taskInfoRow}>
            <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={1}>
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
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Tap to select a task to focus on</Text>
        )}
      </View>

      {activeTask && onCompleteTask ? (
        <TouchableOpacity
          onPress={() => onCompleteTask(activeTask)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.checkBtn}
        >
          <CheckCircle2 size={20} color={semantic.stateSuccess} />
        </TouchableOpacity>
      ) : (
        <ChevronRight size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS["2xl"],
    borderWidth: 1,
    padding: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.xl,
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
    flexShrink: 1,
  },
  placeholderText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    marginTop: 2,
  },
  checkBtn: {
    padding: SPACING.xs,
  },
});
