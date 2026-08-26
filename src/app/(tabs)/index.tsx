import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Plus } from "lucide-react-native";
import { useTaskStore } from "../../stores/task-store";
import { useUIStore } from "../../stores/ui-store";
import { Task } from "../../db/schema/tasks";
import { Course } from "../../db/schema/courses";
import { TaskRow } from "../../components/task/task-row";
import { TimeGapRow } from "../../components/task/time-gap-row";
import { DateSelector } from "../../components/task/date-selector";
import { FilterStrip } from "../../components/task/filter-strip";
import { QuickAddModal } from "../../components/task/quick-add-modal";
import { RescheduleModal } from "../../components/task/reschedule-modal";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { TaskRepository } from "../../db/repositories/task-repository";
import { CourseRepository } from "../../db/repositories/course-repository";
import { getDatabase } from "../../db/client";
import { draftToCreateTaskInput, parseQuickAdd } from "../../domain/quick-add";
import { useRouter } from "expo-router";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

type ListItem =
  | { type: "task"; data: Task }
  | { type: "gap"; data: { startMinutes: number; endMinutes: number; durationMinutes: number } };

export default function TasksScreen() {
  const router = useRouter();
  const selectedDate = useTaskStore((s) => s.selectedDate);
  const setSelectedDate = useTaskStore((s) => s.setSelectedDate);
  const activeFilter = useTaskStore((s) => s.activeFilter);
  const setActiveFilter = useTaskStore((s) => s.setActiveFilter);
  const optimisticOverrides = useTaskStore((s) => s.optimisticOverrides);
  const setOptimisticOverride = useTaskStore((s) => s.setOptimisticOverride);
  const removeOptimisticOverride = useTaskStore((s) => s.removeOptimisticOverride);

  const isQuickAddOpen = useUIStore((s) => s.isQuickAddModalOpen);
  const openQuickAdd = useUIStore((s) => s.openQuickAddModal);
  const closeQuickAdd = useUIStore((s) => s.closeQuickAddModal);
  const isRescheduleOpen = useUIStore((s) => s.isRescheduleModalOpen);
  const activeModalTaskId = useUIStore((s) => s.activeModalTaskId);
  const openReschedule = useUIStore((s) => s.openRescheduleModal);
  const closeReschedule = useUIStore((s) => s.closeRescheduleModal);
  const addToast = useUIStore((s) => s.addToast);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load courses once
  useEffect(() => {
    async function loadCourses() {
      try {
        const db = getDatabase();
        const repo = new CourseRepository(db);
        const allCourses = await repo.listActive();
        setCourses(allCourses);
      } catch (err) {
        logger.error("TasksScreen", "Failed to load courses", err);
      }
    }
    loadCourses();
  }, []);

  // Load tasks for selected date & filter
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const db = getDatabase();
      const repo = new TaskRepository(db);

      let fetchedTasks: Task[] = [];
      if (activeFilter === "today" || activeFilter === "all") {
        fetchedTasks = await repo.listByDate(selectedDate);
      } else if (activeFilter === "completed") {
        fetchedTasks = (await repo.listByDate(selectedDate)).filter((t) => t.isCompleted);
      } else if (activeFilter === "p1" || activeFilter === "p2" || activeFilter === "p3") {
        fetchedTasks = (await repo.listByDate(selectedDate)).filter(
          (t) => t.priority === activeFilter
        );
      } else {
        fetchedTasks = await repo.listByDate(selectedDate);
      }

      setTasks(fetchedTasks);
    } catch (err) {
      logger.error("TasksScreen", "Failed to fetch tasks", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, activeFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Apply optimistic overrides
  const displayTasks = useMemo(() => {
    return tasks
      .map((t) => {
        const override = optimisticOverrides[t.id];
        if (override === null) return null; // deleted
        if (override) return { ...t, ...override };
        return t;
      })
      .filter((t): t is Task => t !== null);
  }, [tasks, optimisticOverrides]);

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    courses.forEach((c) => map.set(c.id, c));
    return map;
  }, [courses]);

  // Transform display tasks into list items
  const listItems: ListItem[] = useMemo(() => {
    return displayTasks.map((t) => ({ type: "task", data: t }));
  }, [displayTasks]);

  const handleToggleComplete = async (task: Task) => {
    const nextCompleted = !task.isCompleted;
    setOptimisticOverride(task.id, { isCompleted: nextCompleted });

    try {
      const db = getDatabase();
      const repo = new TaskRepository(db);
      if (nextCompleted) {
        await repo.completeTaskAtomic(task.id);
        addToast("Task completed", "success");
      } else {
        await repo.update(task.id, { isCompleted: false, completedAt: null });
      }
      removeOptimisticOverride(task.id);
      loadTasks();
    } catch (err) {
      logger.error("TasksScreen", "Failed to toggle task completion", err);
      removeOptimisticOverride(task.id);
      addToast("Failed to update task", "error");
    }
  };

  const handleQuickAddSubmit = async (rawInput: string) => {
    try {
      const draft = parseQuickAdd(rawInput);
      const courseMapByCode = new Map(courses.map((c) => [c.code.toLowerCase(), c.id]));
      const input = draftToCreateTaskInput(draft, (tag) => courseMapByCode.get(tag.toLowerCase()));
      if (!input.dueDate) {
        input.dueDate = selectedDate;
      }
      const db = getDatabase();
      const repo = new TaskRepository(db);
      await repo.create(input);
      addToast("Task added", "success");
      loadTasks();
    } catch (err) {
      logger.error("TasksScreen", "Failed to add task", err);
      addToast("Failed to create task", "error");
    }
  };

  const handleRescheduleConfirm = async (newDate: string) => {
    if (!activeModalTaskId) return;
    try {
      const db = getDatabase();
      const repo = new TaskRepository(db);
      await repo.update(activeModalTaskId, { dueDate: newDate });
      addToast("Task rescheduled", "success");
      loadTasks();
    } catch (err) {
      logger.error("TasksScreen", "Failed to reschedule task", err);
      addToast("Failed to reschedule", "error");
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "gap") {
        return (
          <TimeGapRow
            startMinutes={item.data.startMinutes}
            endMinutes={item.data.endMinutes}
            durationMinutes={item.data.durationMinutes}
            onScheduleInGap={() => openQuickAdd()}
          />
        );
      }

      const task = item.data;
      const course = task.courseId ? courseMap.get(task.courseId) ?? null : null;

      return (
        <TaskRow
          task={task}
          course={course}
          onToggleComplete={handleToggleComplete}
          onPress={(t) => router.push(`/task/${t.id}` as any)}
          onLongPress={() => openReschedule(task.id)}
        />
      );
    },
    [courseMap, handleToggleComplete, openQuickAdd, openReschedule, router]
  );

  const { colors } = useTheme();

  return (
    <ErrorBoundary fallbackTitle="Tasks View Error">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Tasks</Text>
            <Text style={[styles.headerDate, { color: colors.textMuted }]}>{selectedDate}</Text>
          </View>
          <TouchableOpacity
            style={[styles.headerAddBtn, { backgroundColor: colors.textPrimary }]}
            onPress={openQuickAdd}
            activeOpacity={0.8}
          >
            <Plus size={20} color={colors.bgCanvas} />
          </TouchableOpacity>
        </View>

        {/* Date Strip */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(date)}
        />

        {/* Filter Strip */}
        <FilterStrip
          activeFilter={activeFilter}
          onSelectFilter={(filter) => setActiveFilter(filter)}
        />

        {/* Recycled Task List via FlashList v2 */}
        <View style={styles.listContainer}>
          {listItems.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No tasks for this day</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Tap the + button to quickly add a task.
              </Text>
            </View>
          ) : (
            <FlashList
              data={listItems}
              renderItem={renderItem}
              keyExtractor={(item) =>
                item.type === "task" ? item.data.id : `gap-${item.data.startMinutes}`
              }
              getItemType={(item) => item.type}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        {/* Quick Add Modal */}
        <QuickAddModal
          visible={isQuickAddOpen}
          courses={courses}
          onClose={closeQuickAdd}
          onSubmit={handleQuickAddSubmit}
        />

        {/* Reschedule Modal */}
        <RescheduleModal
          visible={isRescheduleOpen}
          onClose={closeReschedule}
          onReschedule={handleRescheduleConfirm}
        />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.display,
    fontSize: 26,
    color: THEME_COLORS.light.textPrimary,
  },
  headerDate: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: THEME_COLORS.light.textMuted,
  },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: THEME_COLORS.light.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    flex: 1,
    marginTop: SPACING.xs,
  },
  listContent: {
    paddingBottom: SPACING["4xl"],
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING["3xl"],
  },
  emptyTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 16,
    color: THEME_COLORS.light.textPrimary,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
});
