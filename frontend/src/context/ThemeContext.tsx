/**
 * ThemeContext
 * 
 * Manages theme state and applies theme to the application.
 * Syncs with user preferences from backend.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getUserProfile, updateUserPreferences } from "../services/user.service";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark"; // Actual theme being applied
  setTheme: (theme: Theme) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(true);

  // Load theme from user preferences
  const loadTheme = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const profile = await getUserProfile();
        const userTheme = profile.preferences.theme;
        setThemeState(userTheme);
        applyTheme(userTheme);
      } else {
        // Not logged in, use system preference
        applyTheme("system");
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
      // Fallback to system theme
      applyTheme("system");
    } finally {
      setLoading(false);
    }
  };

  // Load theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Listen for auth changes to reload theme
  useEffect(() => {
    const handleAuthChange = () => {
      loadTheme();
    };

    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        setEffectiveTheme(e.matches ? "dark" : "light");
        applyThemeToDOM(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const applyTheme = (newTheme: Theme) => {
    let resolvedTheme: "light" | "dark";

    if (newTheme === "system") {
      // Use system preference
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      resolvedTheme = isDark ? "dark" : "light";
    } else {
      resolvedTheme = newTheme;
    }

    setEffectiveTheme(resolvedTheme);
    applyThemeToDOM(resolvedTheme);
  };

  const applyThemeToDOM = (resolvedTheme: "light" | "dark") => {
    const root = document.documentElement;
    
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Store in localStorage for persistence
    localStorage.setItem("effectiveTheme", resolvedTheme);
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    // Sync with backend if logged in
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await updateUserPreferences({ theme: newTheme });
        console.log("✅ Theme synced with backend:", newTheme);
      }
    } catch (error) {
      console.error("Failed to sync theme with backend:", error);
      // Theme is still applied locally, just not synced
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
