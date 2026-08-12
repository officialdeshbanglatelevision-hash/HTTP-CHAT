import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Users, User as UserIcon, Loader2, Bot } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types/chat';
import { acpAiService, ACP_PROFILE } from '../services/acpAiService';

interface NewChatScreenProps {
  onOpenAddContactModal: () => void;
  onOpenNewGroupModal: () => void;
  onOpenNewCommunityModal: () => void;
}

export const NewChatScreen: React.FC<NewChatScreenProps> = ({
  onOpenAddContactModal,
  onOpenNewGroupModal,
  onOpenNewCommunityModal,
}) => {
  const { navigateTo, showToast } = useTheme();
  const { getOrCreateIndividualChat, setActiveChatId } = useChat();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), limit(20));
        const snap = await getDocs(q);
        const list: UserProfile[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          if (data.uid !== currentUser.uid) {
            list.push(data);
          }
        });
        setUsers(list);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.includes(q)
    );
  });

  const handleStartChat = async (targetUser: UserProfile) => {
    if (creating) return;
    setCreating(true);
    try {
      const chatId = await getOrCreateIndividualChat(targetUser);
      setActiveChatId(chatId);
      navigateTo('individual_chat');
      showToast(`Chat started with ${targetUser.displayName}`, 'success');
    } catch (err: any) {
      console.error('Failed to create chat:', err);
      showToast('Failed to start chat', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Search Bar & Action Buttons */}
      <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, or phone number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="space-y-1">
          <button
            onClick={async () => {
              if (!currentUser) return;
              try {
                const chatId = await acpAiService.getOrCreateAcpChat(currentUser.uid, currentUser.displayName || 'User');
                setActiveChatId(chatId);
                navigateTo('individual_chat');
                showToast('Connected to ACP AI Assistant', 'success');
              } catch (e) {
                showToast('Failed to start ACP AI chat', 'error');
              }
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 transition-colors text-left border border-purple-500/20"
          >
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <span>ACP AI Assistant</span>
                <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">AI</span>
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-300">
                Built-in intelligent assistant for HTTP CHAT
              </p>
            </div>
          </button>

          <button
            onClick={onOpenNewGroupModal}
            className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                New Group
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a group chat with contacts
              </p>
            </div>
          </button>

          <button
            onClick={onOpenAddContactModal}
            className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                New Contact
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add a new contact by details
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Users List */}
      <div className="flex-1 p-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Available Users
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs font-semibold">Finding contacts...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={UserIcon}
            title="No users found"
            description="Invite friends or search by exact name / email address."
            actionLabel="Add Contact"
            onAction={onOpenAddContactModal}
          />
        ) : (
          <div className="space-y-1">
            {filteredUsers.map((u) => (
              <button
                key={u.uid}
                onClick={() => handleStartChat(u)}
                disabled={creating}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all text-left group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                    ) : (
                      (u.displayName || 'U').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-500 transition-colors">
                      {u.displayName || 'Unnamed User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {u.email || u.phoneNumber || 'HTTP Chat Member'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-xl shrink-0">
                  Message
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
