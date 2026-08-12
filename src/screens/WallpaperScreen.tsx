import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { wallpaperService, WALLPAPER_PRESETS, WallpaperOption } from '../services/wallpaperService';
import { mediaService } from '../services/mediaService';
import { ArrowLeft, Image, Check, Upload, RefreshCw } from 'lucide-react';

export const WallpaperScreen: React.FC = () => {
  const { setActiveScreen, selectedChatId, showToast } = useTheme();

  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperOption>(
    selectedChatId ? wallpaperService.getChatWallpaper(selectedChatId) : wallpaperService.getGlobalWallpaper()
  );
  const [uploading, setUploading] = useState(false);

  const handleSelect = (wp: WallpaperOption) => {
    setActiveWallpaper(wp);
    if (selectedChatId) {
      wallpaperService.setChatWallpaper(selectedChatId, wp);
      showToast(`Chat wallpaper updated for this conversation`, 'success');
    } else {
      wallpaperService.setGlobalWallpaper(wp);
      showToast('Global chat wallpaper updated', 'success');
    }
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const meta = await mediaService.uploadImage(file);
      const customWp: WallpaperOption = {
        id: `custom_${Date.now()}`,
        name: 'Custom Image Wallpaper',
        type: 'custom',
        value: `url(${meta.secureUrl})`,
      };
      handleSelect(customWp);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload custom wallpaper', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveScreen('appearance')}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Appearance</span>
        </button>
        <h1 className="text-base font-bold text-slate-100">Chat Wallpaper</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-6">
        {/* Preview Container */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Wallpaper Preview
          </span>
          <div
            className="w-full h-48 rounded-3xl border border-slate-700/80 p-4 flex flex-col justify-end relative overflow-hidden shadow-2xl transition-all duration-300"
            style={{
              background: activeWallpaper.type === 'custom' ? activeWallpaper.value : activeWallpaper.value,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Mock Chat Messages */}
            <div className="space-y-2 relative z-10">
              <div className="bg-slate-800/90 backdrop-blur text-white text-xs p-2.5 rounded-2xl rounded-bl-xs max-w-[80%] shadow">
                Hey! How does this wallpaper look?
              </div>
              <div className="bg-emerald-600 text-white text-xs p-2.5 rounded-2xl rounded-br-xs max-w-[80%] ml-auto shadow">
                Looks clean and super crisp! 🌟
              </div>
            </div>
          </div>
        </div>

        {/* Custom Upload Button */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-white">Choose Custom Photo</p>
              <p className="text-[11px] text-slate-400">Upload your own wallpaper image</p>
            </div>
          </div>

          <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow">
            {uploading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{uploading ? 'Uploading...' : 'Browse'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Preset Wallpapers Grid */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Presets & Gradients
          </span>

          <div className="grid grid-cols-2 gap-3">
            {WALLPAPER_PRESETS.map((wp) => {
              const isSelected = activeWallpaper.id === wp.id;
              return (
                <button
                  key={wp.id}
                  onClick={() => handleSelect(wp)}
                  className={`h-24 rounded-2xl p-3 border text-left flex flex-col justify-between relative overflow-hidden transition-all shadow ${
                    isSelected
                      ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                  style={{
                    background: wp.value,
                  }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-md">{wp.name}</span>
                  {isSelected && (
                    <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
