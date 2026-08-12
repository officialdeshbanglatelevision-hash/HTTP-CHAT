import React, { useRef } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  MapPin,
  User,
  Calendar,
  Headphones,
  Palette,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { motion } from 'motion/react';

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEventModal?: () => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  isOpen,
  onClose,
  onOpenEventModal,
}) => {
  const { showToast } = useTheme();
  const { activeChatId, sendMessage } = useChat();
  const { startUpload } = useMediaUpload();

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    typeLabel: string,
    fileCategory: 'image_video' | 'document' | 'audio' | 'camera'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!activeChatId) {
      showToast('Please open a chat to send media', 'warning');
      onClose();
      return;
    }

    setUploading(true);
    onClose();

    try {
      let mediaType: 'image' | 'video' | 'audio' | 'document' = 'image';

      if (fileCategory === 'image_video') {
        mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      } else if (fileCategory === 'audio') {
        mediaType = 'audio';
      } else if (fileCategory === 'document') {
        mediaType = 'document';
      } else {
        mediaType = 'image';
      }

      await startUpload({
        file,
        fileName: file.name,
        chatId: activeChatId,
        mediaType,
      });
    } catch (err: any) {
      console.error('File Upload Queue Error:', err);
      showToast(err.message || 'Failed to queue media upload', 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleLocationSelect = async () => {
    onClose();
    if (!activeChatId) {
      showToast('Please open a chat first', 'warning');
      return;
    }

    if ('geolocation' in navigator) {
      showToast('Fetching GPS position...', 'info');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const locText = `📍 Shared Location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          await sendMessage(activeChatId, locText, 'location');
          showToast('Location shared!', 'success');
        },
        async () => {
          const fallback = '📍 Location: San Francisco, CA (37.7749° N, 122.4194° W)';
          await sendMessage(activeChatId, fallback, 'location');
          showToast('Location shared!', 'success');
        },
        { timeout: 3000 }
      );
    } else {
      const fallback = '📍 Location: San Francisco, CA (37.7749° N, 122.4194° W)';
      await sendMessage(activeChatId, fallback, 'location');
      showToast('Location shared!', 'success');
    }
  };

  const handleAction = (id: string, label: string) => {
    if (id === 'gallery') {
      galleryInputRef.current?.click();
    } else if (id === 'document') {
      documentInputRef.current?.click();
    } else if (id === 'camera') {
      cameraInputRef.current?.click();
    } else if (id === 'audio') {
      audioInputRef.current?.click();
    } else if (id === 'location') {
      handleLocationSelect();
    } else if (id === 'event') {
      onClose();
      if (onOpenEventModal) onOpenEventModal();
    } else {
      onClose();
      showToast(`${label} action triggered`);
    }
  };

  const attachmentOptions = [
    {
      id: 'gallery',
      label: 'Gallery',
      icon: ImageIcon,
      gradient: 'from-purple-500 to-indigo-600 text-white shadow-purple-500/20',
      desc: 'Photos & Videos',
    },
    {
      id: 'document',
      label: 'Document',
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-600 text-white shadow-blue-500/20',
      desc: 'PDFs, Docs, Files',
    },
    {
      id: 'event',
      label: 'Event',
      icon: Calendar,
      gradient: 'from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
      desc: 'Create Meeting/Event',
    },
    {
      id: 'location',
      label: 'Location',
      icon: MapPin,
      gradient: 'from-rose-500 to-pink-600 text-white shadow-rose-500/20',
      desc: 'Share Live GPS',
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: Camera,
      gradient: 'from-amber-500 to-orange-600 text-white shadow-amber-500/20',
      desc: 'Take Photo',
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: User,
      gradient: 'from-cyan-500 to-blue-600 text-white shadow-cyan-500/20',
      desc: 'Share vCard',
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Headphones,
      gradient: 'from-pink-500 to-rose-600 text-white shadow-pink-500/20',
      desc: 'Music & Voice',
    },
    {
      id: 'drawing',
      label: 'Canvas',
      icon: Palette,
      gradient: 'from-violet-500 to-purple-600 text-white shadow-violet-500/20',
      desc: 'Sketch & Draw',
    },
  ];

  return (
    <>
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'Gallery Media', 'image_video')}
      />
      <input
        type="file"
        ref={documentInputRef}
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'Document', 'document')}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'Camera Photo', 'camera')}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'Audio File', 'audio')}
      />

      <BottomSheet isOpen={isOpen} onClose={onClose} title="Share & Attach">
        <div className="space-y-4 pt-1 pb-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select content type to attach to your conversation
          </p>

          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {attachmentOptions.map((opt, idx) => {
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => handleAction(opt.id, opt.label)}
                  disabled={uploading}
                  className="flex flex-col items-center gap-2 p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group disabled:opacity-50"
                >
                  <div
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center shadow-md transition-transform group-hover:scale-105 group-active:scale-95`}
                  >
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block mt-0.5">
                      {opt.desc}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
