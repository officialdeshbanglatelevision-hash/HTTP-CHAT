import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Video, Camera, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export const CameraTestScreen: React.FC = () => {
  const { navigateTo, showToast } = useTheme();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const startCamera = async () => {
    setErrorMessage(null);
    setCapturedPhoto(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera (getUserMedia) is not supported by this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      showToast('Camera active and streaming', 'success');
    } catch (err: any) {
      console.error('Camera test error:', err);
      let msg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera access was blocked. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device was found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application or tab.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !isStreaming) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedPhoto(dataUrl);
      showToast('Snapshot captured successfully', 'success');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopCamera();
            navigateTo('permissions');
          }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Permissions
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-500" />
          Camera Diagnostic & Test
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Test your browser camera hardware and permission state. All camera media tracks are strictly released when you leave this view.
        </p>

        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Camera Access Error</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
          />
          {!isStreaming && !capturedPhoto && (
            <div className="text-center p-6 space-y-3">
              <Video className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
              <p className="text-sm text-slate-400">Camera preview is offline</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
              >
                Start Camera Test
              </button>
            </div>
          )}

          {capturedPhoto && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4">
              <img src={capturedPhoto} alt="Snapshot" className="max-h-64 rounded-lg border border-slate-700 shadow-md" />
              <button
                onClick={() => setCapturedPhoto(null)}
                className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg transition-colors"
              >
                Retake
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
            ></span>
            {isStreaming ? 'Streaming Live Video' : 'Camera Stopped'}
          </div>

          <div className="flex items-center gap-2">
            {isStreaming ? (
              <>
                <button
                  onClick={captureSnapshot}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 text-sm font-medium rounded-xl transition-colors"
                >
                  Stop Camera
                </button>
              </>
            ) : (
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Start Camera
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
