import React, { useState, useEffect } from 'react';
import { User, AtSign, Camera, Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { storage } from '../../lib/firebase';

export const ProfileSetupScreen: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile, reserveUsername, checkUsernameAvailable } = useAuth();
  const { navigateTo, showToast } = useTheme();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || '');
  const [username, setUsername] = useState(
    userProfile?.username && !userProfile.username.startsWith('user_') ? userProfile.username : ''
  );
  const [photoURL, setPhotoURL] = useState(
    userProfile?.photoURL || currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid || 'avatar'}`
  );

  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  // Username validation & real-time checking
  useEffect(() => {
    const clean = username.toLowerCase().trim();
    if (!clean) {
      setUsernameStatus('idle');
      return;
    }
    if (clean.length < 3 || !/^[a-z0-9_]{3,30}$/.test(clean)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(clean);
        setUsernameStatus(available ? 'available' : 'taken');
      } catch (e) {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  // Handle Photo Upload to Firebase Storage
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'warning');
      return;
    }

    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `avatars/${currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
      showToast('Profile photo updated!', 'success');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      showToast('Failed to upload profile photo', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('Please enter your display name', 'warning');
      return;
    }

    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername) {
      showToast('Please choose a unique @username', 'warning');
      return;
    }

    if (usernameStatus !== 'available' && userProfile?.username !== cleanUsername) {
      showToast('Please choose an available @username', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (userProfile?.username !== cleanUsername) {
        await reserveUsername(cleanUsername);
      }

      await updateUserProfile({
        displayName: displayName.trim(),
        username: cleanUsername,
        photoURL,
      });

      showToast('Profile setup complete! Welcome to HTTP CHAT', 'success');
      navigateTo('chats');
    } catch (error: any) {
      console.error('Profile setup error:', error);
      showToast(error.message || 'Failed to complete profile setup', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen max-w-md mx-auto bg-slate-950 text-white p-6 justify-between overflow-y-auto scrollbar-none select-none">
      <div>
        <div className="space-y-2 mb-8 text-center pt-4">
          <h1 className="text-2xl font-black tracking-tight text-white">
            Create Your Profile
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Set up your photo, display name and unique handle to connect with friends.
          </p>
        </div>

        {/* Profile Avatar Upload Block */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <img
              src={photoURL}
              alt="Profile Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500/30 ring-4 ring-slate-900 bg-slate-900 shadow-xl"
            />
            <label
              htmlFor="avatar-upload-input"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-95"
            >
              {uploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>
            <input
              id="avatar-upload-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-400 mt-3">
            {uploadingImage ? 'Uploading photo...' : 'Tap icon to change photo'}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Display Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 px-1">Display Name</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-13 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 px-1">Unique Handle</label>
            <div className="relative">
              <AtSign className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full h-13 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-10 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <div className="absolute right-4 top-4">
                {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
                {usernameStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {usernameStatus === 'taken' && <XCircle className="w-5 h-5 text-rose-500" />}
                {usernameStatus === 'invalid' && <span className="text-[10px] text-amber-400 font-bold">min 3 chars</span>}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 px-1 pt-0.5">
              People can search and connect with you using @{username || 'username'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImage || (usernameStatus !== 'available' && userProfile?.username !== username.toLowerCase().trim())}
            className="w-full h-13 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] mt-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Completing Setup...</span>
              </>
            ) : (
              <>
                <span>Continue to HTTP CHAT</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="text-center pt-6 pb-2">
        <p className="text-[11px] text-slate-500">
          Your handle and avatar are visible to contacts in HTTP CHAT.
        </p>
      </div>
    </div>
  );
};
