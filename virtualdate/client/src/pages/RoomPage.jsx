import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';
import api from '../services/api';

import ActivityTabs from '../components/room/ActivityTabs';
import ChatBox from '../components/chat/ChatBox';
import VideoGrid from '../components/call/VideoGrid';
import UniversalVideoPlayer from '../components/movie/UniversalVideoPlayer';
import MusicPlayer from '../components/music/MusicPlayer';
import Whiteboard from '../components/whiteboard/Whiteboard';
import GameRoom from '../components/games/GameRoom';
import QRCodeModal from '../components/room/QRCodeModal';
import HeroField from '../components/HeroField';

const REACTION_EMOJIS = ['⚡', '✦', '☾', '❋', '◌', '✧'];

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, token, guestLogin } = useAuthStore();
  const {
    room,
    setRoom,
    participants,
    setParticipants,
    messages,
    addMessage,
    currentActivity,
    setCurrentActivity,
    clearRoom,
  } = useRoomStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pipVideoOpen, setPipVideoOpen] = useState(false);
  const [desktopChatOpen, setDesktopChatOpen] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [syncWithPartner, setSyncWithPartner] = useState(true);
  const [activityNotice, setActivityNotice] = useState('');

  // Ref to hold syncWithPartner state so toggling doesn't re-trigger socket teardown
  const syncWithPartnerRef = useRef(syncWithPartner);
  useEffect(() => {
    syncWithPartnerRef.current = syncWithPartner;
  }, [syncWithPartner]);

  // Password & Guest Entry states
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');
  const [isJoiningGuest, setIsJoiningGuest] = useState(false);

  // Floating Reaction Pulses
  const [particles, setParticles] = useState([]);

  // Session Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Step 1: Fetch Room Metadata & Handle Unauthenticated Guests
  useEffect(() => {
    let mounted = true;

    const checkRoom = async () => {
      try {
        const { data } = await api.get(`/rooms/${roomId}`);
        if (!mounted) return;
        setRoom(data);

        // Check password protection
        if (data.hasPassword && (!user || user._id !== data.createdBy?._id)) {
          const unlockedKey = `unlocked_${roomId}`;
          const isUnlocked = sessionStorage.getItem(unlockedKey) === 'true';
          if (!isUnlocked) {
            setNeedsPassword(true);
            setLoading(false);
            return;
          }
        }

        // If visitor not logged in, prompt guest entry
        if (!user || !token) {
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'Meeting room not found');
          setLoading(false);
        }
      }
    };

    checkRoom();

    return () => {
      mounted = false;
    };
  }, [roomId, user, token, setRoom]);

  // Step 2: Establish Socket Connection
  useEffect(() => {
    if (!token || needsPassword || loading || error) return;

    const socket = initSocket(token);

    socket.emit('room:join', { roomId });

    socket.on('room:participants', ({ participants }) => {
      setParticipants(participants);
    });

    socket.on('chat:receive', (msg) => {
      if (msg) addMessage(msg);
    });

    // Real-time Activity Sync: when partner switches activity
    socket.on('room:activity_change', ({ activity, username }) => {
      setActivityNotice(`${username} opened ${activity} ✦`);
      setTimeout(() => setActivityNotice(''), 3500);

      if (syncWithPartnerRef.current) {
        setCurrentActivity(activity);
      }
    });

    // Real-time Reaction Particles
    socket.on('room:reaction', ({ emoji }) => {
      spawnParticle(emoji);
    });

    return () => {
      socket.emit('room:leave', { roomId });
      disconnectSocket();
      clearRoom();
    };
  }, [roomId, token, needsPassword, loading, error, setParticipants, addMessage, setCurrentActivity, clearRoom]);

  // Handle Guest Entry
  const handleGuestJoin = async (e) => {
    e?.preventDefault();
    setIsJoiningGuest(true);
    setPasswordError('');

    if (needsPassword) {
      try {
        const res = await api.post(`/rooms/${roomId}/verify-password`, { password: passwordInput });
        if (res.data.success) {
          sessionStorage.setItem(`unlocked_${roomId}`, 'true');
          setNeedsPassword(false);
        }
      } catch (err) {
        setPasswordError('Incorrect room password');
        setIsJoiningGuest(false);
        return;
      }
    }

    if (!user || !token) {
      const result = await guestLogin(guestNameInput || 'Colleague');
      if (!result.success) {
        setPasswordError('Failed to join as guest');
        setIsJoiningGuest(false);
        return;
      }
    }

    setIsJoiningGuest(false);
  };

  const handleSelectActivity = (activity) => {
    setCurrentActivity(activity);
    const socket = getSocket();
    socket?.emit('room:activity_change', { roomId, activity });
  };

  const spawnParticle = (emoji) => {
    const id = Date.now() + Math.random();
    const left = 20 + Math.random() * 60;
    const newParticle = { id, emoji, left };

    setParticles((prev) => [...prev, newParticle]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 2200);
  };

  const sendReaction = (emoji) => {
    spawnParticle(emoji);
    const socket = getSocket();
    socket?.emit('room:reaction', { roomId, emoji });
  };

  // Screen 1: Loading
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--k)',
        color: 'var(--w2)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--w)' }}>✦</div>
          <p style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--w1)', letterSpacing: '-0.02em' }}>
            Entering room...
          </p>
        </div>
      </div>
    );
  }

  // Screen 2: Error
  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--k)',
        padding: '1.5rem',
      }}>
        <div style={{
          textAlign: 'center',
          background: 'var(--k1)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: '2.5rem',
          maxWidth: 420,
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--w3)' }}>✕</div>
          <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 500,
            marginBottom: '0.5rem',
            color: 'var(--w)',
            letterSpacing: '-0.03em',
          }}>
            Room Unavailable
          </h2>
          <p style={{ color: 'var(--w2)', marginBottom: '1.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="pill"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Screen 3: Guest Entry / Password Protection Screen (Section 10)
  if (needsPassword || (!user && !token)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background swirling partner lights */}
        <HeroField densityMultiplier={0.35} interactive={false} />

        <div style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--k1)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: '2.5rem 2rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 40px 120px rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--w)' }}>
            {needsPassword ? '🔒' : '☾'}
          </div>

          <h2 style={{
            fontSize: '1.65rem',
            fontWeight: 500,
            color: 'var(--w)',
            letterSpacing: '-0.04em',
            marginBottom: '0.4rem',
          }}>
            {room?.name || 'Meeting Room'}
          </h2>

          <p style={{
            color: 'var(--w2)',
            fontSize: '0.875rem',
            marginBottom: '1.75rem',
            lineHeight: 1.5,
          }}>
            {needsPassword
              ? 'This meeting room is protected with a private password.'
              : 'Direct guest entry. No accounts or signup required.'}
          </p>

          <form onSubmit={handleGuestJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!user && (
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--w2)', marginBottom: '0.35rem', display: 'block' }}>
                  Your Display Name
                </label>
                <input
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  placeholder="e.g. Alex Rivera or Jordan"
                  style={{
                    width: '100%',
                    background: 'var(--k2)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: '0.75rem 1rem',
                    color: 'var(--w)',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {needsPassword && (
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--w2)', marginBottom: '0.35rem', display: 'block' }}>
                  Room Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  required
                  style={{
                    width: '100%',
                    background: 'var(--k2)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: '0.75rem 1rem',
                    color: 'var(--w)',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {passwordError && (
              <div style={{
                color: 'var(--w1)',
                fontSize: '0.8125rem',
                padding: '0.65rem',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}>
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={isJoiningGuest}
              className="pill"
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '0.5rem',
                opacity: isJoiningGuest ? 0.7 : 1,
                fontSize: '0.95rem',
              }}
            >
              {isJoiningGuest ? 'Connecting...' : 'Enter the room'}
            </button>
          </form>

          <p className="mono" style={{
            fontSize: '0.75rem',
            color: 'var(--w3)',
            marginTop: '1.75rem',
          }}>
            Direct peer encrypted link &middot; Geist typography
          </p>
        </div>
      </div>
    );
  }

  // Screen 4: Main Active Dimension Workspace
  return (
    <div className="room-container" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--k)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Floating Reaction Particles Overlay */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="floating-particle"
          style={{
            bottom: '75px',
            left: `${p.left}%`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* =========================================================================
          Top Header Bar (Adaptive Desktop vs Mobile)
          ========================================================================= */}
      <header className="mobile-header-bar" style={{
        padding: '0.65rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        zIndex: 20,
        flexShrink: 0,
        background: 'var(--k1)',
        borderBottom: '1px solid var(--line)',
      }}>
        {/* Left: Sanctuary identity & duration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'var(--k2)',
              border: '1px solid var(--line)',
              color: 'var(--w2)',
              padding: '0.35rem 0.75rem',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 500,
              flexShrink: 0,
            }}
            title="Exit Room"
          >
            ← Exit
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <h2 style={{
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--w)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '160px',
              }}>
                {room?.name || 'Meeting Room'}
              </h2>
              {room?.hasPassword && <span style={{ fontSize: '0.75rem' }} title="Password Protected">🔒</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6875rem', color: 'var(--w3)' }}>
              <span className="mono" style={{ color: 'var(--w2)' }}>
                {formatTime(elapsedSeconds)}
              </span>
              <span>&bull;</span>
              <span className="mono" style={{ color: participants.length > 1 ? 'var(--w)' : 'var(--w3)' }}>
                {participants.length} online
              </span>
            </div>
          </div>
        </div>

        {/* Center: Signature Dimension Activity Switcher Pill (Desktop Only) */}
        <div className="desktop-activity-nav">
          <ActivityTabs
            currentActivity={currentActivity}
            onSelectActivity={handleSelectActivity}
          />
        </div>

        {/* Right Actions: Desktop & Mobile responsive splits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          {/* Desktop Only: Partner Sync Toggle */}
          <button
            onClick={() => setSyncWithPartner(!syncWithPartner)}
            className="desktop-only"
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 999,
              background: syncWithPartner ? 'var(--glass)' : 'var(--k2)',
              border: `1px solid ${syncWithPartner ? 'var(--w)' : 'var(--line)'}`,
              color: syncWithPartner ? 'var(--w)' : 'var(--w3)',
              fontSize: '0.75rem',
              fontWeight: 500,
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
            }}
            title="When synced, switching activity tabs changes both screens"
          >
            <span>🔗</span>
            <span>{syncWithPartner ? 'Synced' : 'Solo'}</span>
          </button>

          {/* Floating Cam Toggle (Desktop) */}
          {currentActivity !== 'call' && (
            <button
              onClick={() => setPipVideoOpen(!pipVideoOpen)}
              className="desktop-only"
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 999,
                background: pipVideoOpen ? 'var(--k3)' : 'var(--k2)',
                border: '1px solid var(--line)',
                color: pipVideoOpen ? 'var(--w)' : 'var(--w2)',
                fontSize: '0.75rem',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
              title="Mini Floating Camera"
            >
              <span>📹</span>
              <span>{pipVideoOpen ? 'Hide Cam' : 'Floating Cam'}</span>
            </button>
          )}

          {/* Desktop Only: Toggle Chat Sidebar (Theater Mode) */}
          <button
            onClick={() => setDesktopChatOpen(!desktopChatOpen)}
            className="desktop-only"
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 999,
              background: desktopChatOpen ? 'var(--k2)' : 'var(--glass)',
              border: `1px solid ${desktopChatOpen ? 'var(--line)' : 'var(--w)'}`,
              color: desktopChatOpen ? 'var(--w2)' : 'var(--w)',
              fontSize: '0.75rem',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
            }}
            title={desktopChatOpen ? 'Collapse chat sidebar (Theater Mode)' : 'Expand chat sidebar'}
          >
            <span>💬</span>
            <span>{desktopChatOpen ? 'Theater' : 'Chat'}</span>
          </button>

          {/* Mobile Only: Open Chat Drawer button */}
          <button
            onClick={() => setMobileChatOpen(true)}
            className="mobile-only"
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 999,
              background: 'var(--k2)',
              border: '1px solid var(--line)',
              color: 'var(--w1)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
            }}
          >
            <span>💬</span>
            <span className="mono">{messages.length}</span>
          </button>

          {/* QR Code Scan to Join Pill */}
          <button
            onClick={() => setQrModalOpen(true)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: 999,
              background: 'var(--w)',
              color: 'var(--k)',
              border: '1px solid var(--w)',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
            }}
            title="Scan QR Code to join"
          >
            <span>📱</span>
            <span>QR</span>
          </button>
        </div>
      </header>

      {/* Activity Notice Pill */}
      {activityNotice && (
        <div style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 35,
          background: 'var(--k1)',
          border: '1px solid var(--line)',
          backdropFilter: 'blur(8px)',
          color: 'var(--w1)',
          padding: '0.35rem 1.15rem',
          borderRadius: 999,
          fontSize: '0.8125rem',
          fontWeight: 500,
          animation: 'fadeIn 180ms ease-out',
        }}>
          {activityNotice}
        </div>
      )}

      {/* =========================================================================
          Main Stage & Chat Workspace
          ========================================================================= */}
      <main style={{
        flex: 1,
        display: 'flex',
        padding: '0.65rem',
        gap: '0.65rem',
        overflow: 'hidden',
        position: 'relative',
        minHeight: 0,
      }}>
        {/* Main Activity View (Expands to 100% on mobile or when desktop chat is collapsed) */}
        <div style={{
          flex: 1,
          height: '100%',
          minWidth: 0,
          position: 'relative',
        }}>
          {currentActivity === 'movie' && <UniversalVideoPlayer roomId={roomId} />}
          {currentActivity === 'music' && <MusicPlayer roomId={roomId} />}
          {currentActivity === 'whiteboard' && <Whiteboard roomId={roomId} />}
          {currentActivity === 'games' && <GameRoom roomId={roomId} />}
          {currentActivity === 'call' && <VideoGrid roomId={roomId} />}

          {/* Floating Picture-in-Picture Video Grid */}
          {pipVideoOpen && currentActivity !== 'call' && (
            <div style={{
              position: 'absolute',
              bottom: 20,
              right: 16,
              width: window.innerWidth < 768 ? 140 : 280,
              height: window.innerWidth < 768 ? 105 : 200,
              zIndex: 40,
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--line)',
              background: 'var(--k)',
            }}>
              <VideoGrid roomId={roomId} />
            </div>
          )}
        </div>

        {/* Desktop Chat Sidebar (Collapsible in Theater Mode) */}
        {desktopChatOpen && (
          <aside className="chat-sidebar-desktop" style={{
            width: 330,
            height: '100%',
            flexShrink: 0,
          }}>
            <ChatBox roomId={roomId} />
          </aside>
        )}
      </main>

      {/* =========================================================================
          Micro-Interactions Bottom Bar
          ========================================================================= */}
      <footer style={{
        padding: '0.45rem 1.25rem',
        background: 'var(--k1)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 25,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', maxWidth: '100%' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--w3)', marginRight: '0.25rem', whiteSpace: 'nowrap' }}>
            Instant Pulse:
          </span>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              style={{
                background: 'var(--k2)',
                border: '1px solid var(--line)',
                borderRadius: 999,
                padding: '0.25rem 0.6rem',
                fontSize: '0.9375rem',
                color: 'var(--w1)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title={`Send ${emoji} to team`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <span className="desktop-only mono" style={{
          fontSize: '0.7rem',
          color: 'var(--w3)',
        }}>
          ✦ Oedg
        </span>
      </footer>

      {/* =========================================================================
          Mobile Bottom Navigation Bar (Visible on phones & small tablets)
          ========================================================================= */}
      <nav className="mobile-bottom-nav" style={{
        display: 'none',
        background: 'var(--k1)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--line)',
        padding: '0.45rem 0.5rem',
        justifyContent: 'space-around',
        zIndex: 30,
        flexShrink: 0,
      }}>
        {[
          { id: 'movie', label: 'Present', icon: '◫' },
          { id: 'music', label: 'Audio', icon: '♩' },
          { id: 'whiteboard', label: 'Canvas', icon: '✎' },
          { id: 'games', label: 'Arcade', icon: '❖' },
          { id: 'call', label: 'Meeting', icon: '◉' },
        ].map((tab) => {
          const isActive = currentActivity === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectActivity(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.15rem',
                background: isActive ? 'var(--w)' : 'transparent',
                border: 'none',
                borderRadius: 999,
                padding: '0.4rem 0.9rem',
                color: isActive ? 'var(--k)' : 'var(--w3)',
                fontSize: '0.6875rem',
                fontWeight: 500,
                minWidth: 54,
                cursor: 'pointer',
                transition: 'all 140ms ease',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* =========================================================================
          Mobile Chat Bottom Drawer Modal (With slideUp animation)
          ========================================================================= */}
      {mobileChatOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 80,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
          {/* Backdrop click to close */}
          <div
            onClick={() => setMobileChatOpen(false)}
            style={{ flex: 1, width: '100%' }}
          />

          {/* Drawer Body */}
          <div style={{
            height: '82vh',
            maxHeight: '82dvh',
            background: 'var(--k1)',
            borderTop: '1px solid var(--line)',
            borderRadius: '24px 24px 0 0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 220ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {/* Drawer Header Handle */}
            <div style={{
              padding: '0.75rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--line)',
              background: 'var(--k2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--w)', fontSize: '0.9rem' }}>✦</span>
                <span style={{ fontWeight: 500, color: 'var(--w1)', fontSize: '0.9375rem' }}>
                  Meeting Chat
                </span>
              </div>
              <button
                onClick={() => setMobileChatOpen(false)}
                style={{
                  background: 'var(--k3)',
                  border: '1px solid var(--line)',
                  color: 'var(--w)',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              <ChatBox roomId={roomId} />
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for Phone Scan */}
      {qrModalOpen && (
        <QRCodeModal
          roomId={roomId}
          roomName={room?.name}
          hasPassword={room?.hasPassword}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </div>
  );
}
