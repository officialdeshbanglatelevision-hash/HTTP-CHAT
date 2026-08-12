import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Shield, Key, Lock, Smartphone, Check, ChevronRight, AlertCircle } from 'lucide-react';

export const SecurityScreen: React.FC = () => {
  const { showToast } = useTheme();

  const [secNotifications, setSecNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [passkeys, setPasskeys] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Encryption Overview */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 text-slate-100 border border-emerald-500/30 space-y-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">End-to-End Encryption</h3>
            <p className="text-xs text-emerald-300">HTTP CHAT Security Standard</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Your personal messages and calls are secured with end-to-end encryption. Nobody outside of your chats can read or listen to them.
        </p>
      </div>

      {/* Security Options */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Protection Settings
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          {/* Security Notifications */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Security Notifications
                </p>
                <p className="text-xs text-slate-400">Get notified when a contact’s security code changes</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={secNotifications}
              onChange={() => {
                setSecNotifications(!secNotifications);
                showToast(`Security notifications ${!secNotifications ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          {/* Two-step verification */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Two-Step Verification
                </p>
                <p className="text-xs text-slate-400">Require a personal PIN when registering your number</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={twoFactor}
              onChange={() => {
                setTwoFactor(!twoFactor);
                showToast(`Two-step verification ${!twoFactor ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          {/* Passkeys */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Passkeys
                </p>
                <p className="text-xs text-slate-400">Use fingerprint, face, or screen lock to sign in</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={passkeys}
              onChange={() => {
                setPasskeys(!passkeys);
                showToast(`Passkey registration ${!passkeys ? 'enabled' : 'disabled'}`);
              }}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Linked Devices */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Device Management
        </h3>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2 shadow-sm">
          <Smartphone className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No active linked devices
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active web or desktop sessions will be managed here.
          </p>
        </div>
      </div>
    </div>
  );
};
