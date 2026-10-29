export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Light unless the visitor has picked dark with the toggle; the OS setting is ignored. */
export const DEFAULT_THEME: Theme = "light";

/**
 * Runs in <head> before first paint: the saved choice, otherwise light.
 * Kept as a plain string because it is inlined into the HTML, not bundled.
 */
export const themeInitScript = `(function(){var t="${DEFAULT_THEME}";try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");if(s==="light"||s==="dark"){t=s}}catch(e){}document.documentElement.setAttribute("data-theme",t)})()`;

export function readSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
