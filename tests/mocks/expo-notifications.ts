export const SchedulableTriggerInputTypes = {
  DATE: "date",
  TIME_INTERVAL: "timeInterval",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
  CALENDAR: "calendar",
} as const;

export const AndroidImportance = {
  UNKNOWN: 0,
  UNSPECIFIED: 1,
  NONE: 2,
  MIN: 3,
  LOW: 4,
  DEFAULT: 5,
  HIGH: 6,
  MAX: 7,
} as const;

export interface MockNotificationRequest {
  identifier?: string;
  content: {
    title?: string | null;
    body?: string | null;
    data?: Record<string, unknown>;
    sound?: boolean | string;
    channelId?: string;
  };
  trigger: unknown;
}

const scheduledNotifications = new Map<string, MockNotificationRequest>();

export async function setNotificationHandler(handler: unknown): Promise<void> {}

export async function setNotificationChannelAsync(
  channelId: string,
  channel: unknown
): Promise<unknown> {
  return null;
}

export async function getPermissionsAsync(): Promise<{ status: string }> {
  return { status: "granted" };
}

export async function requestPermissionsAsync(): Promise<{ status: string }> {
  return { status: "granted" };
}

export async function scheduleNotificationAsync(
  request: MockNotificationRequest
): Promise<string> {
  const id = request.identifier ?? crypto.randomUUID();
  scheduledNotifications.set(id, request);
  return id;
}

export async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  scheduledNotifications.delete(identifier);
}

export async function cancelAllScheduledNotificationsAsync(): Promise<void> {
  scheduledNotifications.clear();
}

export async function getAllScheduledNotificationsAsync(): Promise<MockNotificationRequest[]> {
  return Array.from(scheduledNotifications.values());
}
