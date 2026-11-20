import React, { createContext, useContext, useEffect, useRef, useState } from "react";

export type Theme = "light" | "dark" | "vice-city";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isCatMode: boolean;
  toggleCatMode: () => void;
  catSoundEnabled: boolean;
  toggleCatSound: () => void;
  viceMusicPlaying: boolean;
  toggleViceMusic: () => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = "selamchat-theme";
const CAT_SOUND_STORAGE_KEY = "selamchat-cat-sound";

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
  const [isCatMode, setIsCatMode] = useState(false);
  const [catSoundEnabled, setCatSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem(CAT_SOUND_STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  });
  const catAudioRef = useRef<HTMLAudioElement | null>(null);
  const viceAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousThemeRef = useRef<Theme>(theme);
  const [viceMusicPlaying, setViceMusicPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio("/cat-theme.mp3");
    audio.loop = true;
    audio.volume = 0.35;
    catAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      catAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = new Audio("/a-gta6-theme.mp3");
    audio.loop = true;
    audio.volume = 0.32;
    viceAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      viceAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = catAudioRef.current;
    if (!audio) return;

    if (isCatMode && catSoundEnabled) {
      void audio.play().catch(() => {
        // Browsers may block playback until the next user gesture.
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isCatMode, catSoundEnabled]);

  useEffect(() => {
    const audio = viceAudioRef.current;
    const viceCityIsActive = theme === "vice-city" && !isCatMode;

    if (!viceCityIsActive) {
      setViceMusicPlaying(false);
      audio?.pause();
      if (audio) audio.currentTime = 0;
    }
  }, [theme, isCatMode]);

  useEffect(() => {
    const audio = viceAudioRef.current;
    if (!audio) return;

    if (viceMusicPlaying && theme === "vice-city" && !isCatMode) {
      void audio.play().catch(() => setViceMusicPlaying(false));
    } else {
      audio.pause();
      if (!viceMusicPlaying) audio.currentTime = 0;
    }
  }, [viceMusicPlaying, theme, isCatMode]);

  useEffect(() => {
    const root = document.documentElement;
    const activeTheme = isCatMode ? "cat" : theme;
    root.dataset.theme = activeTheme;
    root.classList.toggle("dark", activeTheme !== "light");
    root.style.colorScheme = activeTheme === "light" ? "light" : "dark";

    if (switchable) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        localStorage.setItem("theme", theme);
      } catch {
        // The selected theme still applies for this page if storage is unavailable.
      }
    }
  }, [theme, isCatMode, switchable]);

  const toggleTheme = switchable
    ? () => setTheme(previous => (previous === "light" ? "dark" : "light"))
    : undefined;
  const toggleCatMode = () => {
    if (isCatMode) {
      setIsCatMode(false);
      setTheme(previousThemeRef.current);
      return;
    }
    previousThemeRef.current = theme;
    setIsCatMode(true);
  };
  const toggleCatSound = () => {
    setCatSoundEnabled(previous => {
      const next = !previous;
      try {
        localStorage.setItem(CAT_SOUND_STORAGE_KEY, next ? "on" : "off");
      } catch {
        // The preference still applies for this page if storage is unavailable.
      }
      return next;
    });
  };
  const toggleViceMusic = () => setViceMusicPlaying(previous => !previous);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isCatMode,
        toggleCatMode,
        catSoundEnabled,
        toggleCatSound,
        viceMusicPlaying,
        toggleViceMusic,
        toggleTheme,
        switchable,
      }}
    >
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
