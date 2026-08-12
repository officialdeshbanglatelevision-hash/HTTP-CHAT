import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Lock, Eye, User, Info, CircleDashed, Users, Phone, ShieldOff, ChevronRight, CheckCheck } from 'lucide-react';
import { PrivacyOption } from '../types';

export const PrivacyScreen: React.FC = () => {
  const { showToast } = useTheme();

  const [lastSeen, setLastSeen] = useState<PrivacyOption>('my_contacts');
  const [profilePhoto, setProfilePhoto] = useState<PrivacyOption>('everyone');
  const [aboutPrivacy, setAboutPrivacy] = useState<PrivacyOption>('everyone');
  const [readReceipts, setReadReceipts] = useState<boolean>(
    () => localStorage.getItem('http_chat_read_receipts') !== 'false'
  );

  const toggleReadReceipts = () => {
    const nextVal = !readReceipts;
    setReadReceipts(nextVal);
    localStorage.setItem('http_chat_read_receipts', String(nextVal));
    showToast(nextVal ? 'Read receipts enabled' : 'Read receipts disabled');
  };

  const privacySelectOptions: { id: PrivacyOption; label: string }[] = [
    { id: 'everyone', label: 'Everyone' },
    { id: 'my_contacts', label: 'My Contacts' },
    { id: 'nobody', label: 'Nobody' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Privacy Overview */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Who can see my personal info
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          {/* Last Seen & Online */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Last Seen & Online
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {privacySelectOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setLastSeen(opt.id);
                    showToast(`Last seen set to ${opt.label}`);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors ${
                    lastSeen === opt.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Profile Photo */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Profile Photo Visibility
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {privacySelectOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setProfilePhoto(opt.id);
                    showToast(`Profile photo visibility set to ${opt.label}`);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors ${
                    profilePhoto === opt.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                About Info Visibility
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {privacySelectOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setAboutPrivacy(opt.id);
                    showToast(`About visibility set to ${opt.label}`);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors ${
                    aboutPrivacy === opt.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Read Receipts Toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Read Receipts
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
                If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.
              </p>
            </div>
            <button
              onClick={toggleReadReceipts}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ml-4 ${
                readReceipts ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  readReceipts ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Blocked Contacts */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
          Blocked Contacts
        </h3>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2 shadow-sm">
          <ShieldOff className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No blocked contacts
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Blocked contacts will be listed here.
          </p>
        </div>
      </div>
    </div>
  );
};
