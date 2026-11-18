import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "vice-city";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = "mukalchat-theme";

function readStoredTheme(defaultTheme: Theme): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem("theme");
    return stored === "light" || stored === "dark" || stored === "vice-city" ? stored : defaultTheme;
  } catch {
    return defaultTheme;
  }
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() =>
    switchable ? readStoredTheme(defaultTheme) : defaultTheme
  );

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme !== "light");
    root.style.colorScheme = theme === "light" ? "light" : "dark";

    if (switchable) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        localStorage.setItem("theme", theme);
      } catch {
        // The selected theme still applies for this page if storage is unavailable.
      }
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => setTheme(previous => (previous === "light" ? "dark" : "light"))
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
