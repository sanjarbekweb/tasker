import { Event } from "../../db/schema/events";

export interface EventFilterCriteria {
  courseId?: string | null;
  eventType?: "class" | "study" | "exam" | "personal";
  searchQuery?: string;
  rangeStart?: number;
  rangeEnd?: number;
}

/**
 * Sorts events by start time ascending, then by end time.
 */
export function sortEventsByStartTime(eventList: Event[]): Event[] {
  return [...eventList].sort((a, b) => {
    if (a.startTime !== b.startTime) {
      return a.startTime - b.startTime;
    }
    return a.endTime - b.endTime;
  });
}

/**
 * Filters events by date range, course, type, and search query.
 */
export function filterEvents(
  eventList: Event[],
  criteria: EventFilterCriteria
): Event[] {
  return eventList.filter((event) => {
    if (criteria.courseId !== undefined && event.courseId !== criteria.courseId) {
      return false;
    }

    if (criteria.eventType !== undefined && event.eventType !== criteria.eventType) {
      return false;
    }

    if (criteria.rangeStart !== undefined && event.endTime < criteria.rangeStart) {
      return false;
    }

    if (criteria.rangeEnd !== undefined && event.startTime > criteria.rangeEnd) {
      return false;
    }

    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase().trim();
      if (!event.title.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Checks whether an event is currently active at timestamp `now`.
 */
export function isEventOngoing(event: Event, now: number = Date.now()): boolean {
  return event.startTime <= now && event.endTime > now;
}

/**
 * Formats time range e.g. "10:00 - 11:30".
 */
export function formatEventTimeRange(
  startTime: number,
  endTime: number,
  locale: string = "en-US"
): string {
  const start = new Date(startTime).toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const end = new Date(endTime).toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${start} – ${end}`;
}

