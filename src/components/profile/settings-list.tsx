import React, { memo } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
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
  const { colors, semantic, isDark } = useTheme();
  const isDarkMode = preferences["themeMode"] === "dark" || (preferences["themeMode"] === "system" ? isDark : isDark);
  const autoStartBreaks = preferences["autoStartBreaks"] === "true";
  const notificationsEnabled = preferences["notificationsEnabled"] !== "false";

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES & DATA</Text>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault },
        ]}
      >
        {/* Dark Mode */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Moon size={18} color={colors.textPrimary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={onToggleTheme}
            trackColor={{
              false: colors.borderDefault,
              true: colors.textPrimary,
            }}
          />
        </View>

        {/* Auto-start Breaks */}
        <View style={[styles.row, styles.rowBorder, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.rowLeft}>
            <Vibrate size={18} color={colors.textPrimary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Auto-start Breaks</Text>
          </View>
          <Switch
            value={autoStartBreaks}
            onValueChange={onToggleAutoStartBreaks}
            trackColor={{
              false: colors.borderDefault,
              true: colors.textPrimary,
            }}
          />
        </View>

        {/* Notifications */}
        <View style={[styles.row, styles.rowBorder, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.rowLeft}>
            <Bell size={18} color={colors.textPrimary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Timer Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={onToggleNotifications}
            trackColor={{
              false: colors.borderDefault,
              true: colors.textPrimary,
            }}
          />
        </View>

        {/* Export Backup */}
        <TouchableOpacity
          style={[styles.row, styles.rowBorder, { borderTopColor: colors.borderSubtle }]}
          onPress={onExportBackup}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Download size={18} color={colors.textPrimary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Export Local Backup</Text>
          </View>
          <Text style={[styles.actionText, { color: colors.textMuted }]}>JSON</Text>
        </TouchableOpacity>

        {/* Import Backup */}
        <TouchableOpacity
          style={[styles.row, styles.rowBorder, { borderTopColor: colors.borderSubtle }]}
          onPress={onImportBackup}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Upload size={18} color={colors.textPrimary} />
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Import Backup</Text>
          </View>
          <Text style={[styles.actionText, { color: colors.textMuted }]}>Restore</Text>
        </TouchableOpacity>

        {/* Security badge */}
        <View style={[styles.row, styles.rowBorder, styles.securityRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.rowLeft}>
            <Shield size={16} color={semantic.stateSuccess} />
            <Text style={[styles.securityText, { color: semantic.stateSuccess }]}>Database encryption ready</Text>
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
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  card: {
    borderRadius: BORDER_RADIUS["2xl"],
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
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabel: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: SPACING.md,
  },
  actionText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
  },
  securityRow: {
    paddingVertical: SPACING.sm + 2,
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: SPACING.sm,
  },
});
