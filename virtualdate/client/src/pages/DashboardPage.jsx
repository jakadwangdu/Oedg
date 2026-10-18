import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Plus, X, Trash2, Lock, Copy, Check, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import Logo from '../components/Logo';
import QRCodeModal from '../components/room/QRCodeModal';
import QRScannerModal from '../components/room/QRScannerModal';

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
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'support'
  const [inquiries, setInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

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

  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const inqRes = await api.get('/inquiries/all').catch(() => ({ data: [] }));
      setInquiries(inqRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchInquiries();
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
    if (!window.confirm('Delete this room?')) return;
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
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--k)',
        color: 'var(--w1)',
        padding: '2.5rem 1.5rem',
        maxWidth: 1040,
        margin: '0 auto',
      }}
    >
      {/* Top Floating Nav Header Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '3rem',
          padding: '0.875rem 1.5rem',
          background: 'var(--k1)',
          border: '1px solid var(--line)',
          borderRadius: 999,
          boxShadow: '0 20px 60px rgba(255, 255, 255, 0.03)',
        }}
      >
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Logo size={22} word={true} />
        </Link>

        {/* User Identity & Logout */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link
            to="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--w1)',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: user?.avatar ? `url(${user.avatar}) center/cover` : 'var(--w)',
                color: 'var(--k)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              {!user?.avatar && (user?.username?.[0]?.toUpperCase() || 'Y')}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {user?.username}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="pill-ghost"
            style={{
              padding: '6px 14px',
              fontSize: 12,
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Sub-nav Tab Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '2.5rem',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('rooms')}
          style={{
            background: activeTab === 'rooms' ? 'var(--k2)' : 'transparent',
            border: activeTab === 'rooms' ? '1px solid var(--line)' : '1px solid transparent',
            color: activeTab === 'rooms' ? 'var(--w)' : 'var(--w3)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '7px 18px',
            borderRadius: 999,
            transition: 'all 0.2s',
          }}
        >
          Workspaces ({rooms.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('support');
            fetchInquiries();
          }}
          style={{
            background: activeTab === 'support' ? 'var(--k2)' : 'transparent',
            border: activeTab === 'support' ? '1px solid var(--line)' : '1px solid transparent',
            color: activeTab === 'support' ? 'var(--w)' : 'var(--w3)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '7px 18px',
            borderRadius: 999,
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>💬</span>
          <span>Help & Support Tickets</span>
          {inquiries.length > 0 && (
            <span
              style={{
                background: 'var(--w)',
                color: 'var(--k)',
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              {inquiries.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ROOMS WORKSPACE */}
      {activeTab === 'rooms' && (
      <div>
        {/* Section Heading & Create CTA */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', marginBottom: '0.35rem' }}>
              WORKSPACES
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                fontWeight: 500,
                color: 'var(--w)',
                letterSpacing: '-0.04em',
              }}
            >
              Your meeting rooms
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setQrScannerOpen(true)}
              className="pill-ghost"
              style={{ padding: '9px 18px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <QrCode size={14} strokeWidth={1.75} />
              <span>Scan QR</span>
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="pill"
              style={{ padding: '10px 22px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              {showCreate ? (
                <>
                  <X size={14} strokeWidth={2} />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus size={14} strokeWidth={2} />
                  <span>Create room</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Create Room Drawer */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            style={{
              background: 'var(--k1)',
              border: '1px solid var(--line)',
              borderRadius: 24,
              padding: '2rem',
              marginBottom: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 30px 80px rgba(255, 255, 255, 0.04)',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name (e.g. Product Architecture Sprint, Weekly Standup)"
                required
                style={{
                  flex: 2,
                  minWidth: 260,
                  background: 'var(--k2)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '0.85rem 1.1rem',
                  color: 'var(--w)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Optional password (leave blank for open access)"
                style={{
                  flex: 1,
                  minWidth: 220,
                  background: 'var(--k2)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '0.85rem 1.1rem',
                  color: 'var(--w)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={creating}
                className="pill"
                style={{
                  padding: '11px 26px',
                  fontSize: '0.9rem',
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? 'Creating...' : 'Create room'}
              </button>
            </div>
          </form>
        )}

        {/* Room Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--w3)' }}>
            <p className="mono">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 2rem',
              background: 'var(--k1)',
              border: '1px solid var(--line)',
              borderRadius: 24,
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✦</div>
            <h3
              style={{
                fontSize: '1.35rem',
                fontWeight: 500,
                color: 'var(--w)',
                marginBottom: '0.5rem',
              }}
            >
              No active rooms yet
            </h3>
            <p
              style={{
                color: 'var(--w2)',
                fontSize: '0.9rem',
                maxWidth: 440,
                margin: '0 auto 2rem',
                lineHeight: 1.5,
              }}
            >
              Create your first quiet workspace above. Share the link or QR code with your team or clients to run focused meetings, brainstorm on canvas, and collaborate in real time.
            </p>
            <button onClick={() => setShowCreate(true)} className="pill">
              + Create a room
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {rooms.map((room) => (
              <div
                key={room.roomId}
                style={{
                  background: 'var(--k1)',
                  border: '1px solid var(--line)',
                  borderRadius: 24,
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
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 500,
                          color: 'var(--w)',
                          lineHeight: 1.25,
                        }}
                      >
                        {room.name}
                      </h3>
                      {room.hasPassword && (
                        <span title="Password Protected" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <Lock size={12} strokeWidth={2} style={{ color: 'var(--w3)' }} />
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(room.roomId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--w3)',
                        fontSize: '0.9rem',
                        padding: '0.2rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                      title="Delete room"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                  <p
                    className="mono"
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--w3)',
                      marginTop: '0.5rem',
                    }}
                  >
                    Created {new Date(room.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link to={`/room/${room.roomId}`} style={{ flex: 1, minWidth: 90 }}>
                    <button
                      className="pill"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.8125rem',
                      }}
                    >
                      Enter room
                    </button>
                  </Link>

                  <button
                    onClick={() => setQrModalRoom(room)}
                    className="pill-ghost"
                    style={{
                      padding: '9px 12px',
                      fontSize: '0.8125rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Scan QR Code to join"
                  >
                    <QrCode size={13} strokeWidth={1.75} />
                    <span>QR</span>
                  </button>

                  <button
                    onClick={() => copyRoomLink(room.roomId)}
                    className="pill-ghost"
                    style={{
                      padding: '9px 12px',
                      fontSize: '0.8125rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Copy invite link"
                  >
                    {copiedId === room.roomId ? (
                      <>
                        <Check size={13} strokeWidth={2} style={{ color: '#10b981' }} />
                        <span style={{ color: '#10b981' }}>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} strokeWidth={1.75} />
                        <span>Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* TAB 2: HELP & SUPPORT TICKETS VIEW */}
      {activeTab === 'support' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.35rem' }}>
                User Support Tickets ({inquiries.length})
              </h3>
              <p style={{ color: 'var(--w2)', fontSize: '0.875rem', margin: 0 }}>
                Questions and assistance requests submitted via the help portal.
              </p>
            </div>
            <button
              onClick={fetchInquiries}
              className="pill-ghost"
              style={{ padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}
            >
              {loadingInquiries ? 'Refreshing...' : '🔄 Refresh Tickets'}
            </button>
          </div>

          {loadingInquiries ? (
            <div style={{ color: 'var(--w3)', textAlign: 'center', padding: '3rem 0' }}>
              Loading tickets...
            </div>
          ) : inquiries.length === 0 ? (
            <div
              style={{
                background: 'var(--k1)',
                border: '1px solid var(--line)',
                borderRadius: 20,
                padding: '3rem 1.5rem',
                textAlign: 'center',
                color: 'var(--w3)',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.25rem' }}>
                No support tickets yet
              </h4>
              <p style={{ color: 'var(--w3)', fontSize: '0.85rem', margin: 0 }}>
                When users or team members submit a help ticket, it will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {inquiries.map((inq) => (
                <div
                  key={inq._id}
                  style={{
                    background: 'var(--k1)',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'var(--w)',
                      }}
                    >
                      SUPPORT TICKET
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--w3)' }}>
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ fontWeight: 500, color: 'var(--w)', fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {inq.name} &lt;{inq.email}&gt;
                  </div>

                  {inq.category && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--w3)', marginBottom: '0.5rem' }}>
                      Category: {inq.category}
                    </div>
                  )}

                  <p style={{ color: 'var(--w2)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                    "{inq.message}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {qrModalRoom && (
        <QRCodeModal
          roomId={qrModalRoom.roomId}
          roomName={qrModalRoom.name}
          hasPassword={qrModalRoom.hasPassword}
          onClose={() => setQrModalRoom(null)}
        />
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
      />
    </div>
  );
}
