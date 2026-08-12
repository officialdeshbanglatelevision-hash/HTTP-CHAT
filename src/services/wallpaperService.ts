export interface WallpaperOption {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'pattern' | 'custom';
  value: string; // CSS color, gradient or image URL
  textColor?: string;
}

export const WALLPAPER_PRESETS: WallpaperOption[] = [
  { id: 'default', name: 'Default Dark/Light', type: 'solid', value: 'transparent' },
  { id: 'emerald_gradient', name: 'Emerald Night', type: 'gradient', value: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' },
  { id: 'indigo_dusk', name: 'Indigo Dusk', type: 'gradient', value: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' },
  { id: 'midnight_blue', name: 'Midnight Blue', type: 'solid', value: '#0f172a' },
  { id: 'slate_dark', name: 'Slate Dark', type: 'solid', value: '#1e293b' },
  { id: 'warm_sunset', name: 'Warm Sunset', type: 'gradient', value: 'linear-gradient(135deg, #7c2d12 0%, #312e81 100%)' },
  { id: 'cyber_purple', name: 'Cyber Purple', type: 'gradient', value: 'linear-gradient(135deg, #581c87 0%, #1e1b4b 100%)' },
];

export const wallpaperService = {
  getGlobalWallpaper(): WallpaperOption {
    try {
      const stored = localStorage.getItem('http_chat_global_wallpaper');
      return stored ? JSON.parse(stored) : WALLPAPER_PRESETS[0];
    } catch {
      return WALLPAPER_PRESETS[0];
    }
  },

  setGlobalWallpaper(option: WallpaperOption) {
    try {
      localStorage.setItem('http_chat_global_wallpaper', JSON.stringify(option));
    } catch (e) {
      console.warn('Failed to store wallpaper', e);
    }
  },

  getChatWallpaper(chatId: string): WallpaperOption {
    try {
      const stored = localStorage.getItem(`http_chat_wallpaper_${chatId}`);
      if (stored) return JSON.parse(stored);
      return this.getGlobalWallpaper();
    } catch {
      return this.getGlobalWallpaper();
    }
  },

  setChatWallpaper(chatId: string, option: WallpaperOption) {
    try {
      localStorage.setItem(`http_chat_wallpaper_${chatId}`, JSON.stringify(option));
    } catch (e) {
      console.warn('Failed to set chat wallpaper', e);
    }
  },
};
