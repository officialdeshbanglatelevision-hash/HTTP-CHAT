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
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Channel, ChannelPost, CloudinaryMediaMetadata } from '../types/chat';

export const channelService = {
  // Create Channel
  async createChannel(
    ownerUid: string,
    name: string,
    username: string,
    description?: string,
    photoURL?: string,
    isPublic = true
  ): Promise<Channel> {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const channelId = `chan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Check username availability in usernames collection
    const usernameSnap = await getDoc(doc(db, 'usernames', cleanUsername));
    if (usernameSnap.exists()) {
      throw new Error(`Channel handle @${cleanUsername} is already taken.`);
    }

    const channelData: Channel = {
      channelId,
      name,
      username: cleanUsername,
      description: description || '',
      photoURL: photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${channelId}`,
      ownerUid,
      adminUids: [ownerUid],
      subscribersCount: 1,
      isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Save channel document
      await setDoc(doc(db, 'channels', channelId), channelData);

      // Reserve username
      await setDoc(doc(db, 'usernames', cleanUsername), {
        uid: ownerUid,
        channelId,
        username: cleanUsername,
        createdAt: new Date().toISOString(),
      });

      // Add owner as first subscriber
      await setDoc(doc(db, 'channels', channelId, 'subscribers', ownerUid), {
        uid: ownerUid,
        subscribedAt: new Date().toISOString(),
      });

      return channelData;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `channels/${channelId}`);
      throw err;
    }
  },

  // Listen to channels the user has subscribed to or public channels
  listenToUserChannels(uid: string, callback: (channels: Channel[]) => void) {
    const q = query(collection(db, 'channels'));
    return onSnapshot(
      q,
      async (snapshot) => {
        const all = snapshot.docs.map((d) => d.data() as Channel);
        
        // Filter subscribed or owned channels
        const userChannels: Channel[] = [];
        for (const chan of all) {
          const subSnap = await getDoc(doc(db, 'channels', chan.channelId, 'subscribers', uid));
          if (subSnap.exists() || chan.ownerUid === uid) {
            userChannels.push({ ...chan, isSubscribed: true });
          } else if (chan.isPublic) {
            userChannels.push({ ...chan, isSubscribed: false });
          }
        }
        callback(userChannels);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'channels');
      }
    );
  },

  // Subscribe / Unsubscribe channel
  async toggleSubscription(channelId: string, uid: string): Promise<boolean> {
    const subRef = doc(db, 'channels', channelId, 'subscribers', uid);
    const subSnap = await getDoc(subRef);

    const chanRef = doc(db, 'channels', channelId);
    const chanSnap = await getDoc(chanRef);
    if (!chanSnap.exists()) throw new Error('Channel not found');

    const currentCount = chanSnap.data().subscribersCount || 0;

    if (subSnap.exists()) {
      // Unsubscribe
      await deleteDoc(subRef);
      await updateDoc(chanRef, { subscribersCount: Math.max(0, currentCount - 1) });
      return false;
    } else {
      // Subscribe
      await setDoc(subRef, { uid, subscribedAt: new Date().toISOString() });
      await updateDoc(chanRef, { subscribersCount: currentCount + 1 });
      return true;
    }
  },

  // Create Channel Post
  async createPost(
    channelId: string,
    authorUid: string,
    authorName: string,
    authorAvatar: string | undefined,
    text: string,
    media?: CloudinaryMediaMetadata
  ): Promise<ChannelPost> {
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const postData: ChannelPost = {
      id: postId,
      channelId,
      authorUid,
      authorName,
      authorAvatar,
      text,
      media,
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };

    try {
      await setDoc(doc(db, 'channels', channelId, 'posts', postId), postData);
      await updateDoc(doc(db, 'channels', channelId), {
        updatedAt: new Date().toISOString(),
      });
      return postData;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `channels/${channelId}/posts/${postId}`);
      throw err;
    }
  },

  // Listen to channel posts
  listenToChannelPosts(channelId: string, callback: (posts: ChannelPost[]) => void) {
    const q = query(
      collection(db, 'channels', channelId, 'posts'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map((d) => d.data() as ChannelPost));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `channels/${channelId}/posts`);
      }
    );
  },
};
