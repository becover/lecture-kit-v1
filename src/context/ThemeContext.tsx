/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type ThemeType = 'default' | 'dark' | 'minimal' | 'professional';

export interface ThemeColors {
  name: string;
  bg: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  accent: string;
  accentHover: string;
  border: string;
  link: string;
  linkHover: string;
}

export const THEME_PRESETS: Record<ThemeType, ThemeColors> = {
  default: {
    name: '기본 테마',
    bg: 'bg-gray-50',
    card: 'bg-white',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    secondary: 'bg-purple-500',
    secondaryHover: 'hover:bg-purple-600',
    accent: 'bg-orange-500',
    accentHover: 'hover:bg-orange-600',
    border: 'border-gray-200',
    link: 'text-indigo-600',
    linkHover: 'hover:text-indigo-800',
  },
  dark: {
    name: '다크 프리미엄',
    bg: 'bg-gray-900',
    card: 'bg-gray-800',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    secondary: 'bg-yellow-600',
    secondaryHover: 'hover:bg-yellow-700',
    accent: 'bg-amber-500',
    accentHover: 'hover:bg-amber-600',
    border: 'border-gray-700',
    link: 'text-amber-500',
    linkHover: 'hover:text-amber-400',
  },
  minimal: {
    name: '모던 미니멀',
    bg: 'bg-slate-50',
    card: 'bg-white',
    text: 'text-slate-900',
    textSecondary: 'text-slate-600',
    primary: 'bg-slate-700',
    primaryHover: 'hover:bg-slate-800',
    secondary: 'bg-blue-600',
    secondaryHover: 'hover:bg-blue-700',
    accent: 'bg-sky-500',
    accentHover: 'hover:bg-sky-600',
    border: 'border-slate-200',
    link: 'text-slate-700',
    linkHover: 'hover:text-slate-900',
  },
  professional: {
    name: '프로페셔널',
    bg: 'bg-slate-100',
    card: 'bg-white',
    text: 'text-slate-800',
    textSecondary: 'text-slate-600',
    primary: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    secondary: 'bg-emerald-600',
    secondaryHover: 'hover:bg-emerald-700',
    accent: 'bg-cyan-500',
    accentHover: 'hover:bg-cyan-600',
    border: 'border-slate-300',
    link: 'text-teal-600',
    linkHover: 'hover:text-teal-800',
  },
};

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as ThemeType) || 'default';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const colors = THEME_PRESETS[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
