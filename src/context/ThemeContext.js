'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('auto'); // 'auto', 'dark', 'light'
  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('pt-theme-mode');
    if (saved) setMode(saved);
  }, []);

  useEffect(() => {
    // Resolve the theme
    let theme = mode;
    if (mode === 'auto') {
      const hour = new Date().getHours();
      theme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
    }
    setResolvedTheme(theme);

    // Apply to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pt-theme-mode', mode);

    // Auto-update every minute in auto mode
    if (mode === 'auto') {
      const interval = setInterval(() => {
        const h = new Date().getHours();
        const newTheme = (h >= 6 && h < 18) ? 'light' : 'dark';
        setResolvedTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const toggleTheme = () => {
    const next = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto';
    setMode(next);
  };

  const setThemeMode = (m) => setMode(m);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
