import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Bell, Volume2, Vibrate, MessageSquare, Users, Phone } from 'lucide-react';

export const NotificationsScreen: React.FC = () => {
  const { showToast } = useTheme();

  const [messageSound, setMessageSound] = useState(true);
  const [messageVibrate, setMessageVibrate] = useState(true);
  const [groupSound, setGroupSound] = useState(true);
  const [callRingtone, setCallRingtone] = useState(true);
  const [reactionNotifications, setReactionNotifications] = useState(true);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Message Notifications */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Message Notifications
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Notification Tone
                </p>
                <p className="text-xs text-slate-400">Default (Chime)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={messageSound}
              onChange={() => {
                setMessageSound(!messageSound);
                showToast(`Message sounds ${!messageSound ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Vibrate on Message
              </p>
            </div>
            <input
              type="checkbox"
              checked={messageVibrate}
              onChange={() => {
                setMessageVibrate(!messageVibrate);
                showToast(`Message vibration ${!messageVibrate ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Group Notifications */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Group Notifications
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Group Message Sounds
                </p>
                <p className="text-xs text-slate-400">Default (Pop)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={groupSound}
              onChange={() => {
                setGroupSound(!groupSound);
                showToast(`Group sounds ${!groupSound ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-500" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Reaction Notifications
              </p>
            </div>
            <input
              type="checkbox"
              checked={reactionNotifications}
              onChange={() => {
                setReactionNotifications(!reactionNotifications);
                showToast(`Reaction notifications ${!reactionNotifications ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Call Notifications */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Call Notifications
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Ringtone
                </p>
                <p className="text-xs text-slate-400">Default (Digital Ring)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={callRingtone}
              onChange={() => {
                setCallRingtone(!callRingtone);
                showToast(`Call ringtone ${!callRingtone ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
