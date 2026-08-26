/**
 * Numo Design Tokens & Theme Constants
 * Adheres strictly to the monochrome shell with semantic color accents specification (4-ui-context.md).
 */

export const THEME_COLORS = {
  light: {
    bgCanvas: "#F8F9FA",
    bgSurfaceCard: "#FFFFFF",
    textPrimary: "#111215",
    textMuted: "#6B7280",
    borderDefault: "#E5E7EB",
    borderSubtle: "#F3F4F6",
  },
  dark: {
    bgCanvas: "#0F1012",
    bgSurfaceCard: "#1A1B1E",
    textPrimary: "#F3F4F6",
    textMuted: "#9CA3AF",
    borderDefault: "#26282E",
    borderSubtle: "#1F2026",
  },
  semantic: {
    priorityHigh: "#EF4444",
    priorityMedium: "#F59E0B",
    priorityLow: "#3B82F6",
    priorityNone: "#9CA3AF",
    eventClass: "#6366F1",
    eventPersonal: "#10B981",
    focusAccent: "#F43F5E",
    gamifyStreak: "#F97316",
    stateSuccess: "#10B981",
    stateError: "#EF4444",
    stateWarning: "#F59E0B",
  },
  coursePalette: [
    "#6366F1", // Indigo
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#14B8A6", // Teal
  ],
} as const;

export const TYPOGRAPHY = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 20,
  },
  timerLarge: {
    fontFamily: "monospace",
    fontSize: 56,
    lineHeight: 64,
    fontWeight: "700" as const,
    letterSpacing: 2,
  },
} as const;

export const BORDER_RADIUS = {
  full: 9999,
  "3xl": 24,
  "2xl": 16,
  xl: 12,
  lg: 8,
  md: 6,
  sm: 4,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

export type ThemeMode = "light" | "dark";

/**
 * Returns a 10% opacity tint of the given hex color for course badge backgrounds,
 * strictly preventing course colors from dominating the monochrome shell.
 */
export function getCourseAccentTint(hexColor: string, opacity: number = 0.12): string {
  const cleanHex = hexColor.replace("#", "");
  if (cleanHex.length !== 6) return "rgba(99, 102, 241, 0.12)";
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
