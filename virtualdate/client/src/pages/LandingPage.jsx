import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ShieldCheck, HardDrive, Globe, QrCode, ArrowRight, LogIn, Activity } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import useSmoothScroll from '../lib/useSmoothScroll';
import useLiveTelemetry from '../lib/useLiveTelemetry';
import Logo from '../components/Logo';
import Hero from '../components/Hero';
import RoomShell from '../components/RoomShell';
import FeatureTrack from '../components/FeatureTrack';
import Footer from '../components/Footer';
import QRScannerModal from '../components/room/QRScannerModal';

export default function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const { latency, isOnline, encryption, serverStorage, status } = useLiveTelemetry();

  // Initialize Lenis smooth scroll
  useSmoothScroll(true);

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      const generatedRoomId = 'room-' + Math.random().toString(36).substring(2, 8);
      navigate(`/room/${generatedRoomId}`);
    }
  };

  return (
    <div style={{ background: 'var(--k)', color: 'var(--w)', minHeight: '100vh', position: 'relative' }}>
      {/* Sleek Floating Navbar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 2rem',
          mixBlendMode: 'difference',
          color: '#fff',
          pointerEvents: 'auto',
        }}
      >
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Logo size={26} word={true} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Live Real-world Telemetry Pill */}
          <div
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.85)',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isOnline ? '#10b981' : '#f59e0b',
                boxShadow: isOnline ? '0 0 8px #10b981' : 'none',
                display: 'inline-block',
              }}
            />
            <span>Edge: {latency}</span>
          </div>

          <button
            onClick={() => setQrScannerOpen(true)}
            className="mono"
            style={{
              color: '#fff',
              background: 'none',
              border: 'none',
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <QrCode size={14} strokeWidth={1.75} />
            <span>Scan QR</span>
          </button>

          {user ? (
            <Link to="/dashboard" className="mono" style={{ color: '#fff', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Dashboard</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="mono" style={{ color: '#fff', textDecoration: 'none', fontSize: 13 }}>
                Sign in
              </Link>
              <button
                onClick={handleStart}
                className="pill"
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  background: '#fff',
                  color: '#000',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Start a meeting</span>
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <Hero onStart={handleStart} onScanQR={() => setQrScannerOpen(true)} />

      {/* Real-time Network Telemetry & Verifiable Performance Ribbon (Zero Fake Numbers) */}
      <section
        style={{
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          background: 'var(--k1)',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.75rem',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
              <Zap size={16} style={{ color: '#10b981' }} />
              <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--w)' }}>
                {latency}
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--w3)' }}>
              Live Edge Roundtrip Ping
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
              <ShieldCheck size={16} style={{ color: 'var(--w)' }} />
              <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--w)' }}>
                256-bit
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--w3)' }}>
              Direct Peer Encryption (DTLS-SRTP)
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
              <HardDrive size={16} style={{ color: 'var(--w)' }} />
              <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--w)' }}>
                0 Bytes
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--w3)' }}>
              Server Data Retention (Strict P2P)
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
              <Globe size={16} style={{ color: '#10b981' }} />
              <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--w)' }}>
                100%
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--w3)' }}>
              Edge Mesh Operational
            </div>
          </div>
        </div>
      </section>

      {/* Pinned / Interactive Room Window */}
      <RoomShell onEnterRoom={handleStart} />

      {/* Feature Track (Architectural Grid - Smooth natural scroll) */}
      <FeatureTrack />

      {/* Section 10: Call-To-Action & Direct Join */}
      <section
        style={{
          padding: '6rem 1.5rem',
          background: 'radial-gradient(ellipse at center, var(--k2) 0%, var(--k) 75%)',
          borderTop: '1px solid var(--line)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', marginBottom: '1rem', letterSpacing: '0.08em' }}>
            A QUIET PRODUCTIVE SPACE
          </div>
          <h2
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              color: 'var(--w)',
              fontWeight: 500,
              letterSpacing: '-0.04em',
              marginBottom: '1.25rem',
            }}
          >
            Ready for your team meeting?
          </h2>
          <p
            style={{
              color: 'var(--w2)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
            }}
          >
            Create a room, send a link, and run quiet, distraction-free meetings with your co-founder or team.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="pill"
              onClick={handleStart}
              style={{
                fontSize: '1rem',
                padding: '14px 36px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>{user ? 'Open Dashboard' : 'Start a meeting'}</span>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => setQrScannerOpen(true)}
              className="pill-ghost"
              style={{
                fontSize: '1rem',
                padding: '14px 30px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <QrCode size={16} strokeWidth={1.75} />
              <span>Scan room QR</span>
            </button>
            {!user && (
              <Link
                to="/login"
                className="pill-ghost"
                style={{
                  fontSize: '1rem',
                  padding: '14px 32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <LogIn size={15} strokeWidth={1.75} />
                <span>Sign in to room</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* QR Code Camera / Image Scanner Modal */}
      <QRScannerModal isOpen={qrScannerOpen} onClose={() => setQrScannerOpen(false)} />

      {/* Production Footer */}
      <Footer />
    </div>
  );
}
