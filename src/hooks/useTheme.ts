import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "th-theme";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme);

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / privacy mode */
    }
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme, applyTheme]);

  useEffect(() => {
    setThemeState(readTheme());
  }, []);

  return { theme, toggle, setTheme: applyTheme } as const;
}
