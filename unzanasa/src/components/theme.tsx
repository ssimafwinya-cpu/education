"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ThemeMode } from "@/lib/types";

interface ThemeCtx {
  theme: ThemeMode;
  resolved: "light" | "dark";
  setTheme: (t: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Load persisted preference once.
  useEffect(() => {
    const saved = (localStorage.getItem("unzanasa.theme") as ThemeMode) || "system";
    setThemeState(saved);
  }, []);

  // Apply the resolved theme to <html> and react to system changes.
  useEffect(() => {
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
      document.documentElement.classList.toggle("dark", dark);
      setResolved(dark ? "dark" : "light");
    };
    apply();
    localStorage.setItem("unzanasa.theme", theme);
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  return (
    <Ctx.Provider value={{ theme, resolved, setTheme: setThemeState }}>{children}</Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
