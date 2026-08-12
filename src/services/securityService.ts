import {
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SecurityEvent } from '../types/chat';

export const securityService = {
  // Log security event
  async logEvent(
    uid: string,
    type: SecurityEvent['type'],
    title: string,
    description: string,
    deviceInfo?: string
  ) {
    const eventId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const eventDoc: SecurityEvent = {
      id: eventId,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      deviceInfo: deviceInfo || 'Web Browser',
    };

    try {
      await setDoc(doc(db, 'users', uid, 'securityEvents', eventId), eventDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/securityEvents/${eventId}`);
    }
  },

  // Listen to security events in real-time
  listenToSecurityEvents(uid: string, callback: (events: SecurityEvent[]) => void) {
    const q = query(
      collection(db, 'users', uid, 'securityEvents'),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map((d) => d.data() as SecurityEvent));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${uid}/securityEvents`);
      }
    );
  },
};
