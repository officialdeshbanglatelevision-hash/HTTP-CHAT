import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Image, Video, FileText, FolderOpen } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const MediaViewerScreen: React.FC = () => {
  const { showToast } = useTheme();
  const [category, setCategory] = useState<'images' | 'videos' | 'documents'>('images');

  const categories = [
    { id: 'images', label: 'Images', icon: Image },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Category Tabs */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Empty State */}
      <div className="flex-1 p-4">
        <EmptyState
          icon={FolderOpen}
          title="No media available"
          description={`Shared ${category} in conversations will be organized and accessible here.`}
          actionLabel="Upload Media Control"
          onAction={() => showToast('Media selector control (UI prototype)')}
        />
      </div>
    </div>
  );
};
