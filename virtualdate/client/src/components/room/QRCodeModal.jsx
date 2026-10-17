import React, { useState } from 'react';

export default function QRCodeModal({ roomId, roomName, hasPassword, onClose }) {
  const [copied, setCopied] = useState(false);
  const roomUrl = `${window.location.origin}/room/${roomId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(roomUrl)}&bgcolor=ffffff&color=000000&margin=0`;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--k1)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: '2.5rem 2rem',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 40px 120px rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: '1px solid var(--line)',
            color: 'var(--w3)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>
          DIRECT ENTRY
        </div>
        <h3
          style={{
            fontSize: '1.45rem',
            fontWeight: 500,
            color: 'var(--w)',
            letterSpacing: '-0.035em',
            marginBottom: '0.4rem',
          }}
        >
          Scan to enter room
        </h3>
        <p
          style={{
            color: 'var(--w2)',
            fontSize: '0.875rem',
            marginBottom: '1.75rem',
            lineHeight: 1.5,
          }}
        >
          Point any phone camera to join instantly. No signup required for her.
        </p>

        {/* QR Code on White Tile (the only large white area in the app) */}
        <div
          style={{
            display: 'inline-block',
            padding: '1.25rem',
            borderRadius: 20,
            background: '#ffffff',
            marginBottom: '1.5rem',
            boxShadow: '0 12px 40px rgba(255, 255, 255, 0.1)',
          }}
        >
          <img
            src={qrCodeUrl}
            alt="Room QR Code"
            style={{
              width: 200,
              height: 200,
              display: 'block',
            }}
          />
        </div>

        {hasPassword && (
          <div
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 999,
              background: 'var(--glass)',
              border: '1px solid var(--line)',
              color: 'var(--w2)',
              fontSize: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <span>🔒</span>
            <span>Password required upon entry</span>
          </div>
        )}

        {/* Link Input & Copy Pill */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            background: 'var(--k2)',
            border: '1px solid var(--line)',
            borderRadius: 999,
            padding: '4px',
            marginBottom: '1.5rem',
          }}
        >
          <input
            readOnly
            value={roomUrl}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--w2)',
              fontSize: '0.8125rem',
              padding: '0.4rem 0.8rem',
              outline: 'none',
              textOverflow: 'ellipsis',
              fontFamily: 'var(--mono)',
            }}
          />
          <button
            onClick={handleCopy}
            className="pill"
            style={{
              padding: '8px 18px',
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="pill-ghost"
          style={{
            width: '100%',
            padding: '11px',
            fontSize: '0.875rem',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
