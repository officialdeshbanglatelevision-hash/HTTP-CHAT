import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Camera, Smile, Mic, Send, X, CornerUpLeft, Trash2, StopCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { useTypingStatus } from '../../hooks/useTypingStatus';
import { AttachmentMenu } from './AttachmentMenu';
import { EmojiStickerPicker } from './EmojiStickerPicker';
import { ReplyTarget, StickerItem } from '../../types/chat';

interface MessageComposerProps {
  onSendMessage?: (text: string, replyTo?: ReplyTarget) => void;
  replyTarget?: ReplyTarget | null;
  onCancelReply?: () => void;
  onOpenEventModal?: () => void;
  onTyping?: (isTyping: boolean) => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  replyTarget,
  onCancelReply,
  onOpenEventModal,
  onTyping,
}) => {
  const { showToast } = useTheme();
  const { activeChatId } = useChat();
  const { startUpload } = useMediaUpload();
  const { handleKeystroke, stopTyping } = useTypingStatus(activeChatId);

  const [text, setText] = useState('');
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleSelectSticker = (sticker: StickerItem) => {
    if (onSendMessage) {
      onSendMessage(`[sticker:${sticker.url}]`, replyTarget || undefined);
    }
    setEmojiPickerOpen(false);
  };

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (replyTarget) {
      inputRef.current?.focus();
    }
  }, [replyTarget]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    if (val.trim()) {
      handleKeystroke();
    } else {
      stopTyping();
    }

    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    stopTyping();
    if (onSendMessage) {
      onSendMessage(text.trim(), replyTarget || undefined);
    }
    setText('');
    if (onTyping) onTyping(false);
    if (onCancelReply) onCancelReply();
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      showToast('Could not access microphone. Please check permissions.', 'error');
    }
  };

  // Cancel voice recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // Stop & upload voice note via useMediaUpload queue
  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (!activeChatId) {
      showToast('Please select a chat first', 'warning');
      cancelRecording();
      return;
    }

    const duration = recordingSeconds;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());

      if (audioBlob.size < 100) {
        showToast('Voice message too short', 'warning');
        return;
      }

      setIsUploadingVoice(true);

      try {
        await startUpload({
          file: audioBlob,
          fileName: `Voice Note (${duration}s)`,
          chatId: activeChatId,
          mediaType: 'voice',
          duration,
          caption: '🎤 Voice message',
        });

        if (onCancelReply) onCancelReply();
      } catch (err: any) {
        console.error('Voice upload error:', err);
        showToast('Failed to queue voice note upload', 'error');
      } finally {
        setIsUploadingVoice(false);
        setIsRecording(false);
        setRecordingSeconds(0);
      }
    };

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    mediaRecorderRef.current.stop();
  };

  return (
    <>
      <div className="bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 backdrop-blur-md sticky bottom-0 z-20 flex flex-col">
        {/* Reply Target Banner */}
        {replyTarget && (
          <div className="px-4 py-2 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0 border-l-2 border-accent pl-2">
              <CornerUpLeft className="w-3.5 h-3.5 text-accent shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-accent truncate">
                  Replying to {replyTarget.senderName}
                </p>
                <p className="text-slate-500 dark:text-slate-400 truncate text-[11px]">
                  {replyTarget.text}
                </p>
              </div>
            </div>

            <button
              onClick={onCancelReply}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
              title="Cancel Reply"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-3 max-w-4xl mx-auto w-full flex items-center gap-2">
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-2xl text-rose-400">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="font-mono font-bold text-xs">
                  {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-rose-300 font-medium hidden sm:inline">Recording voice note...</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Cancel Recording"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={stopAndSendRecording}
                  disabled={isUploadingVoice}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  title="Send Voice Note"
                >
                  {isUploadingVoice ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Emoji & Attachment Buttons */}
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 relative">
                <button
                  onClick={() => setEmojiPickerOpen((prev) => !prev)}
                  className={`p-2 rounded-xl transition-colors ${
                    emojiPickerOpen
                      ? 'bg-accent-subtle text-accent'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Emoji & Stickers"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {emojiPickerOpen && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <EmojiStickerPicker
                      onSelectEmoji={handleSelectEmoji}
                      onSelectSticker={handleSelectSticker}
                      onClose={() => setEmojiPickerOpen(false)}
                    />
                  </div>
                )}
                <button
                  onClick={() => setAttachmentOpen((prev) => !prev)}
                  className={`p-2 rounded-xl transition-all ${
                    attachmentOpen
                      ? 'bg-accent-subtle text-accent scale-105'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Attach File"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              {/* Text Input */}
              <div className="flex-1 relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="Type a message..."
                  className="w-full py-2.5 px-4 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ring-accent transition-all"
                />
                <button
                  onClick={() => setAttachmentOpen(true)}
                  className="absolute right-2.5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                  title="Camera"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Microphone or Send Button */}
              {text.trim().length > 0 ? (
                <button
                  onClick={handleSend}
                  className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shadow-md accent-glow active:scale-95 transition-all shrink-0"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shrink-0 active:scale-95"
                  title="Record Voice Note"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <AttachmentMenu
        isOpen={attachmentOpen}
        onClose={() => setAttachmentOpen(false)}
        onOpenEventModal={onOpenEventModal}
      />
    </>
  );
};
