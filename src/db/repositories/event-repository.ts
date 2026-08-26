import { eq, and, isNull, lte, gte, asc } from "drizzle-orm";
import { AppDatabase } from "../client";
import { events, Event } from "../schema/events";
import { courses } from "../schema/courses";
import { createEventSchema, updateEventSchema } from "../validation";
import { DatabaseError, NotFoundError, ValidationError } from "../errors";

export class EventRepository {
  constructor(private db: AppDatabase) {}

  async create(input: unknown): Promise<Event> {
    const parseResult = createEventSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid event creation data", parseResult.error.flatten());
    }

    const {
      title,
      courseId,
      seriesId,
      eventType,
      startTime,
      endTime,
      isRecurring,
      recurrenceRule,
      id,
    } = parseResult.data;

    const now = Date.now();
    const eventId = id ?? crypto.randomUUID();

    try {
      if (courseId) {
        const course = await this.db
          .select()
          .from(courses)
          .where(and(eq(courses.id, courseId), isNull(courses.deletedAt)))
          .limit(1);
        if (course.length === 0) {
          throw new NotFoundError(`Referenced course ${courseId} not found`, "Course", courseId);
        }
      }

      await this.db.insert(events).values({
        id: eventId,
        seriesId: seriesId ?? null,
        courseId: courseId ?? null,
        title,
        eventType: eventType ?? "class",
        startTime,
        endTime,
        isRecurring: isRecurring ?? false,
        recurrenceRule: recurrenceRule ?? null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const created = await this.findById(eventId);
      if (!created) {
        throw new DatabaseError("Failed to retrieve created event");
      }
      return created;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError("Database error while creating event", error);
    }
  }

  async findById(id: string): Promise<Event | null> {
    try {
      const result = await this.db
        .select()
        .from(events)
        .where(and(eq(events.id, id), isNull(events.deletedAt)))
        .limit(1);
      return result[0] ?? null;
    } catch (error) {
      throw new DatabaseError(`Database error finding event by id ${id}`, error);
    }
  }

  async listInRange(rangeStart: number, rangeEnd: number): Promise<Event[]> {
    try {
      // An event overlaps if event.startTime <= rangeEnd AND event.endTime >= rangeStart
      return await this.db
        .select()
        .from(events)
        .where(
          and(
            lte(events.startTime, rangeEnd),
            gte(events.endTime, rangeStart),
            isNull(events.deletedAt)
          )
        )
        .orderBy(asc(events.startTime));
    } catch (error) {
      throw new DatabaseError("Database error listing events in range", error);
    }
  }

  async listBySeries(seriesId: string): Promise<Event[]> {
    try {
      return await this.db
        .select()
        .from(events)
        .where(and(eq(events.seriesId, seriesId), isNull(events.deletedAt)))
        .orderBy(asc(events.startTime));
    } catch (error) {
      throw new DatabaseError(`Database error listing events for series ${seriesId}`, error);
    }
  }

  async listActive(): Promise<Event[]> {
    try {
      return await this.db
        .select()
        .from(events)
        .where(isNull(events.deletedAt))
        .orderBy(asc(events.startTime));
    } catch (error) {
      throw new DatabaseError("Database error listing active events", error);
    }
  }

  async update(id: string, input: unknown): Promise<Event> {
    const parseResult = updateEventSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid event update data", parseResult.error.flatten());
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with id "${id}" not found`, "Event", id);
    }

    const startTime = parseResult.data.startTime ?? existing.startTime;
    const endTime = parseResult.data.endTime ?? existing.endTime;

    if (startTime >= endTime) {
      throw new ValidationError("Start time must be before end time");
    }

    const now = Date.now();
    try {
      if (parseResult.data.courseId) {
        const course = await this.db
          .select()
          .from(courses)
          .where(and(eq(courses.id, parseResult.data.courseId), isNull(courses.deletedAt)))
          .limit(1);
        if (course.length === 0) {
          throw new NotFoundError(`Referenced course ${parseResult.data.courseId} not found`, "Course", parseResult.data.courseId);
        }
      }

      await this.db
        .update(events)
        .set({
          ...parseResult.data,
          updatedAt: now,
        })
        .where(eq(events.id, id));

      const updated = await this.findById(id);
      if (!updated) {
        throw new NotFoundError(`Event with id "${id}" not found after update`, "Event", id);
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Database error updating event ${id}`, error);
    }
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Event with id "${id}" not found`, "Event", id);
    }

    try {
      await this.db
        .update(events)
        .set({
          deletedAt: Date.now(),
          updatedAt: Date.now(),
        })
        .where(eq(events.id, id));
    } catch (error) {
      throw new DatabaseError(`Database error soft-deleting event ${id}`, error);
    }
  }

  async softDeleteSeries(seriesId: string): Promise<void> {
    try {
      await this.db
        .update(events)
        .set({
          deletedAt: Date.now(),
          updatedAt: Date.now(),
        })
        .where(eq(events.seriesId, seriesId));
    } catch (error) {
      throw new DatabaseError(`Database error soft-deleting series ${seriesId}`, error);
    }
  }
}
