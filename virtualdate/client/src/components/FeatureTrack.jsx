import React, { useRef } from 'react';
import { PlayCircle, ShieldCheck, QrCode, PenTool, Sparkles, Layers, ArrowUpRight } from 'lucide-react';

const FEATURES = [
  {
    tag: '01 / SYNCHRONIZATION',
    title: 'Frames in lockstep',
    desc: 'Universal media and presentation sync with sub-second precision. When you play, pause, or scrub, every participant stays aligned in exact lockstep.',
    Icon: PlayCircle,
    secondaryTag: 'Sub-second sync',
  },
  {
    tag: '02 / PRIVACY ARCHITECTURE',
    title: 'Private by default',
    desc: 'Direct WebRTC peer encrypted calls and screen share. Your meetings run device-to-device with zero recordings, cloud surveillance, or observers.',
    Icon: ShieldCheck,
    secondaryTag: '256-bit DTLS',
  },
  {
    tag: '03 / ACCESSIBILITY',
    title: 'Zero-friction entry',
    desc: 'Send a one-click link or scan a QR code from any phone. Teammates and clients enter the room in two seconds without passwords or mandatory downloads.',
    Icon: QrCode,
    secondaryTag: 'Zero download',
  },
  {
    tag: '04 / DEEP COLLABORATION',
    title: 'Focus canvas & audio',
    desc: 'Collaborative real-time whiteboard and focus audio. Brainstorm architectures, sketch ideas, and run quiet, distraction-free sprint sessions.',
    Icon: PenTool,
    secondaryTag: 'Peer canvas',
  },
];

function Card({ f, index }) {
  const cardRef = useRef(null);
  const spotRef = useRef(null);
  const { Icon } = f;

  const handlePointerMove = (e) => {
    if (!cardRef.current || !spotRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    spotRef.current.style.opacity = '1';
    spotRef.current.style.background = `radial-gradient(400px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.08), transparent 70%)`;
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
        borderRadius: 24,
        background: 'var(--k1)',
        border: '1px solid var(--line)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.25rem',
        boxSizing: 'border-box',
        minHeight: 340,
        transition: 'border-color 0.3s ease, transform 0.3s ease',
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

      {/* Top Header & Tag */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: 'var(--w3)',
            }}
          >
            {f.tag}
          </span>
          <span
            className="mono"
            style={{
              fontSize: '0.6875rem',
              color: 'rgba(255, 255, 255, 0.45)',
              padding: '3px 9px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {f.secondaryTag}
          </span>
        </div>

        <h3
          style={{
            fontSize: 'clamp(1.5rem, 2.2vw, 1.85rem)',
            fontWeight: 500,
            color: 'var(--w)',
            letterSpacing: '-0.03em',
            marginBottom: '0.85rem',
            lineHeight: 1.15,
          }}
        >
          {f.title}
        </h3>

        <p
          style={{
            color: 'var(--w2)',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            maxWidth: '44ch',
            margin: 0,
          }}
        >
          {f.desc}
        </p>
      </div>

      {/* Premium Graphic Anchor Area */}
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          height: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 1,
          marginTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '1rem',
        }}
      >
        {/* Subtle Ambient Pulse Rings */}
        <div
          style={{
            position: 'absolute',
            width: 72,
            height: 72,
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            animation: 'ring 4.5s cubic-bezier(0.16, 1, 0.3, 1) infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 110,
            height: 110,
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            animation: 'ring 4.5s cubic-bezier(0.16, 1, 0.3, 1) infinite',
            animationDelay: '-2.2s',
          }}
        />

        {/* Center Premium Icon Badge */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--w)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            zIndex: 2,
          }}
        >
          <Icon size={20} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

export default function FeatureTrack() {
  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--k)',
        padding: '5rem 1.5rem 6rem',
        borderTop: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto 3rem',
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--w3)',
            marginBottom: '0.75rem',
            letterSpacing: '0.08em',
          }}
        >
          WORKSPACE ARCHITECTURE
        </div>
        <h2
          style={{
            fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)',
            color: 'var(--w)',
            letterSpacing: '-0.04em',
            fontWeight: 500,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Crafted for quiet productivity.
        </h2>
      </div>

      {/* Responsive Architectural Bento Grid - No janky pin traps, seamless natural desktop scroll */}
      <div
        className="feature-track-container"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
          gap: '1.75rem',
        }}
      >
        {FEATURES.map((f, i) => (
          <Card key={i} f={f} index={i} />
        ))}
      </div>
    </section>
  );
}
