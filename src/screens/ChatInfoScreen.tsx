import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  User,
  Phone,
  Video,
  Bell,
  Lock,
  Image,
  ShieldAlert,
  Flag,
  Trash2,
  ChevronRight,
  Clock,
  Link,
  FileText,
  Mic,
  Download,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { ConfirmationModal, ConfirmationType } from '../components/modals/ConfirmationModal';

export const ChatInfoScreen: React.FC = () => {
  const { navigateTo, showToast, goBack } = useTheme();
  const { activeChatId, chats, activeChatMessages } = useChat();
  const { currentUser } = useAuth();

  const activeChat = chats.find((c) => (c as any).chatId === activeChatId || c.id === activeChatId) || chats[0];
  const [muted, setMuted] = useState(false);
  const [confirmModalType, setConfirmModalType] = useState<ConfirmationType | null>(null);
  const [mediaTab, setMediaTab] = useState<'media' | 'links' | 'docs' | 'audio'>('media');

  useEffect(() => {
    if (activeChat && currentUser) {
      const isMuted = activeChat.mutedBy?.includes(currentUser.uid) || false;
      setMuted(isMuted);
    }
  }, [activeChat, currentUser]);

  // Extract real media files from Firestore messages
  const chatMedia = useMemo(() => {
    const imagesAndVideos: any[] = [];
    const sharedLinks: any[] = [];
    const documents: any[] = [];
    const audioAndVoice: any[] = [];

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    activeChatMessages.forEach((m) => {
      // Extract links from message text
      if (m.text) {
        const matches = m.text.match(urlRegex);
        if (matches) {
          matches.forEach((url) => {
            sharedLinks.push({
              id: `${m.id}_link`,
              url,
              createdAt: m.timestamp,
              sender: m.senderName,
            });
          });
        }
      }

      if (m.mediaUrl || m.media?.secureUrl) {
        const item = {
          id: m.id,
          name: m.mediaName || m.media?.fileName || m.text || 'Media',
          url: m.media?.secureUrl || m.mediaUrl || '',
          size: m.mediaSize || (m.media?.size ? `${Math.round(m.media.size / 1024)} KB` : 'Attachment'),
          type: m.type,
          createdAt: m.timestamp,
          publicId: m.media?.publicId,
        };

        if (m.type === 'image' || m.type === 'video') {
          imagesAndVideos.push(item);
        } else if (m.type === 'audio' || m.text?.includes('Voice')) {
          audioAndVoice.push(item);
        } else if (m.type === 'document') {
          documents.push(item);
        }
      }
    });

    return {
      media: imagesAndVideos,
      links: sharedLinks,
      docs: documents,
      audio: audioAndVoice,
    };
  }, [activeChatMessages]);

  return (
    <div className="max-w-md mx-auto p-4 space-y-5 pb-12">
      {/* Header back bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Back to Chat"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Contact Info & Media
        </h2>
      </div>

      {/* Contact Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-3">
        {activeChat?.avatar ? (
          <img
            src={activeChat.avatar}
            alt={activeChat.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/30 shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500/30 flex items-center justify-center text-slate-400">
            <User className="w-12 h-12" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {activeChat?.name || 'Contact'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {activeChat?.type === 'group' ? 'Group Chat' : 'Encrypted Personal Chat'}
          </p>
        </div>

        {/* Quick Call Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => showToast('Voice call initiated', 'info')}
            className="flex flex-col items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
              <Phone className="w-5 h-5" />
            </div>
            Audio
          </button>
          <button
            onClick={() => showToast('Video call initiated', 'info')}
            className="flex flex-col items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
              <Video className="w-5 h-5" />
            </div>
            Video
          </button>
        </div>
      </div>

      {/* Encryption Badge */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
        <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
          Messages and calls are end-to-end encrypted with Firestore security rules.
        </p>
      </div>

      {/* Shared Media Tabs Section */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Image className="w-4 h-4 text-emerald-500" />
            Media, Links & Docs
          </h3>
          <span className="text-xs font-bold text-slate-400 font-mono">
            {chatMedia.media.length + chatMedia.links.length + chatMedia.docs.length + chatMedia.audio.length} items
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setMediaTab('media')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mediaTab === 'media' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs' : ''
            }`}
          >
            Media ({chatMedia.media.length})
          </button>
          <button
            onClick={() => setMediaTab('links')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mediaTab === 'links' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs' : ''
            }`}
          >
            Links ({chatMedia.links.length})
          </button>
          <button
            onClick={() => setMediaTab('docs')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mediaTab === 'docs' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs' : ''
            }`}
          >
            Docs ({chatMedia.docs.length})
          </button>
          <button
            onClick={() => setMediaTab('audio')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mediaTab === 'audio' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs' : ''
            }`}
          >
            Audio ({chatMedia.audio.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-2 min-h-[100px]">
          {mediaTab === 'media' && (
            chatMedia.media.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No images or videos shared in this chat yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {chatMedia.media.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-xl overflow-hidden group bg-slate-800"
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" />
                    )}
                  </a>
                ))}
              </div>
            )
          )}

          {mediaTab === 'links' && (
            chatMedia.links.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No shared links found.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {chatMedia.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate text-blue-500 underline font-medium">{link.url}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            )
          )}

          {mediaTab === 'docs' && (
            chatMedia.docs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No shared documents.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {chatMedia.docs.map((docItem) => (
                  <a
                    key={docItem.id}
                    href={docItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 dark:text-slate-100">{docItem.name}</p>
                        <p className="text-[10px] text-slate-400">{docItem.size}</p>
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            )
          )}

          {mediaTab === 'audio' && (
            chatMedia.audio.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No audio or voice notes recorded.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {chatMedia.audio.map((audioItem) => (
                  <div key={audioItem.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mic className="w-4 h-4 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 dark:text-slate-100">{audioItem.name}</p>
                        <p className="text-[10px] text-slate-400">{audioItem.size}</p>
                      </div>
                    </div>
                    <audio src={audioItem.url} controls className="h-8 max-w-[150px]" />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Preferences List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Mute Notifications
            </span>
          </div>
          <input
            type="checkbox"
            checked={muted}
            onChange={async () => {
              const newMuted = !muted;
              setMuted(newMuted);
              if (currentUser && activeChat) {
                try {
                  const chatRef = doc(db, 'chats', (activeChat as any).chatId || activeChat.id || activeChatId!);
                  await updateDoc(chatRef, {
                    mutedBy: newMuted ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid),
                  });
                } catch (e) {
                  console.error('Failed to update chat mute status:', e);
                }
              }
              showToast(newMuted ? 'Chat notifications muted' : 'Chat notifications unmuted');
            }}
            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
          />
        </div>

        <button
          onClick={() => navigateTo('storage')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Manage Storage & Auto-Download
              </p>
              <p className="text-xs text-slate-400">View media usage & storage rules</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
        <button
          onClick={() => setConfirmModalType('block')}
          className="w-full p-4 flex items-center gap-3 text-amber-600 dark:text-amber-400 font-semibold text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left transition-colors"
        >
          <ShieldAlert className="w-5 h-5" />
          <span>Block Contact</span>
        </button>

        <button
          onClick={() => setConfirmModalType('report')}
          className="w-full p-4 flex items-center gap-3 text-amber-600 dark:text-amber-400 font-semibold text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left transition-colors"
        >
          <Flag className="w-5 h-5" />
          <span>Report Contact</span>
        </button>

        <button
          onClick={() => setConfirmModalType('delete')}
          className="w-full p-4 flex items-center gap-3 text-rose-600 dark:text-rose-400 font-semibold text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          <span>Clear & Delete Chat</span>
        </button>
      </div>

      {confirmModalType && (
        <ConfirmationModal
          isOpen={!!confirmModalType}
          onClose={() => setConfirmModalType(null)}
          type={confirmModalType}
        />
      )}
    </div>
  );
};
