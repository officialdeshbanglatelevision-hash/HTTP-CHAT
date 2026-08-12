import { StickerPack, StickerItem } from '../types/chat';

export const BUILTIN_STICKER_PACKS: StickerPack[] = [
  {
    id: 'http_vibes',
    name: 'HTTP Vibes',
    author: 'HTTP CHAT',
    previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    stickers: [
      {
        id: 'vibes_1',
        name: 'Cool Wave',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        category: 'Happy',
      },
      {
        id: 'vibes_2',
        name: 'Party Time',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        category: 'Celebration',
      },
      {
        id: 'vibes_3',
        name: 'Heart Glasses',
        url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
        category: 'Love',
      },
      {
        id: 'vibes_4',
        name: 'High Five',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        category: 'Friendship',
      },
    ],
  },
  {
    id: '3d_emojis',
    name: '3D Expressions',
    author: 'HTTP CHAT',
    previewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=120&auto=format&fit=crop&q=80',
    stickers: [
      {
        id: '3d_1',
        name: 'Mind Blown',
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80',
        category: 'Surprised',
      },
      {
        id: '3d_2',
        name: 'Zen Meditation',
        url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&auto=format&fit=crop&q=80',
        category: 'Calm',
      },
      {
        id: '3d_3',
        name: 'Rocket Blast',
        url: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=300&auto=format&fit=crop&q=80',
        category: 'Action',
      },
    ],
  },
];

export const stickerService = {
  getBuiltinPacks(): StickerPack[] {
    return BUILTIN_STICKER_PACKS;
  },

  getRecentStickers(): StickerItem[] {
    try {
      const stored = localStorage.getItem('http_chat_recent_stickers');
      return stored ? JSON.parse(stored) : BUILTIN_STICKER_PACKS[0].stickers.slice(0, 3);
    } catch {
      return BUILTIN_STICKER_PACKS[0].stickers.slice(0, 3);
    }
  },

  addRecentSticker(sticker: StickerItem) {
    try {
      const recents = this.getRecentStickers().filter((s) => s.id !== sticker.id);
      recents.unshift(sticker);
      localStorage.setItem('http_chat_recent_stickers', JSON.stringify(recents.slice(0, 20)));
    } catch (e) {
      console.warn('Failed to save recent sticker', e);
    }
  },
};
