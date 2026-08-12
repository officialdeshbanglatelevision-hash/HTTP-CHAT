import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Phone, PhoneCall, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CallSession } from '../services/callService';

export const CallsScreen: React.FC = () => {
  const { navigateTo } = useTheme();
  const { currentUser } = useAuth();
  const [callLogs, setCallLogs] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setCallLogs([]);
      setLoading(false);
      return;
    }

    const qCaller = query(
      collection(db, 'calls'),
      where('callerUid', '==', currentUser.uid)
    );

    const qReceiver = query(
      collection(db, 'calls'),
      where('receiverUid', '==', currentUser.uid)
    );

    const logsMap = new Map<string, CallSession>();

    const unsub1 = onSnapshot(qCaller, (snap) => {
      snap.forEach((docSnap) => {
        logsMap.set(docSnap.id, { callId: docSnap.id, ...docSnap.data() } as CallSession);
      });
      updateLogs();
    });

    const unsub2 = onSnapshot(qReceiver, (snap) => {
      snap.forEach((docSnap) => {
        logsMap.set(docSnap.id, { callId: docSnap.id, ...docSnap.data() } as CallSession);
      });
      updateLogs();
    });

    const updateLogs = () => {
      const list = Array.from(logsMap.values());
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setCallLogs(list);
      setLoading(false);
    };

    return () => {
      unsub1();
      unsub2();
    };
  }, [currentUser]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-slate-50 dark:bg-slate-950">
      {/* Quick Action Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          onClick={() => navigateTo('contacts')}
          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Phone className="w-4 h-4 stroke-[2]" />
          <span>New Voice Call</span>
        </button>

        <button
          onClick={() => navigateTo('contacts')}
          className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Video className="w-4 h-4 stroke-[2]" />
          <span>New Video Call</span>
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading call history...</div>
        ) : callLogs.length === 0 ? (
          <EmptyState
            icon={PhoneCall}
            title="No call history"
            description="Your recent voice and video call logs will appear here."
            actionLabel="Start a call"
            onAction={() => navigateTo('contacts')}
          />
        ) : (
          <div className="space-y-2 max-w-xl mx-auto">
            {callLogs.map((log) => {
              const isOutgoing = log.callerUid === currentUser?.uid;
              const otherName = isOutgoing ? log.receiverName : log.callerName;
              const otherAvatar = isOutgoing
                ? log.receiverAvatar
                : log.callerAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${otherName}`;

              return (
                <div
                  key={log.callId}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={otherAvatar}
                      alt={otherName}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {otherName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isOutgoing ? (
                          <PhoneOutgoing className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : log.status === 'declined' ? (
                          <PhoneMissed className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        ) : (
                          <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span className="capitalize">{log.type} call • {log.status}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('contacts')}
                    className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shrink-0"
                  >
                    {log.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
