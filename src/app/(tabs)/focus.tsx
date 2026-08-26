import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useFocusStore } from "../../stores/focus-store";
import { useUIStore } from "../../stores/ui-store";
import { FocusEngine } from "../../services/focus/focus-engine";
import { FocusStateRepository } from "../../db/repositories/focus-state-repository";
import { TaskRepository } from "../../db/repositories/task-repository";
import { CourseRepository } from "../../db/repositories/course-repository";
import { getDatabase } from "../../db/client";
import { Task } from "../../db/schema/tasks";
import { Course } from "../../db/schema/courses";
import { FocusMode } from "../../domain/focus";
import { Timer } from "../../components/focus/timer";
import { ModeSelector } from "../../components/focus/mode-selector";
import { TaskContext } from "../../components/focus/task-context";
import { FocusControls } from "../../components/focus/focus-controls";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function FocusScreen() {
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const mode = useFocusStore((s) => s.mode);
  const status = useFocusStore((s) => s.status);
  const remainingSeconds = useFocusStore((s) => s.remainingSeconds);
  const progress = useFocusStore((s) => s.progress);
  const setMode = useFocusStore((s) => s.setMode);
  const addToast = useUIStore((s) => s.addToast);
  const { colors } = useTheme();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const engine = useMemo(() => {
    const db = getDatabase();
    const repo = new FocusStateRepository(db);
    return new FocusEngine({ focusStateRepository: repo });
  }, []);

  // Initialize engine and persistent state on mount
  useEffect(() => {
    async function initFocus() {
      try {
        await engine.initialize();
      } catch (err) {
        logger.error("FocusScreen", "Failed to initialize FocusEngine", err);
      }
    }
    initFocus();

    return () => {
      engine.destroy();
    };
  }, [engine]);

  // Fetch active task details if activeTaskId changes
  useEffect(() => {
    async function fetchTask() {
      if (!activeTaskId) {
        setActiveTask(null);
        setActiveCourse(null);
        return;
      }
      try {
        const db = getDatabase();
        const taskRepo = new TaskRepository(db);
        const courseRepo = new CourseRepository(db);
        const task = await taskRepo.findById(activeTaskId);
        setActiveTask(task);
        if (task?.courseId) {
          const course = await courseRepo.findById(task.courseId);
          setActiveCourse(course);
        } else {
          setActiveCourse(null);
        }
      } catch (err) {
        logger.error("FocusScreen", "Failed to fetch task context", err);
      }
    }
    fetchTask();
  }, [activeTaskId]);

  const handleStart = async () => {
    try {
      await engine.startSession({ mode, taskId: activeTaskId });
    } catch (err) {
      logger.error("FocusScreen", "Failed to start session", err);
      addToast("Failed to start timer", "error");
    }
  };

  const handlePause = async () => {
    try {
      await engine.pauseSession();
    } catch (err) {
      logger.error("FocusScreen", "Failed to pause session", err);
    }
  };

  const handleResume = async () => {
    try {
      await engine.resumeSession();
    } catch (err) {
      logger.error("FocusScreen", "Failed to resume session", err);
    }
  };

  const handleReset = async () => {
    try {
      await engine.cancelSession();
      addToast("Timer reset", "info");
    } catch (err) {
      logger.error("FocusScreen", "Failed to reset timer", err);
    }
  };

  const handleSkip = async () => {
    try {
      await engine.completeSession();
      addToast("Session completed/skipped", "info");
    } catch (err) {
      logger.error("FocusScreen", "Failed to skip session", err);
    }
  };

  const handleSelectMode = (newMode: FocusMode) => {
    if (status === "running") return;
    setMode(newMode);
  };

  const handleCompleteTask = async (task: Task) => {
    try {
      const db = getDatabase();
      const taskRepo = new TaskRepository(db);
      await taskRepo.completeTaskAtomic(task.id);
      addToast("Task completed!", "success");
      setActiveTask((prev) => (prev ? { ...prev, isCompleted: true } : null));
    } catch (err) {
      logger.error("FocusScreen", "Failed to complete task", err);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Focus View Error">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Focus Engine</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Timestamp-driven deep work timer</Text>
          </View>

          {/* Active Task Context */}
          <TaskContext
            activeTask={activeTask}
            course={activeCourse}
            onCompleteTask={handleCompleteTask}
          />

          {/* Timer Display */}
          <Timer
            remainingSeconds={remainingSeconds}
            progress={progress}
            mode={mode}
            status={status}
          />

          {/* Mode Selector */}
          <ModeSelector
            mode={mode}
            disabled={status === "running"}
            onSelectMode={handleSelectMode}
          />

          {/* Controls */}
          <FocusControls
            status={status}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
            onSkip={handleSkip}
          />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING["4xl"],
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.display,
    fontSize: 26,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
});
