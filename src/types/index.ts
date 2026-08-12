export type ScreenType =
  | 'splash'
  | 'welcome'
  | 'phone_login'
  | 'otp_verification'
  | 'email_login'
  | 'register'
  | 'forgot_password'
  | 'profile_setup'
  | 'chats'
  | 'updates'
  | 'communities'
  | 'calls'
  | 'contacts'
  | 'settings'
  | 'profile'
  | 'new_chat'
  | 'individual_chat'
  | 'group_chat'
  | 'chat_info'
  | 'media_viewer'
  | 'search'
  | 'notifications'
  | 'privacy'
  | 'security'
  | 'storage'
  | 'manage_storage'
  | 'media_quality'
  | 'appearance'
  | 'help'
  | 'about'
  | 'error_demo'
  | 'qr_profile'
  | 'scan_qr'
  | 'linked_devices'
  | 'link_secondary'
  | 'account_settings'
  | 'security_activity'
  | 'find_people'
  | 'wallpaper'
  | 'stickers'
  | 'permissions'
  | 'camera_test'
  | 'mic_test'
  | 'notification_debug';

export type MainTabType = 'chats' | 'updates' | 'communities' | 'calls';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColor =
  | 'emerald'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'cyan'
  | 'amber'
  | 'indigo'
  | 'teal'
  | 'orange';

export type ChatWallpaper =
  | 'default'
  | 'doodle'
  | 'geometric'
  | 'dot-matrix'
  | 'abstract-waves'
  | 'cyber-grid'
  | 'circuit'
  | 'gradient-emerald'
  | 'gradient-sunset'
  | 'gradient-midnight'
  | 'gradient-aurora'
  | 'solid-dark'
  | 'solid-light'
  | 'solid-sage'
  | 'solid-navy'
  | 'solid-plum'
  | 'solid-sand'
  | 'solid-charcoal';

export type FontSize = 'small' | 'medium' | 'large';

export type SearchCategory =
  | 'all'
  | 'messages'
  | 'contacts'
  | 'groups'
  | 'communities'
  | 'media'
  | 'documents'
  | 'links';

export type PrivacyOption = 'everyone' | 'my_contacts' | 'nobody' | 'my_contacts_except' | 'only_share_with';

export interface ToastMessage {
  id: string;
  title: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}
