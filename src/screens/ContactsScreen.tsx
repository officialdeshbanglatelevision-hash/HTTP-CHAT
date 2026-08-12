import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { contactService } from '../services/contactService';
import { UserContact } from '../types/chat';
import { User, UserPlus, Users, Search, QrCode, SearchCode, MessageSquare, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

interface ContactsScreenProps {
  onOpenAddContactModal: () => void;
  onOpenNewGroupModal: () => void;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({
  onOpenAddContactModal,
  onOpenNewGroupModal,
}) => {
  const { currentUser } = useAuth();
  const { showToast, navigateTo, setSelectedChatId, setActiveScreen } = useTheme();

  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<UserContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsub = contactService.listenToUserContacts(currentUser.uid, (data) => {
      setContacts(data);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const handleStartChat = (contactUid: string) => {
    setSelectedChatId(contactUid);
    setActiveScreen('individual_chat');
  };

  const handleRemoveContact = async (contactUid: string, name: string) => {
    if (!currentUser) return;
    if (confirm(`Remove ${name} from your contacts?`)) {
      try {
        await contactService.removeContact(currentUser.uid, contactUid);
        showToast(`Removed ${name}`, 'info');
      } catch (err: any) {
        showToast(err.message || 'Failed to remove contact', 'error');
      }
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const term = search.toLowerCase();
    const name = c.profile?.displayName || c.alias || '';
    const username = c.profile?.username || '';
    return name.toLowerCase().includes(term) || username.toLowerCase().includes(term);
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Search & Quick Actions */}
      <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigateTo('find_people')}
            className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium text-xs flex items-center justify-center gap-1.5 border border-emerald-200/50 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"
          >
            <SearchCode className="w-4 h-4" />
            <span>Find People</span>
          </button>

          <button
            onClick={() => navigateTo('scan_qr')}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <QrCode className="w-4 h-4 text-emerald-500" />
            <span>Scan QR</span>
          </button>

          <button
            onClick={onOpenNewGroupModal}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Users className="w-4 h-4 text-purple-500" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Contacts List or Empty State */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            icon={User}
            title={contacts.length === 0 ? 'No contacts added yet' : 'No contacts matching search'}
            description="Find people by username, phone number, or scan their QR code."
            actionLabel="Find People"
            onAction={() => navigateTo('find_people')}
            secondaryActionLabel="My QR Code"
            onSecondaryAction={() => navigateTo('qr_profile')}
          />
        ) : (
          <div className="space-y-2">
            {filteredContacts.map((item) => {
              const profile = item.profile;
              const name = item.alias || profile?.displayName || 'HTTP CHAT User';
              const username = profile?.username ? `@${profile.username}` : '';
              const avatar = profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.contactUid}`;

              return (
                <div
                  key={item.contactUid}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-emerald-500/40 transition-all"
                >
                  <div
                    onClick={() => handleStartChat(item.contactUid)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <img
                      src={avatar}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0 bg-slate-800"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{name}</h3>
                      <p className="text-xs text-emerald-500 font-semibold truncate">{username}</p>
                      {profile?.about && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{profile.about}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartChat(item.contactUid)}
                      className="p-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-colors"
                      title="Send Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRemoveContact(item.contactUid, name)}
                      className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Remove Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
