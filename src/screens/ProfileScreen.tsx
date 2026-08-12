import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { User, Camera, QrCode, Edit3, Phone, Info, Check } from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { showToast } = useTheme();
  const [displayName, setDisplayName] = useState('Display Name Placeholder');
  const [aboutText, setAboutText] = useState('Available • HTTP CHAT User');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    showToast('Profile information saved locally (UI prototype)');
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Profile Image & Avatar Placeholder */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center text-slate-400">
            <User className="w-14 h-14" />
          </div>
          <button
            onClick={() => showToast('Change profile photo control (UI prototype)')}
            className="absolute bottom-0 right-0 p-2.5 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-transform active:scale-95"
            title="Upload Profile Photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload photo or customize avatar
        </p>
      </div>

      {/* Edit Toggle / Action */}
      <div className="flex justify-end">
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {isEditing ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Save Profile
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5 text-emerald-500" /> Edit Profile
            </>
          )}
        </button>
      </div>

      {/* Profile Fields */}
      <div className="space-y-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Display Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Display Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          ) : (
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            This name will be visible to your contacts on HTTP CHAT.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            About
          </label>
          {isEditing ? (
            <input
              type="text"
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          ) : (
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-sm text-slate-700 dark:text-slate-300">{aboutText}</p>
            </div>
          )}
        </div>

        {/* Account Info Section */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Phone / Account Handle
          </label>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-sm font-mono text-slate-600 dark:text-slate-400">
              Not linked (UI Prototype Mode)
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Placeholder Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-3">
        <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-3 text-slate-400">
          <QrCode className="w-16 h-16 stroke-[1.25]" />
          <span className="text-[10px] font-medium mt-1">QR CODE</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Your Contact QR Code</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scan to quickly share your HTTP CHAT account link.
          </p>
        </div>
        <button
          onClick={() => showToast('Share QR Code control (UI prototype)')}
          className="py-2 px-4 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-medium text-xs hover:bg-emerald-600/20 transition-colors"
        >
          Share QR Code
        </button>
      </div>
    </div>
  );
};
