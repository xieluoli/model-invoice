import type { ThemeName, ThemePalette } from "./types.js";

export const themes: Record<ThemeName, ThemePalette> = {
  color: {
    bg: "#faf7f0",
    fg: "#222222",
    muted: "rgba(34,34,34,0.7)",
    dashed: "#b8ad94",
    double: "#8a7f63",
    border: "#e5dfd0",
    accent: "#3a2f1c",
  },
  mono: {
    bg: "#ffffff",
    fg: "#111111",
    muted: "#666666",
    dashed: "#bbbbbb",
    double: "#444444",
    border: "#dddddd",
    accent: "#111111",
  },
};

export const FONT_STACK =
  `"SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, "Courier New", monospace`;
