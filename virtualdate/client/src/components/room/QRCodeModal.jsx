import React, { useState } from 'react';

export default function QRCodeModal({ roomId, roomName, hasPassword, onClose }) {
  const [copied, setCopied] = useState(false);
  const roomUrl = `${window.location.origin}/room/${roomId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(roomUrl)}&bgcolor=161616&color=ededed&margin=12`;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(10, 10, 10, 0.88)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      animation: 'fadeIn 180ms ease-out',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--color-graphite)',
        border: '1px solid var(--color-hairline)',
        borderRadius: 'var(--radius-card)', // 24px
        padding: '2.25rem 2rem',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: '1px solid var(--color-hairline)',
            color: 'var(--color-slate)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--accent-violet)' }}>✦</div>
        <h3 style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '1.45rem',
          fontWeight: 500,
          color: 'var(--color-bone)',
          letterSpacing: '-0.035em',
          marginBottom: '0.35rem',
        }}>
          Direct Sanctuary Access
        </h3>
        <p style={{
          fontFamily: 'var(--font-geist)',
          fontSize: '0.875rem',
          color: 'var(--color-ash)',
          marginBottom: '1.75rem',
          lineHeight: 1.5,
        }}>
          Scan with your device camera to connect immediately. No login required.
        </p>

        {/* QR Code Hairline Frame */}
        <div style={{
          display: 'inline-block',
          padding: '1rem',
          borderRadius: 20,
          background: '#121212',
          border: '1px solid var(--color-hairline)',
          marginBottom: '1.25rem',
        }}>
          <img
            src={qrCodeUrl}
            alt="Room QR Code"
            style={{
              width: 220,
              height: 220,
              borderRadius: 12,
              display: 'block',
            }}
          />
        </div>

        {hasPassword && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#fbbf24',
            fontSize: '0.75rem',
            marginBottom: '1.25rem',
          }}>
            <span>🔒</span>
            <span>Password required upon entry</span>
          </div>
        )}

        {/* URL Input & Copy Button */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: '#141414',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--radius-ui)',
          padding: '0.4rem',
          marginBottom: '1.5rem',
        }}>
          <input
            readOnly
            value={roomUrl}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--color-ash)',
              fontSize: '0.8125rem',
              padding: '0.4rem 0.6rem',
              outline: 'none',
              textOverflow: 'ellipsis',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-pill)',
              background: copied ? 'var(--success)' : 'var(--color-snow-white)',
              color: copied ? '#fff' : 'var(--color-graphite)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.7rem',
            borderRadius: 'var(--radius-pill)',
            background: '#1a1a1a',
            border: '1px solid var(--color-hairline)',
            color: 'var(--color-bone)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
