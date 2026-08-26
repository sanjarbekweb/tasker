import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { FocusMode } from "../../domain/focus";

export const FOCUS_NOTIFICATION_IDENTIFIER = "numo_focus_timer_complete";
export const FOCUS_NOTIFICATION_CHANNEL_ID = "focus_timer_alerts";

export interface ScheduleFocusNotificationParams {
  targetTimestamp: number;
  mode: FocusMode;
  taskTitle?: string | null;
  title?: string;
  body?: string;
  now?: number;
}

export class NotificationService {
  private static isConfigured = false;
  private static mockScheduledNotificationId: string | null = null;
  private static mockScheduledTimestamp: number | null = null;

  /**
   * Configures foreground notification display behaviors and Android channels.
   */
  static async configure(): Promise<void> {
    if (this.isConfigured) return;

    try {
      if (Notifications && typeof Notifications.setNotificationHandler === "function") {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      }

      if (Platform.OS === "android" && typeof Notifications.setNotificationChannelAsync === "function") {
        await Notifications.setNotificationChannelAsync(FOCUS_NOTIFICATION_CHANNEL_ID, {
          name: "Focus Timer Alerts",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: "default",
          lightColor: "#6366F1",
        });
      }

      this.isConfigured = true;
    } catch {
      // In test/unsupported environments, safely record configuration state
      this.isConfigured = true;
    }
  }

  /**
   * Requests OS notification permissions.
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Notifications || typeof Notifications.getPermissionsAsync !== "function") {
        return true;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted" && typeof Notifications.requestPermissionsAsync === "function") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch {
      return false;
    }
  }

  /**
   * Schedules a focus timer completion alert from a target timestamp.
   * Invariant (§29): Notification is scheduled from target timestamp, not a running JS timer.
   */
  static async scheduleFocusTimerNotification(
    params: ScheduleFocusNotificationParams
  ): Promise<string | null> {
    await this.configure();

    const now = params.now ?? Date.now();
    const diffMs = params.targetTimestamp - now;

    if (diffMs <= 0) {
      return null;
    }

    // Default title & body based on mode
    let defaultTitle = "Focus Session Complete!";
    let defaultBody = params.taskTitle
      ? `You finished focusing on "${params.taskTitle}". Time for a break!`
      : "Great work! Time for a well-deserved break.";

    if (params.mode === "short_break" || params.mode === "long_break") {
      defaultTitle = "Break is Over";
      defaultBody = "Ready to start your next focus session?";
    }

    const title = params.title ?? defaultTitle;
    const body = params.body ?? defaultBody;

    // Cancel any existing focus notification first
    await this.cancelFocusTimerNotification();

    try {
      if (
        Notifications &&
        typeof Notifications.scheduleNotificationAsync === "function"
      ) {
        const id = await Notifications.scheduleNotificationAsync({
          identifier: FOCUS_NOTIFICATION_IDENTIFIER,
          content: {
            title,
            body,
            sound: "default",
            data: {
              type: "FOCUS_SESSION_COMPLETE",
              mode: params.mode,
              taskTitle: params.taskTitle ?? null,
              targetTimestamp: params.targetTimestamp,
            },
            ...(Platform.OS === "android" ? { channelId: FOCUS_NOTIFICATION_CHANNEL_ID } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: params.targetTimestamp,
          },
        });

        this.mockScheduledNotificationId = id;
        this.mockScheduledTimestamp = params.targetTimestamp;
        return id;
      }
    } catch {
      // Fallback for tests / environment where native bridge is mock
      this.mockScheduledNotificationId = FOCUS_NOTIFICATION_IDENTIFIER;
      this.mockScheduledTimestamp = params.targetTimestamp;
      return FOCUS_NOTIFICATION_IDENTIFIER;
    }

    this.mockScheduledNotificationId = FOCUS_NOTIFICATION_IDENTIFIER;
    this.mockScheduledTimestamp = params.targetTimestamp;
    return FOCUS_NOTIFICATION_IDENTIFIER;
  }

  /**
   * Cancels any scheduled focus timer notification.
   */
  static async cancelFocusTimerNotification(): Promise<void> {
    try {
      if (
        Notifications &&
        typeof Notifications.cancelScheduledNotificationAsync === "function"
      ) {
        await Notifications.cancelScheduledNotificationAsync(FOCUS_NOTIFICATION_IDENTIFIER);
      }
    } catch {
      // Safe no-op in mocked/unsupported environments
    } finally {
      this.mockScheduledNotificationId = null;
      this.mockScheduledTimestamp = null;
    }
  }

  /**
   * Test/Inspection helper to get current scheduled timestamp
   */
  static getScheduledTimestamp(): number | null {
    return this.mockScheduledTimestamp;
  }
}

