import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Moon,
  Sun,
  UserPlus,
  Users,
  Settings,
  User,
  Shield,
  Palette,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { ScreenType } from '../../types';

interface HeaderProps {
  onOpenNewGroupModal?: () => void;
  onOpenNewCommunityModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewGroupModal,
  onOpenNewCommunityModal,
}) => {
  const {
    activeScreen,
    navigateTo,
    goBack,
    isDarkMode,
    setThemeMode,
    themeMode,
    showToast,
  } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMainTab = ['chats', 'updates', 'communities', 'calls'].includes(activeScreen);

  const getScreenTitle = (): string => {
    switch (activeScreen) {
      case 'chats':
        return 'HTTP CHAT';
      case 'updates':
        return 'Updates';
      case 'communities':
        return 'Communities';
      case 'calls':
        return 'Calls';
      case 'contacts':
        return 'Select Contact';
      case 'settings':
        return 'Settings';
      case 'profile':
        return 'Profile';
      case 'new_chat':
        return 'New Chat';
      case 'individual_chat':
        return 'Contact name';
      case 'group_chat':
        return 'Group name';
      case 'chat_info':
        return 'Chat Info';
      case 'media_viewer':
        return 'Media Viewer';
      case 'search':
        return 'Search';
      case 'notifications':
        return 'Notifications';
      case 'privacy':
        return 'Privacy';
      case 'security':
        return 'Security';
      case 'storage':
        return 'Storage & Data';
      case 'appearance':
        return 'Appearance';
      case 'help':
        return 'Help';
      case 'about':
        return 'About HTTP CHAT';
      case 'error_demo':
        return 'Error State';
      default:
        return 'HTTP CHAT';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Left Section: Back or Logo */}
        <div className="flex items-center gap-3 min-w-0">
          {!isMainTab && (
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5 truncate">
            {isMainTab && activeScreen === 'chats' && (
              <div className="w-8 h-8 rounded-xl bg-accent text-white font-bold flex items-center justify-center text-xs tracking-wider shadow-sm shrink-0 transition-colors">
                HTTP
              </div>
            )}
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
              {getScreenTitle()}
            </h1>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Search Button */}
          {activeScreen !== 'search' && (
            <button
              onClick={() => navigateTo('search')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Theme Quick Toggle */}
          <button
            onClick={() => setThemeMode(isDarkMode ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* More Options Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl ring-1 ring-slate-900/10 dark:ring-white/10 py-2 z-50 text-sm font-medium animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigateTo('new_chat');
                  }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  New Chat
                </button>

                {onOpenNewGroupModal && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenNewGroupModal();
                    }}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    New Group
                  </button>
                )}

                {onOpenNewCommunityModal && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenNewCommunityModal();
                    }}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Users className="w-4 h-4 text-cyan-500" />
                    New Community
                  </button>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigateTo('profile');
                  }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Profile
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigateTo('appearance');
                  }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Palette className="w-4 h-4 text-violet-500" />
                  Appearance
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigateTo('settings');
                  }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigateTo('error_demo');
                  }}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Error State Demo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
