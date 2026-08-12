import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccentColor, ChatWallpaper, FontSize, ScreenType, ThemeMode, ToastMessage } from '../types';

export interface AccentDetails {
  id: AccentColor;
  name: string;
  desc: string;
  hex500: string;
  hex600: string;
  hex700: string;
  rgb: string;
  bgClass: string;
  hoverBgClass: string;
  textClass: string;
  borderClass: string;
  ringClass: string;
  subtleBgClass: string;
}

export const WALLPAPER_COLLECTION: Record<ChatWallpaper, {
  id: ChatWallpaper;
  name: string;
  category: 'patterns' | 'gradients' | 'solids';
  desc: string;
  className: string;
}> = {
  default: {
    id: 'default',
    name: 'Standard Neutral',
    category: 'patterns',
    desc: 'Default clean background',
    className: 'chat-wallpaper-default',
  },
  doodle: {
    id: 'doodle',
    name: 'Chat Doodle',
    category: 'patterns',
    desc: 'Subtle chat icons & shapes',
    className: 'chat-wallpaper-doodle',
  },
  geometric: {
    id: 'geometric',
    name: 'Geometric Grid',
    category: 'patterns',
    desc: 'Minimalist lined grid',
    className: 'chat-wallpaper-geometric',
  },
  'dot-matrix': {
    id: 'dot-matrix',
    name: 'Dot Matrix',
    category: 'patterns',
    desc: 'Clean micro-dot alignment',
    className: 'chat-wallpaper-dot-matrix',
  },
  'abstract-waves': {
    id: 'abstract-waves',
    name: 'Abstract Waves',
    category: 'patterns',
    desc: 'Flowing vector contour lines',
    className: 'chat-wallpaper-abstract-waves',
  },
  'cyber-grid': {
    id: 'cyber-grid',
    name: 'Cyber Grid',
    category: 'patterns',
    desc: 'Tech grid with accent highlights',
    className: 'chat-wallpaper-cyber-grid',
  },
  circuit: {
    id: 'circuit',
    name: 'Tech Circuit',
    category: 'patterns',
    desc: 'PCB trace vector pattern',
    className: 'chat-wallpaper-circuit',
  },
  'gradient-emerald': {
    id: 'gradient-emerald',
    name: 'Accent Aurora',
    category: 'gradients',
    desc: 'Soft radial accent glow',
    className: 'chat-wallpaper-gradient-emerald',
  },
  'gradient-sunset': {
    id: 'gradient-sunset',
    name: 'Sunset Glow',
    category: 'gradients',
    desc: 'Warm rose & amber blend',
    className: 'chat-wallpaper-gradient-sunset',
  },
  'gradient-midnight': {
    id: 'gradient-midnight',
    name: 'Midnight Cosmic',
    category: 'gradients',
    desc: 'Deep indigo & slate gradient',
    className: 'chat-wallpaper-gradient-midnight',
  },
  'gradient-aurora': {
    id: 'gradient-aurora',
    name: 'Teal Aurora',
    category: 'gradients',
    desc: 'Mystic teal & purple aura',
    className: 'chat-wallpaper-gradient-aurora',
  },
  'solid-dark': {
    id: 'solid-dark',
    name: 'Slate Charcoal',
    category: 'solids',
    desc: 'Classic matte dark canvas',
    className: 'chat-wallpaper-solid-dark',
  },
  'solid-light': {
    id: 'solid-light',
    name: 'Pure Off-White',
    category: 'solids',
    desc: 'High contrast light canvas',
    className: 'chat-wallpaper-solid-light',
  },
  'solid-sage': {
    id: 'solid-sage',
    name: 'Calming Sage',
    category: 'solids',
    desc: 'Muted botanical green tone',
    className: 'chat-wallpaper-solid-sage',
  },
  'solid-navy': {
    id: 'solid-navy',
    name: 'Royal Navy',
    category: 'solids',
    desc: 'Deep ocean navy backdrop',
    className: 'chat-wallpaper-solid-navy',
  },
  'solid-plum': {
    id: 'solid-plum',
    name: 'Velvet Plum',
    category: 'solids',
    desc: 'Luxurious deep violet tone',
    className: 'chat-wallpaper-solid-plum',
  },
  'solid-sand': {
    id: 'solid-sand',
    name: 'Desert Sand',
    category: 'solids',
    desc: 'Warm natural cream canvas',
    className: 'chat-wallpaper-solid-sand',
  },
  'solid-charcoal': {
    id: 'solid-charcoal',
    name: 'Pitch Onyx',
    category: 'solids',
    desc: 'Deep dark OLED onyx canvas',
    className: 'chat-wallpaper-solid-charcoal',
  },
};

export const ACCENT_PALETTE: Record<AccentColor, AccentDetails> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    desc: 'Classic Messaging Green',
    hex500: '#10b981',
    hex600: '#059669',
    hex700: '#047857',
    rgb: '16, 185, 129',
    bgClass: 'bg-emerald-600',
    hoverBgClass: 'hover:bg-emerald-700',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500',
    ringClass: 'ring-emerald-500',
    subtleBgClass: 'bg-emerald-500/15',
  },
  blue: {
    id: 'blue',
    name: 'Classic Blue',
    desc: 'Clean & Professional Blue',
    hex500: '#3b82f6',
    hex600: '#2563eb',
    hex700: '#1d4ed8',
    rgb: '59, 130, 246',
    bgClass: 'bg-blue-600',
    hoverBgClass: 'hover:bg-blue-700',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500',
    ringClass: 'ring-blue-500',
    subtleBgClass: 'bg-blue-500/15',
  },
  violet: {
    id: 'violet',
    name: 'Royal Violet',
    desc: 'Vibrant Deep Purple',
    hex500: '#8b5cf6',
    hex600: '#7c3aed',
    hex700: '#6d28d9',
    rgb: '139, 92, 246',
    bgClass: 'bg-violet-600',
    hoverBgClass: 'hover:bg-violet-700',
    textClass: 'text-violet-500',
    borderClass: 'border-violet-500',
    ringClass: 'ring-violet-500',
    subtleBgClass: 'bg-violet-500/15',
  },
  rose: {
    id: 'rose',
    name: 'Electric Rose',
    desc: 'Bold & Expressive Crimson',
    hex500: '#f43f5e',
    hex600: '#e11d48',
    hex700: '#be123c',
    rgb: '244, 63, 94',
    bgClass: 'bg-rose-600',
    hoverBgClass: 'hover:bg-rose-700',
    textClass: 'text-rose-500',
    borderClass: 'border-rose-500',
    ringClass: 'ring-rose-500',
    subtleBgClass: 'bg-rose-500/15',
  },
  cyan: {
    id: 'cyan',
    name: 'Ocean Cyan',
    desc: 'Bright Tech Turquoise',
    hex500: '#06b6d4',
    hex600: '#0891b2',
    hex700: '#0e7490',
    rgb: '6, 182, 212',
    bgClass: 'bg-cyan-600',
    hoverBgClass: 'hover:bg-cyan-700',
    textClass: 'text-cyan-500',
    borderClass: 'border-cyan-500',
    ringClass: 'ring-cyan-500',
    subtleBgClass: 'bg-cyan-500/15',
  },
  amber: {
    id: 'amber',
    name: 'Golden Amber',
    desc: 'Warm Gold Accent',
    hex500: '#f59e0b',
    hex600: '#d97706',
    hex700: '#b45309',
    rgb: '245, 158, 11',
    bgClass: 'bg-amber-600',
    hoverBgClass: 'hover:bg-amber-700',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500',
    ringClass: 'ring-amber-500',
    subtleBgClass: 'bg-amber-500/15',
  },
  indigo: {
    id: 'indigo',
    name: 'Deep Indigo',
    desc: 'Modern Electric Indigo',
    hex500: '#6366f1',
    hex600: '#4f46e5',
    hex700: '#4338ca',
    rgb: '99, 102, 241',
    bgClass: 'bg-indigo-600',
    hoverBgClass: 'hover:bg-indigo-700',
    textClass: 'text-indigo-500',
    borderClass: 'border-indigo-500',
    ringClass: 'ring-indigo-500',
    subtleBgClass: 'bg-indigo-500/15',
  },
  teal: {
    id: 'teal',
    name: 'Mystic Teal',
    desc: 'Sophisticated Dark Aqua',
    hex500: '#14b8a6',
    hex600: '#0d9488',
    hex700: '#0f766e',
    rgb: '20, 184, 166',
    bgClass: 'bg-teal-600',
    hoverBgClass: 'hover:bg-teal-700',
    textClass: 'text-teal-500',
    borderClass: 'border-teal-500',
    ringClass: 'ring-teal-500',
    subtleBgClass: 'bg-teal-500/15',
  },
  orange: {
    id: 'orange',
    name: 'Radiant Orange',
    desc: 'Punchy High Energy Orange',
    hex500: '#f97316',
    hex600: '#ea580c',
    hex700: '#c2410c',
    rgb: '249, 115, 22',
    bgClass: 'bg-orange-600',
    hoverBgClass: 'hover:bg-orange-700',
    textClass: 'text-orange-500',
    borderClass: 'border-orange-500',
    ringClass: 'ring-orange-500',
    subtleBgClass: 'bg-orange-500/15',
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  accentDetails: AccentDetails;
  wallpaper: ChatWallpaper;
  setWallpaper: (wallpaper: ChatWallpaper) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  previousScreen: ScreenType | null;
  navigateTo: (screen: ScreenType) => void;
  goBack: () => void;
  toasts: ToastMessage[];
  showToast: (title: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  isDarkMode: boolean;
  activeTab: 'chats' | 'updates' | 'communities' | 'calls';
  setActiveTab: (tab: 'chats' | 'updates' | 'communities' | 'calls') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    try {
      const saved = localStorage.getItem('http_chat_accent') as AccentColor;
      return saved && ACCENT_PALETTE[saved] ? saved : 'emerald';
    } catch {
      return 'emerald';
    }
  });

  const [wallpaper, setWallpaperState] = useState<ChatWallpaper>(() => {
    try {
      const saved = localStorage.getItem('http_chat_wallpaper') as ChatWallpaper;
      return saved && WALLPAPER_COLLECTION[saved] ? saved : 'default';
    } catch {
      return 'default';
    }
  });

  const setWallpaper = (wp: ChatWallpaper) => {
    setWallpaperState(wp);
    try {
      localStorage.setItem('http_chat_wallpaper', wp);
    } catch (e) {
      console.warn('Could not save wallpaper preference:', e);
    }
  };
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [activeScreen, setActiveScreen] = useState<ScreenType>('chats');
  const [screenHistory, setScreenHistory] = useState<ScreenType[]>(['chats']);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'updates' | 'communities' | 'calls'>('chats');

  // Compute dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    try {
      localStorage.setItem('http_chat_accent', color);
    } catch (e) {
      console.warn('Could not save accent preference:', e);
    }
  };

  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Update root CSS custom properties dynamically whenever accentColor changes
  useEffect(() => {
    const item = ACCENT_PALETTE[accentColor] || ACCENT_PALETTE.emerald;
    const root = document.documentElement;
    root.style.setProperty('--color-accent-500', item.hex500);
    root.style.setProperty('--color-accent-600', item.hex600);
    root.style.setProperty('--color-accent-700', item.hex700);
    root.style.setProperty('--color-accent-rgb', item.rgb);
    root.style.setProperty('--color-accent-subtle', `rgba(${item.rgb}, 0.15)`);
    root.style.setProperty('--color-accent-subtle-hover', `rgba(${item.rgb}, 0.25)`);
    root.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  const navigateTo = (screen: ScreenType) => {
    setScreenHistory((prev) => [...prev, screen]);
    setActiveScreen(screen);
    // Sync main tab if navigating to a main tab
    if (['chats', 'updates', 'communities', 'calls'].includes(screen)) {
      setActiveTab(screen as 'chats' | 'updates' | 'communities' | 'calls');
    }
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const updatedHistory = [...screenHistory];
      updatedHistory.pop();
      const prevScreen = updatedHistory[updatedHistory.length - 1];
      setScreenHistory(updatedHistory);
      setActiveScreen(prevScreen);
      if (['chats', 'updates', 'communities', 'calls'].includes(prevScreen)) {
        setActiveTab(prevScreen as 'chats' | 'updates' | 'communities' | 'calls');
      }
    } else {
      setActiveScreen('chats');
      setActiveTab('chats');
    }
  };

  const showToast = (title: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const previousScreen = screenHistory.length > 1 ? screenHistory[screenHistory.length - 2] : null;
  const accentDetails = ACCENT_PALETTE[accentColor] || ACCENT_PALETTE.emerald;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        accentColor,
        setAccentColor,
        accentDetails,
        wallpaper,
        setWallpaper,
        fontSize,
        setFontSize,
        activeScreen,
        setActiveScreen,
        previousScreen,
        navigateTo,
        goBack,
        toasts,
        showToast,
        removeToast,
        isDarkMode,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
