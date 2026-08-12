import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto min-h-[50vh]"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-accent flex items-center justify-center mb-5 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10">
        <Icon className="w-8 h-8 stroke-[1.75]" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-xs">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="w-full py-2.5 px-5 rounded-xl bg-accent text-white font-medium text-sm shadow-sm accent-glow hover:brightness-105 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2"
          >
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="w-full py-2.5 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
};
