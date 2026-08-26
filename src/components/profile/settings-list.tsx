import React, { memo } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { Moon, Bell, Vibrate, Download, Upload, Shield } from "lucide-react-native";

export interface SettingsListProps {
  preferences: Record<string, string>;
  onToggleTheme?: (isDark: boolean) => void;
  onToggleAutoStartBreaks?: (enabled: boolean) => void;
  onToggleNotifications?: (enabled: boolean) => void;
  onExportBackup?: () => void;
  onImportBackup?: () => void;
}

export const SettingsList = memo(function SettingsList({
  preferences,
  onToggleTheme,
  onToggleAutoStartBreaks,
  onToggleNotifications,
  onExportBackup,
  onImportBackup,
}: SettingsListProps) {
  const isDarkMode = preferences["themeMode"] === "dark";
  const autoStartBreaks = preferences["autoStartBreaks"] === "true";
  const notificationsEnabled = preferences["notificationsEnabled"] !== "false";

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PREFERENCES & DATA</Text>

      <View style={styles.card}>
        {/* Dark Mode */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Moon size={18} color={THEME_COLORS.light.textPrimary} />
            <Text style={styles.rowLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={onToggleTheme}
            trackColor={{
              false: THEME_COLORS.light.borderDefault,
              true: THEME_COLORS.light.textPrimary,
            }}
          />
        </View>

        {/* Auto-start Breaks */}
        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowLeft}>
            <Vibrate size={18} color={THEME_COLORS.light.textPrimary} />
            <Text style={styles.rowLabel}>Auto-start Breaks</Text>
          </View>
          <Switch
            value={autoStartBreaks}
            onValueChange={onToggleAutoStartBreaks}
            trackColor={{
              false: THEME_COLORS.light.borderDefault,
              true: THEME_COLORS.light.textPrimary,
            }}
          />
        </View>

        {/* Notifications */}
        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowLeft}>
            <Bell size={18} color={THEME_COLORS.light.textPrimary} />
            <Text style={styles.rowLabel}>Timer Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={onToggleNotifications}
            trackColor={{
              false: THEME_COLORS.light.borderDefault,
              true: THEME_COLORS.light.textPrimary,
            }}
          />
        </View>

        {/* Export Backup */}
        <TouchableOpacity
          style={[styles.row, styles.rowBorder]}
          onPress={onExportBackup}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Download size={18} color={THEME_COLORS.light.textPrimary} />
            <Text style={styles.rowLabel}>Export Local Backup</Text>
          </View>
          <Text style={styles.actionText}>JSON</Text>
        </TouchableOpacity>

        {/* Import Backup */}
        <TouchableOpacity
          style={[styles.row, styles.rowBorder]}
          onPress={onImportBackup}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Upload size={18} color={THEME_COLORS.light.textPrimary} />
            <Text style={styles.rowLabel}>Import Backup</Text>
          </View>
          <Text style={styles.actionText}>Restore</Text>
        </TouchableOpacity>

        {/* Security badge */}
        <View style={[styles.row, styles.rowBorder, styles.securityRow]}>
          <View style={styles.rowLeft}>
            <Shield size={16} color={THEME_COLORS.semantic.stateSuccess} />
            <Text style={styles.securityText}>Database encryption ready</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING["4xl"],
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: "700",
    color: THEME_COLORS.light.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.light.borderSubtle,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabel: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: "500",
    color: THEME_COLORS.light.textPrimary,
    marginLeft: SPACING.md,
  },
  actionText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: THEME_COLORS.light.textMuted,
  },
  securityRow: {
    paddingVertical: SPACING.sm + 2,
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: THEME_COLORS.semantic.stateSuccess,
    fontWeight: "600",
    marginLeft: SPACING.sm,
  },
});
