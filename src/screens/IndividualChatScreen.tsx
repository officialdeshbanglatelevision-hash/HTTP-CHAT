import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme, WALLPAPER_COLLECTION } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import { Phone, Video, Info, ArrowLeft, Loader2 } from 'lucide-react';
import { MessageComposer } from '../components/chat/MessageComposer';
import { ChatMessageBubble } from '../components/chat/ChatMessageBubble';
import { EditMessageModal } from '../components/chat/EditMessageModal';
import { CreateEventModal } from '../components/chat/CreateEventModal';
import { ChatMessage, ReplyTarget, EventDetails, UserProfile } from '../types/chat';
import { getGroupedMessages } from '../utils/chatGrouping';
import { callService } from '../services/callService';
import { useAuth } from '../context/AuthContext';

export const IndividualChatScreen: React.FC = () => {
  const { navigateTo, showToast, wallpaper, goBack } = useTheme();
  const { userProfile } = useAuth();
  const {
    activeChat,
    activeChatId,
    activeChatMessages,
    activeChatMembersProfiles,
    activeTypingUsers,
    loadingMessages,
    sendMessage,
    reactToMessage,
    deleteMessage,
    editMessage,
    updateTypingState,
    markMessagesAsRead,
  } = useChat();

  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingReadIdsRef = useRef<Set<string>>(new Set());
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentWallpaper = WALLPAPER_COLLECTION[wallpaper] || WALLPAPER_COLLECTION.default;
  const groupedMessages = getGroupedMessages(activeChatMessages, 5);

  // Check read receipt privacy settings
  const isReadReceiptsEnabled = useCallback(() => {
    if (userProfile?.privacySettings?.readReceipts === false) return false;
    if (localStorage.getItem('http_chat_read_receipts') === 'false') return false;
    return true;
  }, [userProfile?.privacySettings?.readReceipts]);

  // Flush pending read updates to Firestore
  const flushReadStatus = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!isReadReceiptsEnabled()) {
      pendingReadIdsRef.current.clear();
      return;
    }

    if (!activeChatId || pendingReadIdsRef.current.size === 0) return;

    const idsToMark = Array.from(pendingReadIdsRef.current);
    pendingReadIdsRef.current.clear();

    markMessagesAsRead(activeChatId, idsToMark);
  }, [activeChatId, isReadReceiptsEnabled, markMessagesAsRead]);

  // Schedule a debounced read status update
  const scheduleReadStatus = useCallback(
    (messageId: string) => {
      if (!isReadReceiptsEnabled()) return;

      pendingReadIdsRef.current.add(messageId);
      processedMessageIdsRef.current.add(messageId);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce writes (600ms) to avoid excessive Firestore operations
      debounceTimerRef.current = setTimeout(() => {
        flushReadStatus();
      }, 600);
    },
    [flushReadStatus, isReadReceiptsEnabled]
  );

  // Initialize IntersectionObserver
  useEffect(() => {
    processedMessageIdsRef.current.clear();
    pendingReadIdsRef.current.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const msgId = entry.target.getAttribute('data-message-id');
            if (msgId && !processedMessageIdsRef.current.has(msgId)) {
              scheduleReadStatus(msgId);
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1, // Trigger when 10% of message enters viewport
      }
    );

    observerRef.current = observer;

    return () => {
      observer.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      flushReadStatus();
    };
  }, [activeChatId, scheduleReadStatus, flushReadStatus]);

  // Callback ref to attach observer to unread messages from other users
  const messageElementRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const msgId = node.getAttribute('data-message-id');
    const isUnreadOther = node.getAttribute('data-is-unread-other') === 'true';

    if (!msgId || !isUnreadOther) return;
    if (processedMessageIdsRef.current.has(msgId)) return;

    if (observerRef.current) {
      observerRef.current.observe(node);
    }
  }, []);

  const handleReact = (messageId: string, emoji: string) => {
    if (activeChatId) {
      reactToMessage(activeChatId, messageId, emoji);
    }
  };

  const handleSendMessage = (text: string, replyTo?: ReplyTarget) => {
    if (activeChatId) {
      sendMessage(activeChatId, text, 'text', undefined, replyTo);
    }
  };

  const handleCreateEvent = (eventDetails: EventDetails) => {
    if (activeChatId) {
      sendMessage(
        activeChatId,
        `📅 Event: ${eventDetails.title}`,
        'event',
        undefined,
        undefined,
        eventDetails
      );
      showToast('Event shared in chat!', 'success');
    }
  };

  const handleEditSave = (messageId: string, newText: string) => {
    if (activeChatId) {
      editMessage(activeChatId, messageId, newText);
      showToast('Message updated');
    }
  };

  const handleDeleteForEveryone = (messageId: string) => {
    if (activeChatId) {
      deleteMessage(activeChatId, messageId);
      showToast('Message deleted');
    }
  };

  const handleDeleteForMe = (messageId: string) => {
    if (activeChatId) {
      deleteMessage(activeChatId, messageId);
      showToast('Message removed');
    }
  };

  // Find other partner details for header
  const partnerProfile: UserProfile | null = activeChat?.type === 'individual'
    ? (Object.values(activeChatMembersProfiles) as UserProfile[]).find((p) => p.uid !== activeChat.createdBy) || (Object.values(activeChatMembersProfiles)[0] as UserProfile | undefined) || null
    : null;

  const headerTitle = activeChat?.name || partnerProfile?.displayName || 'Chat Conversation';
  const headerSub = activeTypingUsers.length > 0
    ? 'typing...'
    : partnerProfile?.online
    ? 'Online'
    : 'Offline';

  return (
    <div className={`flex flex-col min-h-[calc(100vh-4rem)] transition-colors ${currentWallpaper.className}`}>
      {/* Header */}
      <div className="p-3 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 sticky top-16 z-20 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigateTo('chat_info')}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm overflow-hidden">
              {partnerProfile?.photoURL || activeChat?.photoURL ? (
                <img src={partnerProfile?.photoURL || activeChat?.photoURL} alt={headerTitle} className="w-full h-full object-cover" />
              ) : (
                headerTitle.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {headerTitle}
              </p>
              <p className={`text-[11px] font-medium truncate ${activeTypingUsers.length > 0 ? 'text-amber-500 animate-pulse font-bold' : 'text-emerald-500'}`}>
                {headerSub}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={async () => {
              if (partnerProfile && userProfile) {
                try {
                  await callService.initiateCall(userProfile, partnerProfile, 'voice');
                } catch (e: any) {
                  showToast(e.message || 'Microphone permission or camera required', 'error');
                }
              } else {
                showToast('Unable to start call: Contact not loaded', 'error');
              }
            }}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (partnerProfile && userProfile) {
                try {
                  await callService.initiateCall(userProfile, partnerProfile, 'video');
                } catch (e: any) {
                  showToast(e.message || 'Camera and microphone required', 'error');
                }
              } else {
                showToast('Unable to start call: Contact not loaded', 'error');
              }
            }}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateTo('chat_info')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Chat Info"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-4 space-y-1 overflow-y-auto max-w-4xl mx-auto w-full"
      >
        {/* Encrypted Notice Banner */}
        <div className="text-center my-2">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800/70 text-[10px] text-slate-600 dark:text-slate-400 font-medium shadow-2xs">
            🔒 Messages & calls are end-to-end encrypted
          </span>
        </div>

        {loadingMessages ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs font-semibold">Loading messages...</span>
          </div>
        ) : activeChatMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium">
            No messages yet. Say hi to start the conversation! 👋
          </div>
        ) : (
          groupedMessages.map(({ message, isFirstInGroup, isLastInGroup, showAvatar }) => {
            const isOtherAndUnread =
              message.sender !== 'me' &&
              message.senderId !== userProfile?.uid &&
              message.status !== 'read';

            return (
              <div
                key={message.id}
                ref={isOtherAndUnread ? messageElementRef : undefined}
                data-message-id={message.id}
                data-is-unread-other={isOtherAndUnread ? 'true' : 'false'}
              >
                <ChatMessageBubble
                  message={message}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  showAvatar={showAvatar}
                  onReact={handleReact}
                  onReply={(m) =>
                    setReplyTarget({
                      id: m.id,
                      senderName: m.senderName || 'Sender',
                      text: m.text,
                    })
                  }
                  onEdit={(m) => setEditingMessage(m)}
                  onDeleteForEveryone={handleDeleteForEveryone}
                  onDeleteForMe={handleDeleteForMe}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        replyTarget={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
        onOpenEventModal={() => setEventModalOpen(true)}
        onTyping={(isTyping) => {
          if (activeChatId) updateTypingState(activeChatId, isTyping);
        }}
      />

      {/* Edit Modal */}
      <EditMessageModal
        message={editingMessage}
        isOpen={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={handleEditSave}
      />

      {/* Event Creation Modal */}
      <CreateEventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  );
};
