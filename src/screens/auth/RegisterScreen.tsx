import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Lock, User, AtSign, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const RegisterScreen: React.FC = () => {
  const { signUpWithEmail, checkUsernameAvailable } = useAuth();
  const { goBack, navigateTo, showToast } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Username checking state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  useEffect(() => {
    const clean = username.toLowerCase().trim();
    if (!clean) {
      setUsernameStatus('idle');
      return;
    }
    if (clean.length < 3 || !/^[a-z0-9_]{3,30}$/.test(clean)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(clean);
        setUsernameStatus(available ? 'available' : 'taken');
      } catch (e) {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Please fill out all fields', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }

    if (usernameStatus !== 'available') {
      showToast('Please choose a valid & available @username', 'warning');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, displayName.trim(), username.trim());
      showToast('Account created successfully!', 'success');
      navigateTo('chats');
    } catch (error: any) {
      console.error('Registration Error:', error);
      showToast(error.message || 'Failed to create account.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-950 text-white p-6 justify-between overflow-y-auto scrollbar-none">
      <div>
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-300 hover:text-white transition-all mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-black tracking-tight text-white">
            Create Account
          </h1>
          <p className="text-xs text-slate-400">
            Choose a unique @username and create your account.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Display Name */}
          <div className="relative">
            <User className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
            <input
              type="text"
              placeholder="Display Name (e.g. Alex Johnson)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-13 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Username */}
          <div className="relative">
            <AtSign className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
            <input
              type="text"
              placeholder="Unique Username (e.g. alex_j)"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full h-13 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-10 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <div className="absolute right-4 top-4">
              {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
              {usernameStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {usernameStatus === 'taken' && <XCircle className="w-5 h-5 text-rose-500" />}
              {usernameStatus === 'invalid' && <span className="text-[10px] text-amber-400 font-bold">min 3 chars</span>}
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
            <input
              type="password"
              placeholder="Password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-13 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-13 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || usernameStatus !== 'available'}
            className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>
      </div>

      <div className="text-center pt-6">
        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => navigateTo('email_login')}
            className="font-bold text-emerald-400 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
