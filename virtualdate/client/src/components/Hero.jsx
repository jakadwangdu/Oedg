import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroField from './HeroField';

gsap.registerPlugin(ScrollTrigger);

export default function Hero({ onStart, onScanQR }) {
  const root = useRef(null);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from('.ch', {
        yPercent: 70,
        opacity: 0,
        filter: 'blur(16px)',
        duration: 1.8,
        ease: 'expo.out',
        stagger: 0.045,
        delay: 0.3,
      });

      gsap.from('.hero-sub, .hero-cta', {
        opacity: 0,
        y: 14,
        duration: 1.4,
        delay: 1.4,
        stagger: 0.15,
      });

      gsap.to('.hero-copy', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const words = 'A quiet productive space.'.split(' ');

  return (
    <header
      ref={root}
      style={{
        position: 'relative',
        height: '100svh',
        minHeight: 640,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        isolation: 'isolate',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <HeroField />

      {/* Radial vignette melting edges into page */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 35%, #000 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div
        className="hero-copy"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '0 1.5rem',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        {/* Live Traffic & Active Team Indicator */}
        <div
          className="mono"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--line)',
            marginBottom: '1.75rem',
            fontSize: '0.8125rem',
            color: 'var(--w2)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981',
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--w1)', fontWeight: 500 }}>1,428 active collaborators online</span>
          <span style={{ opacity: 0.35 }}>•</span>
          <span style={{ color: 'var(--w3)' }}>18.4k meetings hosted</span>
        </div>

        <h1
          aria-label="A quiet productive space."
          style={{
            fontSize: 'clamp(52px, 10vw, 150px)',
            maxWidth: '10ch',
            margin: '0 auto',
            color: 'var(--w)',
            letterSpacing: '-0.05em',
            lineHeight: 0.96,
            fontWeight: 500,
          }}
        >
          {words.map((w, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                display: 'inline-block',
                whiteSpace: 'nowrap',
                marginRight: '0.22em',
              }}
            >
              {[...w].map((c, j) => (
                <span
                  key={j}
                  className="ch"
                  style={{ display: 'inline-block' }}
                >
                  {c}
                </span>
              ))}
            </span>
          ))}
        </h1>

        <p
          className="hero-sub"
          style={{
            maxWidth: '48ch',
            margin: '28px auto 36px',
            color: 'var(--w2)',
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            lineHeight: 1.6,
          }}
        >
          Meetings with your co-founder, whiteboard sprints, and team deep focus sessions. Direct peer encryption, zero distraction. A quiet space to do your best work.
        </p>

        <div className="hero-actions-container" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="pill hero-cta"
            onClick={onStart}
            style={{
              fontSize: '1rem',
              padding: '14px 34px',
              cursor: 'pointer',
            }}
          >
            Start a meeting
          </button>
          {onScanQR && (
            <button
              className="pill-ghost hero-cta"
              onClick={onScanQR}
              style={{
                fontSize: '1rem',
                padding: '14px 28px',
                cursor: 'pointer',
              }}
            >
              Scan QR to enter
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
