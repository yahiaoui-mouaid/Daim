// src/context/ThemeContext.jsx
// Single source of truth for the Momentum color theme.
// Applies `data-theme` to <html> so every token in tokens.css responds.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'momentum-theme';
const LEGACY_KEY = 'habit-theme'; // carried over from the previous design

const ThemeContext = createContext(null);

function readStoredTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    []
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback so components used outside a provider still render.
    return { theme: 'light', isDark: false, toggleTheme: () => {}, setTheme: () => {} };
  }
  return ctx;
};
