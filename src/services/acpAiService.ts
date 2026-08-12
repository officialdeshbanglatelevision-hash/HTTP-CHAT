import { doc, getDoc, setDoc, addDoc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types/chat';

export const ACP_BOT_UID = 'acp_ai_assistant';

export const ACP_PROFILE: UserProfile = {
  uid: ACP_BOT_UID,
  displayName: 'ACP AI',
  username: 'acpai',
  email: 'acp.ai@httpchat.app',
  about: 'AI Assistant for HTTP CHAT',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=ACP_AI',
  online: true,
  lastSeen: 'Online',
};

class AcpAiService {
  // Ensure ACP AI profile document exists in Firestore
  async ensureAcpUserExists(): Promise<UserProfile> {
    try {
      const userRef = doc(db, 'users', ACP_BOT_UID);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          ...ACP_PROFILE,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      return ACP_PROFILE;
    } catch (error) {
      console.error('Error ensuring ACP AI user profile:', error);
      return ACP_PROFILE;
    }
  }

  // Create or get 1-on-1 chat session with ACP AI
  async getOrCreateAcpChat(userUid: string, userName: string): Promise<string> {
    await this.ensureAcpUserExists();

    const chatId = `chat_${userUid}_${ACP_BOT_UID}`;
    const chatRef = doc(db, 'chats', chatId);

    try {
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        await setDoc(chatRef, {
          chatId,
          type: 'individual',
          name: 'ACP AI',
          photoURL: ACP_PROFILE.photoURL,
          members: [userUid, ACP_BOT_UID],
          createdBy: userUid,
          updatedAt: serverTimestamp(),
          lastMessageText: 'Hello! I am ACP AI. How can I help you today?',
          lastMessageSenderName: 'ACP AI',
        });

        // Add welcome message
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        await addDoc(messagesRef, {
          chatId,
          senderId: ACP_BOT_UID,
          senderName: 'ACP AI',
          senderAvatar: ACP_PROFILE.photoURL,
          type: 'text',
          text: 'Hello! I am **ACP AI**, your built-in AI assistant. You can ask me questions, search information, analyze topics, or talk to me anytime!',
          status: 'read',
          createdAt: serverTimestamp(),
        });
      }
      return chatId;
    } catch (error) {
      console.error('Error creating ACP chat:', error);
      return chatId;
    }
  }

  // Set typing indicator for ACP AI
  async setAcpTypingState(chatId: string, isTyping: boolean) {
    try {
      const typingRef = doc(db, `chats/${chatId}/typing`, ACP_BOT_UID);
      await setDoc(
        typingRef,
        {
          isTyping,
          userId: ACP_BOT_UID,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      // Ignore typing errors
    }
  }

  // Query ACP AI via server API endpoint
  async processAcpMessage(
    chatId: string,
    prompt: string,
    history: { role: 'user' | 'model'; text: string }[] = [],
    imageBase64?: string
  ): Promise<string> {
    try {
      // Set typing state
      await this.setAcpTypingState(chatId, true);

      const res = await fetch('/api/acp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history,
          imageBase64,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || (data.error ? `ACP AI Error: ${data.error}` : 'Sorry, I could not respond.');

      // Clear typing state
      await this.setAcpTypingState(chatId, false);

      // Post message to Firestore
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      await addDoc(messagesRef, {
        chatId,
        senderId: ACP_BOT_UID,
        senderName: 'ACP AI',
        senderAvatar: ACP_PROFILE.photoURL,
        type: 'text',
        text: replyText,
        status: 'read',
        createdAt: serverTimestamp(),
      });

      // Update parent chat
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessageText: replyText,
        lastMessageSenderName: 'ACP AI',
        lastMessageTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return replyText;
    } catch (error: any) {
      console.error('Error processing ACP message:', error);
      await this.setAcpTypingState(chatId, false);

      const fallbackMsg = 'ACP AI is temporarily unavailable. Please try again later.';
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      await addDoc(messagesRef, {
        chatId,
        senderId: ACP_BOT_UID,
        senderName: 'ACP AI',
        senderAvatar: ACP_PROFILE.photoURL,
        type: 'text',
        text: fallbackMsg,
        status: 'read',
        createdAt: serverTimestamp(),
      });

      return fallbackMsg;
    }
  }

  // Handle Group Mention (@ACP AI or @ACP or @acpai)
  async handleGroupMention(
    chatId: string,
    userText: string,
    senderName: string,
    groupHistory: { role: 'user' | 'model'; text: string }[] = []
  ) {
    const isMentioned = /@ACP(\s+AI)?|@acpai/i.test(userText);
    if (!isMentioned) return;

    // Clean query prompt by removing @ACP AI mention
    const cleanPrompt = userText.replace(/@ACP(\s+AI)?|@acpai/gi, '').trim() || 'How can I assist this group?';

    const systemInstruction = `You are ACP AI participating in a group chat named on HTTP CHAT. User ${senderName} mentioned you with: "${cleanPrompt}". Provide a brief, useful, and engaging response to the group context.`;

    try {
      await this.setAcpTypingState(chatId, true);

      const res = await fetch('/api/acp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `User ${senderName} asks: ${cleanPrompt}`,
          history: groupHistory,
          systemInstruction,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "I'm here to help!";

      await this.setAcpTypingState(chatId, false);

      // Post AI response in group
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      await addDoc(messagesRef, {
        chatId,
        senderId: ACP_BOT_UID,
        senderName: 'ACP AI',
        senderAvatar: ACP_PROFILE.photoURL,
        type: 'text',
        text: replyText,
        status: 'read',
        createdAt: serverTimestamp(),
      });

      // Update parent chat
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessageText: `ACP AI: ${replyText}`,
        lastMessageSenderName: 'ACP AI',
        lastMessageTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Group ACP mention error:', e);
      await this.setAcpTypingState(chatId, false);
    }
  }

  // Generate Voice Speech using TTS API endpoint
  async synthesizeVoice(text: string): Promise<string | null> {
    try {
      const res = await fetch('/api/acp/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        return `data:audio/mp3;base64,${data.audioBase64}`;
      }
      return null;
    } catch (e) {
      console.error('TTS synthesis error:', e);
      return null;
    }
  }
}

export const acpAiService = new AcpAiService();
