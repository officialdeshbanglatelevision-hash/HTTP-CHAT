import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  MessageSquare,
  CircleDashed,
  Users,
  Phone,
  Settings,
  User,
  Shield,
  Palette,
  Search,
  Moon,
  Sun,
  Plus,
} from 'lucide-react';
import { MainTabType, ScreenType } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeScreen,
    navigateTo,
    isDarkMode,
    setThemeMode,
  } = useTheme();

  const navItems: { id: MainTabType; label: string; icon: typeof MessageSquare }[] = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'updates', label: 'Updates', icon: CircleDashed },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'calls', label: 'Calls', icon: Phone },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-20 lg:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none py-4 px-3">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-xl bg-accent text-white font-bold flex items-center justify-center text-sm tracking-wider shadow-lg accent-glow shrink-0 transition-colors">
            HTTP
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-white tracking-tight leading-none text-base">
              HTTP CHAT
            </h1>
            <span className="text-[11px] text-slate-400 font-medium">UI Prototype</span>
          </div>
        </div>

        {/* Primary Tabs */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && ['chats', 'updates', 'communities', 'calls'].includes(activeScreen);

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  navigateTo(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-accent text-white shadow-md accent-glow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 pt-4 space-y-1">
          <button
            onClick={() => navigateTo('search')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              activeScreen === 'search'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline">Search</span>
          </button>

          <button
            onClick={() => navigateTo('appearance')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              activeScreen === 'appearance'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline">Appearance</span>
          </button>

          <button
            onClick={() => navigateTo('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              activeScreen === 'settings'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Footer Profile & Theme */}
      <div className="border-t border-slate-800/80 pt-4 space-y-3">
        <button
          onClick={() => setThemeMode(isDarkMode ? 'light' : 'dark')}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-sm font-medium"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 text-slate-300 shrink-0" />
            )}
            <span className="hidden lg:inline">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </button>

        <button
          onClick={() => navigateTo('profile')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 transition-all text-left"
        >
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden lg:block min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">Profile</p>
            <p className="text-[11px] text-slate-400 truncate">HTTP CHAT User</p>
          </div>
        </button>
      </div>
    </aside>
  );
};
