import React, { useState } from 'react';
import { useTheme, ACCENT_PALETTE, WALLPAPER_COLLECTION } from '../context/ThemeContext';
import { Sun, Moon, Monitor, Check, Palette, Image, Type, Send, Sparkles, Layers, Grid, RefreshCw } from 'lucide-react';
import { AccentColor, ChatWallpaper, FontSize, ThemeMode } from '../types';

export const AppearanceScreen: React.FC = () => {
  const {
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
    accentDetails,
    wallpaper,
    setWallpaper,
    fontSize,
    setFontSize,
    showToast,
  } = useTheme();

  const [wallpaperCategory, setWallpaperCategory] = useState<'all' | 'patterns' | 'gradients' | 'solids'>('all');

  const themeOptions: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System Default', icon: Monitor },
  ];

  const paletteKeys = Object.keys(ACCENT_PALETTE) as AccentColor[];
  const allWallpapers = Object.values(WALLPAPER_COLLECTION);

  const filteredWallpapers = allWallpapers.filter((w) => {
    if (wallpaperCategory === 'all') return true;
    return w.category === wallpaperCategory;
  });

  const fontSizes: { id: FontSize; label: string }[] = [
    { id: 'small', label: 'Small (13px)' },
    { id: 'medium', label: 'Medium (15px)' },
    { id: 'large', label: 'Large (17px)' },
  ];

  const activeWallpaperInfo = WALLPAPER_COLLECTION[wallpaper] || WALLPAPER_COLLECTION.default;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-7">
      {/* Theme Mode Selector */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Theme Mode
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setThemeMode(opt.id);
                  showToast(`Theme set to ${opt.label}`);
                }}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2.5 transition-all ${
                  isSelected
                    ? 'bg-accent-subtle border-accent text-accent ring-2 ring-accent shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="w-6 h-6 stroke-[1.75]" />
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Accent Color Palette */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Accent Color Palette
            </h3>
          </div>
          <span className="text-xs font-semibold text-accent px-2.5 py-0.5 rounded-full bg-accent-subtle">
            {accentDetails.name}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose a theme accent to dynamically customize primary buttons, active tabs, floating actions, and unread badges across the application.
        </p>

        {/* Color Palette Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 pt-1">
          {paletteKeys.map((key) => {
            const item = ACCENT_PALETTE[key];
            const isSelected = accentColor === key;

            return (
              <button
                key={key}
                onClick={() => {
                  setAccentColor(key);
                  showToast(`Accent color updated to ${item.name}`);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 relative overflow-hidden group ${
                  isSelected
                    ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/10 dark:ring-white/20 shadow-md scale-[1.02]'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]'
                }`}
                style={{
                  backgroundColor: isSelected ? `${item.hex500}10` : undefined,
                }}
              >
                <div className="flex items-center justify-between w-full z-10">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: item.hex500 }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                    {item.hex500}
                  </span>
                </div>

                <div className="z-10">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {item.name}
                  </p>
                </div>

                <div
                  className="absolute -right-3 -bottom-3 w-12 h-12 rounded-full opacity-20 blur-md pointer-events-none transition-opacity group-hover:opacity-40"
                  style={{ backgroundColor: item.hex500 }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Chat Window Backgrounds & Patterns Collection */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Chat Window Backgrounds & Patterns
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select an abstract vector pattern, gradient tint, or solid color canvas for your conversation windows.
            </p>
          </div>

          <button
            onClick={() => {
              setWallpaper('default');
              showToast('Chat wallpaper reset to default');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: 'all', label: 'All Wallpapers', count: allWallpapers.length },
              { id: 'patterns', label: 'Abstract Patterns', count: 7 },
              { id: 'gradients', label: 'Gradients', count: 4 },
              { id: 'solids', label: 'Solid Colors', count: 7 },
            ] as const
          ).map((tab) => {
            const isActive = wallpaperCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setWallpaperCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Wallpaper Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredWallpapers.map((w) => {
            const isSelected = wallpaper === w.id;
            return (
              <button
                key={w.id}
                onClick={() => {
                  setWallpaper(w.id);
                  showToast(`Wallpaper set to ${w.name}`);
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isSelected
                    ? 'border-accent ring-2 ring-accent bg-accent-subtle/30 shadow-md scale-[1.02]'
                    : 'bg-slate-50/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]'
                }`}
              >
                {/* Visual Thumbnail Card */}
                <div
                  className={`w-full h-20 rounded-xl mb-2.5 border border-slate-200/60 dark:border-slate-800 relative p-2 flex flex-col justify-between overflow-hidden shadow-inner ${w.className}`}
                >
                  {/* Miniature incoming bubble */}
                  <div className="bg-white/90 dark:bg-slate-900/90 text-[9px] font-medium px-2 py-1 rounded-lg text-slate-800 dark:text-slate-200 max-w-[80%] shadow-sm backdrop-blur-xs leading-tight">
                    Hey there! 👋
                  </div>

                  {/* Miniature outgoing bubble */}
                  <div className="bg-accent text-white text-[9px] font-medium px-2 py-1 rounded-lg max-w-[80%] ml-auto shadow-sm leading-tight">
                    Nice pattern ✨
                  </div>
                </div>

                {/* Info Footer */}
                <div className="flex items-start justify-between gap-1 w-full px-0.5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {w.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {w.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Interactive Chat Window Wallpaper Preview Frame */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-md border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-300">
                Live Chat Canvas Preview
              </span>
            </div>
            <span className="text-[11px] font-semibold text-accent px-2 py-0.5 rounded-md bg-accent-subtle">
              {activeWallpaperInfo.name}
            </span>
          </div>

          {/* Chat Window Frame Mockup */}
          <div
            className={`w-full rounded-xl border border-slate-800/80 p-3 min-h-[140px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${activeWallpaperInfo.className}`}
          >
            {/* Header info bar mockup */}
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/30">
              <div className="w-6 h-6 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                HC
              </div>
              <div className="text-[11px]">
                <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  HTTP CHAT Preview
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                  Online • Chat wallpaper active
                </p>
              </div>
            </div>

            {/* Simulated Chat Messages */}
            <div className="space-y-2 py-3">
              <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs p-2.5 rounded-2xl max-w-[85%] shadow-sm backdrop-blur-xs">
                How does this background pattern look in active conversation?
                <span className="block text-[9px] text-slate-400 text-right mt-1">10:42 AM</span>
              </div>

              <div className="bg-accent text-white text-xs p-2.5 rounded-2xl max-w-[85%] ml-auto shadow-sm">
                Clean & distinct! Patterns dynamically adjust to theme modes.
                <span className="block text-[9px] text-white/80 text-right mt-1">10:43 AM ✓✓</span>
              </div>
            </div>

            {/* Input bar mockup */}
            <div className="pt-2 border-t border-slate-700/30 flex items-center gap-2">
              <div className="flex-1 bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-400">
                Type a message...
              </div>
              <div className="w-7 h-7 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Font Size Selector */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Font Size</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {fontSizes.map((f) => {
            const isSelected = fontSize === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setFontSize(f.id);
                  showToast(`Font size set to ${f.label}`);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
