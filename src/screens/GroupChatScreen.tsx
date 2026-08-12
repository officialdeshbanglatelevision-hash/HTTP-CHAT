import React, { useState } from 'react';
import { useTheme, WALLPAPER_COLLECTION } from '../context/ThemeContext';
import { Users, Search, Info, RefreshCw } from 'lucide-react';
import { MessageComposer } from '../components/chat/MessageComposer';
import { ChatMessageBubble } from '../components/chat/ChatMessageBubble';
import { EditMessageModal } from '../components/chat/EditMessageModal';
import { ChatMessage, ReplyTarget } from '../types/chat';
import { getGroupedMessages } from '../utils/chatGrouping';

const INITIAL_GROUP_MESSAGES: ChatMessage[] = [
  {
    id: 'grp-1',
    sender: 'other',
    senderName: 'Alex Rivera',
    text: 'Hey team! Welcome to the Project Alpha group discussion.',
    timestamp: '09:30 AM',
  },
  {
    id: 'grp-2',
    sender: 'other',
    senderName: 'Alex Rivera',
    text: 'Did everyone check out the latest design system and message grouping features?',
    timestamp: '09:30 AM',
    reactions: {
      '👍': { emoji: '👍', count: 3, users: ['me', 'Maya', 'John'], reactedByMe: true },
      '🎉': { emoji: '🎉', count: 2, users: ['Maya', 'John'], reactedByMe: false },
    },
  },
  {
    id: 'grp-3',
    sender: 'other',
    senderName: 'Maya Patel',
    text: 'Yes! The accent colors and dark mode theme switching look crisp.',
    timestamp: '09:32 AM',
  },
  {
    id: 'grp-4',
    sender: 'other',
    senderName: 'Maya Patel',
    text: 'And grouping consecutive messages by sender hides duplicate avatars while keeping alignment perfect!',
    timestamp: '09:32 AM',
    reactions: {
      '❤️': { emoji: '❤️', count: 2, users: ['me', 'Alex'], reactedByMe: true },
    },
  },
  {
    id: 'grp-5',
    sender: 'me',
    text: 'Just tested out emoji reactions and message management!',
    timestamp: '09:35 AM',
    status: 'read',
  },
  {
    id: 'grp-6',
    sender: 'me',
    text: 'Long press or hover over any message to react, edit, reply, or delete.',
    timestamp: '09:35 AM',
    status: 'read',
    reactions: {
      '🔥': { emoji: '🔥', count: 2, users: ['Alex', 'Maya'], reactedByMe: false },
    },
  },
];

export const GroupChatScreen: React.FC = () => {
  const { navigateTo, showToast, wallpaper } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_GROUP_MESSAGES);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  const currentWallpaper = WALLPAPER_COLLECTION[wallpaper] || WALLPAPER_COLLECTION.default;
  const groupedMessages = getGroupedMessages(messages, 5);

  const handleReact = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const currentReactions = { ...(msg.reactions || {}) };
        const existing = currentReactions[emoji];

        if (existing) {
          if (existing.reactedByMe) {
            if (existing.count <= 1) {
              delete currentReactions[emoji];
            } else {
              currentReactions[emoji] = {
                ...existing,
                count: existing.count - 1,
                reactedByMe: false,
                users: existing.users.filter((u) => u !== 'me'),
              };
            }
          } else {
            currentReactions[emoji] = {
              ...existing,
              count: existing.count + 1,
              reactedByMe: true,
              users: [...existing.users, 'me'],
            };
          }
        } else {
          currentReactions[emoji] = {
            emoji,
            count: 1,
            users: ['me'],
            reactedByMe: true,
          };
        }

        return { ...msg, reactions: currentReactions };
      })
    );
  };

  const handleSendMessage = (text: string, replyTo?: ReplyTarget) => {
    const newMessage: ChatMessage = {
      id: `grp-${Date.now()}`,
      sender: 'me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      replyTo,
    };

    setMessages((prev) => [...prev, newMessage]);
    showToast('Group message sent');
  };

  const handleEditSave = (messageId: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              text: newText,
              isEdited: true,
            }
          : msg
      )
    );
    showToast('Group message updated');
  };

  const handleDeleteForEveryone = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              text: 'This message was deleted',
              isDeletedForEveryone: true,
              reactions: {},
            }
          : msg
      )
    );
    showToast('Deleted for everyone');
  };

  const handleDeleteForMe = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    showToast('Deleted for you');
  };

  return (
    <div className={`flex flex-col min-h-[calc(100vh-4rem)] transition-colors ${currentWallpaper.className}`}>
      {/* Sub-Header for Group Chat */}
      <div className="p-3 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 sticky top-16 z-20 backdrop-blur-md">
        <button
          onClick={() => navigateTo('chat_info')}
          className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              Project Alpha Team
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Alex, Maya, Sarah, You
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => showToast('Search group messages')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMessages(INITIAL_GROUP_MESSAGES)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset Messages"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateTo('chat_info')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Group Info"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 space-y-1 overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="text-center my-2">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800/70 text-[10px] text-slate-600 dark:text-slate-400 font-medium shadow-2xs">
            👥 Group Created • End-to-end encrypted
          </span>
        </div>

        {groupedMessages.map(({ message, isFirstInGroup, isLastInGroup, showAvatar }) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            showAvatar={showAvatar}
            onReact={handleReact}
            onReply={(m) =>
              setReplyTarget({
                id: m.id,
                senderName: m.senderName || (m.sender === 'me' ? 'You' : 'Member'),
                text: m.text,
              })
            }
            onEdit={(m) => setEditingMessage(m)}
            onDeleteForEveryone={handleDeleteForEveryone}
            onDeleteForMe={handleDeleteForMe}
          />
        ))}
      </div>

      {/* Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        replyTarget={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
      />

      {/* Edit Modal */}
      <EditMessageModal
        message={editingMessage}
        isOpen={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={handleEditSave}
      />
    </div>
  );
};
