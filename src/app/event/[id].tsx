import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  Repeat,
} from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { EventRepository } from "../../db/repositories/event-repository";
import { CourseRepository } from "../../db/repositories/course-repository";
import { Event, EventType } from "../../db/schema/events";
import { Course } from "../../db/schema/courses";
import { useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { parseDateAndTimeToTimestamp } from "../../domain/scheduling";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function EventDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const eventId = params.id;
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [event, setEvent] = useState<Event | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("class");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadEventData = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const db = getDatabase();
      const eventRepo = new EventRepository(db);
      const courseRepo = new CourseRepository(db);

      const [loadedEvent, activeCourses] = await Promise.all([
        eventRepo.findById(eventId),
        courseRepo.listActive(),
      ]);

      if (loadedEvent) {
        setEvent(loadedEvent);
        setTitle(loadedEvent.title);
        setEventType(loadedEvent.eventType);
        setCourseId(loadedEvent.courseId);
        setIsRecurring(loadedEvent.isRecurring);
        setRecurrenceRule(loadedEvent.recurrenceRule || "");

        const startObj = new Date(loadedEvent.startTime);
        const endObj = new Date(loadedEvent.endTime);
        setDate(startObj.toISOString().split("T")[0]!);
        setStartTime(
          `${String(startObj.getHours()).padStart(2, "0")}:${String(startObj.getMinutes()).padStart(2, "0")}`
        );
        setEndTime(
          `${String(endObj.getHours()).padStart(2, "0")}:${String(endObj.getMinutes()).padStart(2, "0")}`
        );
      }
      setCourses(activeCourses);
    } catch (err) {
      logger.error("EventDetailScreen", "Failed to load event details", err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const handleSave = async () => {
    if (!eventId || !title.trim()) return;
    try {
      const startMs = parseDateAndTimeToTimestamp(date, startTime);
      const endMs = parseDateAndTimeToTimestamp(date, endTime);

      if (endMs <= startMs) {
        addToast("End time must be after start time", "error");
        return;
      }

      const db = getDatabase();
      const eventRepo = new EventRepository(db);

      await eventRepo.update(eventId, {
        title: title.trim(),
        eventType,
        courseId: eventType === "class" ? courseId : null,
        startTime: startMs,
        endTime: endMs,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : null,
      });

      addToast("Event updated", "success");
      router.back();
    } catch (err) {
      logger.error("EventDetailScreen", "Failed to update event", err);
      addToast("Failed to save changes", "error");
    }
  };

  const handleDeleteOccurrence = async () => {
    if (!eventId) return;
    try {
      const db = getDatabase();
      const eventRepo = new EventRepository(db);
      await eventRepo.delete(eventId);
      addToast("Event deleted", "info");
      router.back();
    } catch (err) {
      logger.error("EventDetailScreen", "Failed to delete event", err);
      addToast("Failed to delete event", "error");
    }
  };

  const handleDeleteSeries = async () => {
    if (!event?.seriesId) return;
    try {
      const db = getDatabase();
      const eventRepo = new EventRepository(db);
      await eventRepo.deleteSeries(event.seriesId);
      addToast("Entire event series deleted", "info");
      router.back();
    } catch (err) {
      logger.error("EventDetailScreen", "Failed to delete series", err);
      addToast("Failed to delete series", "error");
    }
  };

  if (isLoading || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Event Detail Error">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={THEME_COLORS.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Event</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleDeleteOccurrence} style={styles.iconBtn} activeOpacity={0.7}>
              <Trash2 size={20} color={THEME_COLORS.semantic.priorityHigh} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
              <Check size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Event Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Event Title"
            />
          </View>

          {/* Event Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Event Category</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typePill, eventType === "class" && styles.typePillClassActive]}
                onPress={() => setEventType("class")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typePillText,
                    eventType === "class" && styles.typePillTextActive,
                  ]}
                >
                  Class / Academic
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typePill, eventType === "study" && styles.typePillPersonalActive]}
                onPress={() => setEventType("study")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typePillText,
                    eventType === "study" && styles.typePillTextActive,
                  ]}
                >
                  Personal / Study
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Associated Course */}
          {eventType === "class" && courses.length > 0 && (
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithIcon}>
                <BookOpen size={16} color={THEME_COLORS.light.textMuted} />
                <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs }]}>Course</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {courses.map((course) => {
                  const isSelected = courseId === course.id;
                  return (
                    <TouchableOpacity
                      key={course.id}
                      style={[
                        styles.coursePill,
                        { borderColor: course.color },
                        isSelected && { backgroundColor: `${course.color}20` },
                      ]}
                      onPress={() => setCourseId(course.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.courseDot, { backgroundColor: course.color }]} />
                      <Text
                        style={[
                          styles.coursePillText,
                          isSelected && { color: THEME_COLORS.light.textPrimary, fontWeight: "600" },
                        ]}
                      >
                        {course.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Date */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelWithIcon}>
              <Calendar size={16} color={THEME_COLORS.light.textMuted} />
              <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs }]}>Date</Text>
            </View>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Start and End Times */}
          <View style={styles.timeRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <View style={styles.labelWithIcon}>
                <Clock size={16} color={THEME_COLORS.light.textMuted} />
                <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs }]}>Start (HH:MM)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <View style={styles.labelWithIcon}>
                <Clock size={16} color={THEME_COLORS.light.textMuted} />
                <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs }]}>End (HH:MM)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>

          {/* Recurrence & Series Deletion */}
          {event.seriesId && (
            <View style={styles.seriesBox}>
              <View style={styles.labelWithIcon}>
                <Repeat size={16} color={THEME_COLORS.light.textPrimary} />
                <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs, marginBottom: 0 }]}>
                  Series: {event.seriesId}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDeleteSeries}
                style={styles.deleteSeriesBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteSeriesText}>Delete Entire Series</Text>
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  saveBtn: {
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
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: THEME_COLORS.light.textPrimary,
  },
  typeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  typePill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
  },
  typePillClassActive: {
    borderColor: THEME_COLORS.semantic.eventClass,
    backgroundColor: `${THEME_COLORS.semantic.eventClass}15`,
  },
  typePillPersonalActive: {
    borderColor: THEME_COLORS.semantic.eventPersonal,
    backgroundColor: `${THEME_COLORS.semantic.eventPersonal}15`,
  },
  typePillText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
  },
  typePillTextActive: {
    color: THEME_COLORS.light.textPrimary,
    fontWeight: "600",
  },
  coursePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    marginRight: SPACING.sm,
  },
  courseDot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
  },
  coursePillText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textPrimary,
  },
  timeRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  seriesBox: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    marginTop: SPACING.sm,
  },
  deleteSeriesBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    backgroundColor: `${THEME_COLORS.semantic.priorityHigh}15`,
    borderRadius: BORDER_RADIUS.lg,
  },
  deleteSeriesText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.semantic.priorityHigh,
    fontWeight: "600",
  },
});
