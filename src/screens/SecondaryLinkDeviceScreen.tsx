import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { linkedDeviceService, getDeviceInfo } from '../services/linkedDeviceService';
import { PairingSession } from '../types/chat';
import { ArrowLeft, KeyRound, QrCode, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';

export const SecondaryLinkDeviceScreen: React.FC = () => {
  const { setActiveScreen, showToast } = useTheme();

  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<PairingSession | null>(null);
  const [waitingApproval, setWaitingApproval] = useState(false);

  const devInfo = getDeviceInfo();

  const handleSubmitCode = async (codeToUse?: string) => {
    const code = codeToUse || pairingCodeInput;
    if (!code.trim()) return;

    setLoading(true);
    try {
      const session = await linkedDeviceService.submitPairingRequest(code, {
        browser: devInfo.browser,
        platform: devInfo.platform,
      });

      setActiveSession(session);
      setWaitingApproval(true);

      // Listen to pairing session state on primary device
      linkedDeviceService.listenToPairingSession(session.sessionId, (updated) => {
        if (!updated) return;
        if (updated.status === 'approved') {
          showToast('Device connection approved by primary device!', 'success');
          setActiveScreen('chats');
        } else if (updated.status === 'rejected') {
          showToast('Pairing request was rejected by primary device.', 'error');
          setWaitingApproval(false);
        }
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to submit pairing code', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveScreen('auth_screen')}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Back</span>
        </button>
        <h1 className="text-base font-bold text-slate-100">Link Existing Account</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-6 my-auto">
        {!waitingApproval ? (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Enter Pairing Code</h2>
              <p className="text-xs text-slate-300">
                Open HTTP CHAT on your primary device, go to Settings → Linked Devices → Link a Device to get your 6-digit code.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block text-center">
                6-Digit Pairing Code:
              </label>
              <input
                type="text"
                value={pairingCodeInput}
                onChange={(e) => setPairingCodeInput(e.target.value)}
                placeholder="e.g. 482 917"
                maxLength={7}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 text-center text-xl font-mono font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => handleSubmitCode()}
              disabled={loading || !pairingCodeInput.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Code...</span>
                </>
              ) : (
                <span>Request Connection</span>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/90 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Awaiting Approval</h2>
              <p className="text-xs text-slate-300 mt-2">
                A notification has been sent to your primary device. Please tap <strong className="text-emerald-400">Approve</strong> on your primary phone to complete pairing.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700 text-xs text-slate-400 font-medium">
              Device: {devInfo.deviceName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
