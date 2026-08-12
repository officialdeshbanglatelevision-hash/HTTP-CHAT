import React from 'react';

interface SkeletonProps {
  type: 'chat-list' | 'contact-list' | 'profile' | 'media' | 'settings';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ type, count = 4 }) => {
  if (type === 'chat-list' || type === 'contact-list') {
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 p-3.5 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-12" />
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="p-6 space-y-6 animate-pulse max-w-md mx-auto">
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        </div>
        <div className="space-y-4 pt-4">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === 'media') {
    return (
      <div className="p-4 grid grid-cols-3 gap-2 animate-pulse">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg" />
        ))}
      </div>
    );
  }

  if (type === 'settings') {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center px-4 gap-3">
            <div className="w-5 h-5 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return null;
};
