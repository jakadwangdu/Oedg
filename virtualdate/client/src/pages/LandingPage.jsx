import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const { user } = useAuthStore();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--color-void-canvas)',
    }}>
      {/* Signature Dimension Ambient Lighting: Warm amber bleeding into dusk violet spotlight */}
      <div style={{
        position: 'absolute',
        top: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 700,
        height: 380,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(107, 98, 242, 0.18) 0%, rgba(245, 158, 11, 0.06) 45%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)',
      }} />

      {/* Subtle Dusk Violet Wash Line across top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: 'var(--color-dusk-violet)',
        opacity: 0.8,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
        {/* Floating Frosted Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1.1rem',
          borderRadius: 9999,
          background: 'rgba(212, 212, 212, 0.08)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid var(--color-hairline)',
          color: 'var(--color-bone)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          marginBottom: '2rem',
          letterSpacing: '0.025em',
        }}>
          <span style={{ color: 'var(--accent-violet)' }}>✦</span>
          <span>Dusk-Lit Virtual Date Workspace</span>
        </div>

        {/* Display Typography: DM Sans at Weight 500 with tight tracking -0.035em */}
        <h1 style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: 'clamp(2.75rem, 6.5vw, 4.5rem)',
          fontWeight: 500,
          letterSpacing: '-0.035em',
          lineHeight: 1.04,
          marginBottom: '1.5rem',
          color: 'var(--color-bone)',
        }}>
          Moments shared in quiet harmony.
        </h1>

        <p style={{
          fontFamily: "var(--font-geist)",
          fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
          color: 'var(--color-ash)',
          lineHeight: 1.65,
          maxWidth: 580,
          margin: '0 auto 2.75rem',
          fontWeight: 400,
          letterSpacing: '-0.01em',
        }}>
          Synchronize cinema, stream music on Dhun, speak over encrypted peer video, sketch live on a shared canvas, and play casual games — nestled in frosted glass panels.
        </p>

        {/* Dimension Pill CTAs */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
          {user ? (
            <Link to="/dashboard">
              <button className="btn-dimension-primary">
                Open Your Sanctuaries →
              </button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <button className="btn-dimension-primary">
                  Begin Free Session
                </button>
              </Link>
              <Link to="/login">
                <button className="btn-dimension-secondary">
                  Sign In
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Editorial Feature Pills with 1px hairlines */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.65rem',
          justifyContent: 'center',
          maxWidth: 680,
          margin: '0 auto',
        }}>
          {[
            { tag: '01', label: 'Universal Cinema Sync' },
            { tag: '02', label: 'Dhun Music & Audio' },
            { tag: '03', label: 'Peer Encrypted Video' },
            { tag: '04', label: 'Real-Time Whiteboard' },
            { tag: '05', label: 'Playful Web Games' },
            { tag: '06', label: 'Whisper Chat & Reactions' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: 9999,
                background: 'rgba(22, 22, 22, 0.75)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                border: '1px solid var(--color-hairline)',
                fontSize: '0.8125rem',
                color: 'var(--color-ash)',
              }}
            >
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: '0.7rem',
                color: 'var(--color-slate)',
              }}>
                {item.tag}
              </span>
              <span style={{ fontWeight: 400 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Subtle Dusk Violet Wash Line */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        background: 'var(--color-dusk-violet)',
        opacity: 0.4,
      }} />
    </div>
  );
}
