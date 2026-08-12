import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-between h-full min-h-screen bg-slate-950 text-white p-6 select-none">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 ring-4 ring-emerald-400/20">
            <MessageSquare className="w-12 h-12 text-slate-950 fill-slate-950 stroke-[2]" />
          </div>
          <div className="absolute -top-1 -right-1 bg-emerald-400 rounded-full p-1.5 ring-4 ring-slate-950 shadow-md">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-black tracking-tight text-white">
            HTTP <span className="text-emerald-400">CHAT</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">
            Real-time, end-to-end encrypted mobile messaging
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Secured by Firebase</span>
      </motion.div>
    </div>
  );
};
