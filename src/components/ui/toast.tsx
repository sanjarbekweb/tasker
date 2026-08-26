import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useUIStore, ToastMessage } from "../../stores/ui-store";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react-native";

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const duration = toast.durationMs ?? 3000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle size={18} color={THEME_COLORS.semantic.stateSuccess} />;
      case "error":
        return <AlertCircle size={18} color={THEME_COLORS.semantic.stateError} />;
      case "info":
      default:
        return <Info size={18} color={THEME_COLORS.light.textPrimary} />;
    }
  };

  return (
    <View style={styles.toastCard}>
      <View style={styles.iconContainer}>{getIcon()}</View>
      <Text style={styles.toastText}>{toast.message}</Text>
      <TouchableOpacity
        onPress={() => onDismiss(toast.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={16} color={THEME_COLORS.light.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: SPACING["3xl"] + 40,
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: "center",
    zIndex: 9999,
  },
  toastCard: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS.xl,
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  toastText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: THEME_COLORS.light.textPrimary,
    flex: 1,
  },
});
