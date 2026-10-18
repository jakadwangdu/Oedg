import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

export default function VideoGrid({ roomId }) {
  const { user } = useAuthStore();
  const { participants } = useRoomStore();

  const [inCall, setInCall] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [partnerScreenSharing, setPartnerScreenSharing] = useState(false);
  const [hasRemoteUser, setHasRemoteUser] = useState(false);
  const [remoteUsername, setRemoteUsername] = useState('Attendee');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [fullscreenMode, setFullscreenMode] = useState(null); // 'local' | 'remote' | 'all' | null

  const containerRef = useRef(null);
  const localCardRef = useRef(null);
  const remoteCardRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const queuedCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null);

  // Sync fullscreen state with native browser Esc/Exit
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setFullscreenMode(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      leaveCall();
    };
  }, []);

  // Continuously ensure active stream (camera or screen share) is attached and playing
  useEffect(() => {
    const activeStream = isScreenSharing && screenStreamRef.current
      ? screenStreamRef.current
      : localStreamRef.current;

    if (localVideoRef.current && activeStream) {
      if (localVideoRef.current.srcObject !== activeStream) {
        localVideoRef.current.srcObject = activeStream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [inCall, cameraOff, isAudioOnly, isScreenSharing]);

  // WebRTC Signaling Listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Incoming Call ring alert from attendee
    const handleIncomingCall = ({ fromSocketId, fromUsername, fromAvatar, isAudioOnly: remoteAudioOnly }) => {
      remoteSocketIdRef.current = fromSocketId;
      setRemoteUsername(fromUsername || 'Attendee');
      setIncomingCall({
        fromSocketId,
        fromUsername: fromUsername || 'Attendee',
        fromAvatar,
        isAudioOnly: remoteAudioOnly,
      });
    };

    const handleCallRejected = () => {
      setErrorMessage(`${remoteUsername} was unavailable to answer.`);
      setTimeout(() => setErrorMessage(''), 4000);
      leaveCall();
    };

    const handleOffer = async ({ offer, fromSocketId, user: senderUser }) => {
      remoteSocketIdRef.current = fromSocketId;
      setRemoteUsername(senderUser?.username || 'Attendee');

      // If we don't have our peer connection or local stream ready yet, save offer
      if (!localStreamRef.current) {
        pendingOfferRef.current = { offer, fromSocketId, senderUser };
        setIncomingCall({
          fromSocketId,
          fromUsername: senderUser?.username || 'Attendee',
          fromAvatar: senderUser?.avatar,
          isAudioOnly: false,
        });
        return;
      }

      await acceptOffer(offer, fromSocketId);
    };

    const handleAnswer = async ({ answer }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushQueuedCandidates(pc);
          setHasRemoteUser(true);
        }
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    };

    const handleCandidate = async ({ candidate }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          queuedCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    };

    const handleScreenStatus = ({ isScreenSharing: remoteScreenSharing, username }) => {
      setPartnerScreenSharing(remoteScreenSharing);
      if (remoteScreenSharing) {
        setErrorMessage(`✦ ${username} started screen sharing`);
        setTimeout(() => setErrorMessage(''), 3000);
      }
    };

    const handlePeerLeft = () => {
      setHasRemoteUser(false);
      setPartnerScreenSharing(false);
      remoteStreamRef.current = null;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    socket.on('webrtc:incoming_call', handleIncomingCall);
    socket.on('webrtc:call_rejected', handleCallRejected);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:candidate', handleCandidate);
    socket.on('webrtc:screen_status', handleScreenStatus);
    socket.on('webrtc:peer_left', handlePeerLeft);

    return () => {
      socket.off('webrtc:incoming_call', handleIncomingCall);
      socket.off('webrtc:call_rejected', handleCallRejected);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:candidate', handleCandidate);
      socket.off('webrtc:screen_status', handleScreenStatus);
      socket.off('webrtc:peer_left', handlePeerLeft);
    };
  }, [roomId, remoteUsername]);

  const flushQueuedCandidates = async (pc) => {
    while (queuedCandidatesRef.current.length > 0) {
      const c = queuedCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.warn('Failed to add queued candidate:', err);
      }
    }
  };

  const createPeerConnection = (targetSocketId) => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {}
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket?.emit('webrtc:candidate', {
          targetSocketId,
          candidate: event.candidate,
          roomId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setHasRemoteUser(true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(() => {});
        }
      }
    };

    // Attach local stream tracks to PC
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  };

  const acceptOffer = async (offer, fromSocketId) => {
    try {
      const pc = createPeerConnection(fromSocketId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushQueuedCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = getSocket();
      socket?.emit('webrtc:answer', {
        targetSocketId: fromSocketId,
        answer,
      });

      setInCall(true);
      setIncomingCall(null);
      pendingOfferRef.current = null;
    } catch (err) {
      console.error('Error accepting WebRTC offer:', err);
    }
  };

  // Start call as caller (supports video call, voice-only, or direct screen share)
  const startCall = async (audioOnly = false, startWithScreen = false) => {
    setConnecting(true);
    setErrorMessage('');
    setIsAudioOnly(audioOnly);

    if (!navigator.mediaDevices || (!navigator.mediaDevices.getUserMedia && !navigator.mediaDevices.getDisplayMedia)) {
      setErrorMessage('Media devices require HTTPS or localhost connection.');
      setConnecting(false);
      return;
    }

    try {
      let stream = null;
      let screenStream = null;

      // 1. If starting with screen share, request display media
      if (startWithScreen) {
        if (!navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Screen sharing is not supported by your browser.');
        }
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          stopScreenShare();
        };
      }

      // 2. Request user media (audio + camera)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: !audioOnly && !startWithScreen ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch (mediaErr) {
        if (!audioOnly && !startWithScreen) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          setIsAudioOnly(true);
          setErrorMessage('Camera unavailable (switched to voice-only mode).');
        } else if (startWithScreen) {
          console.warn('Microphone error during screen share, continuing:', mediaErr.message);
        } else {
          throw mediaErr;
        }
      }

      localStreamRef.current = stream;
      setInCall(true);

      const socket = getSocket();
      socket?.emit('webrtc:call_user', { roomId, isAudioOnly: audioOnly });
      if (startWithScreen) {
        socket?.emit('webrtc:screen_status', { roomId, isScreenSharing: true });
      }

      // Determine target socket ID
      const otherParticipant = participants.find((p) => p.userId !== user?._id);
      const targetSocketId = otherParticipant?.socketId || null;
      remoteSocketIdRef.current = targetSocketId;

      // Create offer
      const pc = createPeerConnection(targetSocketId);
      if (startWithScreen && screenStream) {
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        } else {
          pc.addTrack(screenTrack, screenStream);
        }
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit('webrtc:offer', {
        roomId,
        offer,
        targetSocketId,
      });
    } catch (err) {
      console.error('Call initiation error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Permission was denied. Please allow camera, microphone, or screen access.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('Required media device not found on this device.');
      } else {
        setErrorMessage('Failed to start call: ' + err.message);
      }
      setInCall(false);
      setIsScreenSharing(false);
    } finally {
      setConnecting(false);
    }
  };

  // Answer incoming call from partner
  const answerIncomingCall = async () => {
    setConnecting(true);
    setErrorMessage('');
    const audioOnly = incomingCall?.isAudioOnly || false;
    setIsAudioOnly(audioOnly);

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: !audioOnly ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        setIsAudioOnly(true);
      }

      localStreamRef.current = stream;
      setInCall(true);

      if (pendingOfferRef.current) {
        await acceptOffer(pendingOfferRef.current.offer, pendingOfferRef.current.fromSocketId);
      } else if (incomingCall?.fromSocketId) {
        const pc = createPeerConnection(incomingCall.fromSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const socket = getSocket();
        socket?.emit('webrtc:offer', {
          roomId,
          offer,
          targetSocketId: incomingCall.fromSocketId,
        });
        setIncomingCall(null);
      }
    } catch (err) {
      console.error('Error answering call:', err);
      setErrorMessage('Could not open camera or microphone: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  // Reject incoming call
  const rejectIncomingCall = () => {
    const socket = getSocket();
    socket?.emit('webrtc:reject_call', {
      targetSocketId: incomingCall?.fromSocketId,
      roomId,
    });
    setIncomingCall(null);
    pendingOfferRef.current = null;
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (!inCall) return;

    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setErrorMessage('Screen sharing is not supported by this browser on this device.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      const screenTrack = screenStream.getVideoTracks()[0];

      // Update local preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        localVideoRef.current.play().catch(() => {});
      }

      // Replace track on peer connection
      const pc = peerConnectionRef.current;
      if (pc) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        } else {
          pc.addTrack(screenTrack, screenStream);
        }
      }

      const socket = getSocket();
      socket?.emit('webrtc:screen_status', { roomId, isScreenSharing: true });

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setErrorMessage('Failed to share screen: ' + err.message);
        setTimeout(() => setErrorMessage(''), 4000);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    setIsScreenSharing(false);

    // Revert back to camera track
    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const pc = peerConnectionRef.current;
      if (pc && cameraTrack) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
      }
      if (localVideoRef.current && cameraTrack) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
    }

    const socket = getSocket();
    socket?.emit('webrtc:screen_status', { roomId, isScreenSharing: false });
  };

  const toggleFullscreen = (target = 'all') => {
    if (fullscreenMode === target) {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        try {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        } catch (e) {}
      }
      setFullscreenMode(null);
    } else {
      setFullscreenMode(target);
      let el = null;
      if (target === 'all') el = containerRef.current;
      else if (target === 'local') el = localCardRef.current;
      else if (target === 'remote') el = remoteCardRef.current;

      if (el) {
        try {
          if (el.requestFullscreen) {
            el.requestFullscreen().catch(() => {});
          } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
          }
        } catch (e) {}
      }
    }
  };

  const leaveCall = () => {
    if (fullscreenMode) {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        try {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        } catch (e) {}
      }
      setFullscreenMode(null);
    }

    stopScreenShare();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {}
      peerConnectionRef.current = null;
    }

    const socket = getSocket();
    socket?.emit('webrtc:leave', { roomId });

    setInCall(false);
    setHasRemoteUser(false);
    setPartnerScreenSharing(false);
    setMicMuted(false);
    setCameraOff(false);
    setIncomingCall(null);
    queuedCandidatesRef.current = [];
    pendingOfferRef.current = null;
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-graphite)',
        borderRadius: fullscreenMode === 'all' ? 0 : 'var(--radius-card)', // 24px
        border: fullscreenMode === 'all' ? 'none' : '1px solid var(--color-hairline)',
        overflow: 'hidden',
        padding: fullscreenMode === 'all' ? '1.5rem' : '1.25rem',
        position: fullscreenMode === 'all' ? 'fixed' : 'relative',
        ...(fullscreenMode === 'all' ? {
          inset: 0,
          zIndex: 9999,
          width: '100vw',
          height: '100vh',
          background: '#0a0a0a',
        } : {}),
      }}
    >
      {/* Floating Exit Fullscreen Button when any full screen mode is active */}
      {fullscreenMode && (
        <button
          onClick={() => toggleFullscreen(fullscreenMode)}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(22, 22, 22, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--color-hairline)',
            color: 'var(--color-bone)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          }}
          title="Exit full screen (or press Esc)"
        >
          <span>✕</span>
          <span>Exit Full Screen</span>
        </button>
      )}
      {/* Incoming Call Ringing Modal Alert */}
      {incomingCall && !inCall && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: 'var(--k1)',
            border: '1px solid var(--line)',
            borderRadius: 24,
            padding: '2.5rem 2rem',
            maxWidth: 380,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 40px 120px rgba(255, 255, 255, 0.05)',
          }}>
            {/* Outlined Partner Avatar pulsing once per second */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              background: incomingCall.fromAvatar ? `url(${incomingCall.fromAvatar}) center/cover` : 'transparent',
              border: '2px solid var(--w)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              color: 'var(--w)',
              fontWeight: 500,
              animation: 'pulseRing 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite',
            }}>
              {!incomingCall.fromAvatar && (incomingCall.fromUsername?.[0]?.toUpperCase() || 'P')}
            </div>

            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: 500,
              color: 'var(--w)',
              marginBottom: '0.4rem',
              letterSpacing: '-0.035em',
            }}>
              {incomingCall.fromUsername} is calling...
            </h3>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--w2)',
              marginBottom: '2rem',
            }}>
              {incomingCall.isAudioOnly ? 'Incoming voice call' : 'Incoming video call'}
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
              <button
                onClick={answerIncomingCall}
                className="pill"
                style={{
                  flex: 1,
                  padding: '11px',
                  fontSize: '0.875rem',
                }}
              >
                Accept
              </button>
              <button
                onClick={rejectIncomingCall}
                className="pill-ghost"
                style={{
                  flex: 1,
                  padding: '11px',
                  fontSize: '0.875rem',
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '0.85rem',
        marginBottom: '0.85rem',
        borderBottom: '1px solid var(--color-hairline)',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1rem', color: 'var(--accent-violet)' }}>✦</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-dm-sans)',
                fontWeight: 500,
                fontSize: '0.9375rem',
                color: 'var(--color-bone)',
                letterSpacing: '-0.02em',
              }}>
                Encrypted Meeting Call
              </span>
              {inCall && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--success)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)' }} />
                  Live Call
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate)' }}>
              Direct peer encrypted link &middot; Screen share supported
            </span>
          </div>
        </div>

        {/* Start / Leave Call Button */}
        <div>
          {!inCall ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => startCall(false, false)}
                disabled={connecting}
                className="btn-dimension-primary"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.8125rem',
                }}
              >
                <span>📹</span>
                <span>{connecting ? 'Connecting...' : 'Start Video Call'}</span>
              </button>
              <button
                onClick={() => startCall(false, true)}
                disabled={connecting}
                style={{
                  padding: '0.5rem 1.1rem',
                  borderRadius: 'var(--radius-pill)',
                  background: '#1a1a1a',
                  border: '1px solid var(--color-hairline)',
                  color: 'var(--color-bone)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                }}
                title="Share your screen directly with attendees"
              >
                <span>🖥️</span>
                <span>Share Screen</span>
              </button>
              <button
                onClick={() => startCall(true, false)}
                disabled={connecting}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-pill)',
                  background: '#1a1a1a',
                  border: '1px solid var(--color-hairline)',
                  color: 'var(--color-ash)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                title="Voice call without camera"
              >
                🎙️ Voice Only
              </button>
            </div>
          ) : (
            <button
              onClick={leaveCall}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--danger)',
                color: '#fff',
                fontWeight: 500,
                border: 'none',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              End Call
            </button>
          )}
        </div>
      </div>

      {/* Error / Alert Notice */}
      {errorMessage && (
        <div style={{
          padding: '0.65rem 0.95rem',
          borderRadius: 'var(--radius-ui)',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#f87171',
          fontSize: '0.8125rem',
          marginBottom: '0.75rem',
          lineHeight: 1.45,
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Video Windows Viewports */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: hasRemoteUser ? '1fr 1fr' : '1fr',
        gap: '0.85rem',
        minHeight: 280,
      }}>
        {/* Local Participant Card */}
        <div
          ref={localCardRef}
          style={{
            position: fullscreenMode === 'local' ? 'fixed' : 'relative',
            ...(fullscreenMode === 'local' ? {
              inset: 0,
              zIndex: 10000,
              width: '100vw',
              height: '100vh',
              borderRadius: 0,
              background: '#000',
            } : {
              background: 'var(--color-void-canvas)', // #0a0a0a
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
              border: '1px solid var(--color-hairline)',
            }),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {inCall && ((!isAudioOnly && !cameraOff) || isScreenSharing) ? (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                ref={(el) => {
                  localVideoRef.current = el;
                  const activeStream = isScreenSharing && screenStreamRef.current
                    ? screenStreamRef.current
                    : localStreamRef.current;
                  if (el && activeStream && el.srcObject !== activeStream) {
                    el.srcObject = activeStream;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  e.target.play().catch(() => {});
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: isScreenSharing ? 'contain' : 'cover',
                  transform: isScreenSharing ? 'none' : 'scaleX(-1)', // Mirror camera only
                }}
              />

              {/* Floating Live Screen Sharing Badge */}
              {isScreenSharing && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(22, 22, 22, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid var(--color-hairline)',
                    color: 'var(--color-bone)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    zIndex: 10,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                  <span>Your Screen (Live Preview)</span>
                </div>
              )}

              {/* Picture-in-Picture Camera Thumbnail when user is sharing screen */}
              {isScreenSharing && !cameraOff && !isAudioOnly && localStreamRef.current && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 48,
                    right: 12,
                    width: 140,
                    height: 90,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    background: '#0a0a0a',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
                    zIndex: 15,
                  }}
                  title="Your camera preview"
                >
                  <video
                    ref={(el) => {
                      if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                        el.srcObject = localStreamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 6,
                      fontSize: '0.625rem',
                      color: 'var(--color-bone)',
                      background: 'rgba(0,0,0,0.65)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Camera
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-slate)' }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: user?.avatar ? `url(${user.avatar}) center/cover` : '#1c1c1c',
                border: '1px solid var(--color-hairline)',
                margin: '0 auto 0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-bone)',
                fontSize: '1.5rem',
                fontWeight: 500,
              }}>
                {!user?.avatar && (user?.username?.[0]?.toUpperCase() || 'You')}
              </div>
              <p style={{ fontWeight: 500, fontSize: '0.9375rem', color: 'var(--color-bone)' }}>
                {user?.username} (You)
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate)', marginTop: '0.2rem' }}>
                {inCall ? (cameraOff ? 'Camera turned off' : 'Voice connected') : 'Click "Start Video Call" to begin'}
              </p>
            </div>
          )}

          {/* Fullscreen Preview button on local card */}
          {inCall && (!cameraOff || isScreenSharing) && (
            <button
              onClick={() => toggleFullscreen('local')}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(22, 22, 22, 0.78)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--color-hairline)',
                color: 'var(--color-bone)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
              title={fullscreenMode === 'local' ? 'Exit preview full screen' : 'Expand preview to full screen'}
            >
              <span>{fullscreenMode === 'local' ? '🗗' : '⛶'}</span>
              <span>{isScreenSharing ? (fullscreenMode === 'local' ? 'Exit Preview' : 'Fullscreen Preview') : (fullscreenMode === 'local' ? 'Exit' : 'Fullscreen')}</span>
            </button>
          )}

          {inCall && (
            <div style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              background: 'rgba(22, 22, 22, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.75rem',
              color: 'var(--color-bone)',
              border: '1px solid var(--color-hairline)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <span>You</span>
              {isScreenSharing && <span style={{ color: 'var(--accent-violet)' }}>🖥️ Screen (Sharing)</span>}
              {micMuted && <span>🔇</span>}
              {cameraOff && !isScreenSharing && <span>🚫</span>}
            </div>
          )}
        </div>

        {/* Remote Partner Card */}
        {hasRemoteUser ? (
          <div
            ref={remoteCardRef}
            style={{
              position: fullscreenMode === 'remote' ? 'fixed' : 'relative',
              ...(fullscreenMode === 'remote' ? {
                inset: 0,
                zIndex: 10000,
                width: '100vw',
                height: '100vh',
                borderRadius: 0,
                background: '#000',
              } : {
                background: 'var(--color-void-canvas)',
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
                border: '1px solid var(--color-hairline)',
              }),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={(el) => {
                if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                  el.srcObject = remoteStreamRef.current;
                  el.play().catch(() => {});
                }
                remoteVideoRef.current = el;
              }}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: partnerScreenSharing ? 'contain' : 'cover',
              }}
            />

            {/* Fullscreen Button for Partner Stream / Screen Share */}
            <button
              onClick={() => toggleFullscreen('remote')}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(22, 22, 22, 0.78)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--color-hairline)',
                color: 'var(--color-bone)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
              title={fullscreenMode === 'remote' ? 'Exit full screen' : (partnerScreenSharing ? 'View screen share in full screen' : 'View attendee in full screen')}
            >
              <span>{fullscreenMode === 'remote' ? '🗗' : '⛶'}</span>
              <span>{partnerScreenSharing ? (fullscreenMode === 'remote' ? 'Exit Full Screen' : 'Full Screen Share') : (fullscreenMode === 'remote' ? 'Exit Full Screen' : 'Full Screen')}</span>
            </button>

            {/* PiP (Picture in Picture) of local user when partner is fullscreen */}
            {fullscreenMode === 'remote' && inCall && !cameraOff && !isAudioOnly && (
              <div style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                width: 190,
                height: 118,
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
                zIndex: 20,
                background: '#161616',
              }}>
                <video
                  ref={(el) => {
                    if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                      el.srcObject = isScreenSharing && screenStreamRef.current ? screenStreamRef.current : localStreamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: isScreenSharing ? 'contain' : 'cover',
                    transform: isScreenSharing ? 'none' : 'scaleX(-1)',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 6,
                  background: 'rgba(0,0,0,0.7)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.6875rem',
                  color: 'var(--color-bone)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  You {isScreenSharing ? '(Screen)' : ''}
                </span>
              </div>
            )}

            <div style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              background: 'rgba(22, 22, 22, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.75rem',
              color: 'var(--color-bone)',
              border: '1px solid var(--color-hairline)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <span>{remoteUsername} ✦</span>
              {partnerScreenSharing && <span style={{ color: 'var(--accent-violet)' }}>🖥️ Sharing Screen</span>}
            </div>
          </div>
        ) : inCall ? (
          <div style={{
            background: 'var(--color-void-canvas)',
            borderRadius: 'var(--radius-card)',
            border: '1px dashed var(--color-hairline)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.7 }}>✉️</div>
            <p style={{ fontWeight: 500, fontSize: '0.9375rem', color: 'var(--color-bone)' }}>
              Ringing {remoteUsername}...
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate)', marginTop: '0.35rem', maxWidth: 280 }}>
              Attendee will see an incoming call alert with Accept and Decline buttons on their screen.
            </p>
          </div>
        ) : null}
      </div>

      {/* Floating Call & Screen Share Controls Bar */}
      {inCall && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.65rem',
          paddingTop: '0.85rem',
          marginTop: '0.85rem',
          borderTop: '1px solid var(--color-hairline)',
        }}>
          {/* Mute/Unmute */}
          <button
            onClick={toggleMic}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: 'var(--radius-pill)',
              background: micMuted ? 'rgba(239, 68, 68, 0.15)' : '#1a1a1a',
              border: `1px solid ${micMuted ? 'rgba(239, 68, 68, 0.4)' : 'var(--color-hairline)'}`,
              color: micMuted ? '#f87171' : 'var(--color-bone)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            {micMuted ? '🔇 Unmute' : '🎙️ Mute'}
          </button>

          {/* Camera On/Off */}
          {!isAudioOnly && !isScreenSharing && (
            <button
              onClick={toggleCamera}
              style={{
                padding: '0.5rem 1.15rem',
                borderRadius: 'var(--radius-pill)',
                background: cameraOff ? 'rgba(239, 68, 68, 0.15)' : '#1a1a1a',
                border: `1px solid ${cameraOff ? 'rgba(239, 68, 68, 0.4)' : 'var(--color-hairline)'}`,
                color: cameraOff ? '#f87171' : 'var(--color-bone)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              {cameraOff ? '📷 Camera On' : '🚫 Camera Off'}
            </button>
          )}

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-pill)',
              background: isScreenSharing ? 'var(--color-snow-white)' : '#1a1a1a',
              border: isScreenSharing ? '1px solid var(--color-snow-white)' : '1px solid var(--color-hairline)',
              color: isScreenSharing ? 'var(--color-graphite)' : 'var(--color-bone)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share your device screen with attendees'}
          >
            <span>🖥️</span>
            <span>{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
          </button>

          {/* Full Screen Call Toggle */}
          <button
            onClick={() => toggleFullscreen('all')}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: 'var(--radius-pill)',
              background: fullscreenMode === 'all' ? 'var(--color-snow-white)' : '#1a1a1a',
              border: fullscreenMode === 'all' ? '1px solid var(--color-snow-white)' : '1px solid var(--color-hairline)',
              color: fullscreenMode === 'all' ? 'var(--color-graphite)' : 'var(--color-bone)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
            title={fullscreenMode === 'all' ? 'Exit full screen call' : 'View entire call in full screen'}
          >
            <span>{fullscreenMode === 'all' ? '🗗' : '⛶'}</span>
            <span>{fullscreenMode === 'all' ? 'Exit Full Screen' : 'Full Screen Call'}</span>
          </button>

          {/* Hang Up Button */}
          <button
            onClick={leaveCall}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--danger)',
              border: 'none',
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
