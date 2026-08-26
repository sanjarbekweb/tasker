import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Timer, Bell, FastForward } from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { PreferenceRepository } from "../../db/repositories/preference-repository";
import { useUIStore } from "../../stores/ui-store";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function FocusSettingsScreen() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const { colors, semantic } = useTheme();

  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const db = getDatabase();
        const repo = new PreferenceRepository(db);
        const [work, shortB, longB, autoB, notifs] = await Promise.all([
          repo.get("workDurationMinutes"),
          repo.get("shortBreakDurationMinutes"),
          repo.get("longBreakDurationMinutes"),
          repo.get("autoStartBreaks"),
          repo.get("notificationsEnabled"),
        ]);

        if (work) setWorkDuration(parseInt(work, 10));
        if (shortB) setShortBreakDuration(parseInt(shortB, 10));
        if (longB) setLongBreakDuration(parseInt(longB, 10));
        if (autoB) setAutoStartBreaks(autoB === "true");
        if (notifs) setNotificationsEnabled(notifs === "true");
      } catch (err) {
        logger.error("FocusSettings", "Failed to load preferences", err);
      }
    }
    loadPreferences();
  }, []);

  const handleUpdatePref = async (key: string, val: string) => {
    try {
      const db = getDatabase();
      const repo = new PreferenceRepository(db);
      await repo.set(key, val);
    } catch (err) {
      logger.error("FocusSettings", `Failed to save ${key}`, err);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Focus Settings Error">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderDefault }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Focus Timer Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Work Duration */}
          <View style={[styles.card, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <View style={styles.cardHeader}>
              <Timer size={18} color={semantic.focusAccent} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Focus Duration</Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Length of a single focus pomodoro session</Text>
            <View style={styles.pillRow}>
              {[15, 20, 25, 30, 45, 50, 60].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.pill,
                    { backgroundColor: colors.bgSurfaceElevated, borderColor: colors.borderDefault },
                    workDuration === mins && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
                  ]}
                  onPress={() => {
                    setWorkDuration(mins);
                    handleUpdatePref("workDurationMinutes", String(mins));
                    addToast(`Focus session set to ${mins}m`, "info");
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: workDuration === mins ? colors.bgCanvas : colors.textPrimary },
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Short Break Duration */}
          <View style={[styles.card, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <View style={styles.cardHeader}>
              <Timer size={18} color={colors.textMuted} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Short Break</Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Rest duration between regular sessions</Text>
            <View style={styles.pillRow}>
              {[3, 5, 8, 10].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.pill,
                    { backgroundColor: colors.bgSurfaceElevated, borderColor: colors.borderDefault },
                    shortBreakDuration === mins && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
                  ]}
                  onPress={() => {
                    setShortBreakDuration(mins);
                    handleUpdatePref("shortBreakDurationMinutes", String(mins));
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: shortBreakDuration === mins ? colors.bgCanvas : colors.textPrimary },
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Long Break Duration */}
          <View style={[styles.card, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <View style={styles.cardHeader}>
              <Timer size={18} color={colors.textMuted} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Long Break</Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Rest duration after 4 completed pomodoros</Text>
            <View style={styles.pillRow}>
              {[10, 15, 20, 30].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.pill,
                    { backgroundColor: colors.bgSurfaceElevated, borderColor: colors.borderDefault },
                    longBreakDuration === mins && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
                  ]}
                  onPress={() => {
                    setLongBreakDuration(mins);
                    handleUpdatePref("longBreakDurationMinutes", String(mins));
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: longBreakDuration === mins ? colors.bgCanvas : colors.textPrimary },
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Toggles */}
          <View style={[styles.card, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <View style={[styles.toggleRow, { borderBottomColor: colors.borderDefault }]}>
              <View style={styles.toggleInfo}>
                <View style={styles.labelWithIcon}>
                  <FastForward size={18} color={colors.textPrimary} />
                  <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Auto-Start Breaks</Text>
                </View>
                <Text style={[styles.toggleSubtitle, { color: colors.textMuted }]}>Automatically start break when focus finishes</Text>
              </View>
              <Switch
                value={autoStartBreaks}
                onValueChange={(val) => {
                  setAutoStartBreaks(val);
                  handleUpdatePref("autoStartBreaks", val ? "true" : "false");
                }}
                trackColor={{ true: colors.textPrimary, false: colors.borderDefault }}
              />
            </View>

            <View style={[styles.toggleRow, { borderBottomWidth: 0, marginTop: SPACING.md }]}>
              <View style={styles.toggleInfo}>
                <View style={styles.labelWithIcon}>
                  <Bell size={18} color={colors.textPrimary} />
                  <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Local Notifications</Text>
                </View>
                <Text style={[styles.toggleSubtitle, { color: colors.textMuted }]}>Alert when timer finishes in the background</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(val) => {
                  setNotificationsEnabled(val);
                  handleUpdatePref("notificationsEnabled", val ? "true" : "false");
                }}
                trackColor={{ true: colors.textPrimary, false: colors.borderDefault }}
              />
            </View>
          </View>
        </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.heading,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS["2xl"],
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: 2,
  },
  cardTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 16,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.md,
    fontSize: 12,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  pillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  toggleTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  toggleSubtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
    fontSize: 12,
  },
});
