import { describe, it, expect } from "vitest";
import {
  THEME_COLORS,
  TYPOGRAPHY,
  BORDER_RADIUS,
  getCourseAccentTint,
} from "../src/constants/theme";

describe("Theme Tokens & Styling Constants", () => {
  it("defines light and dark theme canvas and surface tokens", () => {
    expect(THEME_COLORS.light.bgCanvas).toBeDefined();
    expect(THEME_COLORS.dark.bgCanvas).toBeDefined();
    expect(THEME_COLORS.light.textPrimary).toBeDefined();
    expect(THEME_COLORS.dark.textPrimary).toBeDefined();
  });

  it("defines all semantic accent tokens", () => {
    expect(THEME_COLORS.semantic.priorityHigh).toBe("#EF4444");
    expect(THEME_COLORS.semantic.priorityMedium).toBe("#F59E0B");
    expect(THEME_COLORS.semantic.priorityLow).toBe("#3B82F6");
    expect(THEME_COLORS.semantic.focusAccent).toBe("#F43F5E");
    expect(THEME_COLORS.semantic.gamifyStreak).toBe("#F97316");
    expect(THEME_COLORS.semantic.stateSuccess).toBe("#10B981");
  });

  it("calculates 10-15% opacity course background tint preventing dominant fills", () => {
    const tint = getCourseAccentTint("#6366F1", 0.12);
    expect(tint).toBe("rgba(99, 102, 241, 0.12)");

    const fallback = getCourseAccentTint("invalid");
    expect(fallback).toContain("rgba");
  });

  it("defines typography tokens without raw scattered font sizes", () => {
    expect(TYPOGRAPHY.display.fontSize).toBeGreaterThanOrEqual(24);
    expect(TYPOGRAPHY.heading.fontSize).toBe(20);
    expect(TYPOGRAPHY.body.fontSize).toBe(15);
    expect(TYPOGRAPHY.caption.fontSize).toBe(12);
    expect(TYPOGRAPHY.mono.fontFamily).toBe("monospace");
  });

  it("defines border radius tokens", () => {
    expect(BORDER_RADIUS.full).toBe(9999);
    expect(BORDER_RADIUS["2xl"]).toBe(16);
    expect(BORDER_RADIUS["3xl"]).toBe(24);
  });
});
