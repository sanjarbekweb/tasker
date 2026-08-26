import { describe, it, expect, beforeEach } from "vitest";
import { NotificationService, FOCUS_NOTIFICATION_IDENTIFIER, FOCUS_NOTIFICATION_CHANNEL_ID } from "../src/services/notifications";

describe("NotificationService", () => {
  beforeEach(async () => {
    await NotificationService.cancelFocusTimerNotification();
  });

  it("schedules focus timer notification from a future target timestamp", async () => {
    const futureTarget = Date.now() + 25 * 60 * 1000;
    const notificationId = await NotificationService.scheduleFocusTimerNotification({
      targetTimestamp: futureTarget,
      mode: "work",
      taskTitle: "Complete Chapter 4 Problem Set",
    });

    expect(notificationId).toBeDefined();
    expect(NotificationService.getScheduledTimestamp()).toBe(futureTarget);
  });

  it("does not schedule notification if target timestamp is in the past or elapsed", async () => {
    const pastTarget = Date.now() - 5000;
    const notificationId = await NotificationService.scheduleFocusTimerNotification({
      targetTimestamp: pastTarget,
      mode: "work",
    });

    expect(notificationId).toBeNull();
    expect(NotificationService.getScheduledTimestamp()).toBeNull();
  });

  it("cancels scheduled notification and clears scheduled timestamp", async () => {
    const futureTarget = Date.now() + 15 * 60 * 1000;
    await NotificationService.scheduleFocusTimerNotification({
      targetTimestamp: futureTarget,
      mode: "short_break",
    });

    expect(NotificationService.getScheduledTimestamp()).toBe(futureTarget);

    await NotificationService.cancelFocusTimerNotification();
    expect(NotificationService.getScheduledTimestamp()).toBeNull();
  });

  it("handles break modes with appropriate notification messages", async () => {
    const futureTarget = Date.now() + 5 * 60 * 1000;
    const id = await NotificationService.scheduleFocusTimerNotification({
      targetTimestamp: futureTarget,
      mode: "short_break",
    });

    expect(id).toBeDefined();
    expect(NotificationService.getScheduledTimestamp()).toBe(futureTarget);
  });
});
