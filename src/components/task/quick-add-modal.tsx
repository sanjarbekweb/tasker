import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { parseQuickAdd } from "../../domain/quick-add";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { PriorityBadge, CoursePill } from "../ui/badge";
import { Calendar, Clock, Tag } from "lucide-react-native";
import { Course } from "../../db/schema/courses";

export interface QuickAddModalProps {
  visible: boolean;
  courses?: Course[];
  onClose: () => void;
  onSubmit: (rawInput: string) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  visible,
  courses = [],
  onClose,
  onSubmit,
}) => {
  const [inputText, setInputText] = useState("");

  const draft = useMemo(() => {
    if (!inputText.trim()) return null;
    return parseQuickAdd(inputText);
  }, [inputText]);

  const matchedCourse = useMemo(() => {
    if (!draft?.courseTag) return null;
    const tag = draft.courseTag.toLowerCase();
    return (
      courses.find(
        (c) =>
          c.code.toLowerCase() === tag ||
          c.name.toLowerCase().includes(tag)
      ) ?? null
    );
  }, [draft?.courseTag, courses]);

  const handleSave = () => {
    if (!inputText.trim()) return;
    onSubmit(inputText);
    setInputText("");
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Quick Add Task</Text>
        <Text style={styles.subtitle}>
          e.g. &quot;Finish CS101 assignment tomorrow at 5pm p1 [2 pomodoros]&quot;
        </Text>

        <TextInput
          style={styles.input}
          placeholder="What needs to be done?"
          placeholderTextColor={THEME_COLORS.light.textMuted}
          value={inputText}
          onChangeText={setInputText}
          autoFocus={visible}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        {/* Live Parsed Token Chips Preview */}
        {draft && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Parsed:</Text>
            <View style={styles.chipsRow}>
              {draft.dueDate && (
                <View style={styles.chip}>
                  <Calendar size={12} color={THEME_COLORS.light.textMuted} />
                  <Text style={styles.chipText}>{draft.dueDate}</Text>
                </View>
              )}

              {draft.timeBlockStart && (
                <View style={styles.chip}>
                  <Clock size={12} color={THEME_COLORS.light.textMuted} />
                  <Text style={styles.chipText}>{draft.timeBlockStart}</Text>
                </View>
              )}

              {draft.priority && draft.priority !== "p4" && (
                <PriorityBadge priority={draft.priority} size="sm" style={styles.chip} />
              )}

              {draft.courseTag && (
                <CoursePill
                  courseCode={matchedCourse?.code ?? draft.courseTag}
                  courseColor={matchedCourse?.color}
                  size="sm"
                  style={styles.chip}
                />
              )}

              {draft.estimatedPomodoros && (
                <View style={styles.chip}>
                  <Tag size={12} color={THEME_COLORS.light.textMuted} />
                  <Text style={styles.chipText}>
                    {draft.estimatedPomodoros} pomodoro{draft.estimatedPomodoros > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.actionsRow}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={onClose}
            style={styles.actionBtn}
          />
          <Button
            title="Add Task"
            variant="primary"
            disabled={!inputText.trim()}
            onPress={handleSave}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.heading,
    color: THEME_COLORS.light.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
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
  previewContainer: {
    marginBottom: SPACING.lg,
  },
  previewLabel: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME_COLORS.light.borderSubtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.xs + 2,
    marginBottom: SPACING.xs,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: THEME_COLORS.light.textPrimary,
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  actionBtn: {
    marginLeft: SPACING.sm,
  },
});
