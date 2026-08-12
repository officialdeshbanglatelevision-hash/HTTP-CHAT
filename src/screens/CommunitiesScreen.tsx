import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Users, Plus, Compass } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

interface CommunitiesScreenProps {
  onOpenNewCommunityModal: () => void;
}

export const CommunitiesScreen: React.FC<CommunitiesScreenProps> = ({
  onOpenNewCommunityModal,
}) => {
  const { showToast } = useTheme();

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Community Action Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          onClick={onOpenNewCommunityModal}
          className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Community</span>
        </button>

        <button
          onClick={() => showToast('Discover Communities view (UI prototype)')}
          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Compass className="w-4 h-4 text-cyan-500" />
          <span>Discover Communities</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="flex-1 p-4">
        <EmptyState
          icon={Users}
          title="No communities yet"
          description="Communities you create or join will appear here."
          actionLabel="New Community"
          onAction={onOpenNewCommunityModal}
        />
      </div>
    </div>
  );
};
