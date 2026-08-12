import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { LinkedDevice, PairingSession } from '../types/chat';

// Helper to detect browser & OS platform
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let platform = 'Unknown OS';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  if (ua.includes('Win')) platform = 'Windows';
  else if (ua.includes('Mac')) platform = 'macOS';
  else if (ua.includes('Linux')) platform = 'Linux';
  else if (ua.includes('Android')) platform = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';

  return { browser, platform, deviceName: `${browser} on ${platform}` };
}

// Generate random 6-digit pairing code (formatted e.g. "482 917")
function generatePairingCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  const str = num.toString();
  return `${str.slice(0, 3)} ${str.slice(3)}`;
}

export const MAX_LINKED_DEVICES = 20;

export const linkedDeviceService = {
  // Primary Session: Create a new short-lived pairing session with QR & 6-digit code
  async createPairingSession(primaryUid: string): Promise<PairingSession> {
    const sessionId = `pair_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pairingCode = generatePairingCode();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry
    const sessionDoc: PairingSession = {
      sessionId,
      pairingCode,
      primaryUid,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    try {
      await setDoc(doc(db, 'pairingSessions', sessionId), sessionDoc);
      return sessionDoc;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pairingSessions/${sessionId}`);
      throw err;
    }
  },

  // Listen to pairing session updates (Primary device listens for secondary connection attempt)
  listenToPairingSession(sessionId: string, callback: (session: PairingSession | null) => void) {
    return onSnapshot(
      doc(db, 'pairingSessions', sessionId),
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as PairingSession);
        } else {
          callback(null);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `pairingSessions/${sessionId}`);
      }
    );
  },

  // Secondary Browser: Submit pairing code or QR session to request link
  async submitPairingRequest(
    pairingCodeOrSessionId: string,
    secondaryInfo: { browser: string; platform: string }
  ): Promise<PairingSession> {
    const cleanCode = pairingCodeOrSessionId.trim().replaceAll(' ', '');
    
    // Find session by sessionId or pairingCode
    let sessionSnap = await getDoc(doc(db, 'pairingSessions', cleanCode));

    if (!sessionSnap.exists()) {
      // Query by pairingCode
      const q = query(
        collection(db, 'pairingSessions'),
        where('pairingCode', '==', pairingCodeOrSessionId.trim())
      );
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        throw new Error('Invalid or expired pairing code. Please try again.');
      }
      sessionSnap = querySnap.docs[0];
    }

    const data = sessionSnap.data() as PairingSession;

    // Check expiry
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      throw new Error('This pairing code has expired. Please generate a new code.');
    }

    if (data.status !== 'pending') {
      throw new Error('Pairing session is no longer valid.');
    }

    // Update status to awaiting_approval
    await updateDoc(doc(db, 'pairingSessions', data.sessionId), {
      status: 'awaiting_approval',
      secondaryDeviceInfo: secondaryInfo,
    });

    return {
      ...data,
      status: 'awaiting_approval',
      secondaryDeviceInfo: secondaryInfo,
    };
  },

  // Primary Device: Approve incoming secondary connection request
  async approvePairingSession(sessionId: string, primaryUid: string): Promise<string> {
    // 1. Enforce max 20 devices limit server-side / transactionally
    const devicesRef = collection(db, 'users', primaryUid, 'devices');
    const activeDevicesSnap = await getDocs(query(devicesRef, where('revoked', '==', false)));

    if (activeDevicesSnap.size >= MAX_LINKED_DEVICES) {
      throw new Error(
        `You've reached the maximum limit of ${MAX_LINKED_DEVICES} linked devices. Please remove an existing device first.`
      );
    }

    const sessionSnap = await getDoc(doc(db, 'pairingSessions', sessionId));
    if (!sessionSnap.exists()) {
      throw new Error('Pairing session not found.');
    }

    const sessionData = sessionSnap.data() as PairingSession;
    if (sessionData.primaryUid !== primaryUid) {
      throw new Error('Unauthorized pairing approval.');
    }

    // Create device ID and device entry
    const newDeviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const browser = sessionData.secondaryDeviceInfo?.browser || 'Browser';
    const platform = sessionData.secondaryDeviceInfo?.platform || 'Web';

    const newDevice: LinkedDevice = {
      deviceId: newDeviceId,
      uid: primaryUid,
      deviceName: `${browser} on ${platform}`,
      browser,
      platform,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      revoked: false,
    };

    await setDoc(doc(db, 'users', primaryUid, 'devices', newDeviceId), newDevice);

    // Update pairing session to approved
    await updateDoc(doc(db, 'pairingSessions', sessionId), {
      status: 'approved',
    });

    // Log security event
    const secEventId = `sec_${Date.now()}`;
    await setDoc(doc(db, 'users', primaryUid, 'securityEvents', secEventId), {
      id: secEventId,
      type: 'device_linked',
      title: 'New Linked Device Approved',
      description: `Linked ${newDevice.deviceName} to your account`,
      timestamp: new Date().toISOString(),
      deviceInfo: newDevice.deviceName,
    });

    return newDeviceId;
  },

  // Primary Device: Reject pairing request
  async rejectPairingSession(sessionId: string) {
    await updateDoc(doc(db, 'pairingSessions', sessionId), {
      status: 'rejected',
    });
  },

  // Get active linked devices for user
  async getLinkedDevices(uid: string): Promise<LinkedDevice[]> {
    try {
      const q = query(collection(db, 'users', uid, 'devices'), where('revoked', '==', false));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as LinkedDevice);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${uid}/devices`);
      return [];
    }
  },

  // Listen to linked devices in real-time
  listenToLinkedDevices(uid: string, callback: (devices: LinkedDevice[]) => void) {
    const q = query(collection(db, 'users', uid, 'devices'));
    return onSnapshot(
      q,
      (snapshot) => {
        const devices = snapshot.docs.map((d) => d.data() as LinkedDevice);
        callback(devices.filter((dev) => !dev.revoked));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${uid}/devices`);
      }
    );
  },

  // Revoke device
  async revokeDevice(uid: string, deviceId: string) {
    const devRef = doc(db, 'users', uid, 'devices', deviceId);
    const devSnap = await getDoc(devRef);
    const deviceName = devSnap.exists() ? devSnap.data().deviceName : 'Device';

    await updateDoc(devRef, { revoked: true });

    // Log security event
    const secEventId = `sec_${Date.now()}`;
    await setDoc(doc(db, 'users', uid, 'securityEvents', secEventId), {
      id: secEventId,
      type: 'device_revoked',
      title: 'Linked Device Revoked',
      description: `Revoked access for ${deviceName}`,
      timestamp: new Date().toISOString(),
      deviceInfo: deviceName,
    });
  },

  // Revoke all other devices
  async revokeAllOtherDevices(uid: string, currentDeviceId: string) {
    const devices = await this.getLinkedDevices(uid);
    for (const dev of devices) {
      if (dev.deviceId !== currentDeviceId) {
        await this.revokeDevice(uid, dev.deviceId);
      }
    }
  },
};
