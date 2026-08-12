import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Info, ShieldCheck, Code, Sparkles, CheckCircle2 } from 'lucide-react';

export const AboutScreen: React.FC = () => {
  const { showToast } = useTheme();

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Brand Hero Card */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col items-center text-center gap-4 shadow-xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-lg tracking-wider shadow-lg shadow-emerald-500/20">
          HTTP
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">HTTP CHAT</h2>
          <p className="text-xs text-emerald-400 font-mono mt-1">Version 1.0.0 (UI Prototype Edition)</p>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
          A modern, high-performance messaging interface designed for speed, clarity, and mobile-first elegance.
        </p>
      </div>

      {/* Specifications */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Architecture & Design System
        </h3>

        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Framework</span>
            <span className="font-semibold">React 19 + TypeScript</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Styling</span>
            <span className="font-semibold">Tailwind CSS v4</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Motion System</span>
            <span className="font-semibold">Motion (Framer)</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Icon Library</span>
            <span className="font-semibold">Lucide React</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-500">Data Integrity</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pure UI (No Fake Data)
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => showToast('HTTP CHAT Prototype v1.0.0 is up to date')}
          className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Check for Updates
        </button>
      </div>
    </div>
  );
};
