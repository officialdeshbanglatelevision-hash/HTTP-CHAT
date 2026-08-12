import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Key,
  Shield,
  Lock,
  Palette,
  Bell,
  HardDrive,
  Globe,
  HelpCircle,
  Info,
  ChevronRight,
  QrCode,
  LogOut,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface SettingsScreenProps {
  onOpenLanguageModal: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenLanguageModal }) => {
  const { navigateTo, showToast } = useTheme();
  const { userProfile, currentUser, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      showToast('Logged out of HTTP CHAT', 'info');
      navigateTo('welcome');
    } catch (err: any) {
      showToast(err.message || 'Failed to log out', 'error');
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const settingsGroups = [
    {
      title: 'Account & Security',
      items: [
        {
          id: 'account_settings',
          icon: Key,
          label: 'Account & Security',
          desc: 'Phone, email, password, two-step verification',
          action: () => navigateTo('account_settings'),
          iconBg: 'bg-emerald-500/10 text-emerald-500',
        },
        {
          id: 'linked_devices',
          icon: Shield,
          label: 'Linked Devices',
          desc: 'Link up to 20 web, tablet, desktop sessions',
          action: () => navigateTo('linked_devices'),
          iconBg: 'bg-blue-500/10 text-blue-500',
        },
        {
          id: 'qr_profile',
          icon: QrCode,
          label: 'My QR Code',
          desc: 'Share or scan profile QR identity',
          action: () => navigateTo('qr_profile'),
          iconBg: 'bg-purple-500/10 text-purple-500',
        },
        {
          id: 'privacy',
          icon: Lock,
          label: 'Privacy',
          desc: 'Discovery settings, last seen, read receipts',
          action: () => navigateTo('privacy'),
          iconBg: 'bg-rose-500/10 text-rose-500',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'appearance',
          icon: Palette,
          label: 'Appearance',
          desc: 'Theme mode & accent colors',
          action: () => navigateTo('appearance'),
          iconBg: 'bg-violet-500/10 text-violet-500',
        },
        {
          id: 'wallpaper',
          icon: Sparkles,
          label: 'Chat Wallpaper',
          desc: 'Presets, custom gradients & photo backdrop',
          action: () => navigateTo('wallpaper'),
          iconBg: 'bg-cyan-500/10 text-cyan-500',
        },
        {
          id: 'stickers',
          icon: Sparkles,
          label: 'Sticker Store',
          desc: 'Free sticker packs & custom creators',
          action: () => navigateTo('stickers'),
          iconBg: 'bg-amber-500/10 text-amber-500',
        },
        {
          id: 'notifications',
          icon: Bell,
          label: 'Notifications',
          desc: 'Message, group & call tones',
          action: () => navigateTo('notifications'),
          iconBg: 'bg-amber-500/10 text-amber-500',
        },
        {
          id: 'storage',
          icon: HardDrive,
          label: 'Storage and Data',
          desc: 'Network usage, storage calculation & auto-download rules',
          action: () => navigateTo('storage'),
          iconBg: 'bg-rose-500/10 text-rose-500',
        },
        {
          id: 'media_quality',
          icon: Sparkles,
          label: 'Media Quality',
          desc: 'Photo, video & voice resolution settings',
          action: () => navigateTo('media_quality'),
          iconBg: 'bg-emerald-500/10 text-emerald-500',
        },
        {
          id: 'language',
          icon: Globe,
          label: 'App Language',
          desc: 'English (US)',
          action: onOpenLanguageModal,
          iconBg: 'bg-teal-500/10 text-teal-500',
        },
      ],
    },
    {
      title: 'Support & Information',
      items: [
        {
          id: 'help',
          icon: HelpCircle,
          label: 'Help & FAQ',
          desc: 'Help center, contact support, terms',
          action: () => navigateTo('help'),
          iconBg: 'bg-cyan-500/10 text-cyan-500',
        },
        {
          id: 'about',
          icon: Info,
          label: 'About HTTP CHAT',
          desc: 'App version, build specs, license',
          action: () => navigateTo('about'),
          iconBg: 'bg-slate-500/10 text-slate-500',
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-12">
      {/* Profile Header Card */}
      <div
        onClick={() => navigateTo('profile')}
        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.displayName}
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 shrink-0 bg-slate-800"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500/30 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <User className="w-7 h-7" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {userProfile?.displayName || currentUser?.displayName || 'HTTP Chat User'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              @{userProfile?.username || 'username'} • {userProfile?.about || 'Hey there! I am using HTTP CHAT.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <QrCode className="w-5 h-5" />
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <div key={group.title} className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
            {group.title}
          </h3>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 shadow-sm">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout Action Card */}
      <div className="pt-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-sm border border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Log out of HTTP CHAT</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Log out of HTTP CHAT?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You will be signed out from this device. Your message history will remain safely stored.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Log out</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
