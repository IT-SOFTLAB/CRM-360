"use client";

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'buttons' | 'icon';
}

export default function ThemeToggle({ variant = 'buttons' }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl text-txt-secondary hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-txt-primary transition cursor-pointer flex items-center justify-center border border-border-crm bg-bg-main shrink-0"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? (
          <Moon className="w-4 h-4 text-txt-secondary" />
        ) : (
          <Sun className="w-4 h-4 text-amber-400" />
        )}
      </button>
    );
  }

  return (
    <div className="flex bg-bg-main border border-border-crm rounded-xl p-1 gap-1 w-full max-w-[240px] shrink-0 select-none">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex-grow py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
          theme === 'light'
            ? 'bg-primary text-white shadow-xs border border-primary/20'
            : 'text-txt-secondary border border-transparent hover:text-txt-primary hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        aria-pressed={theme === 'light'}
      >
        <Sun className="w-3.5 h-3.5" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex-grow py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
          theme === 'dark'
            ? 'bg-primary text-white shadow-xs border border-primary/20'
            : 'text-txt-secondary border border-transparent hover:text-txt-primary hover:bg-slate-700/50'
        }`}
        aria-pressed={theme === 'dark'}
      >
        <Moon className="w-3.5 h-3.5" />
        <span>Dark</span>
      </button>
    </div>
  );
}
