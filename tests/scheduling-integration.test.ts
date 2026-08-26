import { describe, it, expect } from "vitest";
import {
  buildDailySchedule,
  detectCollision,
  getFreeGaps,
  rescheduleTask,
  parseDateAndTimeToTimestamp,
} from "../src/domain/scheduling";
import { parseQuickAdd, draftToCreateTaskInput } from "../src/domain/quick-add";

describe("Scheduling Integration & Daily Timeline", () => {
  const date = "2026-09-01";

  it("builds daily schedule combining events and task time blocks", () => {
    const eventStart = parseDateAndTimeToTimestamp(date, "10:00");
    const eventEnd = parseDateAndTimeToTimestamp(date, "11:30");

    const schedule = buildDailySchedule({
      date,
      events: [
        {
          id: "event-1",
          title: "Linear Algebra Lecture",
          startTime: eventStart,
          endTime: eventEnd,
        },
      ],
      tasks: [
        {
          id: "task-1",
          title: "Complete Problem Set",
          dueDate: date,
          timeBlockStart: "13:00",
          timeBlockEnd: "14:30",
          estimatedPomodoros: 3,
        },
        {
          id: "task-2",
          title: "Reading Assignment",
          dueDate: date,
          timeBlockStart: "16:00",
          timeBlockEnd: "17:00",
          estimatedPomodoros: 2,
        },
      ],
      windowStartHour: 8,
      windowEndHour: 18,
    });

    expect(schedule.items.length).toBe(3);
    expect(schedule.collisions.length).toBe(0);

    // Free gaps between 08:00 and 18:00:
    // 1. 08:00 - 10:00 (120 min)
    // 2. 11:30 - 13:00 (90 min)
    // 3. 14:30 - 16:00 (90 min)
    // 4. 17:00 - 18:00 (60 min)
    expect(schedule.freeGaps.length).toBe(4);
    expect(schedule.totalFreeMinutes).toBe(360);
    expect(schedule.totalScheduledMinutes).toBe(240);
  });

  it("detects collisions between overlapping events and scheduled tasks", () => {
    const eventStart = parseDateAndTimeToTimestamp(date, "14:00");
    const eventEnd = parseDateAndTimeToTimestamp(date, "15:30");

    const schedule = buildDailySchedule({
      date,
      events: [
        {
          id: "event-1",
          title: "Office Hours",
          startTime: eventStart,
          endTime: eventEnd,
        },
      ],
      tasks: [
        {
          id: "task-colliding",
          title: "Study Group Session",
          dueDate: date,
          timeBlockStart: "15:00", // Overlaps 14:00 - 15:30
          timeBlockEnd: "16:30",
          estimatedPomodoros: 2,
        },
      ],
    });

    expect(schedule.collisions.length).toBe(1);
    expect(schedule.collisions[0]).toEqual({
      itemAId: "event-1",
      itemBId: "task-colliding",
    });

    const eventItem = schedule.items.find((i) => i.id === "event-1");
    const taskItem = schedule.items.find((i) => i.id === "task-colliding");

    expect(eventItem?.hasCollision).toBe(true);
    expect(taskItem?.hasCollision).toBe(true);
    expect(eventItem?.collidingWithIds).toContain("task-colliding");
    expect(taskItem?.collidingWithIds).toContain("event-1");
  });

  it("integrates quick-add parser directly into task creation draft input", () => {
    const rawInput = "Physics lab report next monday 2pm p1 #phys101 [3p]";
    const refDate = new Date("2026-08-26T12:00:00Z"); // Wednesday

    const draft = parseQuickAdd(rawInput, refDate);
    expect(draft.title).toBe("Physics lab report");
    expect(draft.priority).toBe("p1");
    expect(draft.timeBlockStart).toBe("14:00");
    expect(draft.courseTag).toBe("phys101");
    expect(draft.estimatedPomodoros).toBe(3);

    const courseMap = new Map([["phys101", "course-uuid-999"]]);
    const taskInput = draftToCreateTaskInput(draft, (tag) => courseMap.get(tag));

    expect(taskInput.title).toBe("Physics lab report");
    expect(taskInput.priority).toBe("p1");
    expect(taskInput.courseId).toBe("course-uuid-999");
    expect(taskInput.estimatedPomodoros).toBe(3);
    expect(taskInput.timeBlockStart).toBe("14:00");
  });

  it("reschedules task with new date and time block", () => {
    const initialTask = {
      id: "task-1",
      title: "Write essay",
      dueDate: "2026-09-01",
      timeBlockStart: "10:00",
      timeBlockEnd: "11:00",
    };

    const rescheduled = rescheduleTask(initialTask, "2026-09-05", {
      start: "14:00",
      end: "15:30",
    });

    expect(rescheduled.dueDate).toBe("2026-09-05");
    expect(rescheduled.timeBlockStart).toBe("14:00");
    expect(rescheduled.timeBlockEnd).toBe("15:30");
  });
});
