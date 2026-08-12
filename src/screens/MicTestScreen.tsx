import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Mic, ArrowLeft, RefreshCw, AlertCircle, Volume2 } from 'lucide-react';

export const MicTestScreen: React.FC = () => {
  const { navigateTo, showToast } = useTheme();
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setAudioLevel(0);
  };

  const startMicrophone = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone (getUserMedia) is not supported by this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setIsRecording(true);
      showToast('Microphone active and recording live input', 'success');

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err: any) {
      console.error('Microphone test error:', err);
      let msg = 'Failed to access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone access was blocked. Please allow microphone access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone device was found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Microphone is already in use by another application or tab.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopMicrophone();
            navigateTo('permissions');
          }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Permissions
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Mic className="w-5 h-5 text-emerald-500" />
          Microphone Diagnostic & Test
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Test your microphone input level in real-time. Audio is analyzed locally on your device and never uploaded or stored.
        </p>

        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Microphone Access Error</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="p-8 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-6">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-emerald-500/20 text-emerald-500 ring-8 ring-emerald-500/10 animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Mic className="w-10 h-10" />
          </div>

          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Input Level</span>
              <span>{audioLevel}%</span>
            </div>
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              ></div>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            {isRecording ? 'Speak into your microphone to test live audio meter response.' : 'Click start test to begin monitoring.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
            ></span>
            {isRecording ? 'Microphone Active' : 'Microphone Released'}
          </div>

          <div>
            {isRecording ? (
              <button
                onClick={stopMicrophone}
                className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 text-sm font-medium rounded-xl transition-colors"
              >
                Stop Test
              </button>
            ) : (
              <button
                onClick={startMicrophone}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Start Microphone Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
