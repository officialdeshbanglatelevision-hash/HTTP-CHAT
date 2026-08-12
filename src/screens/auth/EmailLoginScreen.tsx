import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const EmailLoginScreen: React.FC = () => {
  const { signInWithEmail } = useAuth();
  const { goBack, navigateTo, showToast } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      showToast('Logged in successfully!', 'success');
      navigateTo('chats');
    } catch (error: any) {
      console.error('Email Login Error:', error);
      showToast(error.message || 'Failed to log in.', 'error');
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
          <h1 className="text-2xl font-black tracking-tight text-white">
            Email Login
          </h1>
          <p className="text-xs text-slate-400">
            Sign in with your email and password to access your chats.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div className="relative">
            <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-13 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => navigateTo('forgot_password')}
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>

      <div className="text-center pt-6">
        <p className="text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={() => navigateTo('register')}
            className="font-bold text-emerald-400 hover:underline"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
};
