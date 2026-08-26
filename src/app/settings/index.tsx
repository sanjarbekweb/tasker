import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Moon,
  Timer,
  Database,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from "lucide-react-native";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";

export default function SettingsOverviewScreen() {
  const router = useRouter();

  return (
    <ErrorBoundary fallbackTitle="Settings Error">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={THEME_COLORS.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section: General */}
          <Text style={styles.sectionHeader}>Preferences</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/settings/appearance" as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Moon size={20} color={THEME_COLORS.light.textPrimary} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Appearance</Text>
                <Text style={styles.menuSubtitle}>Theme, monochrome shell, and contrast</Text>
              </View>
              <ChevronRight size={18} color={THEME_COLORS.light.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/settings/focus" as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Timer size={20} color={THEME_COLORS.semantic.focusAccent} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Focus Timer</Text>
                <Text style={styles.menuSubtitle}>Durations, auto-start, and alerts</Text>
              </View>
              <ChevronRight size={18} color={THEME_COLORS.light.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/courses" as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <BookOpen size={20} color={THEME_COLORS.semantic.eventClass} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Course Manager</Text>
                <Text style={styles.menuSubtitle}>Manage course codes and color accents</Text>
              </View>
              <ChevronRight size={18} color={THEME_COLORS.light.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Section: Data & Storage */}
          <Text style={styles.sectionHeader}>Data & Privacy</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/settings/backup" as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Database size={20} color={THEME_COLORS.light.textPrimary} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Backup & Restore</Text>
                <Text style={styles.menuSubtitle}>Export and import validated JSON data</Text>
              </View>
              <ChevronRight size={18} color={THEME_COLORS.light.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Section: Security Details */}
          <View style={styles.securityBadge}>
            <ShieldCheck size={20} color={THEME_COLORS.semantic.stateSuccess} />
            <Text style={styles.securityText}>
              Numo is 100% offline-first. Your data is stored locally in encrypted SQLite and isolated with SecureStore.
            </Text>
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING["4xl"],
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: "600",
    color: THEME_COLORS.light.textMuted,
    textTransform: "uppercase",
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    letterSpacing: 0.5,
  },
  menuGroup: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderWidth: 1,
    borderColor: THEME_COLORS.light.borderDefault,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.light.borderDefault,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: THEME_COLORS.light.bgCanvas,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: THEME_COLORS.light.textPrimary,
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textMuted,
    marginTop: 2,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${THEME_COLORS.semantic.stateSuccess}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    color: THEME_COLORS.light.textPrimary,
    flex: 1,
    fontSize: 12,
  },
});
