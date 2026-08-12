import React, { useEffect, useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import {
  HardDrive,
  Image,
  Video,
  FileText,
  Mic,
  Music,
  Trash2,
  ChevronRight,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  File,
  ShieldCheck,
} from 'lucide-react';
import { mediaService } from '../services/mediaService';
import { settingsService, UserMediaSettings, DEFAULT_MEDIA_SETTINGS } from '../services/settingsService';

interface StorageMediaFile {
  messageId: string;
  chatId: string;
  chatName: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'voice';
  name: string;
  size: number; // bytes
  url: string;
  publicId?: string;
  createdAt: string;
}

export const StorageScreen: React.FC = () => {
  const { showToast, navigateTo } = useTheme();
  const { chats, messagesMap, deleteMessage } = useChat();

  const [settings, setSettings] = useState<UserMediaSettings>(DEFAULT_MEDIA_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'chats' | 'autodownload'>('overview');

  // Load persistent user settings
  useEffect(() => {
    settingsService.getUserSettings().then((s) => setSettings(s));
  }, []);

  // Compute real calculated media files across all user chats from Firestore messages
  const mediaFiles = useMemo(() => {
    const list: StorageMediaFile[] = [];

    Object.entries(messagesMap).forEach(([chatId, msgs]) => {
      const chatObj = chats.find((c) => c.id === chatId);
      const chatName = chatObj?.name || 'Chat ' + chatId.slice(0, 5);

      (msgs as any[]).forEach((m: any) => {
        if (m.mediaUrl || m.media?.secureUrl) {
          const url = m.media?.secureUrl || m.mediaUrl || '';
          const name = m.mediaName || m.media?.fileName || m.text || 'Media File';

          // parse or derive size
          let sizeInBytes = m.media?.size || 0;
          if (!sizeInBytes && m.mediaSize) {
            const sizeStr = m.mediaSize.toLowerCase();
            if (sizeStr.includes('mb')) {
              sizeInBytes = parseFloat(sizeStr) * 1024 * 1024;
            } else if (sizeStr.includes('kb')) {
              sizeInBytes = parseFloat(sizeStr) * 1024;
            }
          }
          if (!sizeInBytes) sizeInBytes = 250 * 1024; // realistic fallback estimation if absent

          const mediaType: 'image' | 'video' | 'audio' | 'document' | 'voice' =
            m.type === 'image'
              ? 'image'
              : m.type === 'video'
              ? 'video'
              : m.type === 'audio' || m.text?.includes('Voice')
              ? 'voice'
              : 'document';

          list.push({
            messageId: m.id,
            chatId,
            chatName,
            type: mediaType,
            name,
            size: Math.round(sizeInBytes),
            url,
            publicId: m.media?.publicId,
            createdAt: m.timestamp || new Date().toISOString(),
          });
        }
      });
    });

    return list.sort((a, b) => b.size - a.size); // largest first
  }, [messagesMap, chats]);

  // Simulate complete calculation effect
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [messagesMap]);

  // Compute breakdown metrics
  const totals = useMemo(() => {
    let imagesSize = 0, imagesCount = 0;
    let videosSize = 0, videosCount = 0;
    let audioSize = 0, audioCount = 0;
    let voiceSize = 0, voiceCount = 0;
    let docsSize = 0, docsCount = 0;

    mediaFiles.forEach((f) => {
      if (f.type === 'image') {
        imagesSize += f.size;
        imagesCount++;
      } else if (f.type === 'video') {
        videosSize += f.size;
        videosCount++;
      } else if (f.type === 'audio') {
        audioSize += f.size;
        audioCount++;
      } else if (f.type === 'voice') {
        voiceSize += f.size;
        voiceCount++;
      } else {
        docsSize += f.size;
        docsCount++;
      }
    });

    const totalSize = imagesSize + videosSize + audioSize + voiceSize + docsSize;
    const totalCount = mediaFiles.length;

    return {
      totalSize,
      totalCount,
      imagesSize,
      imagesCount,
      videosSize,
      videosCount,
      audioSize,
      audioCount,
      voiceSize,
      voiceCount,
      docsSize,
      docsCount,
    };
  }, [mediaFiles]);

  // Compute chat-by-chat storage usage
  const chatUsage = useMemo(() => {
    const map: Record<string, { chatId: string; name: string; count: number; totalSize: number }> = {};

    mediaFiles.forEach((f) => {
      if (!map[f.chatId]) {
        map[f.chatId] = {
          chatId: f.chatId,
          name: f.chatName,
          count: 0,
          totalSize: 0,
        };
      }
      map[f.chatId].count++;
      map[f.chatId].totalSize += f.size;
    });

    return Object.values(map).sort((a, b) => b.totalSize - a.totalSize);
  }, [mediaFiles]);

  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Toggle file selection
  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all files
  const toggleSelectAll = () => {
    if (selectedFileIds.length === mediaFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(mediaFiles.map((f) => f.messageId));
    }
  };

  // Delete selected files securely
  const handleDeleteSelected = async () => {
    if (selectedFileIds.length === 0) return;

    setDeleting(true);
    let deletedCount = 0;

    for (const msgId of selectedFileIds) {
      const fileObj = mediaFiles.find((f) => f.messageId === msgId);
      if (fileObj) {
        if (fileObj.publicId) {
          await mediaService.deleteMedia(
            fileObj.publicId,
            fileObj.type === 'video' ? 'video' : fileObj.type === 'image' ? 'image' : 'raw'
          );
        }
        await deleteMessage(fileObj.chatId, fileObj.messageId);
        deletedCount++;
      }
    }

    setDeleting(false);
    setSelectedFileIds([]);
    showToast(`Deleted ${deletedCount} media file(s) safely`, 'success');
  };

  // Auto-download setting update
  const toggleAutoDownload = async (
    networkType: 'mobile' | 'wifi' | 'roaming',
    category: 'photos' | 'audio' | 'videos' | 'documents'
  ) => {
    let key: 'autoDownloadMobile' | 'autoDownloadWifi' | 'autoDownloadRoaming';
    if (networkType === 'mobile') key = 'autoDownloadMobile';
    else if (networkType === 'wifi') key = 'autoDownloadWifi';
    else key = 'autoDownloadRoaming';

    const currentSub = settings[key];
    const updatedSub = { ...currentSub, [category]: !currentSub[category] };

    const updated = await settingsService.updateUserSettings({ [key]: updatedSub });
    setSettings(updated);
    showToast('Auto-download rules updated', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-12">
      {/* Top Controls Header */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Manage Storage & Media
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatSize(totals.totalSize)} used across {totals.totalCount} files
              </p>
            </div>
          </div>

          <button
            onClick={() => navigateTo('media_quality')}
            className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-xs hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Quality Settings</span>
          </button>
        </div>

        {/* Visual Progress Ratio Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {totals.totalSize > 0 ? (
              <>
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${(totals.imagesSize / totals.totalSize) * 100}%` }}
                  title="Images"
                />
                <div
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{ width: `${(totals.videosSize / totals.totalSize) * 100}%` }}
                  title="Videos"
                />
                <div
                  className="bg-purple-500 h-full transition-all duration-500"
                  style={{ width: `${(totals.voiceSize / totals.totalSize) * 100}%` }}
                  title="Voice & Audio"
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${(totals.docsSize / totals.totalSize) * 100}%` }}
                  title="Documents"
                />
              </>
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Images ({formatSize(totals.imagesSize)})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Videos ({formatSize(totals.videosSize)})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Voice ({formatSize(totals.voiceSize)})
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'overview' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'files' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Manage Files ({mediaFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'chats' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          By Chat
        </button>
        <button
          onClick={() => setActiveTab('autodownload')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'autodownload' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Auto-Download
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-1">
              <Image className="w-5 h-5 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Images</p>
              <p className="text-xs text-slate-400">{totals.imagesCount} files</p>
              <p className="text-xs font-bold text-emerald-500">{formatSize(totals.imagesSize)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-1">
              <Video className="w-5 h-5 text-blue-500 mx-auto" />
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Videos</p>
              <p className="text-xs text-slate-400">{totals.videosCount} files</p>
              <p className="text-xs font-bold text-blue-500">{formatSize(totals.videosSize)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-1">
              <Mic className="w-5 h-5 text-purple-500 mx-auto" />
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Voice Notes</p>
              <p className="text-xs text-slate-400">{totals.voiceCount} files</p>
              <p className="text-xs font-bold text-purple-500">{formatSize(totals.voiceSize)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-1">
              <FileText className="w-5 h-5 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Documents</p>
              <p className="text-xs text-slate-400">{totals.docsCount} files</p>
              <p className="text-xs font-bold text-amber-500">{formatSize(totals.docsSize)}</p>
            </div>
          </div>

          {/* Largest Files Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Largest Files
              </h4>
              <button
                onClick={() => setActiveTab('files')}
                className="text-xs text-emerald-500 font-bold hover:underline"
              >
                View all
              </button>
            </div>

            {mediaFiles.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No media files found in your chats.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {mediaFiles.slice(0, 5).map((f) => (
                  <div key={f.messageId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {f.type === 'image' && <Image className="w-4 h-4 text-emerald-500" />}
                        {f.type === 'video' && <Video className="w-4 h-4 text-blue-500" />}
                        {f.type === 'voice' && <Mic className="w-4 h-4 text-purple-500" />}
                        {f.type === 'document' && <FileText className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{f.chatName}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      {formatSize(f.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE & DELETE FILES */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              {selectedFileIds.length === mediaFiles.length && mediaFiles.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({selectedFileIds.length})</span>
            </button>

            {selectedFileIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete ({selectedFileIds.length})</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-sm">
            {mediaFiles.length === 0 ? (
              <p className="text-xs text-slate-400 p-6 text-center italic">No media files available to manage.</p>
            ) : (
              mediaFiles.map((f) => {
                const isSelected = selectedFileIds.includes(f.messageId);
                return (
                  <div
                    key={f.messageId}
                    onClick={() => toggleSelectFile(f.messageId)}
                    className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'bg-emerald-500/10 dark:bg-emerald-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {f.type === 'image' && <Image className="w-4 h-4 text-emerald-500" />}
                        {f.type === 'video' && <Video className="w-4 h-4 text-blue-500" />}
                        {f.type === 'voice' && <Mic className="w-4 h-4 text-purple-500" />}
                        {f.type === 'document' && <FileText className="w-4 h-4 text-amber-500" />}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{f.chatName}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{formatSize(f.size)}</p>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-emerald-500 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CHAT USAGE BREAKDOWN */}
      {activeTab === 'chats' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-sm">
          {chatUsage.length === 0 ? (
            <p className="p-6 text-xs text-slate-400 text-center italic">No storage usage recorded per chat yet.</p>
          ) : (
            chatUsage.map((item) => (
              <div key={item.chatId} className="p-4 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.count} media files</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-emerald-500">{formatSize(item.totalSize)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: AUTO-DOWNLOAD SETTINGS */}
      {activeTab === 'autodownload' && (
        <div className="space-y-4">
          {/* Mobile Data */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              When Using Mobile Data
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['photos', 'audio', 'videos', 'documents'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleAutoDownload('mobile', cat)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between capitalize transition-all ${
                    settings.autoDownloadMobile[cat]
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{cat}</span>
                  <input
                    type="checkbox"
                    checked={settings.autoDownloadMobile[cat]}
                    onChange={() => {}}
                    className="accent-emerald-500 rounded"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Wi-Fi */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              When Connected on Wi-Fi
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['photos', 'audio', 'videos', 'documents'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleAutoDownload('wifi', cat)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between capitalize transition-all ${
                    settings.autoDownloadWifi[cat]
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{cat}</span>
                  <input
                    type="checkbox"
                    checked={settings.autoDownloadWifi[cat]}
                    onChange={() => {}}
                    className="accent-emerald-500 rounded"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Roaming */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              When Roaming
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(['photos', 'audio', 'videos', 'documents'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleAutoDownload('roaming', cat)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between capitalize transition-all ${
                    settings.autoDownloadRoaming[cat]
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{cat}</span>
                  <input
                    type="checkbox"
                    checked={settings.autoDownloadRoaming[cat]}
                    onChange={() => {}}
                    className="accent-emerald-500 rounded"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
