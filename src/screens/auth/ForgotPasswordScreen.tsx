import React, { useState } from 'react';
import { ArrowLeft, Mail, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const ForgotPasswordScreen: React.FC = () => {
  const { sendPasswordReset } = useAuth();
  const { goBack, navigateTo, showToast } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email', 'warning');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
      showToast('Password reset link sent to your email!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to send reset link', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-950 text-white p-6 justify-between">
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
            Reset Password
          </h1>
          <p className="text-xs text-slate-400">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-13 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-2">
            <p className="text-sm font-bold text-emerald-400">Check Your Inbox</p>
            <p className="text-xs text-slate-300">
              We've sent a password reset email to <span className="font-semibold text-white">{email}</span>.
            </p>
            <button
              onClick={() => navigateTo('email_login')}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold text-white border border-slate-800"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>

      <div className="text-center pt-6">
        <button
          onClick={() => navigateTo('email_login')}
          className="text-xs font-bold text-slate-400 hover:text-white"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};
