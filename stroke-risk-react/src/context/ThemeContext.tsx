import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  themeConfig: {
    name: string;
    bgClass: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accentBg: string;
    accentText: string;
    accentHover: string;
    badgeBg: string;
    sidebarBg: string;
    sidebarBorder: string;
    headerBg: string;
    inputBg: string;
    inputBorder: string;
    chartTheme: {
      grid: string;
      text: string;
      primary: string;
      secondary: string;
      stroke: string;
    };
  };
}

const THEME_CONFIGS: Record<ThemeMode, ThemeContextType['themeConfig']> = {
  light: {
    name: 'Modern Light',
    bgClass: 'bg-slate-50 text-slate-800',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200/80',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    accentBg: 'bg-teal-600 hover:bg-teal-700 text-white',
    accentText: 'text-teal-600',
    accentHover: 'hover:bg-teal-50',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    sidebarBg: 'bg-white border-r border-slate-200',
    sidebarBorder: 'border-slate-200',
    headerBg: 'bg-white/90 backdrop-blur-md border-b border-slate-200',
    inputBg: 'bg-white text-slate-900 placeholder:text-slate-400',
    inputBorder: 'border-slate-300 focus:border-teal-500 focus:ring-teal-500/20',
    chartTheme: {
      grid: '#f1f5f9',
      text: '#64748b',
      primary: '#0d9488',
      secondary: '#3b82f6',
      stroke: '#ef4444',
    },
  },
  dark: {
    name: 'Midnight Dark',
    bgClass: 'bg-slate-950 text-slate-100',
    cardBg: 'bg-slate-900/90',
    cardBorder: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-500',
    accentBg: 'bg-teal-500 hover:bg-teal-600 text-slate-950 font-medium',
    accentText: 'text-teal-400',
    accentHover: 'hover:bg-slate-800',
    badgeBg: 'bg-teal-950/60 text-teal-300 border-teal-800/80',
    sidebarBg: 'bg-slate-900 border-r border-slate-800',
    sidebarBorder: 'border-slate-800',
    headerBg: 'bg-slate-900/90 backdrop-blur-md border-b border-slate-800',
    inputBg: 'bg-slate-800 text-slate-100 placeholder:text-slate-500',
    inputBorder: 'border-slate-700 focus:border-teal-400 focus:ring-teal-400/20',
    chartTheme: {
      grid: '#1e293b',
      text: '#94a3b8',
      primary: '#14b8a6',
      secondary: '#60a5fa',
      stroke: '#f87171',
    },
  },
  'healthcare-blue': {
    name: 'Healthcare Blue',
    bgClass: 'bg-sky-50/70 text-slate-900',
    cardBg: 'bg-white',
    cardBorder: 'border-sky-200/80',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-sky-900/80',
    textMuted: 'text-sky-600/70',
    accentBg: 'bg-sky-600 hover:bg-sky-700 text-white',
    accentText: 'text-sky-600',
    accentHover: 'hover:bg-sky-50',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    sidebarBg: 'bg-white border-r border-sky-200',
    sidebarBorder: 'border-sky-200',
    headerBg: 'bg-white/95 backdrop-blur-md border-b border-sky-200',
    inputBg: 'bg-white text-slate-900 placeholder:text-slate-400',
    inputBorder: 'border-sky-300 focus:border-sky-600 focus:ring-sky-600/20',
    chartTheme: {
      grid: '#e0f2fe',
      text: '#0369a1',
      primary: '#0284c7',
      secondary: '#2563eb',
      stroke: '#e11d48',
    },
  },
  'soft-green': {
    name: 'Soft Green',
    bgClass: 'bg-emerald-50/60 text-slate-900',
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-200/80',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-emerald-950/80',
    textMuted: 'text-emerald-700/70',
    accentBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    accentText: 'text-emerald-600',
    accentHover: 'hover:bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    sidebarBg: 'bg-white border-r border-emerald-200',
    sidebarBorder: 'border-emerald-200',
    headerBg: 'bg-white/95 backdrop-blur-md border-b border-emerald-200',
    inputBg: 'bg-white text-slate-900 placeholder:text-slate-400',
    inputBorder: 'border-emerald-300 focus:border-emerald-600 focus:ring-emerald-600/20',
    chartTheme: {
      grid: '#ecfdf5',
      text: '#047857',
      primary: '#059669',
      secondary: '#0284c7',
      stroke: '#dc2626',
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('stroke_app_theme') as ThemeMode;
    return saved && THEME_CONFIGS[saved] ? saved : 'dark';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('stroke_app_theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const value = {
    theme,
    setTheme,
    themeConfig: THEME_CONFIGS[theme],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
