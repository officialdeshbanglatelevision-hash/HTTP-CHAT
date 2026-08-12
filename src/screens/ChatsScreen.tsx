import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Plus, Search, Loader2, Users } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

interface ChatsScreenProps {
  onOpenNewGroupModal: () => void;
}

export const ChatsScreen: React.FC<ChatsScreenProps> = () => {
  const { navigateTo } = useTheme();
  const { chats, setActiveChatId, loadingChats } = useChat();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters: { id: typeof filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'groups', label: 'Groups' },
  ];

  const filteredChats = chats.filter((c) => {
    if (filter === 'groups' && c.type !== 'group') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchMsg = c.lastMessageText?.toLowerCase().includes(q);
      return matchName || matchMsg;
    }
    return true;
  });

  const handleOpenChat = (chatId: string, type: 'individual' | 'group') => {
    setActiveChatId(chatId);
    if (type === 'group') {
      navigateTo('individual_chat');
    } else {
      navigateTo('individual_chat');
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Search Bar & Filters */}
      <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 ring-accent transition-all shadow-sm"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                filter === f.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-2 sm:p-4">
        {loadingChats ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs font-semibold">Loading conversations...</span>
          </div>
        ) : filteredChats.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Start a new conversation or search for users by @username."
            actionLabel="Start New Chat"
            onAction={() => navigateTo('new_chat')}
          />
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <button
                key={chat.chatId}
                onClick={() => handleOpenChat(chat.chatId, chat.type)}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-all text-left group"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm overflow-hidden">
                    {chat.photoURL ? (
                      <img src={chat.photoURL} alt={chat.name || 'Chat'} className="w-full h-full object-cover" />
                    ) : chat.type === 'group' ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      (chat.name || 'Chat').slice(0, 2).toUpperCase()
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-500 transition-colors">
                      {chat.name || 'Chat'}
                    </p>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      Just now
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {chat.lastMessageSenderName ? `${chat.lastMessageSenderName}: ` : ''}
                    {chat.lastMessageText || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-30">
        <button
          onClick={() => navigateTo('new_chat')}
          className="w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg accent-glow active:scale-95 transition-all duration-150"
          title="New Chat"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
