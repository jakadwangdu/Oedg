import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Tv, Headphones, PenTool, Gamepad2, Network, Play, Pause, Send, ArrowRight } from 'lucide-react';
import Logo from './Logo';

gsap.registerPlugin(ScrollTrigger);

const MONO_REACTIONS = ['✦', '⚡', '✓', '❋', '◌', '✧'];

export default function RoomShell({ onEnterRoom }) {
  const frameRef = useRef(null);
  const tabsRef = useRef([]);
  const indRef = useRef(null);
  const panelRef = useRef(null);

  const [activeTab, setActiveTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeStation, setActiveStation] = useState(0);

  // Tic-Tac-Toe state for Arcade tab
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  // Flow tab constellation/node state
  const [stars, setStars] = useState([
    { x: 120, y: 140, type: 'you' },
    { x: 220, y: 100, type: 'teammate' },
    { x: 340, y: 180, type: 'you' },
    { x: 420, y: 130, type: 'teammate' },
  ]);

  // Notes state
  const [messages, setMessages] = useState([
    { id: 1, sender: 'teammate', text: 'Sharing the sprint roadmap walkthrough now...' },
    { id: 2, sender: 'you', text: 'Architecture targets are well defined. ✦' },
  ]);
  const [inputText, setInputText] = useState('');
  const [particles, setParticles] = useState([]);

  const tabs = [
    { name: 'Present', icon: Tv },
    { name: 'Focus Audio', icon: Headphones },
    { name: 'Canvas', icon: PenTool },
    { name: 'Arcade', icon: Gamepad2 },
    { name: 'Flow', icon: Network },
  ];

  // Frame scroll entrance scale effect
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        frameRef.current,
        { scale: 0.86, y: 80, opacity: 0.4 },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: frameRef.current,
            start: 'top 100%',
            end: 'top 35%',
            scrub: true,
          },
        }
      );
    }, frameRef);

    return () => ctx.revert();
  }, []);

  // Update sliding pill indicator position on tab select or resize
  const selectTab = (i) => {
    const b = tabsRef.current[i];
    if (b && indRef.current) {
      gsap.to(indRef.current, {
        x: b.offsetLeft,
        width: b.offsetWidth,
        duration: 0.6,
        ease: 'expo.out',
      });
    }
    setActiveTab(i);
  };

  useEffect(() => {
    const b = tabsRef.current[activeTab];
    if (b && indRef.current) {
      gsap.set(indRef.current, {
        x: b.offsetLeft,
        width: b.offsetWidth,
      });
    }
  }, []);

  // Panel entrance animation on active tab change
  useEffect(() => {
    if (panelRef.current && panelRef.current.children) {
      gsap.from(panelRef.current.children, {
        opacity: 0,
        y: 16,
        filter: 'blur(8px)',
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.06,
        clearProps: 'all',
      });
    }
  }, [activeTab]);

  // Tic-Tac-Toe move with pop-in
  const handleCellClick = (idx) => {
    if (board[idx]) return;
    const next = [...board];
    next[idx] = xIsNext ? 'X' : 'O';
    setBoard(next);
    setXIsNext(!xIsNext);

    // Pop-in animation
    setTimeout(() => {
      const el = document.getElementById(`ttt-cell-${idx}`);
      if (el) {
        gsap.fromTo(
          el,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }
        );
      }
    }, 10);
  };

  // Sky star placement
  const handleSkyClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newStar = { x, y, type: 'you' };

    setStars((prev) => [...prev, newStar]);

    // Teammate automatic constellation response after 450ms
    setTimeout(() => {
      const partnerX = x + (Math.random() * 80 - 40);
      const partnerY = y + (Math.random() * 80 - 40);
      setStars((prev) => [...prev, { x: partnerX, y: partnerY, type: 'teammate' }]);
    }, 450);
  };

  // Send team note
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: 'you',
      text: inputText.trim(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Trigger subtle teammate reaction
    setTimeout(() => {
      setParticles((prev) => [
        ...prev,
        {
          id: Date.now(),
          glyph: '⚡',
          x: Math.random() * 60 + 20,
        },
      ]);
    }, 1000);
  };

  // Click reaction glyph
  const handleReact = (glyph) => {
    setParticles((prev) => [
      ...prev,
      {
        id: Date.now(),
        glyph,
        x: Math.random() * 60 + 20,
      },
    ]);
  };

  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--k)',
        padding: '2rem 1.5rem 6rem',
        maxWidth: 1240,
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: 'var(--w3)',
            letterSpacing: '0.08em',
            marginBottom: '0.65rem',
          }}
        >
          LIVE PREVIEW ROOM
        </div>
        <h2
          style={{
            fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
            color: 'var(--w)',
            letterSpacing: '-0.04em',
            fontWeight: 500,
          }}
        >
          Inside your quiet productive space.
        </h2>
      </div>

      {/* Main Room Window Shell */}
      <div
        id="frame"
        ref={frameRef}
        style={{
          borderRadius: 30,
          background: 'linear-gradient(180deg, var(--k2), var(--k1))',
          border: '1px solid var(--line)',
          boxShadow: '0 60px 160px rgba(255, 255, 255, 0.07)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 290px',
          minHeight: 620,
          position: 'relative',
        }}
        className="room-frame-grid"
      >
        {/* Floating particles for monochrome reactions */}
        {particles.map((p) => (
          <div
            key={p.id}
            onAnimationEnd={() => setParticles((prev) => prev.filter((item) => item.id !== p.id))}
            style={{
              position: 'absolute',
              bottom: 80,
              right: `${p.x}%`,
              fontSize: '1.5rem',
              color: 'var(--w)',
              textShadow: '0 0 16px rgba(255, 255, 255, 0.8)',
              pointerEvents: 'none',
              zIndex: 50,
              animation: 'riseAndBlur 2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {p.glyph}
          </div>
        ))}

        {/* LEFT COLUMN: Stage with Sliding Tab Indicator */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--line)',
            background: 'var(--k1)',
          }}
        >
          {/* Top Bar with Logo & Sliding Indicator Tabs */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Logo size={22} word={true} />
              <span
                style={{
                  display: 'inline-block',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--w)',
                  opacity: 0.6,
                }}
              />
              <span className="mono" style={{ fontSize: 12, color: 'var(--w3)' }}>
                room/focus-sprint
              </span>
            </div>

            {/* Sliding Pill Tabs Bar */}
            <div
              className="room-shell-tabs-bar"
              style={{
                position: 'relative',
                display: 'inline-flex',
                background: 'var(--k3)',
                padding: 4,
                borderRadius: 999,
                border: '1px solid var(--line)',
              }}
            >
              {/* Animated sliding white indicator pill */}
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

              {tabs.map(({ name, icon: Icon }, i) => {
                const isActive = activeTab === i;
                return (
                  <button
                    key={name}
                    ref={(el) => (tabsRef.current[i] = el)}
                    onClick={() => selectTab(i)}
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      padding: '7px 16px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 500,
                      color: isActive ? 'var(--k)' : 'var(--w3)',
                      transition: 'color 0.25s',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon size={13} strokeWidth={2} />
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Panel Content Area */}
          <div
            ref={panelRef}
            style={{
              flex: 1,
              padding: 'clamp(1rem, 3.5vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* TAB 0: WATCH (Universal Cinema Sync) */}
            {activeTab === 0 && (
              <div
                style={{
                  borderRadius: 20,
                  background: '#000',
                  border: '1px solid var(--line)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: 240,
                    borderRadius: 14,
                    background: 'radial-gradient(ellipse at center, #1c1c1c 0%, #000 80%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        background: 'var(--w)',
                        color: 'var(--k)',
                        display: 'grid',
                        placeItems: 'center',
                        margin: '0 auto 0.75rem',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft: 3 }} />}
                    </div>
                    <span className="mono" style={{ fontSize: 13, color: 'var(--w2)' }}>
                      Product Architecture Walkthrough &middot; 14:20 / 32:00
                    </span>
                  </div>

                  {/* Teammate outlined presence cursor tag */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '25%',
                      right: '28%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px dashed var(--w)',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'var(--w1)',
                      fontSize: 11,
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        border: '1.5px solid var(--w)',
                      }}
                    />
                    Teammate viewing
                  </div>
                </div>

                {/* Scrubber: 4px line with hollow thumb */}
                <div style={{ position: 'relative', width: '100%', height: 16, display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      height: 4,
                      borderRadius: 2,
                      background: 'var(--k3)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '45%',
                        height: '100%',
                        background: 'var(--w)',
                        borderRadius: 2,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '45%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2px solid var(--w)',
                        background: 'var(--k)',
                      }}
                    />
                  </div>
                </div>

                {/* Glass controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--w3)' }}>
                    Synced across devices
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="pill-ghost" style={{ padding: '6px 14px', fontSize: 12 }}>
                      1080p
                    </button>
                    <button className="pill-ghost" style={{ padding: '6px 14px', fontSize: 12 }}>
                      Subtitles
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: DHUN (Music with Spinning Vinyl) */}
            {activeTab === 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2.5rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Vinyl Disc */}
                <div className={`vinyl ${isPlaying ? '' : 'paused'}`}>
                  <i />
                </div>

                {/* Station selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 240 }}>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', marginBottom: 4 }}>
                    DEEP WORK & FOCUS AUDIO
                  </div>
                  {[
                    'Deep Work & Code Focus Lofi',
                    'Rain & Window Glass Focus',
                    'Alpha Waves Flow Piano',
                    'Binaural Deep Focus Beats',
                  ].map((st, idx) => {
                    const isCur = activeStation === idx;
                    return (
                      <div
                        key={st}
                        onClick={() => {
                          setActiveStation(idx);
                          setIsPlaying(true);
                        }}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 14,
                          background: isCur ? 'var(--glass)' : 'transparent',
                          border: `1px solid ${isCur ? 'var(--w)' : 'var(--line)'}`,
                          color: isCur ? 'var(--w)' : 'var(--w2)',
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span>{st}</span>
                        {isCur && isPlaying && (
                          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 12 }}>
                            {[8, 14, 10, 16].map((h, i) => (
                              <span
                                key={i}
                                style={{
                                  width: 2,
                                  height: h,
                                  background: 'var(--w)',
                                  borderRadius: 1,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: CANVAS (Collaborative 4-Shade Monochrome Drawing) */}
            {activeTab === 2 && (
              <div
                style={{
                  borderRadius: 20,
                  background: '#000',
                  border: '1px solid var(--line)',
                  padding: '1.5rem',
                  height: 320,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {/* Demo hand-drawn strokes: Solid for you, dotted for teammate */}
                  <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                    {/* Your solid line */}
                    <path
                      d="M 60 180 Q 140 120, 220 180 T 380 180"
                      stroke="#fff"
                      strokeWidth="3.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Teammate dotted line */}
                    <path
                      d="M 80 210 Q 160 250, 240 210 T 400 210"
                      stroke="#a8a8a8"
                      strokeWidth="3"
                      strokeDasharray="6 6"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--w3)' }}>
                    Collaborative Sketchpad
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--w3)', marginRight: 4 }}>You: solid</span>
                    <span style={{ fontSize: 11, color: 'var(--w3)' }}>Teammate: dotted</span>
                  </div>
                </div>

                {/* 4 Monochrome Shades Palette */}
                <div style={{ display: 'flex', gap: 8, zIndex: 2 }}>
                  {['#ffffff', '#bdbdbd', '#7a7a7a', '#454545'].map((c) => (
                    <div
                      key={c}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: c,
                        border: '1px solid var(--line)',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ARCADE (Tic-Tac-Toe with pop-ins) */}
            {activeTab === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', marginBottom: '1rem' }}>
                  TURN: {xIsNext ? 'YOU (X — Solid)' : 'TEAM MEMBER (O — Outlined)'}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 86px)',
                    gridTemplateRows: 'repeat(3, 86px)',
                    gap: 10,
                  }}
                >
                  {board.map((cell, idx) => (
                    <button
                      key={idx}
                      id={`ttt-cell-${idx}`}
                      onClick={() => handleCellClick(idx)}
                      style={{
                        background: 'var(--glass)',
                        border: '1px solid var(--line)',
                        borderRadius: 16,
                        fontSize: 28,
                        fontWeight: 600,
                        color: 'var(--w)',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {cell === 'X' ? (
                        <span style={{ color: '#fff' }}>✕</span>
                      ) : cell === 'O' ? (
                        <span style={{ color: '#a8a8a8' }}>◯</span>
                      ) : (
                        ''
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setBoard(Array(9).fill(null))}
                  className="pill-ghost"
                  style={{ marginTop: '1.25rem', padding: '6px 16px', fontSize: 12 }}
                >
                  Reset board
                </button>
              </div>
            )}

            {/* TAB 4: SKY (Tap to link constellations) */}
            {activeTab === 4 && (
              <div
                onClick={handleSkyClick}
                style={{
                  borderRadius: 20,
                  background: 'radial-gradient(ellipse at center, #121212 0%, #000 90%)',
                  border: '1px solid var(--line)',
                  height: 320,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'crosshair',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 20,
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                >
                  <div className="mono" style={{ fontSize: 12, color: 'var(--w3)' }}>
                    TAP FLOW TO PLACE A NODE
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--w2)' }}>
                    You = solid light &middot; Teammate answers in outline
                  </span>
                </div>

                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                  {/* Constellation lines */}
                  {stars.map((s, i) => {
                    if (i === 0) return null;
                    const prev = stars[i - 1];
                    return (
                      <line
                        key={`line-${i}`}
                        x1={prev.x}
                        y1={prev.y}
                        x2={s.x}
                        y2={s.y}
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth="1"
                        strokeDasharray={s.type === 'teammate' ? '3 3' : 'none'}
                      />
                    );
                  })}
                  {/* Stars */}
                  {stars.map((s, i) => (
                    <circle
                      key={`star-${i}`}
                      cx={s.x}
                      cy={s.y}
                      r={s.type === 'you' ? 4 : 3.5}
                      fill={s.type === 'you' ? '#fff' : 'none'}
                      stroke="#fff"
                      strokeWidth={s.type === 'you' ? '0' : '1.5'}
                    />
                  ))}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 290px Sidebar (Team Notes & Monochrome Reactions) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--k)',
            padding: '1.25rem',
            position: 'relative',
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: 'var(--w3)',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>TEAM CHAT</span>
              <span>2 online</span>
            </div>

            {/* Notes list */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginTop: '1rem',
                maxHeight: 380,
                overflowY: 'auto',
              }}
            >
              {messages.map((m) => {
                const isYou = m.sender === 'you';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isYou ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: isYou ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isYou ? 'var(--w)' : 'var(--glass)',
                      color: isYou ? 'var(--k)' : 'var(--w1)',
                      border: isYou ? 'none' : '1px solid var(--line)',
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {m.text}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom input and monochrome reaction glyphs */}
          <div>
            {/* Monochrome reactions bar */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              {MONO_REACTIONS.map((glyph) => (
                <button
                  key={glyph}
                  onClick={() => handleReact(glyph)}
                  style={{
                    fontSize: 14,
                    color: 'var(--w2)',
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: 'var(--glass)',
                    border: '1px solid var(--line)',
                    cursor: 'pointer',
                    transition: 'color 0.2s, transform 0.2s',
                  }}
                  title="Send reaction"
                >
                  {glyph}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 6 }}>
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send a note or message..."
                style={{
                  flex: 1,
                  background: 'var(--k2)',
                  border: '1px solid var(--line)',
                  borderRadius: 999,
                  padding: '9px 14px',
                  color: 'var(--w)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--w)',
                  color: 'var(--k)',
                  border: 'none',
                  borderRadius: 999,
                  padding: '9px 14px',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span>Send</span>
                <Send size={11} strokeWidth={2.2} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Button to enter actual meeting space */}
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <button
          className="pill"
          onClick={onEnterRoom}
          style={{
            fontSize: '1.05rem',
            padding: '14px 38px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>Enter meeting space</span>
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>

      <style>{`
        @keyframes riseAndBlur {
          0% { transform: translateY(0) scale(0.8); opacity: 1; filter: blur(0px); }
          100% { transform: translateY(-120px) scale(1.3); opacity: 0; filter: blur(10px); }
        }
        @media (max-width: 820px) {
          .room-frame-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
