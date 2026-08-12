import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db, firebaseApp } from '../lib/firebase';

const VAPID_KEY = 'BJhxfc4Odgdtsm43kwHbGm9sUJ5FYvxy1JkbJhzCYmgFAYdZDcDn5FK44M2v2flx6Y3zUzWH5ECtDrDfnAXQ3iA';

export interface FCMTokenRecord {
  uid: string;
  deviceId: string;
  fcmToken: string;
  browser: string;
  platform: string;
  createdAt: any;
  lastActiveAt: any;
  notificationsEnabled: boolean;
}

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('http_chat_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('http_chat_device_id', deviceId);
  }
  return deviceId;
};

export const checkSecureContext = (): boolean => {
  return window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
};

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser.');
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    console.log('Firebase Messaging Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function requestAndRegisterFCMToken(uid: string): Promise<string | null> {
  if (!checkSecureContext()) {
    console.warn('Notifications require a secure context (HTTPS or localhost).');
    throw new Error('Secure context required for push notifications.');
  }

  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser/environment.');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied or dismissed.');
  }

  const swReg = await registerServiceWorker();
  if (!swReg) {
    throw new Error('Service Worker registration is required for push notifications.');
  }

  const messaging = getMessaging(firebaseApp);
  
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (currentToken) {
      const deviceId = getDeviceId();
      const tokenRecordId = `${deviceId}_${uid.substring(0, 6)}`;
      const tokenDocRef = doc(db, 'users', uid, 'notificationTokens', tokenRecordId);

      const record: FCMTokenRecord = {
        uid,
        deviceId,
        fcmToken: currentToken,
        browser: navigator.userAgent,
        platform: navigator.platform || 'Web',
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        notificationsEnabled: true,
      };

      await setDoc(tokenDocRef, record, { merge: true });
      localStorage.setItem('http_chat_fcm_token', currentToken);
      localStorage.setItem('http_chat_notifications_enabled', 'true');
      console.log('FCM Token successfully registered:', currentToken.substring(0, 10) + '...');
      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving FCM token:', error);
    throw error;
  }
}

export async function removeFCMTokenOnLogout(uid?: string): Promise<void> {
  try {
    const deviceId = getDeviceId();
    const token = localStorage.getItem('http_chat_fcm_token');
    if (uid) {
      const tokenRecordId = `${deviceId}_${uid.substring(0, 6)}`;
      const tokenDocRef = doc(db, 'users', uid, 'notificationTokens', tokenRecordId);
      await deleteDoc(tokenDocRef).catch(() => {});
    }
    localStorage.removeItem('http_chat_fcm_token');
    localStorage.setItem('http_chat_notifications_enabled', 'false');
  } catch (error) {
    console.error('Error removing FCM token on logout:', error);
  }
}

export async function initForegroundMessaging(onMessageCallback?: (payload: any) => void) {
  const supported = await isSupported();
  if (!supported || Notification.permission !== 'granted') return;

  try {
    const messaging = getMessaging(firebaseApp);
    onMessage(messaging, async (payload) => {
      console.log('Foreground message received:', payload);
      // Check user preferences if uid provided in payload data
      if (payload.data?.recipientUid) {
        const prefs = await getUserNotificationPreferences(payload.data.recipientUid);
        if (prefs && prefs.messagePreview === false) {
          // Hide message preview if user disabled message preview
          if (payload.notification) {
            payload.notification.body = 'New message';
          }
        }
      }

      if (onMessageCallback) {
        onMessageCallback(payload);
      } else {
        const title = payload.notification?.title || 'HTTP CHAT';
        const body = payload.notification?.body || 'New message received';
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      }
    });
  } catch (err) {
    console.error('Failed to initialize foreground messaging:', err);
  }
}

export interface NotificationPreferences {
  messageSound: boolean;
  messageVibrate: boolean;
  groupSound: boolean;
  callRingtone: boolean;
  reactionNotifications: boolean;
  messagePreview: boolean;
  securityAlerts: boolean;
  acpReplies: boolean;
  eventReminders: boolean;
}

export async function getUserNotificationPreferences(uid: string): Promise<NotificationPreferences | null> {
  try {
    const docRef = doc(db, 'users', uid, 'settings', 'notifications');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as NotificationPreferences;
    }
  } catch (e) {
    console.error('Failed to fetch user notification preferences:', e);
  }
  return null;
}
