import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useUIStore, ToastMessage } from "../../stores/ui-store";
import { TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react-native";

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const { colors, semantic } = useTheme();

  useEffect(() => {
    const duration = toast.durationMs ?? 1800;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle size={18} color={semantic.stateSuccess} />;
      case "error":
        return <AlertCircle size={18} color={semantic.stateError} />;
      case "info":
      default:
        return <Info size={18} color={colors.textPrimary} />;
    }
  };

  return (
    <View
      style={[
        styles.toastCard,
        {
          backgroundColor: colors.bgSurfaceCard,
          borderColor: colors.borderDefault,
        },
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <Text style={[styles.toastText, { color: colors.textPrimary }]}>{toast.message}</Text>
      <TouchableOpacity
        onPress={() => onDismiss(toast.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={16} color={colors.textMuted} />
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
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  toastText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
});
