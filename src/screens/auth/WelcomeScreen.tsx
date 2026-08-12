import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Phone, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const WelcomeScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const { navigateTo, showToast } = useTheme();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast('Welcome to HTTP CHAT!', 'success');
      navigateTo('chats');
    } catch (error: any) {
      showToast(error.message || 'Google Sign-In failed', 'error');
    }
  };

  return (
    <div className="flex flex-col justify-between h-full min-h-screen bg-slate-950 text-white p-6">
      <div className="pt-10 space-y-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
        >
          <MessageSquare className="w-10 h-10 text-emerald-400 stroke-[2.2]" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome to <span className="text-emerald-400">HTTP CHAT</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Connect instantly with friends and communities in real time.
          </p>
        </div>
      </div>

      <div className="space-y-3 pb-8">
        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full h-13 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Phone Sign In */}
        <button
          onClick={() => navigateTo('phone_login')}
          className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98]"
        >
          <Phone className="w-5 h-5 text-emerald-100" />
          <span>Continue with Phone</span>
        </button>

        {/* Email Sign In */}
        <button
          onClick={() => navigateTo('email_login')}
          className="w-full h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center gap-3 border border-slate-800 transition-all active:scale-[0.98]"
        >
          <Mail className="w-5 h-5 text-slate-400" />
          <span>Continue with Email</span>
        </button>

        <div className="pt-2 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={() => navigateTo('register')}
              className="text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              Create account
            </button>
          </p>
        </div>

        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-500">
            By continuing, you agree to HTTP CHAT's Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
