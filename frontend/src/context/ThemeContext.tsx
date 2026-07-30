"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { ToastContext } from './ToastContext';

export interface ThemeContextType {
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<string>('light');
  const toastCtx = useContext(ToastContext);

  // Initialize theme from localStorage on mount (hydration safe)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  // Sync state changes with DOM classes and localStorage
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Maintain body class dark-theme for legacy CSS selectors in stylesheet
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    localStorage.setItem('theme', theme);
    localStorage.setItem('crm_theme', theme); // Backwards compatibility
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    // if (toastCtx) {
    //   toastCtx.addToast('info', `Switched to ${nextTheme} mode`);
    // }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
