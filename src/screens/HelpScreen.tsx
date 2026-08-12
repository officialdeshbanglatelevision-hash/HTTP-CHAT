import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { HelpCircle, MessageSquare, FileText, Shield, Info, ChevronRight, ExternalLink } from 'lucide-react';

export const HelpScreen: React.FC = () => {
  const { navigateTo, showToast } = useTheme();

  const helpItems = [
    {
      id: 'center',
      icon: HelpCircle,
      title: 'Help Center',
      desc: 'Get answers to common questions and guides',
      action: () => showToast('Help Center opened (UI prototype)'),
    },
    {
      id: 'support',
      icon: MessageSquare,
      title: 'Contact Support',
      desc: 'Get in touch with support team',
      action: () => showToast('Support ticket form control (UI prototype)'),
    },
    {
      id: 'terms',
      icon: FileText,
      title: 'Terms of Service',
      desc: 'Read terms, conditions, and usage policies',
      action: () => showToast('Terms of service document (UI prototype)'),
    },
    {
      id: 'privacy',
      icon: Shield,
      title: 'Privacy Policy',
      desc: 'Learn how HTTP CHAT protects user data',
      action: () => showToast('Privacy policy document (UI prototype)'),
    },
    {
      id: 'about',
      icon: Info,
      title: 'About HTTP CHAT',
      desc: 'App version, licenses, and specifications',
      action: () => navigateTo('about'),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          How can we help you?
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          HTTP CHAT is a frontend UI prototype designed with modern messaging aesthetics.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
        {helpItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
