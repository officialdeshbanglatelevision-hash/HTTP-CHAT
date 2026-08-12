import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { contactService } from '../services/contactService';
import { UserProfile } from '../types/chat';
import { ArrowLeft, Camera, Upload, UserPlus, MessageSquare, Search, AlertCircle, CheckCircle } from 'lucide-react';

export const ScanQRScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const { setActiveScreen, setSelectedChatId, showToast } = useTheme();

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<UserProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedContact, setAddedContact] = useState(false);

  const handleScanOrResolve = async (val: string) => {
    setErrorMsg('');
    setScannedProfile(null);
    setAddedContact(false);

    if (!val.trim()) return;

    setLoading(true);
    try {
      // Extract UID or handle if URL e.g. http-chat.app/u/{uid}
      let targetUid = val.trim();
      if (targetUid.includes('/u/')) {
        const parts = targetUid.split('/u/');
        targetUid = parts[parts.length - 1].split('?')[0];
      } else if (targetUid.startsWith('@')) {
        const found = await contactService.searchUserByUsername(targetUid);
        if (found) {
          setScannedProfile(found);
          setLoading(false);
          return;
        } else {
          setErrorMsg(`No user found for handle ${targetUid}`);
          setLoading(false);
          return;
        }
      }

      // Fetch user profile from Firestore
      const profile = await contactService.fetchUserProfile(targetUid);
      if (profile) {
        setScannedProfile(profile);
      } else {
        setErrorMsg('User profile not found. Please verify the QR code or profile link.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error looking up profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!currentUser || !scannedProfile) return;
    try {
      await contactService.addContact(currentUser.uid, scannedProfile.uid);
      setAddedContact(true);
      showToast(`${scannedProfile.displayName} added to your contacts!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add contact', 'error');
    }
  };

  const handleStartMessage = () => {
    if (!scannedProfile) return;
    setSelectedChatId(scannedProfile.uid);
    setActiveScreen('individual_chat');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveScreen('qr_profile')}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">My QR</span>
        </button>
        <h1 className="text-base font-bold text-slate-100">Scan QR / Find User</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-6">
        {/* Scanner Simulation Box */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-48 h-48 mx-auto border-2 border-dashed border-emerald-500/60 rounded-2xl flex flex-col items-center justify-center bg-slate-900/60 relative overflow-hidden group">
            <Camera className="w-12 h-12 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-slate-300 font-medium px-4">
              Point camera at HTTP CHAT QR Code
            </span>
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 animate-pulse" />
          </div>

          <p className="text-xs text-slate-400">
            Scanning validates the identity directly from secure Firestore profile records.
          </p>
        </div>

        {/* Input Manual / Link Resolution */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Or enter Username, UID or Profile Link:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. @username or https://http-chat.app/u/uid"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
            <button
              onClick={() => handleScanOrResolve(inputVal)}
              disabled={loading || !inputVal.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow"
            >
              {loading ? 'Validating...' : 'Lookup'}
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Scanned Profile Preview Result */}
        {scannedProfile && (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <img
                src={scannedProfile.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${scannedProfile.uid}`}
                alt={scannedProfile.displayName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base truncate">{scannedProfile.displayName}</h3>
                <p className="text-xs font-semibold text-emerald-400">@{scannedProfile.username}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{scannedProfile.about || 'HTTP CHAT user'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddContact}
                disabled={addedContact}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-colors"
              >
                {addedContact ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Contact Added</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Add Contact</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStartMessage}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Message</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
