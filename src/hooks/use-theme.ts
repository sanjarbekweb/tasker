import { useColorScheme } from "react-native";
import { useUIStore, ThemePreference } from "../stores/ui-store";
import {
  THEME_COLORS,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SPACING,
  ThemeMode,
  getCourseAccentTint,
} from "../constants/theme";

export interface ThemeContext {
  mode: ThemeMode;
  preference: ThemePreference;
  isDark: boolean;
  colors: (typeof THEME_COLORS)["light"] | (typeof THEME_COLORS)["dark"];
  semantic: typeof THEME_COLORS.semantic;
  coursePalette: typeof THEME_COLORS.coursePalette;
  typography: typeof TYPOGRAPHY;
  borderRadius: typeof BORDER_RADIUS;
  spacing: typeof SPACING;
  getCourseAccentTint: typeof getCourseAccentTint;
}

export function useTheme(): ThemeContext {
  const systemColorScheme = useColorScheme();
  const themePreference = useUIStore((s) => s.themePreference);

  const activeMode: ThemeMode =
    themePreference === "system"
      ? (systemColorScheme === "dark" ? "dark" : "light")
      : themePreference;

  const colors = THEME_COLORS[activeMode];
  const isDark = activeMode === "dark";

  return {
    mode: activeMode,
    preference: themePreference,
    isDark,
    colors,
    semantic: THEME_COLORS.semantic,
    coursePalette: THEME_COLORS.coursePalette,
    typography: TYPOGRAPHY,
    borderRadius: BORDER_RADIUS,
    spacing: SPACING,
    getCourseAccentTint,
  };
}

export default useTheme;
