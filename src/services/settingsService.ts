import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface UserMediaSettings {
  photoQuality: 'standard' | 'hd';
  videoQuality: 'standard' | 'hd';
  audioQuality: 'standard' | 'high';
  voiceQuality: 'standard' | 'high';
  downloadQuality: 'standard' | 'hd' | 'ask';
  autoDownloadMobile: {
    photos: boolean;
    audio: boolean;
    videos: boolean;
    documents: boolean;
  };
  autoDownloadWifi: {
    photos: boolean;
    audio: boolean;
    videos: boolean;
    documents: boolean;
  };
  autoDownloadRoaming: {
    photos: boolean;
    audio: boolean;
    videos: boolean;
    documents: boolean;
  };
}

export const DEFAULT_MEDIA_SETTINGS: UserMediaSettings = {
  photoQuality: 'standard',
  videoQuality: 'standard',
  audioQuality: 'standard',
  voiceQuality: 'standard',
  downloadQuality: 'standard',
  autoDownloadMobile: {
    photos: true,
    audio: false,
    videos: false,
    documents: false,
  },
  autoDownloadWifi: {
    photos: true,
    audio: true,
    videos: true,
    documents: true,
  },
  autoDownloadRoaming: {
    photos: false,
    audio: false,
    videos: false,
    documents: false,
  },
};

class SettingsService {
  private localCacheKey = 'http_chat_media_settings';

  /**
   * Get cached local settings immediately
   */
  getLocalSettings(): UserMediaSettings {
    try {
      const stored = localStorage.getItem(this.localCacheKey);
      if (stored) {
        return { ...DEFAULT_MEDIA_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage:', e);
    }
    return DEFAULT_MEDIA_SETTINGS;
  }

  /**
   * Load user settings from Firestore (users/{uid}/settings)
   */
  async getUserSettings(uid?: string): Promise<UserMediaSettings> {
    const user = auth.currentUser;
    const targetUid = uid || user?.uid;

    if (!targetUid) {
      return this.getLocalSettings();
    }

    try {
      const settingsRef = doc(db, 'users', targetUid, 'settings', 'media');
      const snap = await getDoc(settingsRef);

      if (snap.exists()) {
        const fetched = snap.data() as UserMediaSettings;
        const merged = { ...DEFAULT_MEDIA_SETTINGS, ...fetched };
        localStorage.setItem(this.localCacheKey, JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Error fetching Firestore settings, using local:', err);
    }

    return this.getLocalSettings();
  }

  /**
   * Update user settings in Firestore and localStorage
   */
  async updateUserSettings(
    patch: Partial<UserMediaSettings>,
    uid?: string
  ): Promise<UserMediaSettings> {
    const current = this.getLocalSettings();
    const updated = { ...current, ...patch };

    // Update localStorage
    try {
      localStorage.setItem(this.localCacheKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to write settings to localStorage:', e);
    }

    // Update Firestore if authenticated
    const user = auth.currentUser;
    const targetUid = uid || user?.uid;

    if (targetUid) {
      try {
        const settingsRef = doc(db, 'users', targetUid, 'settings', 'media');
        await setDoc(settingsRef, updated, { merge: true });
      } catch (err) {
        console.error('Error saving Firestore media settings:', err);
      }
    }

    return updated;
  }
}

export const settingsService = new SettingsService();
