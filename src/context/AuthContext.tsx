import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  signInWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleAuthProvider, testFirestoreConnection, OperationType, handleFirestoreError } from '../lib/firebase';
import { UserProfile } from '../types/chat';
import { notificationManager } from '../utils/notificationManager';
import { removeFCMTokenOnLogout } from '../services/fcmService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string, username: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  reserveUsername: (username: string) => Promise<void>;
  setupRecaptcha: (elementId: string) => RecaptchaVerifier;
  sendPhoneOtp: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Monitor auth state changes & sync user profile from Firestore
  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Test Firestore connection
        testFirestoreConnection();

        // Listen to User Profile doc in Firestore
        const userRef = doc(db, 'users', user.uid);

        profileUnsub = onSnapshot(
          userRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data() as UserProfile);
            } else {
              // Create initial profile if it doesn't exist yet
              const defaultUsername = `user_${user.uid.slice(0, 8).toLowerCase()}`;
              const newProfile: UserProfile = {
                uid: user.uid,
                username: defaultUsername,
                displayName: user.displayName || 'HTTP Chat User',
                email: user.email || '',
                photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
                about: 'Hey there! I am using HTTP CHAT.',
                phoneNumber: user.phoneNumber || '',
                online: true,
                lastSeen: new Date().toISOString(),
              };

              try {
                await setDoc(userRef, newProfile, { merge: true });
                setUserProfile(newProfile);
              } catch (err) {
                console.error('Error creating profile doc:', err);
              }
            }
            setLoading(false);
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
            setLoading(false);
          }
        );

        // Update presence to online
        try {
          await updateDoc(userRef, {
            online: true,
            lastSeen: new Date().toISOString(),
          });
        } catch (e) {
          // Ignore if user doc not yet created
        }

        // Initialize FCM push notifications
        notificationManager.initializeForUser(user.uid).catch(() => {});
      } else {
        if (profileUnsub) profileUnsub();
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  // Update presence on tab unload/blur
  useEffect(() => {
    if (!currentUser) return;

    const handleVisibilityChange = () => {
      const userRef = doc(db, 'users', currentUser.uid);
      if (document.hidden) {
        updateDoc(userRef, { online: false, lastSeen: new Date().toISOString() }).catch(() => {});
      } else {
        updateDoc(userRef, { online: true, lastSeen: new Date().toISOString() }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        // Ensure user profile doc exists or is created
        const userRef = doc(db, 'users', result.user.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          const cleanUsername = (result.user.displayName || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 15) + '_' + result.user.uid.slice(0, 4);

          await setDoc(userRef, {
            uid: result.user.uid,
            username: cleanUsername,
            displayName: result.user.displayName || 'HTTP Chat User',
            email: result.user.email || '',
            photoURL: result.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${result.user.uid}`,
            about: 'Hey there! I am using HTTP CHAT.',
            phoneNumber: result.user.phoneNumber || '',
            online: true,
            lastSeen: new Date().toISOString(),
          });

          // Reserve default username
          try {
            await setDoc(doc(db, 'usernames', cleanUsername), {
              uid: result.user.uid,
              username: cleanUsername,
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Username reservation skipped/failed:', e);
          }
        }
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      throw err;
    }
  };

  // Email Sign In
  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  // Email Sign Up
  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    username: string
  ) => {
    const cleanUsername = username.toLowerCase().trim();
    // Validate availability
    const isAvailable = await checkUsernameAvailable(cleanUsername);
    if (!isAvailable) {
      throw new Error(`Username @${cleanUsername} is already taken.`);
    }

    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;

    // Transaction for atomic username & user profile creation
    await runTransaction(db, async (transaction) => {
      const usernameRef = doc(db, 'usernames', cleanUsername);
      const userRef = doc(db, 'users', uid);

      const usernameSnap = await transaction.get(usernameRef);
      if (usernameSnap.exists() && usernameSnap.data().uid !== uid) {
        throw new Error(`Username @${cleanUsername} was taken just now.`);
      }

      transaction.set(usernameRef, {
        uid,
        username: cleanUsername,
        createdAt: new Date().toISOString(),
      });

      transaction.set(userRef, {
        uid,
        username: cleanUsername,
        displayName: displayName || 'HTTP Chat User',
        email,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
        about: 'Hey there! I am using HTTP CHAT.',
        phoneNumber: '',
        online: true,
        lastSeen: new Date().toISOString(),
      });
    });
  };

  // Password Reset
  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Logout
  const logout = async () => {
    if (currentUser) {
      try {
        await notificationManager.cleanupForLogout();
        await updateDoc(doc(db, 'users', currentUser.uid), {
          online: false,
          lastSeen: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Logout cleanup error', e);
      }
    }
    await signOut(auth);
    setUserProfile(null);
  };

  // Check username availability
  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const clean = username.toLowerCase().trim();
    if (!clean || clean.length < 3) return false;
    const snap = await getDoc(doc(db, 'usernames', clean));
    if (!snap.exists()) return true;
    return snap.data().uid === currentUser?.uid;
  };

  // Reserve username
  const reserveUsername = async (username: string) => {
    if (!currentUser) throw new Error('Must be signed in to reserve a username');
    const clean = username.toLowerCase().trim();

    await runTransaction(db, async (transaction) => {
      const usernameRef = doc(db, 'usernames', clean);
      const userRef = doc(db, 'users', currentUser.uid);

      const usernameSnap = await transaction.get(usernameRef);
      if (usernameSnap.exists() && usernameSnap.data().uid !== currentUser.uid) {
        throw new Error('Username is already taken');
      }

      transaction.set(usernameRef, {
        uid: currentUser.uid,
        username: clean,
        createdAt: new Date().toISOString(),
      });

      transaction.update(userRef, {
        username: clean,
      });
    });
  };

  // Update profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userRef, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  // Recaptcha Verifier helper for Phone Auth
  const setupRecaptcha = (elementId: string) => {
    return new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {},
    });
  };

  // Send Phone OTP
  const sendPhoneOtp = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        logout,
        updateUserProfile,
        checkUsernameAvailable,
        reserveUsername,
        setupRecaptcha,
        sendPhoneOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
