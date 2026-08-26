import { describe, it, expect } from "vitest";
import {
  tokenizeQuickAdd,
  parseQuickAdd,
  parseDateToken,
  parseTimeToken,
  parsePriorityToken,
  parsePomodoroToken,
} from "../src/domain/quick-add";

describe("Domain Quick Add Parser", () => {
  const refDate = new Date(2026, 7, 27, 12, 0, 0); // 2026-08-27 (Thursday)

  describe("Token Parsers", () => {
    it("parses relative date tokens (today, tomorrow, next monday)", () => {
      expect(parseDateToken("today", refDate)).toBe("2026-08-27");
      expect(parseDateToken("tod", refDate)).toBe("2026-08-27");
      expect(parseDateToken("tomorrow", refDate)).toBe("2026-08-28");
      expect(parseDateToken("tmrw", refDate)).toBe("2026-08-28");
      expect(parseDateToken("next friday", refDate)).toBe("2026-09-04");
      expect(parseDateToken("friday", refDate)).toBe("2026-08-28");
    });

    it("parses absolute date tokens (YYYY-MM-DD, MM/DD)", () => {
      expect(parseDateToken("2026-09-15", refDate)).toBe("2026-09-15");
      expect(parseDateToken("09/15", refDate)).toBe("2026-09-15");
    });

    it("parses time tokens (12h and 24h)", () => {
      expect(parseTimeToken("5pm")).toBe("17:00");
      expect(parseTimeToken("5:30pm")).toBe("17:30");
      expect(parseTimeToken("10am")).toBe("10:00");
      expect(parseTimeToken("11:45am")).toBe("11:45");
      expect(parseTimeToken("14:30")).toBe("14:30");
      expect(parseTimeToken("@5pm")).toBe("17:00");
    });

    it("parses priority tokens", () => {
      expect(parsePriorityToken("p1")).toBe("p1");
      expect(parsePriorityToken("p2")).toBe("p2");
      expect(parsePriorityToken("p3")).toBe("p3");
      expect(parsePriorityToken("p4")).toBe("p4");
      expect(parsePriorityToken("!1")).toBe("p1");
      expect(parsePriorityToken("!urgent")).toBe("p1");
      expect(parsePriorityToken("invalid")).toBeNull();
    });

    it("parses pomodoro count tokens", () => {
      expect(parsePomodoroToken("2p")).toBe(2);
      expect(parsePomodoroToken("[3p]")).toBe(3);
      expect(parsePomodoroToken("4pomos")).toBe(4);
      expect(parsePomodoroToken("2pomodoros")).toBe(2);
      expect(parsePomodoroToken("hello")).toBeNull();
    });
  });

  describe("Full Quick Add Pipeline", () => {
    it("parses complex input with date, time, priority, hashtag, and pomodoros", () => {
      const input = "Complete Math Assignment tomorrow 5pm p1 #math [2p]";
      const draft = parseQuickAdd(input, refDate);

      expect(draft.title).toBe("Complete Math Assignment");
      expect(draft.dueDate).toBe("2026-08-28");
      expect(draft.timeBlockStart).toBe("17:00");
      expect(draft.priority).toBe("p1");
      expect(draft.courseTag).toBe("math");
      expect(draft.estimatedPomodoros).toBe(2);
      expect(draft.rawInput).toBe(input);
    });

    it("computes timeBlockEnd when time and duration are specified", () => {
      const input = "Study Chemistry today 14:00 90m #chem !2";
      const draft = parseQuickAdd(input, refDate);

      expect(draft.title).toBe("Study Chemistry");
      expect(draft.dueDate).toBe("2026-08-27");
      expect(draft.timeBlockStart).toBe("14:00");
      expect(draft.timeBlockEnd).toBe("15:30"); // 14:00 + 90 min
      expect(draft.priority).toBe("p2");
      expect(draft.courseTag).toBe("chem");
    });

    it("handles plain text input with default priority and pomodoros", () => {
      const input = "Buy groceries";
      const draft = parseQuickAdd(input, refDate);

      expect(draft.title).toBe("Buy groceries");
      expect(draft.dueDate).toBeNull();
      expect(draft.timeBlockStart).toBeNull();
      expect(draft.priority).toBe("p4");
      expect(draft.courseTag).toBeNull();
      expect(draft.estimatedPomodoros).toBe(1);
    });

    it("throws ValidationError or Error on empty input", () => {
      expect(() => parseQuickAdd("   ", refDate)).toThrow();
    });
  });
});
