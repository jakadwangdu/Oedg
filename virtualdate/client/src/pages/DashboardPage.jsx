import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import QRCodeModal from '../components/room/QRCodeModal';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [qrModalRoom, setQrModalRoom] = useState(null);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/rooms', {
        name: roomName.trim(),
        password: roomPassword.trim(),
      });
      navigate(`/room/${data.roomId}`);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Delete this date workspace?')) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms(rooms.filter((r) => r.roomId !== roomId));
    } catch (e) {}
  };

  const copyRoomLink = (roomId) => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-void-canvas)',
      padding: '2.5rem 1.5rem',
      maxWidth: 1040,
      margin: '0 auto',
    }}>
      {/* Top Floating Nav Header Bar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '3rem',
        padding: '0.875rem 1.25rem',
        background: 'var(--color-graphite)',
        border: '1px solid var(--color-hairline)',
        borderRadius: 'var(--radius-pill)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ color: 'var(--accent-violet)', fontSize: '1rem' }}>✦</span>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '1.05rem',
              fontWeight: 500,
              letterSpacing: '-0.025em',
              color: 'var(--color-bone)',
              lineHeight: 1.1,
            }}>
              VirtualDate
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-slate)', letterSpacing: '0.02em' }}>
              Dimension Workspace
            </span>
          </div>
        </div>

        {/* User Identity & Logout */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: user?.avatar ? `url(${user.avatar}) center/cover` : '#222',
              border: '1px solid var(--color-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-bone)',
              fontWeight: 500,
              fontSize: '0.8125rem',
            }}>
              {!user?.avatar && (user?.username?.[0]?.toUpperCase() || '?')}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-bone)', fontWeight: 500 }}>
              {user?.username}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-hairline)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--color-slate)',
              padding: '0.35rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 400,
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div>
        {/* Section Heading & Create CTA */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '1.875rem',
              fontWeight: 500,
              color: 'var(--color-bone)',
              letterSpacing: '-0.035em',
            }}>
              Your Date Sanctuaries
            </h2>
            <p style={{
              fontFamily: 'var(--font-geist)',
              color: 'var(--color-ash)',
              fontSize: '0.875rem',
              marginTop: '0.25rem',
            }}>
              Direct guest access via link or QR code — no registration required for your partner.
            </p>
          </div>

          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-dimension-primary"
            style={{ padding: '0.625rem 1.35rem', fontSize: '0.875rem' }}
          >
            <span>{showCreate ? '✕ Cancel' : '+ New Sanctuary'}</span>
          </button>
        </div>

        {/* Create Room Drawer */}
        {showCreate && (
          <form onSubmit={handleCreate} style={{
            background: 'var(--color-graphite)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--radius-card)', // 24px
            padding: '1.75rem',
            marginBottom: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Workspace name (e.g. Quiet Evening with Bae 🕯️)"
                required
                style={{
                  flex: 2,
                  minWidth: 260,
                  background: '#1a1a1a',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-ui)',
                  padding: '0.75rem 1rem',
                  color: 'var(--color-bone)',
                  fontSize: '0.9375rem',
                }}
              />
              <input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Optional Room Password (leave blank for open access)"
                style={{
                  flex: 1,
                  minWidth: 220,
                  background: '#1a1a1a',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-ui)',
                  padding: '0.75rem 1rem',
                  color: 'var(--color-bone)',
                  fontSize: '0.9375rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={creating}
                className="btn-dimension-primary"
                style={{
                  padding: '0.65rem 1.6rem',
                  fontSize: '0.875rem',
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? 'Creating...' : 'Initialize Sanctuary'}
              </button>
            </div>
          </form>
        )}

        {/* Room Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-slate)' }}>
            <p>Loading workspaces...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            background: 'var(--color-graphite)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--radius-card)', // 24px
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.8 }}>🌙</div>
            <h3 style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: 'var(--color-bone)',
              marginBottom: '0.4rem',
            }}>
              No active rooms yet
            </h3>
            <p style={{
              fontFamily: 'var(--font-geist)',
              color: 'var(--color-ash)',
              fontSize: '0.875rem',
              maxWidth: 380,
              margin: '0 auto 1.75rem',
            }}>
              Create your first private room above. Share the link or QR code with your partner to start streaming cinema or drawing in real time.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-dimension-secondary"
            >
              + Create a Room
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '1.25rem',
          }}>
            {rooms.map((room) => (
              <div
                key={room.roomId}
                style={{
                  background: 'var(--color-graphite)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-card)', // 24px
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <h3 style={{
                        fontFamily: 'var(--font-dm-sans)',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        color: 'var(--color-bone)',
                        lineHeight: 1.25,
                      }}>
                        {room.name}
                      </h3>
                      {room.hasPassword && (
                        <span title="Password Protected" style={{ fontSize: '0.8125rem' }}>🔒</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(room.roomId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-slate)',
                        fontSize: '0.875rem',
                        padding: '0.2rem',
                        cursor: 'pointer',
                      }}
                      title="Delete room"
                    >
                      ✕
                    </button>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--color-slate)',
                    marginTop: '0.5rem',
                  }}>
                    Created {new Date(room.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Card Actions: 9999px pill buttons with hairlines */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link to={`/room/${room.roomId}`} style={{ flex: 1, minWidth: 90 }}>
                    <button style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--color-snow-white)',
                      color: 'var(--color-graphite)',
                      fontWeight: 500,
                      border: '1px solid var(--color-snow-white)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}>
                      Enter Room
                    </button>
                  </Link>

                  <button
                    onClick={() => setQrModalRoom(room)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-pill)',
                      background: '#1a1a1a',
                      border: '1px solid var(--color-hairline)',
                      color: 'var(--color-bone)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                    title="Scan QR Code to join"
                  >
                    <span>📱</span>
                    <span>QR</span>
                  </button>

                  <button
                    onClick={() => copyRoomLink(room.roomId)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: 'var(--radius-pill)',
                      background: '#1a1a1a',
                      border: '1px solid var(--color-hairline)',
                      color: copiedId === room.roomId ? 'var(--success)' : 'var(--color-ash)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                    title="Copy invite link"
                  >
                    {copiedId === room.roomId ? '✓ Copied' : '🔗 Link'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrModalRoom && (
        <QRCodeModal
          roomId={qrModalRoom.roomId}
          roomName={qrModalRoom.name}
          hasPassword={qrModalRoom.hasPassword}
          onClose={() => setQrModalRoom(null)}
        />
      )}
    </div>
  );
}
