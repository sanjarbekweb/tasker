import React, { memo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from "react-native";
import { Haptics } from "../../utils/haptics";
import { Check, Clock, ListChecks } from "lucide-react-native";
import { Task } from "../../db/schema/tasks";
import { Course } from "../../db/schema/courses";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING, getCourseAccentTint } from "../../constants/theme";
import { PriorityBadge, CoursePill } from "../ui/badge";

export interface TaskRowProps {
  task: Task;
  course?: Course | null;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  onToggleComplete: (task: Task) => void;
  onPress?: (task: Task) => void;
  onLongPress?: (task: Task) => void;
  style?: ViewStyle;
}

export const TaskRow = memo(function TaskRow({
  task,
  course,
  subtaskCount = 0,
  completedSubtaskCount = 0,
  onToggleComplete,
  onPress,
  onLongPress,
  style,
}: TaskRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!task.isCompleted) {
      // Task completion animation: scale -> spring -> fade
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onToggleComplete(task);
      });
    } else {
      onToggleComplete(task);
    }
  };

  const isCompleted = task.isCompleted;
  const courseAccentColor = course?.color ?? THEME_COLORS.semantic.eventClass;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.contentRow}
        activeOpacity={0.7}
        onPress={() => onPress?.(task)}
        onLongPress={() => onLongPress?.(task)}
      >
        {/* Checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
          onPress={handleToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.8}
        >
          {isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Title and Metadata */}
        <View style={styles.detailsContainer}>
          <Text
            style={[
              styles.title,
              isCompleted && styles.titleCompleted,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {/* Chips & Badges */}
          <View style={styles.metaRow}>
            {course && (
              <CoursePill
                courseCode={course.code}
                courseColor={courseAccentColor}
                size="sm"
                style={styles.metaPill}
              />
            )}

            {task.priority !== "p4" && (
              <PriorityBadge priority={task.priority} size="sm" style={styles.metaPill} />
            )}

            {task.estimatedPomodoros && task.estimatedPomodoros > 0 ? (
              <View style={styles.pomodoroBadge}>
                <Clock size={11} color={THEME_COLORS.light.textMuted} />
                <Text style={styles.pomodoroText}>
                  {task.completedPomodoros}/{task.estimatedPomodoros}
                </Text>
              </View>
            ) : null}

            {subtaskCount > 0 && (
              <View style={styles.pomodoroBadge}>
                <ListChecks size={11} color={THEME_COLORS.light.textMuted} />
                <Text style={styles.pomodoroText}>
                  {completedSubtaskCount}/{subtaskCount}
                </Text>
              </View>
            )}

            {task.timeBlockStart && (
              <Text style={styles.timeText}>{task.timeBlockStart}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.lg,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: THEME_COLORS.light.borderDefault,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: THEME_COLORS.semantic.stateSuccess,
    borderColor: THEME_COLORS.semantic.stateSuccess,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: "500",
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.xs,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: THEME_COLORS.light.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
  },
  metaPill: {
    marginRight: SPACING.xs + 2,
    marginVertical: 2,
  },
  pomodoroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.light.borderSubtle,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs + 2,
    marginVertical: 2,
  },
  pomodoroText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: THEME_COLORS.light.textMuted,
    marginLeft: 3,
  },
  timeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: THEME_COLORS.light.textMuted,
    marginVertical: 2,
  },
});
