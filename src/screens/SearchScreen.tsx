import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  MessageSquare,
  User,
  Users,
  Image,
  FileText,
  Link,
  X,
} from 'lucide-react';
import { SearchCategory } from '../types';
import { EmptyState } from '../components/common/EmptyState';

export const SearchScreen: React.FC = () => {
  const { showToast } = useTheme();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');

  const categories: { id: SearchCategory; label: string; icon: typeof Search }[] = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'contacts', label: 'Contacts', icon: User },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'links', label: 'Links', icon: Link },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Search Input & Filter Chips */}
      <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search HTTP CHAT..."
            autoFocus
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all ${
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
          icon={Search}
          title={query ? `No results for "${query}"` : 'Search your conversations and contacts'}
          description={
            query
              ? 'No matching conversations or content found in local index.'
              : 'Type keywords, contact names, or search parameters above to search across HTTP CHAT.'
          }
        />
      </div>
    </div>
  );
};
