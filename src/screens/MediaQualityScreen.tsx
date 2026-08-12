import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Image,
  Video,
  Music,
  Mic,
  Download,
  Check,
  ChevronLeft,
  Sparkles,
  Info,
} from 'lucide-react';
import { settingsService, UserMediaSettings, DEFAULT_MEDIA_SETTINGS } from '../services/settingsService';

export const MediaQualityScreen: React.FC = () => {
  const { goBack, showToast } = useTheme();
  const [settings, setSettings] = useState<UserMediaSettings>(DEFAULT_MEDIA_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    settingsService.getUserSettings().then((res) => {
      if (isMounted) setSettings(res);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdate = async (patch: Partial<UserMediaSettings>) => {
    setSaving(true);
    const updated = await settingsService.updateUserSettings(patch);
    setSettings(updated);
    setSaving(false);
    showToast('Quality preferences saved', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={goBack}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Go Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Media Quality Settings</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control resolution, audio bitrates, and compression policies for uploads & downloads
          </p>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          Higher quality media consumes more cellular data and takes slightly longer to send and receive over slower networks.
        </p>
      </div>

      {/* 1. Photo Upload Quality */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
          <Image className="w-4 h-4 text-emerald-500" />
          Photo Upload Quality
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <button
            onClick={() => handleUpdate({ photoQuality: 'standard' })}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Standard</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Smaller file size (max 1280px), optimized for fast messaging and low data usage.
              </p>
            </div>
            {settings.photoQuality === 'standard' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleUpdate({ photoQuality: 'hd' })}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">HD (High Definition)</p>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Crisp
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Higher resolution (up to 3840px) and minimal compression for vibrant details.
              </p>
            </div>
            {settings.photoQuality === 'hd' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 2. Video Upload Quality */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
          <Video className="w-4 h-4 text-blue-500" />
          Video Upload Quality
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <button
            onClick={() => handleUpdate({ videoQuality: 'standard' })}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Standard</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optimized resolution and compression for quick playback and mobile data savings.
              </p>
            </div>
            {settings.videoQuality === 'standard' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleUpdate({ videoQuality: 'hd' })}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">HD Quality</p>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                  1080p
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preserves higher bitrate and full HD video clarity without severe downsampling.
              </p>
            </div>
            {settings.videoQuality === 'hd' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 3. Audio & Voice Quality */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-purple-500" />
          Voice & Audio Quality
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <button
            onClick={() => handleUpdate({ voiceQuality: 'standard', audioQuality: 'standard' })}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Standard Voice</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Balanced 64kbps speech compression for crystal-clear vocal clarity with low file size.
              </p>
            </div>
            {settings.voiceQuality === 'standard' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleUpdate({ voiceQuality: 'high', audioQuality: 'high' })}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">High Quality Audio</p>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">
                  128kbps+
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full dynamic audio spectrum for high fidelity voice notes and music recordings.
              </p>
            </div>
            {settings.voiceQuality === 'high' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 4. Download Quality */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
          <Download className="w-4 h-4 text-amber-500" />
          Default Download Quality
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
          <button
            onClick={() => handleUpdate({ downloadQuality: 'standard' })}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Standard Quality</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automatically download bandwidth-friendly web versions of images and videos.
              </p>
            </div>
            {settings.downloadQuality === 'standard' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleUpdate({ downloadQuality: 'hd' })}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">HD Quality</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Always request full high-resolution assets when available.
              </p>
            </div>
            {settings.downloadQuality === 'hd' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleUpdate({ downloadQuality: 'ask' })}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Ask every time</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prompt to select between Standard or HD when viewing or downloading large media.
              </p>
            </div>
            {settings.downloadQuality === 'ask' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
