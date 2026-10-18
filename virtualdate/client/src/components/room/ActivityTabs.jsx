import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

const TABS = [
  { id: 'call', label: 'Meeting Call' },
  { id: 'whiteboard', label: 'Canvas' },
  { id: 'movie', label: 'Present' },
  { id: 'music', label: 'Focus Audio' },
  { id: 'games', label: 'Arcade' },
];

export default function ActivityTabs({ currentActivity, onSelectActivity }) {
  const tabsRef = useRef([]);
  const indRef = useRef(null);

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.id === currentActivity)
  );

  const updateIndicator = (idx, animate = true) => {
    const el = tabsRef.current[idx];
    if (el && indRef.current) {
      if (animate) {
        gsap.to(indRef.current, {
          x: el.offsetLeft,
          width: el.offsetWidth,
          duration: 0.6,
          ease: 'expo.out',
        });
      } else {
        gsap.set(indRef.current, {
          x: el.offsetLeft,
          width: el.offsetWidth,
        });
      }
    }
  };

  useEffect(() => {
    updateIndicator(activeIndex, true);
  }, [activeIndex]);

  useEffect(() => {
    // Initial mount without delay
    updateIndicator(activeIndex, false);
    const handleResize = () => updateIndicator(activeIndex, false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--k3)',
        padding: 4,
        borderRadius: 999,
        border: '1px solid var(--line)',
        overflowX: 'auto',
        maxWidth: '100%',
      }}
    >
      {/* Sliding white pill indicator */}
      <div
        ref={indRef}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          borderRadius: 999,
          background: 'var(--w)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {TABS.map((tab, i) => {
        const isActive = activeIndex === i;
        return (
          <button
            key={tab.id}
            ref={(el) => (tabsRef.current[i] = el)}
            onClick={() => {
              updateIndicator(i, true);
              onSelectActivity(tab.id);
            }}
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '7px 18px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              color: isActive ? 'var(--k)' : 'var(--w3)',
              transition: 'color 0.25s',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
