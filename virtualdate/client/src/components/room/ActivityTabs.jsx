import React from 'react';

const TABS = [
  { id: 'movie', label: 'Cinema', icon: '🎬' },
  { id: 'music', label: 'Dhun Music', icon: '🎵' },
  { id: 'whiteboard', label: 'Canvas', icon: '🎨' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'call', label: 'Video Call', icon: '📹' },
];

export default function ActivityTabs({ currentActivity, onSelectActivity }) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      background: 'rgba(22, 22, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '0.25rem 0.35rem',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--color-hairline)',
      overflowX: 'auto',
      maxWidth: '100%',
    }}>
      {TABS.map((tab) => {
        const isActive = currentActivity === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectActivity(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-pill)',
              background: isActive ? 'var(--color-snow-white)' : 'transparent',
              border: isActive ? '1px solid var(--color-snow-white)' : '1px solid transparent',
              color: isActive ? 'var(--color-graphite)' : 'var(--color-ash)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
