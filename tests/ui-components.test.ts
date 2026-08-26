import { describe, it, expect } from "vitest";
import { formatTimeRemaining } from "../src/domain/focus";
import { getCourseAccentTint, THEME_COLORS, TYPOGRAPHY } from "../src/constants/theme";
import { parseQuickAdd, draftToCreateTaskInput } from "../src/domain/quick-add";

describe("UI Formatting & Tokens", () => {
  it("formats timer digits into MM:SS correctly without jitter", () => {
    expect(formatTimeRemaining(25 * 60)).toBe("25:00");
    expect(formatTimeRemaining(5 * 60)).toBe("05:00");
    expect(formatTimeRemaining(63)).toBe("01:03");
    expect(formatTimeRemaining(9)).toBe("00:09");
    expect(formatTimeRemaining(0)).toBe("00:00");
  });

  it("calculates course accent background tint at ~12% opacity", () => {
    const tint = getCourseAccentTint("#6366F1", 0.12);
    expect(tint).toBe("rgba(99, 102, 241, 0.12)");
  });

  it("integrates quick add tokenizer with draftToCreateTaskInput", () => {
    const draft = parseQuickAdd("Finish assignment tomorrow 5pm p1 #cs101 [2p]");
    const input = draftToCreateTaskInput(draft, (tag) => (tag === "cs101" ? "course-cs101-id" : null));

    expect(input.title).toBe("Finish assignment");
    expect(input.priority).toBe("p1");
    expect(input.estimatedPomodoros).toBe(2);
    expect(input.courseId).toBe("course-cs101-id");
    expect(input.timeBlockStart).toBe("17:00");
  });

  it("enforces strict typography scale without scattered magic numbers", () => {
    expect(TYPOGRAPHY.display.fontSize).toBe(28);
    expect(TYPOGRAPHY.heading.fontSize).toBe(20);
    expect(TYPOGRAPHY.body.fontSize).toBe(15);
    expect(TYPOGRAPHY.caption.fontSize).toBe(12);
    expect(TYPOGRAPHY.mono.fontFamily).toBe("monospace");
    expect(TYPOGRAPHY.timerLarge.fontSize).toBe(56);
  });
});
