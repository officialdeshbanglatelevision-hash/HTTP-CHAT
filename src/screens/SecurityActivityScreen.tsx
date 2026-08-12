import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { securityService } from '../services/securityService';
import { SecurityEvent } from '../types/chat';
import { ArrowLeft, ShieldCheck, KeyRound, Smartphone, Mail, Lock, AlertTriangle } from 'lucide-react';

export const SecurityActivityScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const { setActiveScreen } = useTheme();

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsub = securityService.listenToSecurityEvents(currentUser.uid, (evs) => {
      setEvents(evs);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'device_linked':
      case 'device_revoked':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'phone_changed':
        return <KeyRound className="w-4 h-4 text-cyan-400" />;
      case 'email_changed':
        return <Mail className="w-4 h-4 text-purple-400" />;
      case 'password_changed':
      case 'two_factor_updated':
        return <Lock className="w-4 h-4 text-amber-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveScreen('account_settings')}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Account</span>
        </button>
        <h1 className="text-base font-bold text-slate-100">Security Activity</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-4">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500">Loading security activity log...</div>
        ) : events.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
            <h3 className="font-bold text-white text-sm">No Security Incidents</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Your account security events (linked devices, email/phone changes, password resets) will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                      {getEventIcon(ev.type)}
                    </div>
                    <span className="text-xs font-bold text-white">{ev.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ev.timestamp).toLocaleDateString()} {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 pl-8">{ev.description}</p>
                {ev.deviceInfo && (
                  <p className="text-[10px] text-slate-500 pl-8 font-mono">Device: {ev.deviceInfo}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
