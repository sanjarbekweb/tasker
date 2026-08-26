import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
} from "lucide-react-native";
import { getDatabase } from "../../db/client";
import { exportBackup, importBackup } from "../../services/backup";
import { SecurityService } from "../../services/security";
import { useUIStore } from "../../stores/ui-store";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { ErrorBoundary } from "../../components/ui/error-boundary";
import { logger } from "../../utils/logger";

export default function BackupSettingsScreen() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const { colors, semantic } = useTheme();

  const [backupJson, setBackupJson] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [keyStatus, setKeyStatus] = useState<string>("Checking SecureStore...");

  useEffect(() => {
    async function checkKey() {
      try {
        const key = await SecurityService.getOrCreateDatabaseKey();
        if (key && key.length === 64) {
          setKeyStatus("256-bit AES Key Isolated in SecureStore");
        } else {
          setKeyStatus("Key initialized");
        }
      } catch (err) {
        setKeyStatus("SecureStore unavailable in current environment");
      }
    }
    checkKey();
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const db = getDatabase();
      const json = await exportBackup(db);
      setBackupJson(json);
      addToast("Backup snapshot generated", "success");
      logger.info("BackupSettings", "Exported backup snapshot");
    } catch (err) {
      logger.error("BackupSettings", "Export failed", err);
      addToast("Failed to export backup", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!backupJson.trim()) {
      addToast("Please paste valid JSON backup data", "error");
      return;
    }

    try {
      setIsImporting(true);
      const db = getDatabase();
      await importBackup(db, backupJson.trim());
      addToast("Backup successfully restored!", "success");
      setBackupJson("");
    } catch (err) {
      logger.error("BackupSettings", "Import failed", err);
      addToast("Backup restoration failed: invalid schema", "error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Backup Settings Error">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderDefault }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Backup & Restore</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Security Banner */}
          <View
            style={[
              styles.securityBanner,
              {
                backgroundColor: `${semantic.stateSuccess}15`,
                borderColor: `${semantic.stateSuccess}30`,
              },
            ]}
          >
            <ShieldCheck size={20} color={semantic.stateSuccess} />
            <View style={styles.securityInfo}>
              <Text style={[styles.securityTitle, { color: colors.textPrimary }]}>Encryption & Key Isolation</Text>
              <Text style={[styles.securityDesc, { color: semantic.stateSuccess }]}>{keyStatus}</Text>
              <Text style={[styles.securityNote, { color: colors.textMuted }]}>
                Backups strictly contain task and event domain data. Database encryption keys and secrets are never exported.
              </Text>
            </View>
          </View>

          {/* Export Section */}
          <View style={[styles.actionCard, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <View style={styles.actionHeader}>
              <Download size={20} color={colors.textPrimary} />
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Export Snapshot</Text>
            </View>
            <Text style={[styles.actionDesc, { color: colors.textMuted }]}>
              Generate a validated, schema-compliant JSON file containing all your local courses, tasks, subtasks, events, and focus logs.
            </Text>
            <TouchableOpacity
              onPress={handleExport}
              disabled={isExporting}
              style={[styles.actionBtn, { backgroundColor: colors.textPrimary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionBtnText, { color: colors.bgCanvas }]}>
                {isExporting ? "Exporting..." : "Generate Backup JSON"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* JSON Payload Area */}
          <View style={[styles.jsonCard, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <Text style={[styles.jsonTitle, { color: colors.textPrimary }]}>Backup Data (JSON)</Text>
            <TextInput
              style={[
                styles.jsonInput,
                {
                  backgroundColor: colors.bgSurfaceElevated,
                  borderColor: colors.borderDefault,
                  color: colors.textPrimary,
                },
              ]}
              value={backupJson}
              onChangeText={setBackupJson}
              placeholder='{"schemaVersion": 1, "appVersion": "1.0.0", "courses": [...], ...}'
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
            />
          </View>

          {/* Import Section */}
          <View style={[styles.actionCard, { backgroundColor: colors.bgSurfaceCard, borderColor: colors.borderDefault }]}>
            <View style={styles.actionHeader}>
              <Upload size={20} color={semantic.priorityHigh} />
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Restore from Backup</Text>
            </View>
            <Text style={[styles.actionDesc, { color: colors.textMuted }]}>
              Validate schema integrity, sanitize records, and atomically import into your local SQLite database.
            </Text>
            <TouchableOpacity
              onPress={handleImport}
              disabled={isImporting || !backupJson.trim()}
              style={[
                styles.actionBtn,
                { backgroundColor: semantic.priorityHigh },
                (!backupJson.trim() || isImporting) && styles.btnDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>
                {isImporting ? "Validating & Restoring..." : "Validate & Import"}
              </Text>
            </TouchableOpacity>
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
  securityBanner: {
    flexDirection: "row",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  securityInfo: {
    flex: 1,
  },
  securityTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  securityDesc: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    marginTop: 2,
  },
  securityNote: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
    fontSize: 11,
    lineHeight: 16,
  },
  actionCard: {
    borderRadius: BORDER_RADIUS["2xl"],
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  actionTitle: {
    ...TYPOGRAPHY.heading,
    fontSize: 16,
  },
  actionDesc: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  actionBtn: {
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  jsonCard: {
    borderRadius: BORDER_RADIUS["2xl"],
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  jsonTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  jsonInput: {
    ...TYPOGRAPHY.mono,
    fontSize: 11,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    height: 120,
    textAlignVertical: "top",
  },
});
