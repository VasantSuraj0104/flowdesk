"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "@/components/icons";

type Theme = "dark" | "light";

export function ThemeToggle() {
  // Default to dark (the black canvas). We read the persisted choice after mount
  // to avoid a hydration mismatch — the inline script in layout has already set
  // the correct data-theme before paint, so there's no flash.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("flowdesk-theme") as Theme) || "dark";
    setTheme(stored);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next === "light" ? "light" : "";
    try {
      localStorage.setItem("flowdesk-theme", next);
    } catch {
      /* private mode — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 rounded-lg border border-border flex items-center justify-center
                 text-text-muted hover:text-text hover:border-text-faint transition-colors"
    >
      {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
    </button>
  );
}
