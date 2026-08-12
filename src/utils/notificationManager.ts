import { requestAndRegisterFCMToken, removeFCMTokenOnLogout, initForegroundMessaging, checkSecureContext } from '../services/fcmService';

export class NotificationManager {
  private static instance: NotificationManager;
  private currentUid: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public async initializeForUser(uid: string): Promise<void> {
    this.currentUid = uid;
    if (!checkSecureContext()) {
      console.warn('NotificationManager: Secure context required for push notifications.');
      return;
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        await requestAndRegisterFCMToken(uid);
        initForegroundMessaging();
      } catch (e) {
        console.error('NotificationManager: Failed to register token on init', e);
      }
    }
  }

  public async requestPermissionAndRegister(uid: string): Promise<string | null> {
    this.currentUid = uid;
    const token = await requestAndRegisterFCMToken(uid);
    initForegroundMessaging();
    return token;
  }

  public async cleanupForLogout(): Promise<void> {
    if (this.currentUid) {
      await removeFCMTokenOnLogout(this.currentUid);
      this.currentUid = null;
    }
  }
}

export const notificationManager = NotificationManager.getInstance();
