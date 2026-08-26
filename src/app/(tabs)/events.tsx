import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Plus } from "lucide-react-native";
import { useTaskStore } from "../../stores/task-store";
import { useUIStore } from "../../stores/ui-store";
import { Event, EventType } from "../../db/schema/events";
import { Course } from "../../db/schema/courses";
import { Task } from "../../db/schema/tasks";
import { DateSelector } from "../../components/task/date-selector";
import { TimelineSchedule } from "../../components/event/timeline-schedule";
import { EventModal } from "../../components/event/event-modal";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { EventRepository } from "../../db/repositories/event-repository";
import { CourseRepository } from "../../db/repositories/course-repository";
import { TaskRepository } from "../../db/repositories/task-repository";
import { getDatabase } from "../../db/client";
import { buildDailySchedule, parseDateAndTimeToTimestamp, DailySchedule } from "../../domain/scheduling";
import { useRouter } from "expo-router";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function EventsScreen() {
  const router = useRouter();
  const selectedDate = useTaskStore((s) => s.selectedDate);
  const setSelectedDate = useTaskStore((s) => s.setSelectedDate);
  const addToast = useUIStore((s) => s.addToast);
  const { colors } = useTheme();

  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const db = getDatabase();
      const eventRepo = new EventRepository(db);
      const courseRepo = new CourseRepository(db);
      const taskRepo = new TaskRepository(db);

      const dayStartMs = parseDateAndTimeToTimestamp(selectedDate, "00:00");
      const dayEndMs = parseDateAndTimeToTimestamp(selectedDate, "23:59");

      const [loadedEvents, loadedCourses, loadedTasks] = await Promise.all([
        eventRepo.listInRange(dayStartMs, dayEndMs),
        courseRepo.listActive(),
        taskRepo.listByDate(selectedDate),
      ]);

      setEvents(loadedEvents);
      setCourses(loadedCourses);
      setTasks(loadedTasks);
    } catch (err) {
      logger.error("EventsScreen", "Failed to load events data", err);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute daily schedule combining events and time-blocked tasks
  const dailySchedule: DailySchedule = useMemo(() => {
    return buildDailySchedule({
      date: selectedDate,
      events,
      tasks,
    });
  }, [selectedDate, events, tasks]);

  const handleCreateEvent = async (input: {
    title: string;
    eventType: EventType;
    courseId?: string | null;
    startTime: number;
    endTime: number;
    isRecurring?: boolean;
  }) => {
    try {
      const db = getDatabase();
      const repo = new EventRepository(db);
      await repo.create(input);
      addToast("Event created", "success");
      loadData();
    } catch (err) {
      logger.error("EventsScreen", "Failed to create event", err);
      addToast("Failed to create event", "error");
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Events View Error">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Schedule & Events</Text>
            <Text style={[styles.headerDate, { color: colors.textMuted }]}>{selectedDate}</Text>
          </View>
          <TouchableOpacity
            style={[styles.headerAddBtn, { backgroundColor: colors.textPrimary }]}
            onPress={() => setIsModalOpen(true)}
            activeOpacity={0.8}
          >
            <Plus size={20} color={colors.bgCanvas} />
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(date)}
        />

        {/* Timeline View */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <TimelineSchedule
            schedule={dailySchedule}
            onScheduleInGap={() => setIsModalOpen(true)}
            onPressItem={(item) => {
              if (item.type === "event") {
                router.push(`/event/${item.id}` as any);
              } else {
                router.push(`/task/${item.id}` as any);
              }
            }}
          />
        </ScrollView>

        {/* Create/Edit Event Modal */}
        <EventModal
          visible={isModalOpen}
          courses={courses}
          selectedDate={selectedDate}
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreateEvent}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  headerDate: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
  },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: SPACING["4xl"],
  },
});
