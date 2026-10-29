"use client";

import { useCallback, useLayoutEffect, useSyncExternalStore } from "react";
import { applyTheme, DEFAULT_THEME, readSavedTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getSnapshot = (): Theme =>
  document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
const getServerSnapshot = (): Theme => DEFAULT_THEME;

/** The current theme (read from <html data-theme>) and a setter that saves the choice. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Dev Strict Mode remounts can strip the attribute the inline script set; put it back before paint.
  useLayoutEffect(() => {
    if (!document.documentElement.hasAttribute("data-theme")) applyTheme(readSavedTheme() ?? DEFAULT_THEME);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the theme still applies for this visit.
    }
  }, []);

  return { theme, setTheme };
}
