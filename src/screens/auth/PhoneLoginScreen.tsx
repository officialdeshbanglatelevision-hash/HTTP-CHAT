import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Phone, Globe2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
];

export const PhoneLoginScreen: React.FC<{ onOtpSent?: (confirmation: any, phone: string) => void }> = ({
  onOtpSent,
}) => {
  const { setupRecaptcha, sendPhoneOtp } = useAuth();
  const { goBack, navigateTo, showToast } = useTheme();

  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      showToast('Please enter your phone number', 'warning');
      return;
    }

    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
    setLoading(true);

    try {
      const recaptcha = setupRecaptcha('recaptcha-container');
      const confirmationResult = await sendPhoneOtp(fullPhone, recaptcha);
      showToast('Verification code sent!', 'success');
      if (onOtpSent) {
        onOtpSent(confirmationResult, fullPhone);
      }
      navigateTo('otp_verification');
    } catch (error: any) {
      console.error('Phone Auth Error:', error);
      showToast(error.message || 'Failed to send OTP code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-950 text-white p-6 justify-between">
      {/* Invisible Recaptcha */}
      <div id="recaptcha-container"></div>

      <div>
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-300 hover:text-white transition-all mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-black tracking-tight text-white">
            Enter Phone Number
          </h1>
          <p className="text-xs text-slate-400">
            HTTP CHAT will send an SMS with a 6-digit verification code.
          </p>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="flex gap-2">
            {/* Country Selector */}
            <div className="relative">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-13 bg-slate-900 text-white border border-slate-800 rounded-2xl px-3 text-sm font-bold appearance-none pr-8 cursor-pointer focus:border-emerald-500 focus:outline-none"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Input */}
            <div className="flex-1 relative">
              <input
                type="tel"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full h-13 bg-slate-900 border border-slate-800 rounded-2xl px-4 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>
        </form>
      </div>

      <div className="text-center pt-6">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" /> Standard SMS rates may apply.
        </p>
      </div>
    </div>
  );
};
