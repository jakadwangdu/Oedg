import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    tag: '01 / CINEMA',
    title: 'Frames in lockstep',
    desc: 'Universal cinema sync with sub-second precision. When you press play, pause, or seek, your partner stays in the exact same moment.',
    glyph: '🎬',
  },
  {
    tag: '02 / CALLS',
    title: 'Private by default',
    desc: 'Direct WebRTC peer encrypted calls and screen share. Your sanctuary runs device-to-device with zero recordings or observers.',
    glyph: '✦',
  },
  {
    tag: '03 / ONBOARDING',
    title: 'No signup for her',
    desc: 'Send a one-click link or scan a QR code from any phone. She enters the room in two seconds without passwords or downloads.',
    glyph: '◌',
  },
  {
    tag: '04 / PRESENCE',
    title: 'Gentle calls',
    desc: 'A quiet, dusk-lit ring alert with polite Accept and Decline controls. No startling alarms, no jarring interruptions.',
    glyph: '♡',
  },
];

function Card({ f, index }) {
  const cardRef = useRef(null);
  const spotRef = useRef(null);

  const handlePointerMove = (e) => {
    if (!cardRef.current || !spotRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    spotRef.current.style.opacity = '1';
    spotRef.current.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.13), transparent 70%)`;
  };

  const handlePointerLeave = () => {
    if (spotRef.current) spotRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="feature-track-card"
      style={{
        width: 'min(78vw, 520px)',
        height: 'min(56vh, 440px)',
        minHeight: 380,
        borderRadius: 28,
        background: 'var(--k1)',
        border: '1px solid var(--line)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem',
        boxSizing: 'border-box',
        flexShrink: 0,
        willChange: 'transform',
      }}
    >
      {/* Zero-lag hardware accelerated spotlight effect */}
      <div
        ref={spotRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.25s ease',
          willChange: 'background, opacity',
        }}
      />

      {/* Top content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          className="mono"
          style={{
            fontSize: 12,
            letterSpacing: '0.08em',
            color: 'var(--w3)',
            marginBottom: '1rem',
          }}
        >
          {f.tag}
        </div>
        <h3
          style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.4rem)',
            fontWeight: 500,
            color: 'var(--w)',
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
            lineHeight: 1.05,
          }}
        >
          {f.title}
        </h3>
        <p
          style={{
            color: 'var(--w2)',
            fontSize: '0.975rem',
            lineHeight: 1.6,
            maxWidth: '38ch',
            margin: 0,
          }}
        >
          {f.desc}
        </p>
      </div>

      {/* Concentric rings art area */}
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            fontSize: '1.25rem',
            color: 'var(--w)',
            zIndex: 2,
            opacity: 0.9,
          }}
        >
          {f.glyph}
        </span>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              animation: 'ring 4.5s cubic-bezier(0.16, 1, 0.3, 1) infinite',
              animationDelay: `${-i * 1.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function FeatureTrack() {
  const section = useRef(null);
  const track = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const mm = gsap.matchMedia();

    mm.add('(min-width: 821px) and (prefers-reduced-motion: no-preference)', () => {
      const tr = track.current;
      if (!tr) return;
      tr.style.overflow = 'visible';
      tr.style.width = 'max-content';

      const d = () => tr.scrollWidth - window.innerWidth + 120;

      gsap.to(tr, {
        x: () => -d(),
        ease: 'none',
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: () => '+=' + d(),
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tr.style.overflow = '';
        tr.style.width = '';
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={section}
      style={{
        position: 'relative',
        background: 'var(--k)',
        padding: '5rem 0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto 3rem',
          padding: '0 2rem',
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 13,
            color: 'var(--w3)',
            marginBottom: '0.75rem',
            letterSpacing: '0.06em',
          }}
        >
          SANCTUARY ARCHITECTURE
        </div>
        <h2
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            color: 'var(--w)',
            letterSpacing: '-0.04em',
            fontWeight: 500,
          }}
        >
          Crafted for quiet intimacy.
        </h2>
      </div>

      <div
        ref={track}
        className="feature-track-container"
        style={{
          display: 'flex',
          gap: '2rem',
          padding: '0 2rem',
          boxSizing: 'border-box',
          flexWrap: 'nowrap',
        }}
      >
        {FEATURES.map((f, i) => (
          <Card key={i} f={f} index={i} />
        ))}
      </div>
    </section>
  );
}
