import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { stickerService, BUILTIN_STICKER_PACKS } from '../services/stickerService';
import { StickerPack } from '../types/chat';
import { ArrowLeft, Smile, Plus, Check, Star, Sparkles } from 'lucide-react';

export const StickersScreen: React.FC = () => {
  const { setActiveScreen, showToast } = useTheme();
  const [selectedPack, setSelectedPack] = useState<StickerPack>(BUILTIN_STICKER_PACKS[0]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveScreen('settings')}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Settings</span>
        </button>
        <h1 className="text-base font-bold text-slate-100">Sticker Store</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-6">
        {/* Pack Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {BUILTIN_STICKER_PACKS.map((pack) => {
            const isSelected = selectedPack.id === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => setSelectedPack(pack)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-2xl text-xs font-bold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                    : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                }`}
              >
                <img src={pack.previewUrl} alt={pack.name} className="w-5 h-5 rounded-md object-cover" />
                <span>{pack.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Sticker Pack Overview */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">{selectedPack.name}</h2>
              <p className="text-xs text-slate-400">By {selectedPack.author} • {selectedPack.stickers.length} Stickers</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg uppercase">
              Free Pack
            </span>
          </div>

          {/* Sticker Items Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {selectedPack.stickers.map((stk) => (
              <div
                key={stk.id}
                className="bg-slate-900 border border-slate-700/60 rounded-2xl p-2 flex flex-col items-center hover:border-emerald-500/50 transition-all group"
              >
                <img
                  src={stk.url}
                  alt={stk.name}
                  className="w-16 h-16 object-contain rounded-xl group-hover:scale-105 transition-transform"
                />
                <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full font-medium">
                  {stk.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
