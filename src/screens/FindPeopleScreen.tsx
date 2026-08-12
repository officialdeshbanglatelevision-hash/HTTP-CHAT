import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { contactService } from '../services/contactService';
import { UserProfile } from '../types/chat';
import { ArrowLeft, Search, AtSign, Phone, QrCode, UserPlus, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

export const FindPeopleScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const { setActiveScreen, setSelectedChatId, showToast } = useTheme();

  const [searchMode, setSearchMode] = useState<'username' | 'phone'>('username');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [foundProfile, setFoundProfile] = useState<UserProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [added, setAdded] = useState(false);

  const handleSearch = async () => {
    setErrorMsg('');
    setFoundProfile(null);
    setAdded(false);

    if (!queryInput.trim()) return;

    setLoading(true);
    try {
      if (searchMode === 'username') {
        const profile = await contactService.searchUserByUsername(queryInput);
        if (profile) {
          setFoundProfile(profile);
        } else {
          setErrorMsg(`No HTTP CHAT user found matching @${queryInput.trim().replace(/^@/, '')}`);
        }
      } else {
        if (!currentUser) return;
        const profile = await contactService.searchUserByPhone(queryInput, currentUser.uid);
        if (profile) {
          setFoundProfile(profile);
        } else {
          setErrorMsg('No user found with that phone number or their discovery settings prevent phone lookup.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing search.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!currentUser || !foundProfile) return;
    try {
      await contactService.addContact(currentUser.uid, foundProfile.uid);
      setAdded(true);
      showToast(`${foundProfile.displayName} added to your contacts!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add contact', 'error');
    }
  };

  const handleStartChat = () => {
    if (!foundProfile) return;
    setSelectedChatId(foundProfile.uid);
    setActiveScreen('individual_chat');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveScreen('contacts')}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Contacts</span>
        </button>
        <h1 className="text-base font-bold text-slate-100">Find People</h1>
        <button
          onClick={() => setActiveScreen('scan_qr')}
          className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5 text-xs font-bold"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-6">
        {/* Mode Toggle Tabs */}
        <div className="flex p-1 bg-slate-800 rounded-2xl border border-slate-700/80">
          <button
            onClick={() => {
              setSearchMode('username');
              setQueryInput('');
              setFoundProfile(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              searchMode === 'username'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AtSign className="w-4 h-4" />
            <span>By Username</span>
          </button>

          <button
            onClick={() => {
              setSearchMode('phone');
              setQueryInput('');
              setFoundProfile(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              searchMode === 'phone'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>By Phone</span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            {searchMode === 'username' ? 'Enter Exact Username:' : 'Enter Phone Number:'}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={searchMode === 'username' ? 'e.g. alex_smith' : 'e.g. +1 (555) 019-2831'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !queryInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Found Profile Result */}
        {foundProfile && (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <img
                src={foundProfile.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${foundProfile.uid}`}
                alt={foundProfile.displayName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500 shadow-md"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base truncate">{foundProfile.displayName}</h3>
                <p className="text-xs font-semibold text-emerald-400">@{foundProfile.username}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{foundProfile.about || 'HTTP CHAT user'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddContact}
                disabled={added}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-colors"
              >
                {added ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Added Contact</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Add Contact</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStartChat}
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
