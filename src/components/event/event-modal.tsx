import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { TimeSlider } from "./time-slider";
import { CoursePill } from "../ui/badge";
import { Course } from "../../db/schema/courses";
import { Event, EventType } from "../../db/schema/events";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";

export interface EventModalProps {
  visible: boolean;
  courses?: Course[];
  initialEvent?: Event | null;
  selectedDate?: string;
  onClose: () => void;
  onSave: (input: {
    title: string;
    eventType: EventType;
    courseId?: string | null;
    startTime: number;
    endTime: number;
    isRecurring?: boolean;
  }) => void;
}

function timestampToMinutes(timestamp: number): number {
  const d = new Date(timestamp);
  return d.getHours() * 60 + d.getMinutes();
}

function dateAndMinutesToTimestamp(dateIso: string, minutes: number): number {
  const [year, month, day] = dateIso.split("-").map(Number);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const d = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, h, m, 0, 0);
  return d.getTime();
}

export const EventModal: React.FC<EventModalProps> = ({
  visible,
  courses = [],
  initialEvent,
  selectedDate = new Date().toISOString().split("T")[0]!,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("class");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [startMinutes, setStartMinutes] = useState(9 * 60); // 09:00
  const [endMinutes, setEndMinutes] = useState(10 * 60); // 10:00

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setEventType(initialEvent.eventType);
      setCourseId(initialEvent.courseId ?? null);
      setStartMinutes(timestampToMinutes(initialEvent.startTime));
      setEndMinutes(timestampToMinutes(initialEvent.endTime));
    } else {
      setTitle("");
      setEventType("class");
      setCourseId(courses[0]?.id ?? null);
      setStartMinutes(9 * 60);
      setEndMinutes(10 * 60);
    }
  }, [initialEvent, courses, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    const startMs = dateAndMinutesToTimestamp(selectedDate, startMinutes);
    const endMs = dateAndMinutesToTimestamp(selectedDate, endMinutes);

    onSave({
      title: title.trim(),
      eventType,
      courseId: eventType === "class" ? courseId : null,
      startTime: startMs,
      endTime: endMs,
    });
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Text style={styles.title}>{initialEvent ? "Edit Event" : "Create Event"}</Text>

        <TextInput
          style={styles.input}
          placeholder="Event Title"
          placeholderTextColor={THEME_COLORS.light.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {/* Event Type Selector */}
        <View style={styles.segmentedRow}>
          {(["class", "study", "exam", "custom"] as EventType[]).map((type) => {
            const isSelected = eventType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.segmentBtn,
                  isSelected && styles.segmentBtnSelected,
                ]}
                onPress={() => setEventType(type)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextSelected,
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Course selection if class event */}
        {eventType === "class" && courses.length > 0 && (
          <View style={styles.courseSelectContainer}>
            <Text style={styles.fieldLabel}>Course</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {courses.map((c) => {
                const isSelected = c.id === courseId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCourseId(c.id)}
                    style={[styles.courseOption, isSelected && styles.courseOptionSelected]}
                  >
                    <CoursePill courseCode={c.code} courseColor={c.color} size="sm" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <TimeSlider
          label="Start Time"
          valueMinutes={startMinutes}
          onChangeMinutes={(val) => {
            setStartMinutes(val);
            if (val >= endMinutes) {
              setEndMinutes(val + 30);
            }
          }}
        />

        <TimeSlider
          label="End Time"
          valueMinutes={endMinutes}
          onChangeMinutes={(val) => {
            setEndMinutes(Math.max(startMinutes + 15, val));
          }}
        />

        <View style={styles.actionsRow}>
          <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.actionBtn} />
          <Button
            title="Save Event"
            variant="primary"
            disabled={!title.trim()}
            onPress={handleSave}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.heading,
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: THEME_COLORS.light.borderSubtle,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body,
    color: THEME_COLORS.light.textPrimary,
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    marginBottom: SPACING.md,
  },
  segmentedRow: {
    flexDirection: "row",
    backgroundColor: THEME_COLORS.light.borderSubtle,
    borderRadius: BORDER_RADIUS.xl,
    padding: 3,
    marginBottom: SPACING.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.lg,
  },
  segmentBtnSelected: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
  },
  segmentText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: "700",
    color: THEME_COLORS.light.textMuted,
  },
  segmentTextSelected: {
    color: THEME_COLORS.light.textPrimary,
  },
  courseSelectContainer: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
    marginBottom: SPACING.xs,
  },
  courseOption: {
    marginRight: SPACING.sm,
    opacity: 0.5,
  },
  courseOptionSelected: {
    opacity: 1.0,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  actionBtn: {
    marginLeft: SPACING.sm,
  },
});
