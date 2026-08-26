import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { Calendar, Sun, ArrowRight } from "lucide-react-native";

export interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onReschedule: (newDate: string) => void;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  visible,
  onClose,
  onReschedule,
}) => {
  const { colors } = useTheme();
  const [selectedOption, setSelectedOption] = useState<string>("today");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const options = [
    { id: "today", label: "Today", date: formatDate(today), icon: Sun },
    { id: "tomorrow", label: "Tomorrow", date: formatDate(tomorrow), icon: ArrowRight },
    { id: "nextWeek", label: "Next Week", date: formatDate(nextWeek), icon: Calendar },
  ];

  const handleConfirm = () => {
    const opt = options.find((o) => o.id === selectedOption) ?? options[0];
    onReschedule(opt!.date);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Reschedule Task</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Choose when you want to work on this task</Text>

        <View style={styles.optionsList}>
          {options.map((opt) => {
            const isSelected = opt.id === selectedOption;
            const IconComp = opt.icon;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected ? colors.bgSurfaceElevated : colors.bgSurfaceCard,
                    borderColor: isSelected ? colors.textPrimary : colors.borderDefault,
                  },
                ]}
                onPress={() => setSelectedOption(opt.id)}
                activeOpacity={0.7}
              >
                <IconComp
                  size={18}
                  color={isSelected ? colors.textPrimary : colors.textMuted}
                />
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colors.textPrimary },
                      isSelected && { fontWeight: "700" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionDate, { color: colors.textMuted }]}>{opt.date}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actionsRow}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={onClose}
            style={styles.actionBtn}
          />
          <Button
            title="Reschedule"
            variant="primary"
            onPress={handleConfirm}
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
    marginBottom: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.lg,
  },
  optionsList: {
    marginBottom: SPACING.lg,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  optionTextContainer: {
    marginLeft: SPACING.md,
  },
  optionLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  optionDate: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  actionBtn: {
    marginLeft: SPACING.sm,
  },
});
