import { z } from "zod";

export const taskDraftSchema = z.object({
  title: z.string().min(1, "Task title cannot be empty"),
  dueDate: z.string().nullable().optional(), // YYYY-MM-DD
  timeBlockStart: z.string().nullable().optional(), // HH:mm
  timeBlockEnd: z.string().nullable().optional(), // HH:mm
  priority: z.enum(["p1", "p2", "p3", "p4"]).default("p4"),
  courseTag: z.string().nullable().optional(),
  estimatedPomodoros: z.number().int().min(1).default(1),
  rawInput: z.string(),
});

export type TaskDraft = z.infer<typeof taskDraftSchema>;

export type TokenType =
  | "DATE"
  | "TIME"
  | "DURATION"
  | "PRIORITY"
  | "COURSE_TAG"
  | "POMODOROS"
  | "TEXT";

export interface Token {
  type: TokenType;
  value: string;
  parsedValue?: unknown;
  raw: string;
}

const DAY_NAMES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseDateToken(
  token: string,
  referenceDate: Date = new Date()
): string | null {
  const lower = token.toLowerCase().trim();

  if (lower === "today" || lower === "tod") {
    return formatIsoDate(referenceDate);
  }

  if (lower === "tomorrow" || lower === "tmrw" || lower === "tom") {
    const nextDay = new Date(referenceDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return formatIsoDate(nextDay);
  }

  if (lower.startsWith("next ") || DAY_NAMES[lower] !== undefined) {
    const dayName = lower.startsWith("next ") ? lower.replace("next ", "").trim() : lower;
    const targetDay = DAY_NAMES[dayName];
    if (targetDay !== undefined) {
      const result = new Date(referenceDate);
      const currentDay = result.getDay();
      let daysAhead = targetDay - currentDay;
      if (daysAhead <= 0 || lower.startsWith("next ")) {
        daysAhead += 7;
      }
      result.setDate(result.getDate() + daysAhead);
      return formatIsoDate(result);
    }
  }

  // ISO date: YYYY-MM-DD
  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(lower);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return formatIsoDate(d);
    }
  }

  // Month/Day: MM/DD or M/D
  const mdMatch = /^(\d{1,2})[-/](\d{1,2})$/.exec(lower);
  if (mdMatch && mdMatch[1] && mdMatch[2]) {
    const month = parseInt(mdMatch[1], 10) - 1;
    const day = parseInt(mdMatch[2], 10);
    const year = referenceDate.getFullYear();
    let d = new Date(year, month, day);
    // If date has already passed this year by more than a week, project to next year
    if (d.getTime() < referenceDate.getTime() - 7 * 24 * 3600 * 1000) {
      d = new Date(year + 1, month, day);
    }
    if (!isNaN(d.getTime())) {
      return formatIsoDate(d);
    }
  }

  return null;
}

export function parseTimeToken(token: string): string | null {
  const cleaned = token.replace(/^@/, "").toLowerCase().trim();

  // 12-hour format: 5pm, 5:30pm, 11am, 11:45am, 5p, 11a
  const match12 = /^(\d{1,2})(?::(\d{2}))?\s*([ap]m|[ap])$/.exec(cleaned);
  if (match12 && match12[1]) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridiem = match12[3]!;

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      return null;
    }

    if (meridiem.startsWith("p") && hours < 12) {
      hours += 12;
    } else if (meridiem.startsWith("a") && hours === 12) {
      hours = 0;
    }

    return formatTime(hours, minutes);
  }

  // 24-hour format: 17:00, 09:30, 9:30
  const match24 = /^(\d{1,2}):(\d{2})$/.exec(cleaned);
  if (match24 && match24[1] && match24[2]) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return formatTime(hours, minutes);
    }
  }

  return null;
}

export function parseDurationMinutes(token: string): number | null {
  const lower = token.toLowerCase().trim();

  // e.g. 30m, 45min, 1h, 1.5h, 2hrs
  const minMatch = /^(\d+)\s*(?:m|min|mins|minutes)$/.exec(lower);
  if (minMatch && minMatch[1]) {
    return parseInt(minMatch[1], 10);
  }

  const hrMatch = /^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours)$/.exec(lower);
  if (hrMatch && hrMatch[1]) {
    return Math.round(parseFloat(hrMatch[1]) * 60);
  }

  return null;
}

export function parsePriorityToken(token: string): "p1" | "p2" | "p3" | "p4" | null {
  const lower = token.toLowerCase().trim();
  if (lower === "p1" || lower === "!1" || lower === "!urgent" || lower === "!high") return "p1";
  if (lower === "p2" || lower === "!2" || lower === "!med" || lower === "!medium") return "p2";
  if (lower === "p3" || lower === "!3" || lower === "!low") return "p3";
  if (lower === "p4" || lower === "!4" || lower === "!none") return "p4";
  return null;
}

export function parsePomodoroToken(token: string): number | null {
  const lower = token.toLowerCase().replace(/[[\]~]/g, "").trim();

  // e.g. 2p, 3pomos, 4pomodoros, ~3p
  const match = /^(\d+)\s*(?:p|pomos?|pomodoros?)$/.exec(lower);
  if (match && match[1]) {
    const count = parseInt(match[1], 10);
    return count > 0 && count <= 50 ? count : null;
  }
  return null;
}

/**
 * Tokenizes raw text into discrete tokens.
 */
export function tokenizeQuickAdd(
  input: string,
  referenceDate: Date = new Date()
): Token[] {
  const words = input.trim().split(/\s+/).filter(Boolean);
  const tokens: Token[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;

    // Check two-word date (e.g. "next monday", "next fri")
    if (
      word.toLowerCase() === "next" &&
      i + 1 < words.length &&
      DAY_NAMES[words[i + 1]!.toLowerCase()] !== undefined
    ) {
      const combined = `next ${words[i + 1]}`;
      const parsedDate = parseDateToken(combined, referenceDate);
      if (parsedDate) {
        tokens.push({
          type: "DATE",
          value: parsedDate,
          raw: combined,
        });
        i++; // Skip next word
        continue;
      }
    }

    // 1. Priority
    const priority = parsePriorityToken(word);
    if (priority) {
      tokens.push({ type: "PRIORITY", value: priority, raw: word });
      continue;
    }

    // 2. Course Tag (#math, #cs101)
    if (word.startsWith("#") && word.length > 1) {
      tokens.push({
        type: "COURSE_TAG",
        value: word.slice(1),
        raw: word,
      });
      continue;
    }

    // 3. Pomodoros ([2p], 3p, 2pomos)
    const pomos = parsePomodoroToken(word);
    if (pomos !== null) {
      tokens.push({ type: "POMODOROS", value: String(pomos), raw: word });
      continue;
    }

    // 4. Time
    const time = parseTimeToken(word);
    if (time) {
      tokens.push({ type: "TIME", value: time, raw: word });
      continue;
    }

    // 5. Duration
    const duration = parseDurationMinutes(word);
    if (duration !== null) {
      tokens.push({ type: "DURATION", value: String(duration), raw: word });
      continue;
    }

    // 6. Date
    const date = parseDateToken(word, referenceDate);
    if (date) {
      tokens.push({ type: "DATE", value: date, raw: word });
      continue;
    }

    // Default: regular text
    tokens.push({ type: "TEXT", value: word, raw: word });
  }

  return tokens;
}

/**
 * Deterministic Quick Add Parser.
 * Tokenizes, extracts metadata, reconstructs clean task title, and returns validated TaskDraft.
 */
export function parseQuickAdd(
  input: string,
  referenceDate: Date = new Date()
): TaskDraft {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Quick add input cannot be empty");
  }

  const tokens = tokenizeQuickAdd(trimmed, referenceDate);

  let dueDate: string | null = null;
  let timeBlockStart: string | null = null;
  let timeBlockEnd: string | null = null;
  let priority: "p1" | "p2" | "p3" | "p4" = "p4";
  let courseTag: string | null = null;
  let estimatedPomodoros = 1;
  let durationMinutes: number | null = null;

  const textTokens: string[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case "DATE":
        if (!dueDate) dueDate = token.value;
        break;
      case "TIME":
        if (!timeBlockStart) timeBlockStart = token.value;
        break;
      case "DURATION":
        if (durationMinutes === null) durationMinutes = parseInt(token.value, 10);
        break;
      case "PRIORITY":
        priority = token.value as "p1" | "p2" | "p3" | "p4";
        break;
      case "COURSE_TAG":
        if (!courseTag) courseTag = token.value;
        break;
      case "POMODOROS":
        estimatedPomodoros = parseInt(token.value, 10);
        break;
      case "TEXT":
        textTokens.push(token.raw);
        break;
    }
  }

  // If timeBlockStart and durationMinutes are known, compute timeBlockEnd
  if (timeBlockStart && durationMinutes && durationMinutes > 0) {
    const parts = timeBlockStart.split(":").map(Number);
    const startHour = parts[0] ?? 0;
    const startMinute = parts[1] ?? 0;
    const totalMinutes = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    timeBlockEnd = formatTime(endHour, endMinute);
  }

  let title = textTokens.join(" ").trim();
  if (!title) {
    // If title was stripped entirely by metadata tokens, fallback to raw input
    title = trimmed;
  }

  const draft: TaskDraft = {
    title,
    dueDate,
    timeBlockStart,
    timeBlockEnd,
    priority,
    courseTag,
    estimatedPomodoros,
    rawInput: trimmed,
  };

  return taskDraftSchema.parse(draft);
}

export interface TaskInputFromDraft {
  id?: string;
  courseId?: string | null;
  title: string;
  priority: "p1" | "p2" | "p3" | "p4";
  dueDate?: string | null;
  timeBlockStart?: string | null;
  timeBlockEnd?: string | null;
  estimatedPomodoros: number;
}

/**
 * Maps a validated TaskDraft into task creation payload, resolving courseId from tag if lookup provided.
 */
export function draftToCreateTaskInput(
  draft: TaskDraft,
  courseTagResolver?: (tag: string) => string | null | undefined
): TaskInputFromDraft {
  let courseId: string | null = null;
  if (draft.courseTag && courseTagResolver) {
    courseId = courseTagResolver(draft.courseTag) ?? null;
  }

  return {
    title: draft.title,
    priority: draft.priority,
    dueDate: draft.dueDate ?? null,
    timeBlockStart: draft.timeBlockStart ?? null,
    timeBlockEnd: draft.timeBlockEnd ?? null,
    estimatedPomodoros: draft.estimatedPomodoros,
    courseId,
  };
}


