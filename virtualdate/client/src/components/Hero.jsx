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
        yPercent: -18,
        opacity: 0,
        scale: 0.94,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom 20%',
          scrub: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const words = 'A quiet space for two.'.split(' ');

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
        <h1
          aria-label="A quiet space for two."
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
            maxWidth: '44ch',
            margin: '28px auto 36px',
            color: 'var(--w2)',
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            lineHeight: 1.6,
          }}
        >
          Watch together, listen together, draw together. No accounts, no noise. Just the two of you, after dark.
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
            Start a date
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
