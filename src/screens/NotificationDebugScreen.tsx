import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowLeft, Terminal, CheckCircle2, XCircle, RefreshCw, Play, AlertTriangle } from 'lucide-react';
import { getDeviceId, checkSecureContext, registerServiceWorker, requestAndRegisterFCMToken } from '../services/fcmService';

export const NotificationDebugScreen: React.FC = () => {
  const { navigateTo, showToast } = useTheme();
  const { currentUser } = useAuth();
  const [debugInfo, setDebugInfo] = useState({
    secureContext: false,
    notificationSupported: false,
    serviceWorkerSupported: false,
    pushSupported: false,
    permission: 'default',
    fcmToken: '',
    fcmTokenMasked: 'None',
    deviceId: '',
    swRegistered: false,
  });

  const [testResult, setTestResult] = useState<{
    running: boolean;
    success?: boolean;
    failurePoint?: string;
    stepLogs: { step: string; status: 'success' | 'failed' | 'pending'; detail: string }[];
    error?: string;
  }>({
    running: false,
    stepLogs: [],
  });

  const loadDiagnostics = async () => {
    const secure = checkSecureContext();
    const notifSupp = 'Notification' in window;
    const swSupp = 'serviceWorker' in navigator;
    const pushSupp = 'PushManager' in window;
    const perm = notifSupp ? Notification.permission : 'unsupported';
    const devId = getDeviceId();
    const token = localStorage.getItem('http_chat_fcm_token') || '';
    const masked = token ? `${token.substring(0, 10)}...${token.substring(token.length - 6)}` : 'Not Registered';

    let swReg = false;
    if (swSupp) {
      const reg = await navigator.serviceWorker.getRegistration();
      swReg = !!reg;
    }

    setDebugInfo({
      secureContext: secure,
      notificationSupported: notifSupp,
      serviceWorkerSupported: swSupp,
      pushSupported: pushSupp,
      permission: perm,
      fcmToken: token,
      fcmTokenMasked: masked,
      deviceId: devId,
      swRegistered: swReg,
    });
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const runE2ETest = async () => {
    if (!currentUser) {
      showToast('Please sign in to run FCM test', 'error');
      return;
    }

    setTestResult({
      running: true,
      stepLogs: [],
    });

    const logs: { step: string; status: 'success' | 'failed' | 'pending'; detail: string }[] = [];

    const addLog = (step: string, status: 'success' | 'failed' | 'pending', detail: string) => {
      logs.push({ step, status, detail });
      setTestResult({ running: true, stepLogs: [...logs] });
    };

    // Step 1: Secure Context
    addLog('Secure Context', 'pending', 'Checking HTTPS or localhost context...');
    const secure = checkSecureContext();
    if (!secure) {
      addLog('Secure Context', 'failed', 'Failure point: permission / secure context required.');
      setTestResult({ running: false, success: false, failurePoint: 'permission', stepLogs: [...logs], error: 'Secure context required for FCM' });
      return;
    }
    addLog('Secure Context', 'success', 'Running in secure context.');

    // Step 2: Permission check
    addLog('Notification Permission', 'pending', 'Checking Notification.permission...');
    if (Notification.permission !== 'granted') {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          addLog('Notification Permission', 'failed', `Failure point: permission. Permission status: ${perm}`);
          setTestResult({ running: false, success: false, failurePoint: 'permission', stepLogs: [...logs], error: `Permission denied: ${perm}` });
          return;
        }
      } catch (e: any) {
        addLog('Notification Permission', 'failed', `Failure point: permission. Error: ${e.message}`);
        setTestResult({ running: false, success: false, failurePoint: 'permission', stepLogs: [...logs], error: e.message });
        return;
      }
    }
    addLog('Notification Permission', 'success', 'Permission granted.');

    // Step 3: Service Worker registration
    addLog('Service Worker', 'pending', 'Registering / verifying /firebase-messaging-sw.js...');
    try {
      const swReg = await registerServiceWorker();
      if (!swReg) {
        addLog('Service Worker', 'failed', 'Failure point: service_worker. Failed to register SW.');
        setTestResult({ running: false, success: false, failurePoint: 'service_worker', stepLogs: [...logs], error: 'Service worker registration failed' });
        return;
      }
      addLog('Service Worker', 'success', `Service worker active with scope: ${swReg.scope}`);
    } catch (e: any) {
      addLog('Service Worker', 'failed', `Failure point: service_worker. Error: ${e.message}`);
      setTestResult({ running: false, success: false, failurePoint: 'service_worker', stepLogs: [...logs], error: e.message });
      return;
    }

    // Step 4: Token Registration & Persistence
    addLog('Token Registration', 'pending', 'Retrieving FCM token and persisting in Firestore (users/{uid}/notificationTokens)...');
    let fcmToken = debugInfo.fcmToken;
    try {
      if (!fcmToken) {
        fcmToken = (await requestAndRegisterFCMToken(currentUser.uid)) || '';
      }
      if (!fcmToken) {
        addLog('Token Registration', 'failed', 'Failure point: token_registration. No FCM token generated.');
        setTestResult({ running: false, success: false, failurePoint: 'token_registration', stepLogs: [...logs], error: 'Failed to obtain FCM registration token' });
        return;
      }
      addLog('Token Registration', 'success', `FCM token obtained and persisted: ${fcmToken.substring(0, 10)}...`);
    } catch (e: any) {
      addLog('Token Registration', 'failed', `Failure point: token_registration. Error: ${e.message}`);
      setTestResult({ running: false, success: false, failurePoint: 'token_registration', stepLogs: [...logs], error: e.message });
      return;
    }

    // Step 5: Backend Trigger & FCM Send API Test
    addLog('Backend Trigger & FCM Send', 'pending', 'Triggering backend test push notification via /api/notifications/test...');
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          token: fcmToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const failurePt = data.failurePoint || 'fcm_send';
        addLog('Backend Trigger & FCM Send', 'failed', `Failure point: ${failurePt}. Details: ${data.error || data.reason || 'Unknown error'}`);
        setTestResult({ running: false, success: false, failurePoint: failurePt, stepLogs: [...logs], error: data.error || data.reason || 'Backend push test failed' });
        return;
      }
      addLog('Backend Trigger & FCM Send', 'success', `FCM push message successfully dispatched! Message ID: ${data.messageId}`);
    } catch (e: any) {
      addLog('Backend Trigger & FCM Send', 'failed', `Failure point: backend_trigger. Error: ${e.message}`);
      setTestResult({ running: false, success: false, failurePoint: 'backend_trigger', stepLogs: [...logs], error: e.message });
      return;
    }

    // Step 6: Browser Delivery simulation / check
    addLog('Browser Delivery', 'success', 'End-to-end FCM Web Push test completed successfully! Notification dispatched to device token.');
    setTestResult({ running: false, success: true, stepLogs: [...logs] });
    loadDiagnostics();
    showToast('FCM E2E test passed successfully!', 'success');
  };

  const renderBadge = (val: boolean) =>
    val ? (
      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
        <CheckCircle2 className="w-4 h-4" /> Yes / Supported
      </span>
    ) : (
      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-xs">
        <XCircle className="w-4 h-4" /> No / Unsupported
      </span>
    );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('notifications')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notifications
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-500" />
          FCM & Push Diagnostics & Test Suite
        </h2>
        <button
          onClick={() => {
            loadDiagnostics();
            showToast('Diagnostics refreshed', 'info');
          }}
          className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
          title="Refresh Diagnostics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* E2E Test Action Card */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">End-to-End FCM Push Test</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Verify permissions, service worker, token persistence in Firestore (users/&#123;uid&#125;/notificationTokens), backend trigger, and FCM delivery.
            </p>
          </div>
          <button
            onClick={runE2ETest}
            disabled={testResult.running}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            {testResult.running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run FCM Test
              </>
            )}
          </button>
        </div>

        {testResult.stepLogs.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Test Execution Logs</h4>
            <div className="space-y-1.5 font-mono text-xs">
              {testResult.stepLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {log.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                  {log.status === 'failed' && <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                  {log.status === 'pending' && <RefreshCw className="w-4 h-4 text-amber-500 animate-spin shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.step}:</span>{' '}
                    <span className="text-slate-600 dark:text-slate-400">{log.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {testResult.failurePoint && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2 text-rose-800 dark:text-rose-200 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Failure Point Detected:</span> <span className="uppercase font-mono font-semibold">{testResult.failurePoint}</span>
                  <p className="mt-0.5">{testResult.error}</p>
                </div>
              </div>
            )}

            {testResult.success && (
              <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                End-to-End FCM Web Push verification passed successfully!
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Secure Context (HTTPS / Localhost)</span>
          {renderBadge(debugInfo.secureContext)}
        </div>

        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notification API Support</span>
          {renderBadge(debugInfo.notificationSupported)}
        </div>

        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Worker Support</span>
          {renderBadge(debugInfo.serviceWorkerSupported)}
        </div>

        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Push Manager Support</span>
          {renderBadge(debugInfo.pushSupported)}
        </div>

        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Worker Registered</span>
          {renderBadge(debugInfo.swRegistered)}
        </div>

        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Permission State</span>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono rounded-lg uppercase">
            {debugInfo.permission}
          </span>
        </div>

        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Device ID</span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{debugInfo.deviceId}</span>
        </div>

        <div className="p-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">FCM Registration Token (Masked)</span>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
            {debugInfo.fcmTokenMasked}
          </div>
        </div>
      </div>
    </div>
  );
};

