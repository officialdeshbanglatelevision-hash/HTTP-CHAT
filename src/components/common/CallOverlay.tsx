import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { callService, CallSession } from '../../services/callService';
import { useAuth } from '../../context/AuthContext';

export const CallOverlay: React.FC = () => {
  const { currentUser } = useAuth();
  const [session, setSession] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Subscriptions & state updates
  useEffect(() => {
    callService.setOnStateChange((activeSession, local, remote) => {
      setSession(activeSession);
      setLocalStream(local);
      setRemoteStream(remote);
    });

    if (currentUser) {
      const unsubIncoming = callService.listenForIncomingCalls(currentUser.uid, (incSession) => {
        setIncomingCall(incSession);
      });
      return () => unsubIncoming();
    }
  }, [currentUser]);

  // Bind streams to video/audio tags
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream, session]);

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (session?.status === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session?.status]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    if (incomingCall) {
      const callToAnswer = incomingCall;
      setIncomingCall(null);
      await callService.acceptCall(callToAnswer);
    }
  };

  const handleDecline = async () => {
    if (incomingCall) {
      await callService.declineCall(incomingCall.callId);
      setIncomingCall(null);
    }
  };

  const handleEnd = async () => {
    await callService.endCall();
  };

  const handleToggleMute = () => {
    const muted = callService.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = () => {
    const videoOff = callService.toggleVideo();
    setIsVideoOff(videoOff);
  };

  // Render Incoming Call Banner
  if (incomingCall && !session) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between animate-bounce">
        <div className="flex items-center space-x-3">
          <img
            src={incomingCall.callerAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${incomingCall.callerName}`}
            alt={incomingCall.callerName}
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
          />
          <div>
            <h4 className="font-semibold text-base">{incomingCall.callerName}</h4>
            <p className="text-xs text-emerald-400 capitalize flex items-center space-x-1">
              <span>Incoming {incomingCall.type} call...</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDecline}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg"
            title="Decline"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
          <button
            onClick={handleAccept}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-colors shadow-lg"
            title="Accept"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Render Active Call Overlay Modal
  if (!session) return null;

  const otherPersonName = session.callerUid === currentUser?.uid ? session.receiverName : session.callerName;
  const otherPersonAvatar =
    session.callerUid === currentUser?.uid
      ? session.receiverAvatar
      : session.callerAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${otherPersonName}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 text-white overflow-hidden">
      {/* Invisible audio element for voice calls */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Video stream elements */}
      {session.type === 'video' ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-3xl border border-slate-800"
          />
          {/* Local Video Thumbnail */}
          <div className="absolute top-4 right-4 w-28 h-40 bg-slate-900 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-2xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        </div>
      ) : (
        /* Voice Call Interface */
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <img
              src={otherPersonAvatar}
              alt={otherPersonName}
              className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 shadow-2xl animate-pulse"
            />
            <div className="absolute -bottom-2 right-2 bg-emerald-500 p-2 rounded-full text-slate-950">
              <Volume2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{otherPersonName}</h2>
            <p className="text-sm text-emerald-400 mt-1 capitalize font-medium">
              {session.status === 'connected' ? formatDuration(duration) : `${session.status}...`}
            </p>
          </div>
        </div>
      )}

      {/* Call Controls Bar */}
      <div className="w-full max-w-sm mx-auto bg-slate-900/90 backdrop-blur-lg p-4 rounded-3xl border border-slate-800 flex items-center justify-around shadow-2xl mb-4">
        <button
          onClick={handleToggleMute}
          className={`p-4 rounded-full transition-all ${
            isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {session.type === 'video' && (
          <button
            onClick={handleToggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        <button
          onClick={handleEnd}
          className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform active:scale-95 shadow-lg"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
