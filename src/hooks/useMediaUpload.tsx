import React, { useState, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { mediaService, CloudinaryMediaMetadata, UploadState } from '../services/mediaService';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export interface UploadQueueItem {
  uploadId: string;
  messageId?: string;
  chatId: string;
  uid: string;
  fileName: string;
  file: File | Blob;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'voice';
  progress: number;
  status: UploadState;
  statusText?: string;
  error?: string | null;
  retryCount: number;
  quality?: 'standard' | 'hd' | 'high';
  caption?: string;
  duration?: number;
  metadata?: CloudinaryMediaMetadata;
}

interface StartUploadParams {
  file: File | Blob;
  fileName?: string;
  chatId: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'voice';
  quality?: 'standard' | 'hd' | 'high';
  caption?: string;
  duration?: number;
}

interface MediaUploadContextType {
  uploadQueue: UploadQueueItem[];
  activeUploads: UploadQueueItem[];
  startUpload: (params: StartUploadParams) => Promise<CloudinaryMediaMetadata | null>;
  cancelUpload: (uploadId: string) => void;
  retryUpload: (uploadId: string) => Promise<void>;
  clearCompleted: () => void;
  clearAll: () => void;
}

const MediaUploadContext = createContext<MediaUploadContextType | undefined>(undefined);

export const MediaUploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { sendMessage } = useChat();
  const { showToast } = useTheme();
  const { currentUser } = useAuth();

  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Update item in state
  const updateItem = useCallback((uploadId: string, patch: Partial<UploadQueueItem>) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.uploadId === uploadId ? { ...item, ...patch } : item))
    );
  }, []);

  // Execute upload procedure
  const runUpload = useCallback(
    async (item: UploadQueueItem) => {
      const uploadId = item.uploadId;
      const abortController = new AbortController();
      abortControllersRef.current.set(uploadId, abortController);

      updateItem(uploadId, {
        status: 'preparing',
        statusText: 'Preparing secure upload connection...',
        progress: 5,
        error: null,
      });

      try {
        const uploadOptions = {
          chatId: item.chatId,
          uid: item.uid,
          signal: abortController.signal,
          onProgress: (percent: number, state: UploadState, text?: string) => {
            updateItem(uploadId, {
              progress: percent,
              status: state,
              statusText: text || `Uploading ${percent}%`,
            });
          },
        };

        let metadata: CloudinaryMediaMetadata;

        if (item.mediaType === 'image') {
          metadata = await mediaService.uploadImage(item.file as File, uploadOptions);
        } else if (item.mediaType === 'video') {
          metadata = await mediaService.uploadVideo(item.file as File, uploadOptions);
        } else if (item.mediaType === 'audio') {
          metadata = await mediaService.uploadAudio(item.file as File, uploadOptions);
        } else if (item.mediaType === 'voice') {
          metadata = await mediaService.uploadVoiceMessage(
            item.file,
            item.duration || 0,
            uploadOptions
          );
        } else {
          metadata = await mediaService.uploadDocument(item.file as File, uploadOptions);
        }

        updateItem(uploadId, {
          status: 'completed',
          progress: 100,
          statusText: 'Completed',
          metadata,
        });

        // Map mediaType to messageType format
        const messageType =
          item.mediaType === 'image'
            ? 'image'
            : item.mediaType === 'video'
            ? 'video'
            : item.mediaType === 'voice' || item.mediaType === 'audio'
            ? 'audio'
            : 'document';

        // Send Firestore Message ONLY after Cloudinary upload succeeds
        await sendMessage(
          item.chatId,
          item.caption || item.fileName,
          messageType as any,
          metadata.secureUrl,
          undefined,
          undefined,
          metadata.fileName || item.fileName,
          metadata.mimeType,
          `${Math.round(metadata.size / 1024)} KB`,
          metadata
        );

        showToast(`${item.fileName} sent successfully`, 'success');
        return metadata;
      } catch (err: any) {
        if (err.message === 'Upload cancelled' || abortController.signal.aborted) {
          updateItem(uploadId, {
            status: 'cancelled',
            statusText: 'Upload cancelled',
            progress: 0,
          });
        } else {
          console.error(`Upload error for ${item.fileName}:`, err);
          updateItem(uploadId, {
            status: 'failed',
            statusText: err.message || 'Media upload failed',
            error: err.message || 'Media upload failed',
          });
          showToast(`Upload failed: ${item.fileName}`, 'error');
        }
        return null;
      } finally {
        abortControllersRef.current.delete(uploadId);
      }
    },
    [sendMessage, showToast, updateItem]
  );

  // Start new upload
  const startUpload = useCallback(
    async (params: StartUploadParams): Promise<CloudinaryMediaMetadata | null> => {
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fileName =
        params.fileName || (params.file as File).name || `media_${Date.now()}`;

      const newItem: UploadQueueItem = {
        uploadId,
        chatId: params.chatId,
        uid: currentUser?.uid || 'user',
        fileName,
        file: params.file,
        mediaType: params.mediaType,
        progress: 0,
        status: 'selecting',
        statusText: 'Selected file',
        retryCount: 0,
        quality: params.quality || 'standard',
        caption: params.caption,
        duration: params.duration,
      };

      setUploadQueue((prev) => [...prev, newItem]);
      return runUpload(newItem);
    },
    [currentUser, runUpload]
  );

  // Cancel an upload
  const cancelUpload = useCallback((uploadId: string) => {
    const controller = abortControllersRef.current.get(uploadId);
    if (controller) {
      controller.abort();
    }
    mediaService.cancelUpload(uploadId);
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.uploadId === uploadId
          ? { ...item, status: 'cancelled', statusText: 'Upload cancelled by user', progress: 0 }
          : item
      )
    );
  }, []);

  // Retry an upload
  const retryUpload = useCallback(
    async (uploadId: string) => {
      const item = uploadQueue.find((i) => i.uploadId === uploadId);
      if (!item) return;

      const updatedItem: UploadQueueItem = {
        ...item,
        status: 'retrying',
        statusText: 'Retrying upload...',
        retryCount: item.retryCount + 1,
        progress: 0,
        error: null,
      };

      setUploadQueue((prev) =>
        prev.map((i) => (i.uploadId === uploadId ? updatedItem : i))
      );

      await runUpload(updatedItem);
    },
    [uploadQueue, runUpload]
  );

  // Clear completed/cancelled items
  const clearCompleted = useCallback(() => {
    setUploadQueue((prev) =>
      prev.filter((i) => i.status !== 'completed' && i.status !== 'cancelled')
    );
  }, []);

  // Clear all queue items
  const clearAll = useCallback(() => {
    // Abort active
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    setUploadQueue([]);
  }, []);

  const activeUploads = uploadQueue.filter(
    (i) =>
      i.status === 'preparing' ||
      i.status === 'uploading' ||
      i.status === 'processing' ||
      i.status === 'retrying'
  );

  return (
    <MediaUploadContext.Provider
      value={{
        uploadQueue,
        activeUploads,
        startUpload,
        cancelUpload,
        retryUpload,
        clearCompleted,
        clearAll,
      }}
    >
      {children}
    </MediaUploadContext.Provider>
  );
};

export function useMediaUpload() {
  const context = useContext(MediaUploadContext);
  if (!context) {
    throw new Error('useMediaUpload must be used within a MediaUploadProvider');
  }
  return context;
}
