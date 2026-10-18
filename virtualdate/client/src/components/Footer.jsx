import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--line)',
        background: 'var(--k)',
        padding: '3rem 2rem 3.5rem',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* Logo and Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Logo size={22} word={true} />
            </Link>
            <span
              className="mono"
              style={{
                fontSize: 12,
                color: 'var(--w3)',
                letterSpacing: '-0.01em',
              }}
            >
              A quiet space for two.
            </span>
          </div>

          {/* Quick Production Nav Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
              fontSize: '0.8125rem',
            }}
          >
            <Link
              to="/buy"
              style={{
                color: 'var(--w)',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'var(--glass)',
                border: '1px solid var(--line)',
              }}
            >
              <span>🏷️</span>
              <span>Buy this website</span>
            </Link>
            <Link
              to="/help"
              style={{
                color: 'var(--w2)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Help & Support
            </Link>
            <Link
              to="/privacy"
              style={{
                color: 'var(--w2)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              style={{
                color: 'var(--w2)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Bottom Credits & Portfolio Link */}
        <div
          style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--w3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span>Made with quiet care by</span>
            <a
              href="https://jakadwangdu.github.io/Portfolio"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--w)',
                fontWeight: 500,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                transition: 'color 0.2s',
              }}
            >
              jakadwangdu
            </a>
          </div>

          <div className="mono" style={{ fontSize: 12 }}>
            Direct peer encrypted link &middot; Geist typography
          </div>
        </div>
      </div>
    </footer>
  );
}
