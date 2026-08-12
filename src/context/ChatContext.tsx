import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { mediaService, CloudinaryMediaMetadata } from '../services/mediaService';
import { acpAiService, ACP_BOT_UID } from '../services/acpAiService';
import { ChatRoom, ChatMessage, UserProfile, EventDetails } from '../types/chat';

interface ChatContextType {
  chats: ChatRoom[];
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  activeChat: ChatRoom | null;
  activeChatMessages: ChatMessage[];
  activeTypingUsers: string[];
  activeChatMembersProfiles: Record<string, UserProfile>;
  loadingChats: boolean;
  loadingMessages: boolean;
  sendMessage: (
    chatId: string,
    text: string,
    type?: ChatMessage['type'],
    mediaUrl?: string,
    replyTo?: ChatMessage['replyTo'],
    eventDetails?: EventDetails,
    mediaName?: string,
    mediaType?: string,
    mediaSize?: string,
    media?: CloudinaryMediaMetadata
  ) => Promise<void>;
  createOrGetIndividualChat: (otherUser: UserProfile) => Promise<string>;
  getOrCreateIndividualChat: (otherUser: UserProfile) => Promise<string>;
  createGroupChat: (name: string, memberUids: string[], photoURL?: string, description?: string) => Promise<string>;
  reactToMessage: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  editMessage: (chatId: string, messageId: string, newText: string) => Promise<void>;
  updateTypingState: (chatId: string, isTyping: boolean) => Promise<void>;
  updateRsvp: (chatId: string, messageId: string, rsvpStatus: 'going' | 'maybe' | 'declined') => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
  markMessagesAsRead: (chatId: string, messageIds: string[]) => Promise<void>;
  uploadMediaFile: (file: File, pathPrefix?: string) => Promise<{ url: string; name: string; type: string; size: string }>;
  searchUsers: (searchQuery: string) => Promise<UserProfile[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [activeTypingUsers, setActiveTypingUsers] = useState<string[]>([]);
  const [activeChatMembersProfiles, setActiveChatMembersProfiles] = useState<Record<string, UserProfile>>({});
  const [loadingChats, setLoadingChats] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  // 1. Listen to real-time chats where current user is a member
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setLoadingChats(false);
      return;
    }

    setLoadingChats(true);
    const chatsPath = 'chats';
    const chatsQuery = query(
      collection(db, chatsPath),
      where('members', 'array-contains', currentUser.uid)
    );

    const unsub = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const loadedChats: ChatRoom[] = [];
        snapshot.forEach((docSnap) => {
          loadedChats.push({
            chatId: docSnap.id,
            ...docSnap.data(),
          } as ChatRoom);
        });

        // Client-side sort by updatedAt timestamp descending
        loadedChats.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt || 0).getTime();
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt || 0).getTime();
          return timeB - timeA;
        });

        setChats(loadedChats);
        setLoadingChats(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, chatsPath);
        setLoadingChats(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // 2. Listen to active chat messages & typing state
  useEffect(() => {
    if (!activeChatId || !currentUser) {
      setActiveChatMessages([]);
      setActiveTypingUsers([]);
      return;
    }

    setLoadingMessages(true);
    const messagesPath = `chats/${activeChatId}/messages`;
    const messagesQuery = query(
      collection(db, messagesPath),
      orderBy('createdAt', 'asc')
    );

    const msgsUnsub = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const formattedTimestamp = data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now';

          msgs.push({
            id: docSnap.id,
            chatId: activeChatId,
            senderId: data.senderId,
            sender: data.senderId === currentUser.uid ? 'me' : 'other',
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            type: data.type || 'text',
            text: data.text || '',
            media: data.media,
            mediaUrl: data.media?.secureUrl || data.mediaUrl,
            mediaName: data.mediaName,
            mediaType: data.mediaType,
            mediaSize: data.mediaSize,
            eventDetails: data.eventDetails,
            timestamp: formattedTimestamp,
            status: data.status || 'read',
            reactions: data.reactions || {},
            replyTo: data.replyTo,
            isEdited: data.isEdited,
            isDeletedForEveryone: data.isDeletedForEveryone,
            createdAt: data.createdAt,
          });
        });

        setActiveChatMessages(msgs);
        setLoadingMessages(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, messagesPath);
        setLoadingMessages(false);
      }
    );

    // Listen to typing indicators for active chat
    const typingPath = `chats/${activeChatId}/typing`;
    const typingUnsub = onSnapshot(
      collection(db, typingPath),
      (snapshot) => {
        const typers: string[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.isTyping && docSnap.id !== currentUser.uid) {
            typers.push(docSnap.id);
          }
        });
        setActiveTypingUsers(typers);
      },
      (err) => {
        // Silent catch for typing indicators
      }
    );

    return () => {
      msgsUnsub();
      typingUnsub();
    };
  }, [activeChatId, currentUser]);

  // 3. Fetch user profiles for members of active chat
  const activeChat = chats.find((c) => c.chatId === activeChatId) || null;

  useEffect(() => {
    if (!activeChat) return;

    const fetchMemberProfiles = async () => {
      const profilesMap: Record<string, UserProfile> = {};
      for (const memberUid of activeChat.members) {
        try {
          const docSnap = await getDoc(doc(db, 'users', memberUid));
          if (docSnap.exists()) {
            profilesMap[memberUid] = docSnap.data() as UserProfile;
          }
        } catch (e) {
          // ignore
        }
      }
      setActiveChatMembersProfiles(profilesMap);
    };

    fetchMemberProfiles();
  }, [activeChatId, activeChat?.members.join(',')]);

  // Send Message
  const sendMessage = async (
    chatId: string,
    text: string,
    type: ChatMessage['type'] = 'text',
    mediaUrl?: string,
    replyTo?: ChatMessage['replyTo'],
    eventDetails?: EventDetails,
    mediaName?: string,
    mediaType?: string,
    mediaSize?: string,
    media?: CloudinaryMediaMetadata
  ) => {
    if (!currentUser || !userProfile) return;

    const messagesPath = `chats/${chatId}/messages`;
    const messageData = {
      chatId,
      senderId: currentUser.uid,
      senderName: userProfile.displayName,
      senderAvatar: userProfile.photoURL,
      type,
      text,
      media: media || null,
      mediaUrl: media?.secureUrl || mediaUrl || null,
      mediaName: media?.fileName || mediaName || null,
      mediaType: media?.mimeType || mediaType || null,
      mediaSize: media?.size ? `${Math.round(media.size / 1024)} KB` : mediaSize || null,
      eventDetails: eventDetails || null,
      replyTo: replyTo || null,
      reactions: {},
      status: 'sent',
      isEdited: false,
      isDeletedForEveryone: false,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, messagesPath), messageData);

      // Update parent chat doc
      const previewText =
        type === 'image'
          ? '📷 Photo'
          : type === 'video'
          ? '🎥 Video'
          : type === 'audio'
          ? '🎵 Voice message'
          : type === 'document'
          ? '📄 Document'
          : type === 'event'
          ? `📅 Event: ${eventDetails?.title || text}`
          : text;

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessageText: previewText,
        lastMessageSenderName: userProfile.displayName,
        lastMessageTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Clear local typing state
      updateTypingState(chatId, false);

      // Check if this chat includes ACP AI or if ACP AI was mentioned
      const chatDocSnap = await getDoc(doc(db, 'chats', chatId));
      if (chatDocSnap.exists()) {
        const chatRoomData = chatDocSnap.data() as ChatRoom;
        const isAcpDirectChat = chatRoomData.type === 'individual' && chatRoomData.members.includes(ACP_BOT_UID);

        if (isAcpDirectChat) {
          // Format recent history
          const historyFormatted = activeChatMessages.slice(-10).map((m) => ({
            role: m.senderId === ACP_BOT_UID ? ('model' as const) : ('user' as const),
            text: m.text,
          }));

          // Process ACP AI Response asynchronously
          acpAiService.processAcpMessage(
            chatId,
            text,
            historyFormatted,
            media?.secureUrl ? undefined : undefined
          );
        } else if (chatRoomData.type === 'group' && /@ACP(\s+AI)?|@acpai/i.test(text)) {
          // Handle group mention
          const groupHistory = activeChatMessages.slice(-10).map((m) => ({
            role: m.senderId === ACP_BOT_UID ? ('model' as const) : ('user' as const),
            text: `${m.senderName}: ${m.text}`,
          }));

          acpAiService.handleGroupMention(chatId, text, userProfile.displayName, groupHistory);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, messagesPath);
    }
  };

  // Create or get 1-on-1 Individual Chat
  const createOrGetIndividualChat = async (otherUser: UserProfile): Promise<string> => {
    if (!currentUser) throw new Error('Not logged in');

    // Check if chat already exists
    const existing = chats.find(
      (c) => c.type === 'individual' && c.members.includes(currentUser.uid) && c.members.includes(otherUser.uid)
    );

    if (existing) {
      return existing.chatId;
    }

    // Create new chat
    const newChatRef = doc(collection(db, 'chats'));
    const chatId = newChatRef.id;

    const chatData: ChatRoom = {
      chatId,
      type: 'individual',
      name: otherUser.displayName,
      photoURL: otherUser.photoURL,
      members: [currentUser.uid, otherUser.uid],
      createdBy: currentUser.uid,
      updatedAt: serverTimestamp(),
      lastMessageText: 'Chat created',
      lastMessageSenderName: userProfile?.displayName || '',
    };

    try {
      await setDoc(newChatRef, chatData);
      return chatId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chats');
      return '';
    }
  };

  // Create Group Chat
  const createGroupChat = async (
    name: string,
    memberUids: string[],
    photoURL?: string,
    description?: string
  ): Promise<string> => {
    if (!currentUser) throw new Error('Not logged in');

    const allMembers = Array.from(new Set([currentUser.uid, ...memberUids]));
    const newChatRef = doc(collection(db, 'chats'));
    const chatId = newChatRef.id;

    const groupData: ChatRoom = {
      chatId,
      type: 'group',
      name,
      description: description || 'Group chat',
      photoURL: photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
      members: allMembers,
      adminUids: [currentUser.uid],
      createdBy: currentUser.uid,
      updatedAt: serverTimestamp(),
      lastMessageText: `${userProfile?.displayName} created group "${name}"`,
      lastMessageSenderName: 'System',
    };

    try {
      await setDoc(newChatRef, groupData);
      return chatId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chats');
      return '';
    }
  };

  // React to Message
  const reactToMessage = async (chatId: string, messageId: string, emoji: string) => {
    if (!currentUser) return;
    const msgRef = doc(db, `chats/${chatId}/messages`, messageId);

    try {
      const snap = await getDoc(msgRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const reactions = data.reactions || {};
      const currentReaction = reactions[emoji] || { emoji, count: 0, users: [] };

      let updatedUsers = [...(currentReaction.users || [])];
      let hasReacted = updatedUsers.includes(currentUser.uid);

      if (hasReacted) {
        updatedUsers = updatedUsers.filter((u) => u !== currentUser.uid);
      } else {
        updatedUsers.push(currentUser.uid);
      }

      if (updatedUsers.length === 0) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = {
          emoji,
          count: updatedUsers.length,
          users: updatedUsers,
        };
      }

      await updateDoc(msgRef, { reactions });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
    }
  };

  // Delete message
  const deleteMessage = async (chatId: string, messageId: string) => {
    const msgRef = doc(db, `chats/${chatId}/messages`, messageId);
    try {
      const snap = await getDoc(msgRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.media?.publicId) {
          mediaService.deleteMedia(data.media.publicId, data.media.resourceType || 'image').catch(() => {});
        }
      }

      await updateDoc(msgRef, {
        isDeletedForEveryone: true,
        text: 'This message was deleted',
        mediaUrl: null,
        media: null,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
    }
  };

  // Edit message
  const editMessage = async (chatId: string, messageId: string, newText: string) => {
    const msgRef = doc(db, `chats/${chatId}/messages`, messageId);
    try {
      await updateDoc(msgRef, {
        text: newText,
        isEdited: true,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
    }
  };

  // Typing state
  const updateTypingState = async (chatId: string, isTyping: boolean) => {
    if (!currentUser) return;
    const typingDocRef = doc(db, `chats/${chatId}/typing`, currentUser.uid);
    try {
      await setDoc(
        typingDocRef,
        {
          isTyping,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      // ignore typing state errors
    }
  };

  // Event RSVP
  const updateRsvp = async (chatId: string, messageId: string, rsvpStatus: 'going' | 'maybe' | 'declined') => {
    if (!currentUser) return;
    const msgRef = doc(db, `chats/${chatId}/messages`, messageId);

    try {
      const snap = await getDoc(msgRef);
      if (!snap.exists()) return;
      const data = snap.data();
      const currentRsvp = data.eventDetails?.rsvp || {};

      const updatedRsvp = {
        ...currentRsvp,
        [currentUser.uid]: rsvpStatus,
      };

      await updateDoc(msgRef, {
        'eventDetails.rsvp': updatedRsvp,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
    }
  };

  // Mark chat read
  const markChatAsRead = async (chatId: string) => {
    if (!currentUser || !chatId) return;
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCounts.${currentUser.uid}`]: 0,
      });
    } catch (e) {
      // Ignore
    }
  };

  // Mark specific messages as read in batch
  const markMessagesAsRead = async (chatId: string, messageIds: string[]) => {
    if (!chatId || !messageIds || messageIds.length === 0) return;
    const readReceiptsEnabled = localStorage.getItem('http_chat_read_receipts') !== 'false';
    if (!readReceiptsEnabled) return;

    try {
      const batch = writeBatch(db);
      messageIds.forEach((msgId) => {
        const msgRef = doc(db, `chats/${chatId}/messages`, msgId);
        batch.update(msgRef, { status: 'read' });
      });
      await batch.commit();

      if (currentUser) {
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
          [`unreadCounts.${currentUser.uid}`]: 0,
        });
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Upload Media File to Firebase Storage
  const uploadMediaFile = async (
    file: File,
    pathPrefix = 'chat'
  ): Promise<{ url: string; name: string; type: string; size: string }> => {
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const storageRef = ref(storage, `${pathPrefix}/${fileId}_${file.name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        () => {},
        (error) => reject(error),
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const formattedSize =
            file.size > 1024 * 1024
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.round(file.size / 1024)} KB`;

          resolve({
            url: downloadUrl,
            name: file.name,
            type: file.type.startsWith('image')
              ? 'image'
              : file.type.startsWith('video')
              ? 'video'
              : file.type.startsWith('audio')
              ? 'audio'
              : 'document',
            size: formattedSize,
          });
        }
      );
    });
  };

  // Search users by name or username
  const searchUsers = async (searchQuery: string): Promise<UserProfile[]> => {
    if (!searchQuery.trim()) return [];
    const cleanQuery = searchQuery.toLowerCase().trim();

    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(30)));
      const results: UserProfile[] = [];
      usersSnap.forEach((docSnap) => {
        const u = docSnap.data() as UserProfile;
        if (
          u.uid !== currentUser?.uid &&
          (u.username?.toLowerCase().includes(cleanQuery) ||
            u.displayName?.toLowerCase().includes(cleanQuery) ||
            u.email?.toLowerCase().includes(cleanQuery))
        ) {
          results.push(u);
        }
      });
      return results;
    } catch (err) {
      console.error('Search users error:', err);
      return [];
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        setActiveChatId,
        activeChat,
        activeChatMessages,
        activeTypingUsers,
        activeChatMembersProfiles,
        loadingChats,
        loadingMessages,
        sendMessage,
        createOrGetIndividualChat,
        getOrCreateIndividualChat: createOrGetIndividualChat,
        createGroupChat,
        reactToMessage,
        deleteMessage,
        editMessage,
        updateTypingState,
        updateRsvp,
        markChatAsRead,
        markMessagesAsRead,
        uploadMediaFile,
        searchUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
