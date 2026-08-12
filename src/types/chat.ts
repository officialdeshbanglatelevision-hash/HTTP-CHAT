export interface PrivacySettings {
  lastSeen?: 'everyone' | 'contacts' | 'nobody';
  profilePhoto?: 'everyone' | 'contacts' | 'nobody';
  about?: 'everyone' | 'contacts' | 'nobody';
  discoveryByPhone?: 'everyone' | 'contacts' | 'nobody';
  discoveryByUsername?: 'everyone' | 'nobody';
  readReceipts?: boolean;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  about?: string;
  phoneNumber?: string;
  email?: string;
  createdAt?: string;
  lastSeen?: string;
  online?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorPin?: string;
  privacySettings?: PrivacySettings;
}

export interface LinkedDevice {
  deviceId: string;
  uid: string;
  deviceName: string;
  browser: string;
  platform: string;
  createdAt: string;
  lastActive: string;
  revoked: boolean;
}

export interface PairingSession {
  sessionId: string;
  pairingCode: string;
  primaryUid: string;
  status: 'pending' | 'awaiting_approval' | 'approved' | 'rejected' | 'expired';
  secondaryDeviceInfo?: {
    browser: string;
    platform: string;
    ipAddress?: string;
    location?: string;
  };
  createdAt: string;
  expiresAt: string;
}

export interface UserContact {
  contactUid: string;
  alias?: string;
  addedAt: string;
  profile?: UserProfile;
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'device_linked' | 'device_revoked' | 'phone_changed' | 'email_changed' | 'password_changed' | 'two_factor_updated';
  title: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface Channel {
  channelId: string;
  name: string;
  username: string;
  description?: string;
  photoURL?: string;
  ownerUid: string;
  adminUids: string[];
  subscribersCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
  isSubscribed?: boolean;
}

export interface ChannelPost {
  id: string;
  channelId: string;
  authorUid: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  media?: CloudinaryMediaMetadata;
  createdAt: string;
  likesCount?: number;
  likedByMe?: boolean;
}

export interface StickerItem {
  id: string;
  url: string;
  name: string;
  category?: string;
}

export interface StickerPack {
  id: string;
  name: string;
  author: string;
  previewUrl: string;
  stickers: StickerItem[];
  isCustom?: boolean;
  ownerUid?: string;
}

export interface ChatRoom {
  chatId: string;
  type: 'individual' | 'group';
  name?: string;
  photoURL?: string;
  description?: string;
  members: string[];
  adminUids?: string[];
  lastMessageText?: string;
  lastMessageSenderName?: string;
  lastMessageTimestamp?: any;
  unreadCounts?: Record<string, number>;
  updatedAt?: any;
  createdBy?: string;
  mutedBy?: string[];
  pinnedBy?: string[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  reactedByMe: boolean;
}

export interface ReplyTarget {
  id: string;
  senderName: string;
  text: string;
}

export interface EventDetails {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  rsvp?: Record<string, 'going' | 'maybe' | 'declined'>;
}

export interface CloudinaryMediaMetadata {
  provider: 'cloudinary';
  publicId: string;
  secureUrl: string;
  thumbnailUrl?: string;
  resourceType: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  fileName?: string;
}

export interface ChatMessage {
  id: string;
  chatId?: string;
  senderId?: string;
  sender?: 'me' | 'other';
  senderName?: string;
  senderAvatar?: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'contact' | 'location' | 'event' | 'poll';
  text: string;
  media?: CloudinaryMediaMetadata;
  mediaUrl?: string;
  mediaName?: string;
  mediaType?: string;
  mediaSize?: string;
  eventDetails?: EventDetails;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions?: Record<string, MessageReaction>;
  replyTo?: ReplyTarget;
  isEdited?: boolean;
  isDeletedForEveryone?: boolean;
  createdAt?: any;
}

