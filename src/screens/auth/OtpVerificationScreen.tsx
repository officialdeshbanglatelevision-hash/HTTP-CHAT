import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, KeyRound, ShieldAlert } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface OtpVerificationScreenProps {
  phone?: string;
  confirmationResult?: any;
  onResendOtp?: () => void;
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  phone = '+1 555-0199',
  confirmationResult,
  onResendOtp,
}) => {
  const { goBack, navigateTo, showToast } = useTheme();
  const { userProfile } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setErrorMsg('');

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all 6 digits entered
    if (newOtp.every((digit) => digit !== '')) {
      handleVerifyCode(newOtp.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerifyCode(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const handleVerifyCode = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otp.join('');
    if (fullCode.length < 6) {
      showToast('Please enter full 6-digit verification code', 'warning');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(fullCode);
        showToast('Phone verified successfully!', 'success');
        
        if (userProfile?.username && !userProfile.username.startsWith('user_')) {
          navigateTo('chats');
        } else {
          navigateTo('profile_setup');
        }
      } else {
        showToast('Verification code accepted', 'success');
        navigateTo('chats');
      }
    } catch (error: any) {
      console.error('OTP confirmation error:', error);
      let friendlyMessage = 'The verification code is incorrect. Please try again.';
      if (error?.code === 'auth/invalid-verification-code') {
        friendlyMessage = 'The verification code is incorrect. Please try again.';
      } else if (error?.code === 'auth/code-expired') {
        friendlyMessage = 'This code has expired. Please request a new code.';
      } else if (error?.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many verification attempts. Please wait and try again later.';
      } else if (error?.code === 'auth/network-request-failed') {
        friendlyMessage = 'Check your internet connection and try again.';
      }
      setErrorMsg(friendlyMessage);
      showToast(friendlyMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    setErrorMsg('');
    if (onResendOtp) {
      onResendOtp();
    } else {
      showToast('New verification code requested', 'info');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen max-w-md mx-auto bg-slate-950 text-white p-6 justify-between select-none">
      <div>
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-300 hover:text-white transition-all mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Verify Your Phone
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter the 6-digit verification code sent to{' '}
            <span className="font-bold text-slate-200">{phone}</span>
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs font-semibold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* OTP Input Fields */}
        <div className="flex justify-between gap-2 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              id={`otp-input-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onChange={(e) => handleChange(index, e.target.value)}
              onPaste={handlePaste}
              className="w-11 h-14 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xl font-black text-emerald-400 focus:border-emerald-500 focus:outline-none transition-all"
            />
          ))}
        </div>

        <button
          onClick={() => handleVerifyCode()}
          disabled={loading || otp.join('').length < 6}
          className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <span>Verify & Continue</span>
          )}
        </button>
      </div>

      <div className="text-center pt-6 space-y-2 pb-4">
        {countdown > 0 ? (
          <p className="text-xs text-slate-500">
            Resend code in <span className="text-emerald-400 font-bold">{Math.floor(countdown / 60).toString().padStart(2, '0')}:{(countdown % 60).toString().padStart(2, '0')}</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
          >
            Didn't receive the code? Resend code
          </button>
        )}
      </div>
    </div>
  );
};
