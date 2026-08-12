import { useState, useEffect, useCallback } from 'react';
import { requestAndRegisterFCMToken, checkSecureContext } from '../services/fcmService';

export type PermissionState = 'granted' | 'denied' | 'prompt';

export interface UsePermissionReturn {
  notificationPermission: NotificationPermission;
  cameraPermission: PermissionState;
  micPermission: PermissionState;
  requestNotification: (uid?: string) => Promise<boolean>;
  requestCamera: () => Promise<MediaStream | null>;
  requestMic: () => Promise<MediaStream | null>;
  checkAllPermissions: () => Promise<void>;
}

export function usePermission(): UsePermissionReturn {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );
  const [cameraPermission, setCameraPermission] = useState<PermissionState>('prompt');
  const [micPermission, setMicPermission] = useState<PermissionState>('prompt');

  const checkAllPermissions = useCallback(async () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const camQuery = await navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => null);
        if (camQuery) {
          setCameraPermission(camQuery.state as PermissionState);
        }

        const micQuery = await navigator.permissions.query({ name: 'microphone' as PermissionName }).catch(() => null);
        if (micQuery) {
          setMicPermission(micQuery.state as PermissionState);
        }
      } catch (err) {
        console.warn('Permissions API query failed:', err);
      }
    }
  }, []);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  const requestNotification = useCallback(async (uid?: string): Promise<boolean> => {
    if (!checkSecureContext()) {
      throw new Error('Push notifications require a secure context (HTTPS or localhost).');
    }
    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      if (uid) {
        await requestAndRegisterFCMToken(uid).catch(() => {});
      }
      return true;
    }
    if (Notification.permission === 'denied') {
      setNotificationPermission('denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted' && uid) {
      await requestAndRegisterFCMToken(uid).catch(() => {});
      return true;
    }
    return false;
  }, []);

  const requestCamera = useCallback(async (): Promise<MediaStream | null> => {
    if (cameraPermission === 'denied') {
      throw new Error('Camera permission is blocked. Please allow camera access in your browser settings.');
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraPermission('granted');
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
      }
      throw err;
    }
  }, [cameraPermission]);

  const requestMic = useCallback(async (): Promise<MediaStream | null> => {
    if (micPermission === 'denied') {
      throw new Error('Microphone permission is blocked. Please allow microphone access in your browser settings.');
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setMicPermission('granted');
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
      }
      throw err;
    }
  }, [micPermission]);

  return {
    notificationPermission,
    cameraPermission,
    micPermission,
    requestNotification,
    requestCamera,
    requestMic,
    checkAllPermissions,
  };
}
