import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types/chat';

export interface CallSession {
  callId: string;
  callerUid: string;
  callerName: string;
  callerAvatar?: string;
  receiverUid: string;
  receiverName: string;
  receiverAvatar?: string;
  type: 'voice' | 'video';
  status: 'calling' | 'ringing' | 'connected' | 'declined' | 'ended' | 'busy';
  offer?: { type: string; sdp: string };
  answer?: { type: string; sdp: string };
  createdAt?: any;
  connectedAt?: any;
  endedAt?: any;
  durationSeconds?: number;
}

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

class CallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callDocUnsub: (() => void) | null = null;
  private candidateUnsubs: (() => void)[] = [];

  public activeCallSession: CallSession | null = null;
  private onStateChangeCb: ((session: CallSession | null, localStream: MediaStream | null, remoteStream: MediaStream | null) => void) | null = null;

  public setOnStateChange(cb: (session: CallSession | null, localStream: MediaStream | null, remoteStream: MediaStream | null) => void) {
    this.onStateChangeCb = cb;
  }

  private notify() {
    if (this.onStateChangeCb) {
      this.onStateChangeCb(this.activeCallSession, this.localStream, this.remoteStream);
    }
  }

  // Listen for incoming calls for the current user
  public listenForIncomingCalls(currentUserUid: string, onIncomingCall: (session: CallSession) => void) {
    const q = query(
      collection(db, 'calls'),
      where('receiverUid', '==', currentUserUid),
      where('status', 'in', ['calling', 'ringing'])
    );

    return onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const session = { callId: change.doc.id, ...change.doc.data() } as CallSession;
          if (!this.activeCallSession && (session.status === 'calling' || session.status === 'ringing')) {
            onIncomingCall(session);
          }
        }
      });
    });
  }

  // Start outgoing call
  public async initiateCall(
    caller: UserProfile,
    receiver: UserProfile,
    type: 'voice' | 'video'
  ): Promise<CallSession> {
    this.cleanup();

    // 1. Get media stream
    const constraints = {
      audio: true,
      video: type === 'video',
    };
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.remoteStream = new MediaStream();

    // 2. Create call document
    const callRef = doc(collection(db, 'calls'));
    const callId = callRef.id;

    const session: CallSession = {
      callId,
      callerUid: caller.uid,
      callerName: caller.displayName,
      callerAvatar: caller.photoURL,
      receiverUid: receiver.uid,
      receiverName: receiver.displayName,
      receiverAvatar: receiver.photoURL,
      type,
      status: 'calling',
      createdAt: serverTimestamp(),
    };

    this.activeCallSession = session;
    this.notify();

    // 3. Create WebRTC PeerConnection
    this.peerConnection = new RTCPeerConnection(iceServers);

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      this.notify();
    };

    // Gather ICE candidates
    const callerCandidatesCol = collection(db, `calls/${callId}/callerCandidates`);
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(callerCandidatesCol, event.candidate.toJSON());
      }
    };

    // Create SDP Offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    session.offer = { type: offer.type, sdp: offer.sdp || '' };
    await setDoc(callRef, session);

    // Listen to call updates (answer, decline, end)
    this.callDocUnsub = onSnapshot(callRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as CallSession;
      this.activeCallSession = { ...data, callId: snap.id };
      this.notify();

      if (data.answer && this.peerConnection && !this.peerConnection.currentRemoteDescription) {
        const remoteAnswer = new RTCSessionDescription(data.answer as RTCSessionDescriptionInit);
        await this.peerConnection.setRemoteDescription(remoteAnswer);
      }

      if (data.status === 'declined' || data.status === 'ended' || data.status === 'busy') {
        this.cleanup();
      }
    });

    // Listen for Callee ICE candidates
    const calleeCandidatesCol = collection(db, `calls/${callId}/calleeCandidates`);
    const calleeUnsub = onSnapshot(calleeCandidatesCol, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === 'added' && this.peerConnection) {
          const candidate = new RTCIceCandidate(change.doc.data());
          await this.peerConnection.addIceCandidate(candidate);
        }
      });
    });
    this.candidateUnsubs.push(calleeUnsub);

    return session;
  }

  // Answer incoming call
  public async acceptCall(session: CallSession): Promise<void> {
    this.cleanup();
    this.activeCallSession = { ...session, status: 'connected' };

    const callRef = doc(db, 'calls', session.callId);
    await updateDoc(callRef, {
      status: 'connected',
      connectedAt: serverTimestamp(),
    });

    // Get media stream
    const constraints = {
      audio: true,
      video: session.type === 'video',
    };
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.remoteStream = new MediaStream();

    this.peerConnection = new RTCPeerConnection(iceServers);

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      this.notify();
    };

    // ICE candidates
    const calleeCandidatesCol = collection(db, `calls/${session.callId}/calleeCandidates`);
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(calleeCandidatesCol, event.candidate.toJSON());
      }
    };

    // Set Remote Offer
    if (session.offer) {
      const offerDescription = new RTCSessionDescription(session.offer as RTCSessionDescriptionInit);
      await this.peerConnection.setRemoteDescription(offerDescription);

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await updateDoc(callRef, {
        answer: { type: answer.type, sdp: answer.sdp || '' },
      });
    }

    // Listen for Caller ICE candidates
    const callerCandidatesCol = collection(db, `calls/${session.callId}/callerCandidates`);
    const callerUnsub = onSnapshot(callerCandidatesCol, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === 'added' && this.peerConnection) {
          const candidate = new RTCIceCandidate(change.doc.data());
          await this.peerConnection.addIceCandidate(candidate);
        }
      });
    });
    this.candidateUnsubs.push(callerUnsub);

    // Listen for call status changes
    this.callDocUnsub = onSnapshot(callRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as CallSession;
      this.activeCallSession = { ...data, callId: snap.id };
      this.notify();

      if (data.status === 'ended' || data.status === 'declined') {
        this.cleanup();
      }
    });

    this.notify();
  }

  // Reject call
  public async declineCall(callId: string) {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'declined',
        endedAt: serverTimestamp(),
      });
    } catch (e) {}
    this.cleanup();
  }

  // End call
  public async endCall() {
    if (this.activeCallSession?.callId) {
      try {
        await updateDoc(doc(db, 'calls', this.activeCallSession.callId), {
          status: 'ended',
          endedAt: serverTimestamp(),
        });
      } catch (e) {}
    }
    this.cleanup();
  }

  // Toggle Mute Audio
  public toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // isMuted
      }
    }
    return false;
  }

  // Toggle Video Camera
  public toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled; // isVideoOff
      }
    }
    return false;
  }

  // Cleanup WebRTC resources
  public cleanup() {
    if (this.callDocUnsub) {
      this.callDocUnsub();
      this.callDocUnsub = null;
    }
    this.candidateUnsubs.forEach((unsub) => unsub());
    this.candidateUnsubs = [];

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
    this.activeCallSession = null;
    this.notify();
  }
}

export const callService = new CallService();
