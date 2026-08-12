import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

export const ErrorStateScreen: React.FC = () => {
  const { goBack, showToast } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto min-h-[60vh]">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-5 ring-1 ring-rose-500/20">
        <AlertTriangle className="w-8 h-8 stroke-[1.75]" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
        Something went wrong
      </h3>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        An unhandled UI state or network condition was simulated.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <button
          onClick={() => showToast('Simulated retry action executed')}
          className="w-full py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        <button
          onClick={goBack}
          className="w-full py-2.5 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
};
