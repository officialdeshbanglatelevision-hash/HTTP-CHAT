import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { CircleDashed, Camera, Edit3, Image, Plus } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const UpdatesScreen: React.FC = () => {
  const { showToast } = useTheme();

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* My Status Section */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Status
        </h2>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                <CircleDashed className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                My Status
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add a status update
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => showToast('Camera status control (UI prototype)')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Camera status"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={() => showToast('Text status control (UI prototype)')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Text status"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => showToast('Gallery status control (UI prototype)')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Gallery status"
            >
              <Image className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Updates Empty State */}
      <div className="flex-1 p-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Recent Updates
        </h2>

        <EmptyState
          icon={CircleDashed}
          title="No updates yet"
          description="Status updates from your contacts will appear here."
          actionLabel="Add Status Update"
          onAction={() => showToast('Add status update control (UI prototype)')}
        />
      </div>
    </div>
  );
};
