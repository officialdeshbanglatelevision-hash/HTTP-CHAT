import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserContact, UserProfile } from '../types/chat';

export const contactService = {
  // Search user by username
  async searchUserByUsername(username: string): Promise<UserProfile | null> {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) return null;

    try {
      const usernameSnap = await getDoc(doc(db, 'usernames', cleanUsername));
      if (!usernameSnap.exists()) return null;

      const uid = usernameSnap.data().uid;
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) return null;

      return userSnap.data() as UserProfile;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `usernames/${cleanUsername}`);
      return null;
    }
  },

  // Search user by phone number (respecting user privacy settings)
  async searchUserByPhone(phone: string, searchingUid: string): Promise<UserProfile | null> {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return null;

    try {
      const q = query(collection(db, 'users'), where('phoneNumber', '==', cleanPhone));
      const querySnap = await getDocs(q);

      if (querySnap.empty) return null;

      const profile = querySnap.docs[0].data() as UserProfile;

      // Check privacy settings
      const discoverySetting = profile.privacySettings?.discoveryByPhone || 'everyone';
      if (discoverySetting === 'nobody') {
        return null;
      }

      if (discoverySetting === 'contacts') {
        // Verify if searchingUid is in target's contacts
        const contactCheck = await getDoc(doc(db, 'users', profile.uid, 'contacts', searchingUid));
        if (!contactCheck.exists()) {
          return null;
        }
      }

      return profile;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
      return null;
    }
  },

  // Fetch public profile by UID or QR Profile ID
  async fetchUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  // Add contact
  async addContact(userUid: string, contactUid: string, alias?: string): Promise<void> {
    if (userUid === contactUid) throw new Error('Cannot add yourself as a contact.');

    const contactRef = doc(db, 'users', userUid, 'contacts', contactUid);
    const newContact: UserContact = {
      contactUid,
      alias: alias || '',
      addedAt: new Date().toISOString(),
    };

    try {
      await setDoc(contactRef, newContact, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userUid}/contacts/${contactUid}`);
    }
  },

  // Remove contact
  async removeContact(userUid: string, contactUid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userUid, 'contacts', contactUid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userUid}/contacts/${contactUid}`);
    }
  },

  // Listen to user contacts
  listenToUserContacts(userUid: string, callback: (contacts: UserContact[]) => void) {
    const contactsRef = collection(db, 'users', userUid, 'contacts');
    return onSnapshot(
      contactsRef,
      async (snapshot) => {
        const contactItems: UserContact[] = [];

        for (const d of snapshot.docs) {
          const item = d.data() as UserContact;
          // Fetch real profile data for referenced UID
          const profile = await contactService.fetchUserProfile(item.contactUid);
          if (profile) {
            item.profile = profile;
          }
          contactItems.push(item);
        }

        callback(contactItems);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${userUid}/contacts`);
      }
    );
  },

  // Block User
  async blockUser(userUid: string, targetUid: string): Promise<void> {
    try {
      await setDoc(
        doc(db, 'users', userUid, 'blocked', targetUid),
        { targetUid, blockedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userUid}/blocked/${targetUid}`);
    }
  },

  // Unblock User
  async unblockUser(userUid: string, targetUid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userUid, 'blocked', targetUid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userUid}/blocked/${targetUid}`);
    }
  },

  // Listen to blocked users list
  listenToBlockedUsers(userUid: string, callback: (blockedUids: string[]) => void) {
    const blockedRef = collection(db, 'users', userUid, 'blocked');
    return onSnapshot(
      blockedRef,
      (snapshot) => {
        callback(snapshot.docs.map((d) => d.id));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${userUid}/blocked`);
      }
    );
  },
};
