import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Clock, Calendar, BookOpen, Repeat } from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { EventRepository } from "../../db/repositories/event-repository";
import { CourseRepository } from "../../db/repositories/course-repository";
import { Course } from "../../db/schema/courses";
import { EventType } from "../../db/schema/events";
import { useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { parseDateAndTimeToTimestamp } from "../../domain/scheduling";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function EventCreateScreen() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("class");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]!);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        const db = getDatabase();
        const repo = new CourseRepository(db);
        const active = await repo.listActive();
        setCourses(active);
        if (active.length > 0) {
          setCourseId(active[0]!.id);
        }
      } catch (err) {
        logger.error("EventCreateScreen", "Failed to load courses", err);
      }
    }
    loadCourses();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      addToast("Please enter an event title", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const startMs = parseDateAndTimeToTimestamp(date, startTime);
      const endMs = parseDateAndTimeToTimestamp(date, endTime);

      if (endMs <= startMs) {
        addToast("End time must be after start time", "error");
        setIsSubmitting(false);
        return;
      }

      const db = getDatabase();
      const repo = new EventRepository(db);

      await repo.create({
        title: title.trim(),
        eventType,
        courseId: eventType === "class" ? courseId : null,
        startTime: startMs,
        endTime: endMs,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
      });

      addToast("Event scheduled successfully", "success");
      router.back();
    } catch (err) {
      logger.error("EventCreateScreen", "Failed to create event", err);
      addToast("Failed to create event", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Event Create Error">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={THEME_COLORS.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Event</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
            activeOpacity={0.8}
          >
            <Check size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Event Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Physics Lecture"
              value={title}
              onChangeText={setTitle}
              autoFocus
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

          {/* Associated Course (if class) */}
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
              <Text style={[styles.fieldLabel, { marginLeft: SPACING.xs }]}>Date (YYYY-MM-DD)</Text>
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
                placeholder="10:00"
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
                placeholder="11:30"
              />
            </View>
          </View>

          {/* Recurring Event Toggle */}
          <View style={styles.fieldGroup}>
            <TouchableOpacity
              style={styles.recurrenceToggle}
              onPress={() => setIsRecurring(!isRecurring)}
              activeOpacity={0.7}
            >
              <View style={styles.labelWithIcon}>
                <Repeat size={18} color={isRecurring ? THEME_COLORS.light.textPrimary : THEME_COLORS.light.textMuted} />
                <Text style={[styles.recurrenceLabel, isRecurring && styles.recurrenceLabelActive]}>
                  Recurring Series
                </Text>
              </View>
              <View style={[styles.toggleSwitch, isRecurring && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, isRecurring && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            {isRecurring && (
              <View style={styles.recurrenceDetails}>
                <Text style={styles.fieldLabel}>Recurrence Rule (iCal RRULE)</Text>
                <TextInput
                  style={styles.input}
                  value={recurrenceRule}
                  onChangeText={setRecurrenceRule}
                  placeholder="RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"
                />
              </View>
            )}
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
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.light.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    ...TYPOGRAPHY.caption,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: SPACING.xs,
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
  recurrenceToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
  },
  recurrenceLabel: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    marginLeft: SPACING.sm,
    color: THEME_COLORS.light.textMuted,
  },
  recurrenceLabelActive: {
    color: THEME_COLORS.light.textPrimary,
    fontWeight: "600",
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME_COLORS.light.borderDefault,
    padding: 2,
    justifyContent: "center",
  },
  toggleSwitchActive: {
    backgroundColor: THEME_COLORS.light.textPrimary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  recurrenceDetails: {
    marginTop: SPACING.md,
  },
});
