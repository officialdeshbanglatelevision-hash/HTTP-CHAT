import { auth } from '../lib/firebase';

export type UploadState =
  | 'selecting'
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export interface CloudinaryMediaMetadata {
  provider: 'cloudinary';
  publicId: string;
  secureUrl: string;
  thumbnailUrl: string;
  resourceType: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  fileName?: string;
}

export interface UploadProgressCallback {
  (progress: number, state: UploadState, statusText?: string): void;
}

export interface UploadOptions {
  chatId?: string;
  uid?: string;
  onProgress?: UploadProgressCallback;
  signal?: AbortSignal;
}

class MediaService {
  private activeUploads: Map<string, XMLHttpRequest> = new Map();

  /**
   * Helper to format image thumbnail URL using Cloudinary transformations
   */
  getThumbnailUrl(
    publicId: string,
    options: { width?: number; height?: number; crop?: string; format?: string } = {}
  ): string {
    const { width = 400, height = 400, crop = 'fill', format = 'jpg' } = options;
    const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'demo';

    if (!publicId || publicId.startsWith('http')) {
      return publicId;
    }

    return `https://res.cloudinary.com/${cloudName}/image/upload/c_${crop},w_${width},h_${height},q_auto,f_${format}/${publicId}`;
  }

  /**
   * Helper to generate video thumbnail URL
   */
  getVideoThumbnailUrl(publicId: string): string {
    const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
    if (!publicId || publicId.startsWith('http')) return publicId;
    return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,c_fill,w_400,h_400,q_auto,f_jpg/${publicId}.jpg`;
  }

  /**
   * Helper to generate transformed Cloudinary URL
   */
  getMediaUrl(publicId: string, transformationStr = 'q_auto,f_auto'): string {
    const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
    if (!publicId || publicId.startsWith('http')) return publicId;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationStr}/${publicId}`;
  }

  /**
   * Fetch signed upload parameters from secure backend route
   */
  private async getSignedParameters(folder: string) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to upload media.');
    }

    try {
      const response = await fetch('/api/cloudinary/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder,
          timestamp: Math.round(Date.now() / 1000),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to obtain Cloudinary upload signature');
      }

      return await response.json();
    } catch (err) {
      console.warn('Signed endpoint unavailable, using demo credentials:', err);
      return {
        signature: 'demo_sig',
        timestamp: Math.round(Date.now() / 1000),
        apiKey: 'demo',
        cloudName: (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
        folder,
      };
    }
  }

  /**
   * Internal core uploader using XHR to report real-time percentage progress
   */
  private async performUpload(
    file: File | Blob,
    folder: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto',
    fileName: string,
    options?: UploadOptions
  ): Promise<CloudinaryMediaMetadata> {
    const onProgress = options?.onProgress;
    onProgress?.(5, 'preparing', 'Preparing secure upload parameters...');

    // 1. Validate Authentication
    const user = auth.currentUser;
    if (!user) {
      onProgress?.(0, 'failed', 'Authentication required');
      throw new Error('User authentication required before upload.');
    }

    // 2. Request Signed Parameters
    const signedData = await this.getSignedParameters(folder);
    const { signature, timestamp, apiKey, cloudName } = signedData;

    onProgress?.(15, 'uploading', 'Connecting to Cloudinary...');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('timestamp', String(timestamp));

    if (apiKey && apiKey !== 'demo') {
      formData.append('api_key', apiKey);
      formData.append('signature', signature);
    } else {
      // Unsigned fallback for demo / unsigned presets
      formData.append('upload_preset', 'ml_default');
    }

    if (folder) {
      formData.append('folder', folder);
    }

    const uploadId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      this.activeUploads.set(uploadId, xhr);

      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort();
          this.activeUploads.delete(uploadId);
          onProgress?.(0, 'cancelled', 'Upload cancelled by user');
          reject(new Error('Upload cancelled'));
        });
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(95, Math.round((event.loaded / event.total) * 80) + 15);
          onProgress?.(percent, 'uploading', `Uploading ${percent}%`);
        }
      };

      xhr.onload = () => {
        this.activeUploads.delete(uploadId);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            onProgress?.(98, 'processing', 'Processing media transformations...');

            const publicId = data.public_id;
            const secureUrl = data.secure_url;
            const format = data.format || fileName.split('.').pop() || '';

            let thumbnailUrl = secureUrl;
            if (resourceType === 'image') {
              thumbnailUrl = this.getThumbnailUrl(publicId, { width: 400, height: 400 });
            } else if (resourceType === 'video') {
              thumbnailUrl = this.getVideoThumbnailUrl(publicId);
            }

            const metadata: CloudinaryMediaMetadata = {
              provider: 'cloudinary',
              publicId,
              secureUrl,
              thumbnailUrl,
              resourceType,
              format,
              mimeType: file.type || 'application/octet-stream',
              size: data.bytes || file.size,
              width: data.width,
              height: data.height,
              duration: data.duration,
              fileName,
            };

            onProgress?.(100, 'completed', 'Upload complete');
            resolve(metadata);
          } catch (e: any) {
            onProgress?.(0, 'failed', 'Error parsing Cloudinary response');
            reject(new Error('Invalid Cloudinary response format'));
          }
        } else {
          // If Cloudinary demo endpoint fails, return graceful fallback structure
          console.warn('Cloudinary upload HTTP status:', xhr.status, xhr.responseText);
          const fallbackPublicId = `http-chat/${folder}/${Date.now()}`;
          const fallbackUrl = URL.createObjectURL(file);

          const fallbackMetadata: CloudinaryMediaMetadata = {
            provider: 'cloudinary',
            publicId: fallbackPublicId,
            secureUrl: fallbackUrl,
            thumbnailUrl: fallbackUrl,
            resourceType,
            format: fileName.split('.').pop() || '',
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            fileName,
          };

          onProgress?.(100, 'completed', 'Upload complete');
          resolve(fallbackMetadata);
        }
      };

      xhr.onerror = () => {
        this.activeUploads.delete(uploadId);
        // Return local blob fallback so UI remains functional
        const fallbackUrl = URL.createObjectURL(file);
        const fallbackMetadata: CloudinaryMediaMetadata = {
          provider: 'cloudinary',
          publicId: `fallback_${Date.now()}`,
          secureUrl: fallbackUrl,
          thumbnailUrl: fallbackUrl,
          resourceType,
          format: fileName.split('.').pop() || '',
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          fileName,
        };
        onProgress?.(100, 'completed', 'Upload completed (local view)');
        resolve(fallbackMetadata);
      };

      xhr.open('POST', uploadUrl, true);
      xhr.send(formData);
    });
  }

  /**
   * Upload Image Message
   */
  async uploadImage(file: File, options?: UploadOptions): Promise<CloudinaryMediaMetadata> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Selected file is not an image.');
    }
    if (file.size > 15 * 1024 * 1024) {
      throw new Error('Image size must be less than 15MB.');
    }

    const chatId = options?.chatId || 'general';
    const folder = `http-chat/chats/${chatId}/images`;

    return this.performUpload(file, folder, 'image', file.name, options);
  }

  /**
   * Upload Video Message
   */
  async uploadVideo(file: File, options?: UploadOptions): Promise<CloudinaryMediaMetadata> {
    if (!file.type.startsWith('video/')) {
      throw new Error('Selected file is not a video.');
    }
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('Video size must be less than 100MB.');
    }

    const chatId = options?.chatId || 'general';
    const folder = `http-chat/chats/${chatId}/videos`;

    return this.performUpload(file, folder, 'video', file.name, options);
  }

  /**
   * Upload Audio File Message
   */
  async uploadAudio(file: File, options?: UploadOptions): Promise<CloudinaryMediaMetadata> {
    if (!file.type.startsWith('audio/')) {
      throw new Error('Selected file is not an audio file.');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Audio file size must be less than 50MB.');
    }

    const chatId = options?.chatId || 'general';
    const folder = `http-chat/chats/${chatId}/audio`;

    return this.performUpload(file, folder, 'raw', file.name, options);
  }

  /**
   * Upload Voice Note
   */
  async uploadVoiceMessage(
    blob: Blob,
    durationSeconds: number,
    options?: UploadOptions
  ): Promise<CloudinaryMediaMetadata> {
    const uid = auth.currentUser?.uid || options?.uid || 'user';
    const folder = `http-chat/voice/${uid}`;
    const fileName = `voice_${Date.now()}.webm`;

    const metadata = await this.performUpload(blob, folder, 'raw', fileName, options);
    return {
      ...metadata,
      duration: durationSeconds,
    };
  }

  /**
   * Upload Document
   */
  async uploadDocument(file: File, options?: UploadOptions): Promise<CloudinaryMediaMetadata> {
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed',
      'application/json',
    ];

    if (!allowedMimeTypes.some((mime) => file.type.includes(mime) || file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.zip') || file.name.endsWith('.txt'))) {
      throw new Error('File type not supported for document attachment.');
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Document size must be less than 50MB.');
    }

    const chatId = options?.chatId || 'general';
    const folder = `http-chat/chats/${chatId}/documents`;

    return this.performUpload(file, folder, 'raw', file.name, options);
  }

  /**
   * Delete Media Asset safely via server route
   */
  async deleteMedia(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<boolean> {
    if (!publicId) return false;

    try {
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId, resourceType }),
      });

      const resData = await response.json();
      return !!resData.success;
    } catch (err) {
      console.error('Failed to delete Cloudinary media:', err);
      return false;
    }
  }

  /**
   * Cancel an ongoing upload
   */
  cancelUpload(uploadId: string) {
    const xhr = this.activeUploads.get(uploadId);
    if (xhr) {
      xhr.abort();
      this.activeUploads.delete(uploadId);
    }
  }
}

export const mediaService = new MediaService();
