import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';
import Hero from '../components/Hero';
import RoomShell from '../components/RoomShell';
import FeatureTrack from '../components/FeatureTrack';
import QRScannerModal from '../components/room/QRScannerModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div style={{ background: 'var(--k)', color: 'var(--w1)', minHeight: '100vh', position: 'relative' }}>
      {/* Floating Navigation with mix-blend-mode: difference */}
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
              gap: '0.35rem',
            }}
          >
            <span>📱</span>
            <span>Scan QR</span>
          </button>

          {user ? (
            <Link to="/dashboard" className="mono" style={{ color: '#fff', textDecoration: 'none', fontSize: 13 }}>
              Dashboard →
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
                }}
              >
                Start a date
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <Hero onStart={handleStart} onScanQR={() => setQrScannerOpen(true)} />

      {/* Pinned / Interactive Room Window */}
      <RoomShell onEnterRoom={handleStart} />

      {/* Feature Track (Pinned Horizontal Scroll) */}
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
            PRIVATE SANCTUARY
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
            Ready for tonight?
          </h2>
          <p
            style={{
              color: 'var(--w2)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
            }}
          >
            Create a room, send a link, and spend quiet hours watching cinema, listening to music, and talking.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="pill" onClick={handleStart} style={{ fontSize: '1rem', padding: '14px 36px' }}>
              {user ? 'Open Dashboard' : 'Start a date'}
            </button>
            <button
              onClick={() => setQrScannerOpen(true)}
              className="pill-ghost"
              style={{ fontSize: '1rem', padding: '14px 30px', cursor: 'pointer' }}
            >
              Scan room QR
            </button>
            {!user && (
              <Link to="/login" className="pill-ghost" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                Sign in to room
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* QR Code Camera / Image Scanner Modal */}
      <QRScannerModal isOpen={qrScannerOpen} onClose={() => setQrScannerOpen(false)} />

      {/* Minimalist Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--line)',
          padding: '2.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Logo size={20} word={true} />
          <span className="mono" style={{ fontSize: 12, color: 'var(--w3)' }}>
            A quiet space for two.
          </span>
        </div>

        <div className="mono" style={{ fontSize: 12, color: 'var(--w3)' }}>
          Direct peer encrypted link &middot; Geist typography
        </div>
      </footer>
    </div>
  );
}
