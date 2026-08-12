import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { linkedDeviceService, MAX_LINKED_DEVICES, getDeviceInfo } from '../services/linkedDeviceService';
import { LinkedDevice, PairingSession } from '../types/chat';
import { ArrowLeft, Monitor, Smartphone, Laptop, Plus, ShieldAlert, Trash2, Check, X, RefreshCw, AlertTriangle, KeyRound } from 'lucide-react';

export const LinkedDevicesScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const { setActiveScreen, showToast } = useTheme();

  const [devices, setDevices] = useState<LinkedDevice[]>([]);
  const [loading, setLoading] = useState(true);

  // Link device modal state
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [activeSession, setActiveSession] = useState<PairingSession | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<PairingSession | null>(null);
  const [approving, setApproving] = useState(false);

  // Current session device info
  const currentDev = getDeviceInfo();

  useEffect(() => {
    if (!currentUser) return;

    // Listen to linked devices
    const unsubDevices = linkedDeviceService.listenToLinkedDevices(currentUser.uid, (devs) => {
      setDevices(devs);
      setLoading(false);
    });

    return () => {
      unsubDevices();
    };
  }, [currentUser]);

  // Start a new pairing session for linking a secondary device
  const handleStartPairing = async () => {
    if (!currentUser) return;

    if (devices.length >= MAX_LINKED_DEVICES) {
      showToast(`You have reached the maximum of ${MAX_LINKED_DEVICES} linked devices. Revoke an existing device first.`, 'error');
      return;
    }

    try {
      const session = await linkedDeviceService.createPairingSession(currentUser.uid);
      setActiveSession(session);
      setShowPairingModal(true);

      // Listen for updates on this pairing session
      const unsubSession = linkedDeviceService.listenToPairingSession(session.sessionId, (updated) => {
        if (!updated) return;
        setActiveSession(updated);

        if (updated.status === 'awaiting_approval') {
          setIncomingRequest(updated);
        } else if (updated.status === 'approved') {
          showToast('Device linked successfully!', 'success');
          setShowPairingModal(false);
          setIncomingRequest(null);
        }
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to start pairing session', 'error');
    }
  };

  // Approve incoming connection request
  const handleApproveIncoming = async () => {
    if (!currentUser || !incomingRequest) return;
    setApproving(true);
    try {
      await linkedDeviceService.approvePairingSession(incomingRequest.sessionId, currentUser.uid);
      showToast('Device connection approved!', 'success');
      setIncomingRequest(null);
      setShowPairingModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to approve device', 'error');
    } finally {
      setApproving(false);
    }
  };

  // Reject incoming connection request
  const handleRejectIncoming = async () => {
    if (!incomingRequest) return;
    try {
      await linkedDeviceService.rejectPairingSession(incomingRequest.sessionId);
      showToast('Connection request rejected', 'info');
      setIncomingRequest(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Revoke device
  const handleRevokeDevice = async (deviceId: string, name: string) => {
    if (!currentUser) return;
    if (confirm(`Revoke access for "${name}"? This device will be immediately logged out.`)) {
      try {
        await linkedDeviceService.revokeDevice(currentUser.uid, deviceId);
        showToast(`Revoked ${name}`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to revoke device', 'error');
      }
    }
  };

  // Log out of all other devices
  const handleRevokeAllOther = async () => {
    if (!currentUser) return;
    if (confirm('Log out of all other linked devices? All other sessions will be terminated immediately.')) {
      try {
        await linkedDeviceService.revokeAllOtherDevices(currentUser.uid, 'current_session');
        showToast('All other linked devices have been logged out.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to revoke all devices', 'error');
      }
    }
  };

  const getDeviceIcon = (platform: string) => {
    if (platform.includes('Android') || platform.includes('iOS')) {
      return <Smartphone className="w-5 h-5 text-emerald-400" />;
    }
    if (platform.includes('Windows') || platform.includes('macOS') || platform.includes('Linux')) {
      return <Laptop className="w-5 h-5 text-cyan-400" />;
    }
    return <Monitor className="w-5 h-5 text-purple-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveScreen('settings')}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-sm">Settings</span>
        </button>
        <h1 className="text-base font-bold text-slate-100">Linked Devices</h1>
        <div className="text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg text-emerald-400 border border-slate-700">
          {devices.length}/{MAX_LINKED_DEVICES}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-6">
        {/* Link New Device Banner */}
        <div className="bg-gradient-to-r from-emerald-900/40 via-slate-800 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Use HTTP CHAT on Other Devices</h3>
              <p className="text-xs text-slate-300 mt-1">
                Link up to {MAX_LINKED_DEVICES} devices (web browsers, tablets, desktop apps) using QR code or a 6-digit pairing code.
              </p>
            </div>
          </div>

          <button
            onClick={handleStartPairing}
            disabled={devices.length >= MAX_LINKED_DEVICES}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3 px-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Link a Device</span>
          </button>
        </div>

        {/* Current Active Device Info */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            This Device
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getDeviceIcon(currentDev.platform)}
              <div>
                <p className="text-xs font-bold text-white">{currentDev.deviceName}</p>
                <p className="text-[11px] text-emerald-400 font-medium">Active Session (Primary)</p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Linked Devices List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Linked Devices ({devices.length})
            </h2>
            {devices.length > 0 && (
              <button
                onClick={handleRevokeAllOther}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Log Out All Other Devices
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading linked devices...</div>
          ) : devices.length === 0 ? (
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">No other devices linked yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Your messages stay synced across all linked sessions in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((dev) => (
                <div
                  key={dev.deviceId}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(dev.platform)}
                    <div>
                      <p className="text-xs font-bold text-white">{dev.deviceName}</p>
                      <p className="text-[10px] text-slate-400">
                        Linked: {new Date(dev.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeDevice(dev.deviceId, dev.deviceName)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title="Revoke Device"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pairing Modal (QR + 6-digit Code) */}
      {showPairingModal && activeSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full space-y-5 text-center relative shadow-2xl">
            <button
              onClick={() => setShowPairingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Link New Device</h3>
              <p className="text-xs text-slate-400 mt-1">
                Scan this QR code from the secondary device, or enter the 6-digit code:
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mx-auto border border-slate-200">
              <QRCodeSVG
                value={`${window.location.origin}/link?session=${activeSession.sessionId}`}
                size={160}
                bgColor={"#FFFFFF"}
                fgColor={"#0F172A"}
                level={"H"}
              />
            </div>

            {/* 6-Digit Pairing Code */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Numeric Pairing Code
              </span>
              <span className="text-2xl font-mono font-bold tracking-widest text-emerald-400">
                {activeSession.pairingCode}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Waiting for secondary device request... Code expires in 5 minutes.
            </p>
          </div>
        </div>
      )}

      {/* Incoming Device Approval Popup */}
      {incomingRequest && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full space-y-5 text-center shadow-2xl">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Device Connection Request</h3>
              <p className="text-xs text-slate-300 mt-2">
                A new device is attempting to pair with your HTTP CHAT account:
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-left space-y-1">
              <p className="text-xs font-bold text-white">
                {incomingRequest.secondaryDeviceInfo?.browser} on {incomingRequest.secondaryDeviceInfo?.platform}
              </p>
              <p className="text-[11px] text-slate-400">
                Requested at: {new Date().toLocaleTimeString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRejectIncoming}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs"
              >
                Reject
              </button>

              <button
                onClick={handleApproveIncoming}
                disabled={approving}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5"
              >
                {approving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Approve Device</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
