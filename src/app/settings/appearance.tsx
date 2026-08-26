import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Sun, Moon, Smartphone } from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { PreferenceRepository } from "../../db/repositories/preference-repository";
import { useUIStore } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

type ThemeOption = "light" | "dark" | "system";

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const setThemePreference = useUIStore((s) => s.setThemePreference);
  const { colors, isDark } = useTheme();

  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>("system");

  useEffect(() => {
    async function loadTheme() {
      try {
        const db = getDatabase();
        const repo = new PreferenceRepository(db);
        const saved = await repo.get("themeMode");
        if (saved === "dark" || saved === "system" || saved === "light") {
          setSelectedTheme(saved as ThemeOption);
          setThemePreference(saved as ThemeOption);
        }
      } catch (err) {
        logger.error("AppearanceSettings", "Failed to load theme preference", err);
      }
    }
    loadTheme();
  }, [setThemePreference]);

  const handleSelectTheme = async (theme: ThemeOption) => {
    try {
      setSelectedTheme(theme);
      setThemePreference(theme);
      const db = getDatabase();
      const repo = new PreferenceRepository(db);
      await repo.set("themeMode", theme);
      addToast(`Theme set to ${theme}`, "info");
    } catch (err) {
      logger.error("AppearanceSettings", "Failed to save theme preference", err);
      addToast("Failed to save preference", "error");
    }
  };

  const options: { id: ThemeOption; label: string; desc: string; icon: any }[] = [
    {
      id: "light",
      label: "Light Theme",
      desc: "Off-white canvas with high contrast dark typography and crisp borders",
      icon: Sun,
    },
    {
      id: "dark",
      label: "Dark Theme",
      desc: "Near-black canvas with elevated dark gray cards and low glare accents",
      icon: Moon,
    },
    {
      id: "system",
      label: "Follow System",
      desc: "Automatically adapt based on OS dark mode configuration",
      icon: Smartphone,
    },
  ];

  return (
    <ErrorBoundary fallbackTitle="Appearance Settings Error">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderDefault }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Appearance</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Theme Mode</Text>
          <View style={[styles.cardGroup, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            {options.map((opt) => {
              const isSelected = selectedTheme === opt.id;
              const Icon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionRow,
                    { borderBottomColor: colors.borderDefault },
                    isSelected && { backgroundColor: `${colors.textPrimary}10` },
                  ]}
                  onPress={() => handleSelectTheme(opt.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: colors.bgSurfaceElevated }]}>
                    <Icon size={20} color={colors.textPrimary} />
                  </View>
                  <View style={styles.textBox}>
                    <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                    <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: colors.textPrimary }]}>
                      <Check size={16} color={colors.bgCanvas} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.philosophyBox, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <Text style={[styles.philosophyTitle, { color: colors.textPrimary }]}>Monochrome Shell Rule</Text>
            <Text style={[styles.philosophyText, { color: colors.textMuted }]}>
              Numo strictly maintains a neutral monochrome surface. Color is reserved exclusively for priority levels, event categories, and ~10% course background tints.
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
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  cardGroup: {
    borderRadius: BORDER_RADIUS["2xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  textBox: {
    flex: 1,
  },
  optionLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  optionDesc: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
    fontSize: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  philosophyBox: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    marginTop: SPACING.xl,
  },
  philosophyTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  philosophyText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    lineHeight: 18,
  },
});
