import React from 'react';

export default function ParticipantList({ participants = [], roomId, roomName }) {
  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Room invite link copied to clipboard 📋');
  };

  return (
    <div style={{
      background: 'var(--color-graphite)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--radius-card)', // 24px
      padding: '0.85rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      {/* Room Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <span style={{ fontSize: '1rem', color: 'var(--accent-violet)' }}>✦</span>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '1rem',
            fontWeight: 500,
            color: 'var(--color-bone)',
            letterSpacing: '-0.02em',
          }}>
            {roomName || 'Date Sanctuary'}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-slate)', fontFamily: 'var(--font-mono)' }}>
            ID: {roomId}
          </span>
        </div>
      </div>

      {/* Avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate)' }}>
          Active ({participants.length}):
        </span>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '-0.2rem' }}>
          {participants.map((p, idx) => (
            <div
              key={p.socketId || idx}
              title={p.username}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: p.avatar ? `url(${p.avatar}) center/cover` : '#222',
                border: '1px solid var(--color-hairline)',
                marginLeft: idx > 0 ? '-8px' : '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-bone)',
                fontSize: '0.75rem',
                fontWeight: 500,
                position: 'relative',
              }}
            >
              {!p.avatar && (p.username?.[0]?.toUpperCase() || '?')}
              <span style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--success)',
              }} />
            </div>
          ))}
        </div>

        {/* Share Button: 9999px pill */}
        <button
          onClick={copyLink}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.95rem',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-snow-white)',
            border: '1px solid var(--color-snow-white)',
            color: 'var(--color-graphite)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginLeft: '0.5rem',
          }}
        >
          <span>🔗</span>
          <span>Copy Invite</span>
        </button>
      </div>
    </div>
  );
}
