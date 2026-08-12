import React, { useState } from 'react';
import { BUILTIN_STICKER_PACKS, stickerService } from '../../services/stickerService';
import { StickerItem } from '../../types/chat';
import { Smile, Sticker, Search, X, Clock } from 'lucide-react';

interface EmojiStickerPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker: (sticker: StickerItem) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Emotion',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','🫠','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','🫨','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'
    ],
  },
  {
    name: 'Gestures & People',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫴','🫳','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦵','🦿','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','💋'
    ],
  },
  {
    name: 'Animals & Nature',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪲','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','zebra','🦍','🦧','🐘','🦣','🦏','🦛','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃','🦚','🦜','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🦔'
    ],
  },
  {
    name: 'Food & Drink',
    emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','☕','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂','🥃','🫗','🥤','🧋','🧃','🧉','🧊'
    ],
  },
  {
    name: 'Objects & Symbols',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆏','🅾️','💦','💨','💫','💬','🗨️','💥','🔥','✨','⭐','🌟','⚡'
    ],
  },
];

export const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
  onSelectEmoji,
  onSelectSticker,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'sticker'>('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStickerPack, setSelectedStickerPack] = useState(BUILTIN_STICKER_PACKS[0]);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-3 shadow-2xl w-full max-w-sm flex flex-col h-80 space-y-2 z-50">
      {/* Top Header & Search Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('emoji')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'emoji' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emojis</span>
          </button>
          <button
            onClick={() => setActiveTab('sticker')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'sticker' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sticker className="w-3.5 h-3.5" />
            <span>Stickers</span>
          </button>
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'emoji' ? 'Search emoji...' : 'Search stickers...'}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1 px-2.5 pl-7 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'emoji' ? (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
          {EMOJI_CATEGORIES.map((cat) => {
            const filtered = cat.emojis.filter((e) =>
              searchQuery ? e.includes(searchQuery) : true
            );
            if (filtered.length === 0) return null;

            return (
              <div key={cat.name} className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {cat.name}
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {filtered.map((emo, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectEmoji(emo)}
                      className="text-lg p-1.5 hover:bg-slate-800 rounded-xl transition-transform hover:scale-125 flex items-center justify-center"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
          {/* Sticker Pack Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
            {BUILTIN_STICKER_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => setSelectedStickerPack(pack)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition-colors ${
                  selectedStickerPack.id === pack.id
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <img src={pack.previewUrl} alt={pack.name} className="w-4 h-4 rounded-md object-cover" />
                <span>{pack.name}</span>
              </button>
            ))}
          </div>

          {/* Sticker Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 pr-1">
            {selectedStickerPack.stickers.map((stk) => (
              <button
                key={stk.id}
                onClick={() => {
                  stickerService.addRecentSticker(stk);
                  onSelectSticker(stk);
                }}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl p-2 flex flex-col items-center justify-center hover:scale-105 transition-all group"
              >
                <img src={stk.url} alt={stk.name} className="w-12 h-12 object-contain" />
                <span className="text-[9px] text-slate-400 mt-1 truncate max-w-full">{stk.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
