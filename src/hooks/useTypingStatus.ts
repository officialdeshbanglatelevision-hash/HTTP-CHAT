import { useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export function useTypingStatus(chatId: string | null) {
  const { currentUser } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyTypingRef = useRef<boolean>(false);

  const setTypingInFirestore = useCallback(
    async (isTyping: boolean) => {
      if (!chatId || !currentUser) return;
      try {
        const typingRef = doc(db, `chats/${chatId}/typing`, currentUser.uid);
        await setDoc(
          typingRef,
          {
            isTyping,
            userId: currentUser.uid,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        isCurrentlyTypingRef.current = isTyping;
      } catch (e) {
        // Silent catch for typing indicator updates
      }
    },
    [chatId, currentUser]
  );

  const handleKeystroke = useCallback(() => {
    if (!chatId || !currentUser) return;

    // Immediately mark as typing in Firestore if not already
    if (!isCurrentlyTypingRef.current) {
      setTypingInFirestore(true);
    }

    // Reset the automatic 3-second cleanup timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setTypingInFirestore(false);
      timeoutRef.current = null;
    }, 3000);
  }, [chatId, currentUser, setTypingInFirestore]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (isCurrentlyTypingRef.current) {
      setTypingInFirestore(false);
    }
  }, [setTypingInFirestore]);

  // Automatic cleanup when chat session changes or component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isCurrentlyTypingRef.current && chatId && currentUser) {
        setTypingInFirestore(false);
      }
    };
  }, [chatId, currentUser, setTypingInFirestore]);

  return {
    handleKeystroke,
    stopTyping,
  };
}
