import { Platform } from "react-native";
import * as ExpoHaptics from "expo-haptics";

export enum ImpactFeedbackStyle {
  Light = "light",
  Medium = "medium",
  Heavy = "heavy",
  Rigid = "rigid",
  Soft = "soft",
}

export enum NotificationFeedbackType {
  Success = "success",
  Warning = "warning",
  Error = "error",
}

export const Haptics = {
  ImpactFeedbackStyle: ExpoHaptics.ImpactFeedbackStyle ?? ImpactFeedbackStyle,
  NotificationFeedbackType: ExpoHaptics.NotificationFeedbackType ?? NotificationFeedbackType,

  async impactAsync(style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle?.Medium ?? ("medium" as any)) {
    if (Platform.OS === "web") return;
    try {
      if (typeof ExpoHaptics.impactAsync === "function") {
        await ExpoHaptics.impactAsync(style);
      }
    } catch {
      // Safe no-op on platforms without haptic engine
    }
  },

  async selectionAsync() {
    if (Platform.OS === "web") return;
    try {
      if (typeof ExpoHaptics.selectionAsync === "function") {
        await ExpoHaptics.selectionAsync();
      }
    } catch {
      // Safe no-op
    }
  },

  async notificationAsync(type: ExpoHaptics.NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType?.Success ?? ("success" as any)) {
    if (Platform.OS === "web") return;
    try {
      if (typeof ExpoHaptics.notificationAsync === "function") {
        await ExpoHaptics.notificationAsync(type);
      }
    } catch {
      // Safe no-op
    }
  },
};

export default Haptics;
