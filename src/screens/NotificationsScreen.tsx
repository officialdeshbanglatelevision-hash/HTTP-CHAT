import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Volume2, Vibrate, MessageSquare, Users, Phone, Terminal, Shield, Sparkles, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { requestAndRegisterFCMToken, checkSecureContext } from '../services/fcmService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const NotificationsScreen: React.FC = () => {
  const { showToast, navigateTo } = useTheme();
  const { currentUser } = useAuth();

  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);

  // Settings states
  const [messageSound, setMessageSound] = useState(true);
  const [messageVibrate, setMessageVibrate] = useState(true);
  const [groupSound, setGroupSound] = useState(true);
  const [callRingtone, setCallRingtone] = useState(true);
  const [reactionNotifications, setReactionNotifications] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [acpReplies, setAcpReplies] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  // Load notification settings from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const loadSettings = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'settings', 'notifications');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.messageSound !== undefined) setMessageSound(data.messageSound);
          if (data.messageVibrate !== undefined) setMessageVibrate(data.messageVibrate);
          if (data.groupSound !== undefined) setGroupSound(data.groupSound);
          if (data.callRingtone !== undefined) setCallRingtone(data.callRingtone);
          if (data.reactionNotifications !== undefined) setReactionNotifications(data.reactionNotifications);
          if (data.messagePreview !== undefined) setMessagePreview(data.messagePreview);
          if (data.securityAlerts !== undefined) setSecurityAlerts(data.securityAlerts);
          if (data.acpReplies !== undefined) setAcpReplies(data.acpReplies);
          if (data.eventReminders !== undefined) setEventReminders(data.eventReminders);
        }
      } catch (e) {
        console.error('Failed to load notification settings:', e);
      }
    };
    loadSettings();
  }, [currentUser]);

  const updateSetting = async (key: string, value: boolean) => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'settings', 'notifications');
      await setDoc(docRef, { [key]: value, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.error('Failed to save notification setting:', e);
    }
  };

  const handleEnableNotifications = async () => {
    if (!currentUser) {
      showToast('Please sign in to enable push notifications', 'error');
      return;
    }
    if (!checkSecureContext()) {
      showToast('Push notifications require a secure context (HTTPS or localhost)', 'error');
      return;
    }

    setLoading(true);
    try {
      await requestAndRegisterFCMToken(currentUser.uid);
      setPermissionState('granted');
      setShowExplanation(false);
      showToast('Push notifications successfully enabled and registered!', 'success');
    } catch (err: any) {
      console.error('Failed to enable notifications:', err);
      setPermissionState(Notification.permission);
      showToast(err.message || 'Failed to enable notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bell className="w-6 h-6 text-emerald-500" />
          Notification Settings
        </h2>
        <button
          onClick={() => navigateTo('notification_debug')}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <Terminal className="w-4 h-4" />
          FCM Diagnostics
        </button>
      </div>

      {/* HTTP CHAT Explanation / Permission Request Banner */}
      {showExplanation && permissionState !== 'granted' && (
        <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Stay connected with new messages, calls and important updates.
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enable browser push notifications to receive real-time alerts even when HTTP CHAT is in the background or minimized.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowExplanation(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          </div>
        </div>
      )}

      {/* Permission Status Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {permissionState === 'granted' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : permissionState === 'denied' ? (
              <XCircle className="w-5 h-5 text-rose-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Browser Permission Status</p>
            <p className="text-xs text-slate-400 capitalize">
              {permissionState === 'granted'
                ? 'Notifications are enabled'
                : permissionState === 'denied'
                ? 'Notifications are blocked by your browser settings.'
                : 'Notifications are currently disabled.'}
            </p>
          </div>
        </div>
        {permissionState !== 'granted' && (
          <button
            onClick={handleEnableNotifications}
            disabled={loading}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            Enable
          </button>
        )}
      </div>

      {/* Privacy: Message Preview */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Notification Privacy
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Message Preview</p>
            <p className="text-xs text-slate-400">Show message text in push notifications or hide for privacy</p>
          </div>
          <input
            type="checkbox"
            checked={messagePreview}
            onChange={async () => {
              const newVal = !messagePreview;
              setMessagePreview(newVal);
              await updateSetting('messagePreview', newVal);
              showToast(`Message preview ${newVal ? 'enabled' : 'hidden'}`);
            }}
            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Message Notifications */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Messages & Groups
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notification Tone</p>
                <p className="text-xs text-slate-400">Default (Chime)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={messageSound}
              onChange={async () => {
                const newVal = !messageSound;
                setMessageSound(newVal);
                await updateSetting('messageSound', newVal);
                showToast(`Message sounds ${newVal ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vibrate on Message</p>
            </div>
            <input
              type="checkbox"
              checked={messageVibrate}
              onChange={async () => {
                const newVal = !messageVibrate;
                setMessageVibrate(newVal);
                await updateSetting('messageVibrate', newVal);
                showToast(`Message vibration ${newVal ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-500" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Group Message Sounds</p>
            </div>
            <input
              type="checkbox"
              checked={groupSound}
              onChange={async () => {
                const newVal = !groupSound;
                setGroupSound(newVal);
                await updateSetting('groupSound', newVal);
                showToast(`Group sounds ${newVal ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-500" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reaction Notifications</p>
            </div>
            <input
              type="checkbox"
              checked={reactionNotifications}
              onChange={async () => {
                const newVal = !reactionNotifications;
                setReactionNotifications(newVal);
                await updateSetting('reactionNotifications', newVal);
                showToast(`Reaction notifications ${newVal ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Call & ACP Notifications */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Calls & ACP Assistant
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ringtone</p>
                <p className="text-xs text-slate-400">Default (Digital Ring)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={callRingtone}
              onChange={async () => {
                const newVal = !callRingtone;
                setCallRingtone(newVal);
                await updateSetting('callRingtone', newVal);
                showToast(`Call ringtone ${newVal ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">ACP AI Assistant Replies</p>
            </div>
            <input
              type="checkbox"
              checked={acpReplies}
              onChange={async () => {
                const newVal = !acpReplies;
                setAcpReplies(newVal);
                await updateSetting('acpReplies', newVal);
                showToast(`ACP replies notifications ${newVal ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Security & Events */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Security & Events
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-rose-500" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">New Login & Linked Device Alerts</p>
            </div>
            <input
              type="checkbox"
              checked={securityAlerts}
              onChange={async () => {
                const newVal = !securityAlerts;
                setSecurityAlerts(newVal);
                await updateSetting('securityAlerts', newVal);
                showToast(`Security alerts ${newVal ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
