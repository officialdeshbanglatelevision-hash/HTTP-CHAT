import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageReaction } from '../../types/chat';
import {
  Smile,
  MoreHorizontal,
  Reply,
  Edit3,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  CornerUpLeft,
  Plus,
  Play,
  Pause,
  Download,
  Maximize2,
  X,
  FileText,
  Music,
  Video as VideoIcon,
  Cloud,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showAvatar?: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onDeleteForMe: (messageId: string) => void;
}

const PRESET_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];
const MORE_EMOJIS = ['👏', '💯', '🚀', '😍', '🤔', '😴', '💩', '🥳', '🙌', '👀'];

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  isFirstInGroup = true,
  isLastInGroup = true,
  showAvatar = true,
  onReact,
  onReply,
  onEdit,
  onDeleteForEveryone,
  onDeleteForMe,
}) => {
  const { showToast } = useTheme();
  const { updateRsvp } = useChat();
  const isMe = message.sender === 'me';

  const [showOverlay, setShowOverlay] = useState(false);
  const [showMoreEmojis, setShowMoreEmojis] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Media lightbox & audio player states
  const [showLightbox, setShowLightbox] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(message.media?.duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close overlay on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowOverlay(false);
        setShowMoreEmojis(false);
      }
    };
    if (showOverlay) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOverlay]);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowOverlay(true);
      if ('vibrate' in navigator) navigator.vibrate(40);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleCopy = () => {
    if (message.isDeletedForEveryone) return;
    navigator.clipboard.writeText(message.text);
    showToast('Message copied to clipboard');
    setShowOverlay(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    onReact(message.id, emoji);
    setShowOverlay(false);
    setShowMoreEmojis(false);
  };

  const reactionsList: MessageReaction[] = (
    Object.values(message.reactions || {}) as MessageReaction[]
  ).filter((r) => r.count > 0);

  const getInitials = (name?: string) => {
    if (!name) return 'SC';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBubbleCorners = () => {
    if (isMe) {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-br-xs';
      if (isFirstInGroup && !isLastInGroup) return 'rounded-2xl rounded-br-xs';
      if (!isFirstInGroup && !isLastInGroup) return 'rounded-2xl rounded-br-xs rounded-tr-xs';
      return 'rounded-2xl rounded-tr-xs';
    } else {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-bl-xs';
      if (isFirstInGroup && !isLastInGroup) return 'rounded-2xl rounded-bl-xs';
      if (!isFirstInGroup && !isLastInGroup) return 'rounded-2xl rounded-bl-xs rounded-tl-xs';
      return 'rounded-2xl rounded-tl-xs';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`group relative flex items-end gap-2 px-1 transition-all ${
        isFirstInGroup ? 'mt-3.5' : 'mt-0.5'
      } mb-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowOverlay(true);
      }}
    >
      {/* Avatar column for incoming messages */}
      {!isMe && (
        <div className="w-8 shrink-0 flex items-end justify-center pb-0.5">
          {showAvatar ? (
            <div
              className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
              title={message.senderName || 'Sarah Connor'}
            >
              {getInitials(message.senderName)}
            </div>
          ) : (
            <div className="w-8 h-8 shrink-0" />
          )}
        </div>
      )}

      {/* Main Container */}
      <div className={`relative flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
        {/* Reaction & Action Bar Popover Overlay */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={{ duration: 0.15, type: 'spring', stiffness: 350, damping: 25 }}
              className={`absolute z-30 -top-14 ${
                isMe ? 'right-0' : 'left-0'
              } bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 flex items-center gap-1 backdrop-blur-lg`}
            >
              {/* Quick Emoji Bar */}
              <div className="flex items-center gap-1 pr-1 border-r border-slate-200 dark:border-slate-800">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-125 transition-transform flex items-center justify-center text-lg leading-none"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() => setShowMoreEmojis((prev) => !prev)}
                  className="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                  title="More Emojis"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-0.5">
                {!message.isDeletedForEveryone && (
                  <>
                    <button
                      onClick={() => {
                        onReply(message);
                        setShowOverlay(false);
                      }}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Reply"
                    >
                      <Reply className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {isMe && (
                      <button
                        onClick={() => {
                          onEdit(message);
                          setShowOverlay(false);
                        }}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowOverlay(false);
                  }}
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Emoji Grid Popup */}
        <AnimatePresence>
          {showOverlay && showMoreEmojis && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              className={`absolute z-40 -top-28 ${
                isMe ? 'right-0' : 'left-0'
              } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 grid grid-cols-5 gap-1`}
            >
              {MORE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-125 transition-transform flex items-center justify-center text-lg"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover Toolbar Trigger (Desktop) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 z-10 ${
            isMe ? '-left-16' : '-right-16'
          }`}
        >
          <button
            onClick={() => setShowOverlay((prev) => !prev)}
            className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm hover:scale-110 transition-all"
            title="React & Actions"
          >
            <Smile className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              onReply(message);
            }}
            className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm hover:scale-110 transition-all"
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </button>
        </div>

        {/* Swipeable Message Content Container */}
        <div className="relative flex items-center">
          {/* Reply Action Indicator Revealed Behind on Swipe */}
          <div
            className={`absolute -left-9 flex items-center justify-center pointer-events-none transition-all duration-150 ${
              dragOffset > 8 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xs ${
                dragOffset >= 50
                  ? 'bg-accent text-white scale-110 shadow-sm'
                  : 'bg-slate-200/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300'
              }`}
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Draggable Message Box */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 80 }}
            dragElastic={{ left: 0.05, right: 0.25 }}
            dragSnapToOrigin={true}
            onDrag={(_, info) => {
              setDragOffset(Math.max(0, info.offset.x));
            }}
            onDragEnd={(_, info) => {
              if (info.offset.x >= 50) {
                onReply(message);
              }
              setDragOffset(0);
            }}
            className="relative min-w-[120px] touch-pan-y cursor-grab active:cursor-grabbing"
          >
            <div
              className={`px-3.5 py-2.5 shadow-xs transition-all relative ${getBubbleCorners()} ${
                isMe
                  ? 'bg-accent text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {/* Sender Name (Only shown on top message in a group) */}
              {!isMe && isFirstInGroup && message.senderName && (
                <p className="text-[11px] font-bold text-accent mb-1 leading-tight">
                  {message.senderName}
                </p>
              )}

              {/* Quoted Reply Card */}
              {message.replyTo && (
                <div
                  className={`p-2 rounded-xl mb-2 text-xs border-l-3 ${
                    isMe
                      ? 'bg-black/15 text-white/90 border-white'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-accent'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-[10px] opacity-80 mb-0.5">
                    <CornerUpLeft className="w-3 h-3" />
                    <span>{message.replyTo.senderName}</span>
                  </div>
                  <p className="line-clamp-2 italic text-[11px] opacity-95">
                    {message.replyTo.text}
                  </p>
                </div>
              )}

              {/* Media Attachments (Cloudinary Powered) */}
              {(message.mediaUrl || message.media?.secureUrl) && message.type === 'image' && (
                <div className="mb-2 rounded-xl overflow-hidden max-w-xs shadow-xs relative group cursor-pointer" onClick={() => setShowLightbox(true)}>
                  <img
                    src={message.media?.thumbnailUrl || message.mediaUrl || message.media?.secureUrl}
                    alt={message.mediaName || 'Cloudinary Image'}
                    className="w-full max-h-60 object-cover rounded-xl transition-transform group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/70 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                    <Cloud className="w-3 h-3 text-sky-400" />
                    <span>Cloudinary</span>
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white drop-shadow" />
                  </div>
                </div>
              )}

              {(message.mediaUrl || message.media?.secureUrl) && message.type === 'video' && (
                <div className="mb-2 rounded-xl overflow-hidden max-w-xs shadow-xs relative">
                  <video
                    src={message.mediaUrl || message.media?.secureUrl}
                    poster={message.media?.thumbnailUrl}
                    controls
                    className="w-full max-h-60 object-cover rounded-xl"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/70 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs pointer-events-none">
                    <VideoIcon className="w-3 h-3 text-purple-400" />
                    <span>HD Video</span>
                  </div>
                </div>
              )}

              {(message.mediaUrl || message.media?.secureUrl) && message.type === 'audio' && (
                <div className={`p-3 rounded-2xl mb-2 min-w-[220px] max-w-xs space-y-2 border text-xs ${
                  isMe ? 'bg-black/20 border-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  <audio
                    ref={audioRef}
                    src={message.mediaUrl || message.media?.secureUrl}
                    onTimeUpdate={() => {
                      if (audioRef.current) setAudioCurrentTime(audioRef.current.currentTime);
                    }}
                    onLoadedMetadata={() => {
                      if (audioRef.current) setAudioDuration(audioRef.current.duration);
                    }}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (!audioRef.current) return;
                        if (isPlayingAudio) {
                          audioRef.current.pause();
                          setIsPlayingAudio(false);
                        } else {
                          audioRef.current.play();
                          setIsPlayingAudio(true);
                        }
                      }}
                      className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
                        <span>
                          {Math.floor(audioCurrentTime / 60)}:{(Math.floor(audioCurrentTime % 60)).toString().padStart(2, '0')}
                        </span>
                        <span>
                          {Math.floor(audioDuration / 60)}:{(Math.floor(audioDuration % 60)).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div
                        onClick={(e) => {
                          if (!audioRef.current || !audioDuration) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const pos = (e.clientX - rect.left) / rect.width;
                          audioRef.current.currentTime = pos * audioDuration;
                          setAudioCurrentTime(pos * audioDuration);
                        }}
                        className="w-full h-1.5 bg-slate-400/30 dark:bg-slate-700 rounded-full cursor-pointer overflow-hidden relative"
                      >
                        <div
                          className="h-full bg-emerald-400 transition-all duration-100"
                          style={{ width: `${(audioCurrentTime / (audioDuration || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] opacity-75 pt-0.5">
                    <span className="flex items-center gap-1"><Music className="w-3 h-3" /> Voice Note</span>
                    <span>Cloudinary Delivered</span>
                  </div>
                </div>
              )}

              {(message.mediaUrl || message.media?.secureUrl) && message.type === 'document' && (
                <a
                  href={message.mediaUrl || message.media?.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-2xl mb-2 text-xs font-semibold border transition-all ${
                    isMe
                      ? 'bg-black/20 border-white/20 text-white hover:bg-black/30'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-xs">{message.mediaName || message.media?.fileName || 'Document'}</p>
                    <p className="text-[10px] opacity-75">{message.mediaSize || `${Math.round((message.media?.size || 0) / 1024)} KB`}</p>
                  </div>
                  <Download className="w-4 h-4 opacity-70 shrink-0" />
                </a>
              )}

              {/* Event Card */}
              {message.type === 'event' && message.eventDetails && (
                <div
                  className={`p-3.5 rounded-2xl mb-2 space-y-2 border text-xs ${
                    isMe
                      ? 'bg-black/20 border-white/20 text-white'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    <span className="p-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
                      📅 EVENT
                    </span>
                    <span className="truncate">{message.eventDetails.title}</span>
                  </div>

                  <div className="space-y-1 text-[11px] opacity-90 pt-1">
                    <p>🗓️ Date: <span className="font-bold">{message.eventDetails.date}</span> ({message.eventDetails.startTime} - {message.eventDetails.endTime})</p>
                    {message.eventDetails.location && <p>📍 Location: <span className="font-bold">{message.eventDetails.location}</span></p>}
                    {message.eventDetails.description && <p className="italic opacity-80 pt-1">{message.eventDetails.description}</p>}
                  </div>

                  {/* RSVP Buttons */}
                  <div className="pt-2 flex items-center gap-1.5 border-t border-slate-500/20">
                    {(['going', 'maybe', 'declined'] as const).map((status) => {
                      const count = Object.values(message.eventDetails?.rsvp || {}).filter((s) => s === status).length;
                      return (
                        <button
                          key={status}
                          onClick={() => {
                            if (message.chatId) {
                              updateRsvp(message.chatId, message.id, status);
                            }
                          }}
                          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold capitalize transition-all ${
                            status === 'going'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : status === 'maybe'
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {status} {count > 0 && `(${count})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message Text */}
              {message.isDeletedForEveryone ? (
                <p className="text-xs italic opacity-75 flex items-center gap-1.5 py-0.5">
                  <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>This message was deleted</span>
                </p>
              ) : (
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}

              {/* Footer Metadata */}
              <div
                className={`flex items-center justify-end gap-1.5 text-[10px] mt-1 ${
                  isMe ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {message.isEdited && !message.isDeletedForEveryone && (
                  <span className="italic font-normal">edited</span>
                )}
                <span>{message.timestamp}</span>
                {isMe && !message.isDeletedForEveryone && (
                  <span>
                    {message.status === 'read' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-200 stroke-[2.5]" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[2]" />
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Active Reactions Pills Display */}
            {reactionsList.length > 0 && (
              <div
                className={`flex flex-wrap items-center gap-1 mt-1 z-10 ${
                  isMe ? 'justify-end' : 'justify-start'
                }`}
              >
                {reactionsList.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    onClick={() => onReact(message.id, reaction.emoji)}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border shadow-xs transition-all active:scale-95 ${
                      reaction.reactedByMe
                        ? 'bg-accent-subtle border-accent text-accent font-bold ring-1 ring-accent/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-[10px]">{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Full Screen Image Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && (message.mediaUrl || message.media?.secureUrl) && (
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md">
            {/* Header Controls */}
            <div className="p-4 flex items-center justify-between text-white border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <Cloud className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold truncate">
                    {message.mediaName || message.media?.fileName || 'Cloudinary Media Attachment'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {message.media?.width && message.media?.height
                      ? `${message.media.width}x${message.media.height} px • `
                      : ''}
                    {message.mediaSize || `${Math.round((message.media?.size || 0) / 1024)} KB`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={message.media?.secureUrl || message.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                  title="Download Original File"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setShowLightbox(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Stage */}
            <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                src={message.media?.secureUrl || message.mediaUrl}
                alt={message.mediaName || 'Expanded view'}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Delete Message?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose whether to delete this message for everyone or only for yourself.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {isMe && !message.isDeletedForEveryone && (
                  <button
                    onClick={() => {
                      onDeleteForEveryone(message.id);
                      setShowDeleteModal(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-sm"
                  >
                    Delete for everyone
                  </button>
                )}

                <button
                  onClick={() => {
                    onDeleteForMe(message.id);
                    setShowDeleteModal(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
                >
                  Delete for me
                </button>

                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
