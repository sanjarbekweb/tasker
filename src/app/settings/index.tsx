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
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";

export default function SettingsOverviewScreen() {
  const router = useRouter();
  const { colors, semantic } = useTheme();

  return (
    <ErrorBoundary fallbackTitle="Settings Error">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderDefault }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section: General */}
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Preferences</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.borderDefault }]}
              onPress={() => router.push("/settings/appearance" as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.bgSurfaceElevated }]}>
                <Moon size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Appearance</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>Theme, monochrome shell, and contrast</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.borderDefault }]}
              onPress={() => router.push("/settings/focus" as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.bgSurfaceElevated }]}>
                <Timer size={20} color={semantic.focusAccent} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Focus Timer</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>Durations, auto-start, and alerts</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => router.push("/courses" as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.bgSurfaceElevated }]}>
                <BookOpen size={20} color={semantic.eventClass} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Course Manager</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>Manage course codes and color accents</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Section: Data & Storage */}
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Data & Privacy</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => router.push("/settings/backup" as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.bgSurfaceElevated }]}>
                <Database size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>Backup & Restore</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>Export and import validated JSON data</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Section: Security Details */}
          <View style={[styles.securityBadge, { backgroundColor: `${semantic.stateSuccess}15` }]}>
            <ShieldCheck size={20} color={semantic.stateSuccess} />
            <Text style={[styles.securityText, { color: colors.textPrimary }]}>
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
    paddingBottom: SPACING["4xl"],
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    letterSpacing: 0.5,
  },
  menuGroup: {
    borderRadius: BORDER_RADIUS["2xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.lg,
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
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    fontSize: 12,
  },
});
