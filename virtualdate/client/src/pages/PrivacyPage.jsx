import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--k)', color: 'var(--w1)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <nav
        style={{
          borderBottom: '1px solid var(--line)',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--k1)',
        }}
      >
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Logo size={24} word={true} />
        </Link>
        <Link to="/" className="mono" style={{ color: 'var(--w2)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to sanctuary
        </Link>
      </nav>

      <main style={{ maxWidth: 840, margin: '0 auto', padding: '4rem 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '3.5rem' }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            SECURITY & DATA PROTOCOL
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              fontWeight: 500,
              letterSpacing: '-0.04em',
              color: 'var(--w)',
              marginBottom: '1rem',
              lineHeight: 1.15,
            }}
          >
            Privacy Policy
          </h1>
          <p className="mono" style={{ fontSize: 13, color: 'var(--w3)' }}>
            Effective Date: October 2026 &middot; Version 2.4
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.7, color: 'var(--w2)', fontSize: '0.975rem' }}>
          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              1. Direct Peer-to-Peer Encryption
            </h2>
            <p>
              Oedg is architected as a quiet, private sanctuary. All live audio calls, video calls, and screen sharing sessions operate over direct WebRTC peer connections. Media packets are encrypted in transit using industry-standard Datagram Transport Layer Security (DTLS) and Secure Real-time Transport Protocol (SRTP).
            </p>
            <p style={{ marginTop: '0.75rem' }}>
              <strong>Zero Recording Guarantee:</strong> We do not record, intercept, transcribe, or store your camera feeds, microphone audio, or screen sharing broadcasts on our servers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              2. Anonymous Guest Access
            </h2>
            <p>
              We believe intimacy should not require surrender of personal information. Partners joining rooms via shared invite links or QR codes are admitted as anonymous guests without requiring an email address, phone number, or password. Guest session tokens are transient and expire upon leaving the room.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              3. Information We Collect
            </h2>
            <p>
              When you choose to register an account or connect via Google OAuth, we collect only the necessary credentials required to maintain your rooms:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Account Credentials:</strong> Username, email address, and cryptographically hashed passwords (using bcrypt with salt rounds).</li>
              <li><strong>Google OAuth:</strong> Verified email address, public display name, and avatar URL provided by Google Identity Services.</li>
              <li><strong>Room Metadata:</strong> Room names, custom passwords (hashed), and transient whiteboard/music state required for synchronization.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              4. Cookies & Local Storage
            </h2>
            <p>
              Oedg does not use third-party tracking cookies or advertising pixels. Browser LocalStorage and SessionStorage are utilized strictly for essential session persistence (keeping you logged in and maintaining active room state).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              5. Data Deletion & Inquiries
            </h2>
            <p>
              You maintain complete ownership over your data. You may delete any created room or conversation history directly from your dashboard. For complete account deletion or privacy questions, please submit a request through our <Link to="/help" style={{ color: 'var(--w)', textDecoration: 'underline' }}>Help Page</Link>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
