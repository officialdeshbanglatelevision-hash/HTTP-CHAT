import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MessageSquare, CircleDashed, Users, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { MainTabType } from '../../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, navigateTo, activeScreen } = useTheme();

  // Hide bottom nav if inside sub-screens like Individual Chat, Media Viewer, etc.
  const isMainTabScreen = ['chats', 'updates', 'communities', 'calls'].includes(activeScreen);

  if (!isMainTabScreen) return null;

  const navItems: { id: MainTabType; label: string; icon: typeof MessageSquare }[] = [
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'updates', label: 'Updates', icon: CircleDashed },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'calls', label: 'Calls', icon: Phone },
  ];

  const handleTabClick = (tabId: MainTabType) => {
    setActiveTab(tabId);
    navigateTo(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className="relative flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors"
            >
              <div className="relative flex items-center justify-center px-4 py-1.5 rounded-full transition-colors">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-accent-subtle rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`relative z-10 w-5 h-5 transition-transform duration-150 ${
                    isActive
                      ? 'text-accent scale-110 stroke-[2.2]'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
              </div>
              <span
                className={`mt-0.5 text-[11px] tracking-tight transition-colors ${
                  isActive
                    ? 'text-accent font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
