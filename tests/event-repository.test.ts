import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initializeDatabase, closeDatabase, AppDatabase } from "../src/db/client";
import { EventRepository } from "../src/db/repositories/event-repository";
import { CourseRepository } from "../src/db/repositories/course-repository";
import { ValidationError } from "../src/db/errors";

describe("EventRepository", () => {
  let db: AppDatabase;
  let eventRepo: EventRepository;
  let courseRepo: CourseRepository;

  beforeEach(async () => {
    db = await initializeDatabase({ inMemory: true });
    eventRepo = new EventRepository(db);
    courseRepo = new CourseRepository(db);
  });

  afterEach(() => {
    closeDatabase();
  });

  it("creates an event and rejects invalid time intervals", async () => {
    await expect(
      eventRepo.create({
        title: "Invalid Event",
        startTime: 2000,
        endTime: 1000,
      })
    ).rejects.toThrow(ValidationError);

    const event = await eventRepo.create({
      title: "Math Lecture",
      startTime: 1000,
      endTime: 2000,
      eventType: "class",
      isRecurring: true,
      recurrenceRule: "RRULE:FREQ=WEEKLY;BYDAY=MO",
      seriesId: "math-lecture-series",
    });

    expect(event.id).toBeDefined();
    expect(event.isRecurring).toBe(true);
    expect(event.seriesId).toBe("math-lecture-series");
  });

  it("filters events overlapping a range", async () => {
    await eventRepo.create({
      title: "Event 1",
      startTime: 100,
      endTime: 200,
    });

    await eventRepo.create({
      title: "Event 2",
      startTime: 300,
      endTime: 400,
    });

    const inRange = await eventRepo.listInRange(150, 250);
    expect(inRange.length).toBe(1);
    expect(inRange[0]?.title).toBe("Event 1");
  });

  it("soft deletes an entire series", async () => {
    await eventRepo.create({
      title: "Recurrence 1",
      startTime: 100,
      endTime: 200,
      seriesId: "series-x",
    });

    await eventRepo.create({
      title: "Recurrence 2",
      startTime: 300,
      endTime: 400,
      seriesId: "series-x",
    });

    let series = await eventRepo.listBySeries("series-x");
    expect(series.length).toBe(2);

    await eventRepo.softDeleteSeries("series-x");

    series = await eventRepo.listBySeries("series-x");
    expect(series.length).toBe(0);
  });
});
