import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { securityService } from '../services/securityService';
import { ArrowLeft, Phone, Mail, ShieldCheck, Lock, Trash2, CheckCircle, AlertCircle, KeyRound, ChevronRight } from 'lucide-react';

export const AccountSettingsScreen: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile, sendPasswordReset, logout } = useAuth();
  const { setActiveScreen, showToast } = useTheme();

  // Phone state
  const [phoneInput, setPhoneInput] = useState(userProfile?.phoneNumber || '');
  const [editingPhone, setEditingPhone] = useState(false);

  // Email state
  const [emailInput, setEmailInput] = useState(userProfile?.email || '');
  const [editingEmail, setEditingEmail] = useState(false);

  // Two-step Verification state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(userProfile?.twoFactorEnabled || false);
  const [pinInput, setPinInput] = useState(userProfile?.twoFactorPin || '');
  const [editingTwoFactor, setEditingTwoFactor] = useState(false);

  const handleSavePhone = async () => {
    if (!currentUser) return;
    try {
      await updateUserProfile({ phoneNumber: phoneInput.trim() });
      await securityService.logEvent(
        currentUser.uid,
        'phone_changed',
        'Phone Number Updated',
        `Phone number changed to ${phoneInput.trim()}`
      );
      showToast('Phone number updated successfully', 'success');
      setEditingPhone(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update phone number', 'error');
    }
  };

  const handleSaveEmail = async () => {
    if (!currentUser) return;
    try {
      await updateUserProfile({ email: emailInput.trim() });
      await securityService.logEvent(
        currentUser.uid,
        'email_changed',
        'Email Address Updated',
        `Account email updated to ${emailInput.trim()}`
      );
      showToast('Email address updated successfully', 'success');
      setEditingEmail(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update email address', 'error');
    }
  };

  const handleToggleTwoFactor = async () => {
    if (!currentUser) return;
    const nextState = !twoFactorEnabled;
    try {
      await updateUserProfile({ twoFactorEnabled: nextState, twoFactorPin: pinInput });
      setTwoFactorEnabled(nextState);
      await securityService.logEvent(
        currentUser.uid,
        'two_factor_updated',
        'Two-Step Verification Updated',
        `Two-Step Verification ${nextState ? 'enabled' : 'disabled'}`
      );
      showToast(`Two-Step Verification ${nextState ? 'enabled' : 'disabled'}`, 'success');
      setEditingTwoFactor(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update Two-Step Verification', 'error');
    }
  };

  const handlePasswordReset = async () => {
    if (!userProfile?.email) {
      showToast('No email address associated with account.', 'error');
      return;
    }
    try {
      await sendPasswordReset(userProfile.email);
      showToast(`Password reset email sent to ${userProfile.email}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send password reset email', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      try {
        await logout();
        showToast('Account deleted', 'info');
        setActiveScreen('auth_screen');
      } catch (e) {
        showToast('Error deleting account', 'error');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveScreen('settings')}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Settings</span>
        </button>
        <h1 className="text-base font-bold text-slate-100">Account & Security</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-6">
        {/* Account Identity Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-4 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Account Identity
          </span>

          {/* Immutable Auth UID */}
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">
              Permanent Identity UID
            </span>
            <code className="text-xs font-mono text-emerald-400 break-all select-all">
              {userProfile?.uid}
            </code>
          </div>

          {/* Phone Number */}
          <div className="space-y-2 pt-1 border-t border-slate-700/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">Phone Number</span>
              </div>
              <button
                onClick={() => setEditingPhone(!editingPhone)}
                className="text-xs text-emerald-400 hover:underline font-medium"
              >
                {editingPhone ? 'Cancel' : 'Change'}
              </button>
            </div>

            {editingPhone ? (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSavePhone}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 pl-6">
                {userProfile?.phoneNumber || 'No phone number added'}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-2 pt-1 border-t border-slate-700/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200">Email Address</span>
              </div>
              <button
                onClick={() => setEditingEmail(!editingEmail)}
                className="text-xs text-emerald-400 hover:underline font-medium"
              >
                {editingEmail ? 'Cancel' : 'Change'}
              </button>
            </div>

            {editingEmail ? (
              <div className="flex gap-2 pt-1">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveEmail}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 pl-6">{userProfile?.email || 'No email associated'}</p>
            )}
          </div>
        </div>

        {/* Security & Verification Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-4 shadow-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Security & Verification
          </span>

          {/* Password Reset */}
          <button
            onClick={handlePasswordReset}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-white">Change / Reset Password</p>
                <p className="text-[10px] text-slate-400">Send password reset email link</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* Two-Step Verification */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-white">Two-Step Verification</p>
                  <p className="text-[10px] text-slate-400">Require PIN code on new logins</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTwoFactor(!editingTwoFactor)}
                className="text-xs text-emerald-400 hover:underline font-medium"
              >
                {editingTwoFactor ? 'Cancel' : twoFactorEnabled ? 'Configure' : 'Enable'}
              </button>
            </div>

            {editingTwoFactor && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-[11px] text-slate-300 block">Set 4 to 6-Digit Passcode PIN:</label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-center text-lg font-mono font-bold text-emerald-400"
                />
                <button
                  onClick={handleToggleTwoFactor}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
                >
                  {twoFactorEnabled ? 'Disable Two-Step Verification' : 'Enable Two-Step Verification'}
                </button>
              </div>
            )}
          </div>

          {/* Security Log Link */}
          <button
            onClick={() => setActiveScreen('security_activity')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs font-bold text-white">Security Activity Log</p>
                <p className="text-[10px] text-slate-400">View recent security events and login activity</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Delete Account */}
        <div className="pt-2">
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
