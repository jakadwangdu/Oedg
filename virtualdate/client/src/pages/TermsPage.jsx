import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

export default function TermsPage() {
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
          ← Back to workspace
        </Link>
      </nav>

      <main style={{ maxWidth: 840, margin: '0 auto', padding: '4rem 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '3.5rem' }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            LEGAL AGREEMENT
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
            Terms of Service
          </h1>
          <p className="mono" style={{ fontSize: 13, color: 'var(--w3)' }}>
            Effective Date: October 2026 &middot; Version 2.4
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.7, color: 'var(--w2)', fontSize: '0.975rem' }}>
          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using Oedg (accessible at oedg.vercel.app), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              2. Workspace Code of Conduct
            </h2>
            <p>
              Oedg is designed as a quiet, productive workspace for remote meetings, synchronized presentations, and focused deep work. You agree not to use the service for:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Broadcasting non-consensual content, harassment, stalking, or defamation.</li>
              <li>Attempting to compromise room encryption or intercepting other users' media sessions.</li>
              <li>Automated scraping, denial-of-service attacks, or flooding Socket.IO signaling servers.</li>
              <li>Distributing malicious files or violating third-party intellectual property rights.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              3. Room Security & Password Protection
            </h2>
            <p>
              You are responsible for safeguarding your room links and passwords. While Oedg enforces direct peer WebRTC encryption and access controls, anyone in possession of an open, unpassworded room link or QR code may enter the room.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              4. Intellectual Property
            </h2>
            <p>
              All trademarks, design tokens, source code architecture, and visual aesthetics of Oedg are protected by copyright. Unauthorized reproduction, modification, or redistribution of proprietary assets is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.75rem' }}>
              5. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p>
              Oedg is provided on an "as is" and "as available" basis without warranties of any kind. Under no circumstances will Oedg or its contributors be liable for indirect, incidental, or consequential damages resulting from third-party network failures, browser WebRTC incompatibilities, or loss of session state.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
