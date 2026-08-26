import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { useUIStore } from "../../stores/ui-store";
import { getDatabase } from "../../db/client";
import { TaskRepository } from "../../db/repositories/task-repository";
import { CourseRepository } from "../../db/repositories/course-repository";
import { FocusSessionRepository } from "../../db/repositories/focus-session-repository";
import { PreferenceRepository } from "../../db/repositories/preference-repository";
import { calculateLiveStreak, calculateHistoricalLongestStreak } from "../../domain/statistics";
import { exportBackup, importBackup } from "../../services/backup";
import { Hero } from "../../components/profile/hero";
import { MetricsGrid } from "../../components/profile/metrics-grid";
import { SemesterStatus, CourseStatItem } from "../../components/profile/semester-status";
import { DailyGoalCard } from "../../components/profile/daily-goal-card";
import { SettingsList } from "../../components/profile/settings-list";
import { Task } from "../../db/schema/tasks";
import { Course } from "../../db/schema/courses";
import { FocusSession } from "../../db/schema/focus-sessions";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { useRouter } from "expo-router";
import { Settings } from "lucide-react-native";
import { logger } from "../../utils/logger";

export default function ProfileScreen() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [totalTasksCount, setTotalTasksCount] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [todayFocusPomodoros, setTodayFocusPomodoros] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [courseStats, setCourseStats] = useState<CourseStatItem[]>([]);

  const loadProfileData = useCallback(async () => {
    try {
      const db = getDatabase();
      const taskRepo = new TaskRepository(db);
      const courseRepo = new CourseRepository(db);
      const sessionRepo = new FocusSessionRepository(db);
      const prefRepo = new PreferenceRepository(db);

      const [allPrefs, allTasks, allCourses, allSessions] = await Promise.all([
        prefRepo.getAll(),
        taskRepo.listActive(),
        courseRepo.listActive(),
        sessionRepo.listAll(),
      ]);

      setPreferences(allPrefs);

      // Task aggregates
      const completed = allTasks.filter((t: Task) => t.isCompleted);
      setCompletedTasksCount(completed.length);
      setTotalTasksCount(allTasks.length);

      // Focus aggregates
      const workSessions = allSessions.filter((s: FocusSession) => s.sessionType === "work");
      const focusMins = workSessions.reduce((acc: number, s: FocusSession) => acc + s.durationMinutes, 0);
      setTotalFocusMinutes(focusMins);

      // Today Pomodoros
      const todayIso = new Date().toISOString().split("T")[0]!;
      const todaySessions = workSessions.filter(
        (s: FocusSession) => new Date(s.startedAt).toISOString().split("T")[0] === todayIso
      );
      setTodayFocusPomodoros(todaySessions.length);

      // Live streaks
      const completionDates = Array.from(
        new Set(
          completed
            .filter((t: Task) => t.completedAt !== null)
            .map((t: Task) => new Date(t.completedAt!).toISOString().split("T")[0]!)
        )
      );

      const liveStreak = calculateLiveStreak(completionDates, todayIso);
      const maxStreak = calculateHistoricalLongestStreak(completionDates);
      setCurrentStreak(liveStreak);
      setLongestStreak(maxStreak);

      // Course breakdown
      const stats: CourseStatItem[] = allCourses.map((course: Course) => {
        const courseTasks = allTasks.filter((t: Task) => t.courseId === course.id);
        const courseCompleted = courseTasks.filter((t: Task) => t.isCompleted);
        return {
          course,
          totalTasks: courseTasks.length,
          completedTasks: courseCompleted.length,
        };
      });
      setCourseStats(stats);
    } catch (err) {
      logger.error("ProfileScreen", "Failed to load profile data", err);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleToggleTheme = async (isDark: boolean) => {
    try {
      const db = getDatabase();
      const prefRepo = new PreferenceRepository(db);
      await prefRepo.set("themeMode", isDark ? "dark" : "light");
      setPreferences((prev) => ({ ...prev, themeMode: isDark ? "dark" : "light" }));
      addToast(`Theme switched to ${isDark ? "Dark" : "Light"}`, "info");
    } catch (err) {
      logger.error("ProfileScreen", "Failed to update theme", err);
    }
  };

  const handleToggleAutoStart = async (enabled: boolean) => {
    try {
      const db = getDatabase();
      const prefRepo = new PreferenceRepository(db);
      await prefRepo.set("autoStartBreaks", enabled ? "true" : "false");
      setPreferences((prev) => ({ ...prev, autoStartBreaks: enabled ? "true" : "false" }));
    } catch (err) {
      logger.error("ProfileScreen", "Failed to update auto start breaks", err);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      const db = getDatabase();
      const prefRepo = new PreferenceRepository(db);
      await prefRepo.set("notificationsEnabled", enabled ? "true" : "false");
      setPreferences((prev) => ({ ...prev, notificationsEnabled: enabled ? "true" : "false" }));
    } catch (err) {
      logger.error("ProfileScreen", "Failed to update notification prefs", err);
    }
  };

  const handleExportBackup = async () => {
    try {
      const db = getDatabase();
      const backupJson = await exportBackup(db);
      addToast("Backup export generated successfully", "success");
      logger.info("ProfileScreen", "Exported backup length: " + backupJson.length);
    } catch (err) {
      logger.error("ProfileScreen", "Export backup failed", err);
      addToast("Backup export failed", "error");
    }
  };

  const handleImportBackup = async () => {
    addToast("Select a valid Numo backup JSON to restore", "info");
  };

  const completionRate =
    totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  return (
    <ErrorBoundary fallbackTitle="Profile View Error">
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero with live streak */}
          <Hero name="Student" currentStreak={currentStreak} />

          {/* Metrics Grid */}
          <MetricsGrid
            completedTasks={completedTasksCount}
            totalFocusMinutes={totalFocusMinutes}
            longestStreak={longestStreak}
            completionRatePercent={completionRate}
          />

          {/* Daily Goal Card */}
          <DailyGoalCard completedPomodoros={todayFocusPomodoros} dailyGoalPomodoros={8} />

          {/* Semester Course Status */}
          <SemesterStatus courseStats={courseStats} />

          {/* Preferences & Backup Settings */}
          <SettingsList
            preferences={preferences}
            onToggleTheme={handleToggleTheme}
            onToggleAutoStartBreaks={handleToggleAutoStart}
            onToggleNotifications={handleToggleNotifications}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />

          <View style={styles.moreSettingsContainer}>
            <TouchableOpacity
              style={styles.moreSettingsBtn}
              onPress={() => router.push("/settings" as any)}
              activeOpacity={0.8}
            >
              <Settings size={18} color="#FFFFFF" />
              <Text style={styles.moreSettingsText}>Advanced Settings & Data</Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: SPACING["4xl"],
  },
  moreSettingsContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: -SPACING.xl,
    marginBottom: SPACING.xl,
  },
  moreSettingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME_COLORS.light.textPrimary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  moreSettingsText: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
