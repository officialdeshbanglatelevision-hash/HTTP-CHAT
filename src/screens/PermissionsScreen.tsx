import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { Bell, Camera, Mic, ArrowLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const PermissionsScreen: React.FC = () => {
  const { navigateTo, showToast } = useTheme();
  const { currentUser } = useAuth();
  const {
    notificationPermission,
    cameraPermission,
    micPermission,
    requestNotification,
    requestCamera,
    requestMic,
    checkAllPermissions,
  } = usePermission();

  const handleRequestCamera = async () => {
    try {
      if (cameraPermission === 'granted') {
        navigateTo('camera_test');
        return;
      }
      await requestCamera();
      showToast('Camera permission granted', 'success');
      navigateTo('camera_test');
    } catch (err: any) {
      showToast(err.message || 'Camera permission blocked or unavailable', 'error');
    }
  };

  const handleRequestMic = async () => {
    try {
      if (micPermission === 'granted') {
        navigateTo('mic_test');
        return;
      }
      await requestMic();
      showToast('Microphone permission granted', 'success');
      navigateTo('mic_test');
    } catch (err: any) {
      showToast(err.message || 'Microphone permission blocked or unavailable', 'error');
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'granted') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Allowed
        </span>
      );
    } else if (status === 'denied') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-full">
          <XCircle className="w-3.5 h-3.5" />
          Blocked
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full">
          <AlertCircle className="w-3.5 h-3.5" />
          Not Requested / Prompt
        </span>
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('settings')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Settings
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          Permissions & Hardware
        </h2>
        <button
          onClick={() => {
            checkAllPermissions();
            showToast('Permission status refreshed', 'info');
          }}
          className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
          title="Refresh Permission Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
        {/* Notifications */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Push Notifications</p>
              <p className="text-xs text-slate-400">Browser alerts for messages and calls</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderStatusBadge(notificationPermission)}
            {notificationPermission !== 'granted' ? (
              <button
                onClick={async () => {
                  try {
                    await requestNotification(currentUser?.uid);
                    showToast('Notifications enabled successfully', 'success');
                  } catch (e: any) {
                    showToast(e.message || 'Failed to enable notifications', 'error');
                  }
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
              >
                Enable
              </button>
            ) : (
              <button
                onClick={() => navigateTo('notifications')}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Camera */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Camera Hardware</p>
              <p className="text-xs text-slate-400">Video calls, status & profile photos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderStatusBadge(cameraPermission)}
            <button
              onClick={handleRequestCamera}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
            >
              {cameraPermission === 'granted' ? 'Test Camera' : 'Request & Test'}
            </button>
          </div>
        </div>

        {/* Microphone */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Microphone Hardware</p>
              <p className="text-xs text-slate-400">Voice messages, voice & video calls</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {renderStatusBadge(micPermission)}
            <button
              onClick={handleRequestMic}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
            >
              {micPermission === 'granted' ? 'Test Microphone' : 'Request & Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
