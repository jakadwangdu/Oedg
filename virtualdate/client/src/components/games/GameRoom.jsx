import React, { useEffect, useState } from 'react';
import { getSocket } from '../../services/socket';
import gsap from 'gsap';

const CASUAL_GAMES = [
  { name: 'Tic-Tac-Toe', type: 'builtin' },
  { name: 'Skribbl.io', url: 'https://skribbl.io', type: 'embed' },
  { name: 'Gartic Phone', url: 'https://garticphone.com', type: 'embed' },
  { name: 'Smash Karts', url: 'https://smashkarts.io', type: 'embed' },
  { name: 'Lichess', url: 'https://lichess.org', type: 'embed' },
];

export default function GameRoom({ roomId }) {
  const [selectedGame, setSelectedGame] = useState(CASUAL_GAMES[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tic Tac Toe State
  const [tttState, setTttState] = useState({
    board: Array(9).fill(null),
    xIsNext: true,
    winner: null,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('ttt:start', { roomId });

    socket.on('ttt:state', (state) => {
      setTttState(state);
    });

    socket.on('game:loaded', ({ url, type }) => {
      if (type === 'embed') {
        setSelectedGame({ name: 'Web Game', url, type: 'embed' });
        setGameUrl(url);
      } else {
        setSelectedGame(CASUAL_GAMES[0]);
      }
    });

    return () => {
      socket.off('ttt:state');
      socket.off('game:loaded');
    };
  }, [roomId]);

  const handleTttClick = (index) => {
    if (tttState.board[index] || tttState.winner) return;
    const socket = getSocket();
    socket?.emit('ttt:move', { roomId, index });

    // Animate mark pop-in with back.out(2)
    setTimeout(() => {
      const el = document.getElementById(`live-ttt-${index}`);
      if (el) {
        gsap.fromTo(
          el,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }
        );
      }
    }, 10);
  };

  const handleTttReset = () => {
    const socket = getSocket();
    socket?.emit('ttt:reset', { roomId });
  };

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    const socket = getSocket();
    if (game.type === 'embed') {
      setGameUrl(game.url);
      socket?.emit('game:load', { roomId, url: game.url, type: 'embed' });
    } else {
      socket?.emit('game:load', { roomId, type: 'builtin' });
    }
  };

  const handleCustomEmbed = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    const url = customUrl.startsWith('http') ? customUrl : `https://${customUrl}`;
    const customGame = { name: 'Custom Game', url, type: 'embed' };
    setSelectedGame(customGame);
    setGameUrl(url);
    const socket = getSocket();
    socket?.emit('game:load', { roomId, url, type: 'embed' });
    setCustomUrl('');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--k1)',
        borderRadius: isFullscreen ? 0 : 24,
        border: isFullscreen ? 'none' : '1px solid var(--line)',
        overflow: 'hidden',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 100 : 'auto',
      }}
    >
      {/* Game Selector Toolbar */}
      <div
        style={{
          padding: '0.65rem 1rem',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          background: 'var(--k2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--w)' }}>✦</span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 500,
                fontSize: '0.875rem',
                color: 'var(--w)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              Interactive Arcade
            </div>
          </div>
        </div>

        {/* Horizontally scrollable Game Tabs for phones & tablets */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            overflowX: 'auto',
            maxWidth: '100%',
            padding: '2px 0',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {CASUAL_GAMES.map((g) => {
            const isSelected = selectedGame.name === g.name;
            return (
              <button
                key={g.name}
                onClick={() => handleSelectGame(g)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 999,
                  background: isSelected ? 'var(--w)' : 'transparent',
                  border: isSelected ? '1px solid var(--w)' : '1px solid var(--line)',
                  color: isSelected ? 'var(--k)' : 'var(--w2)',
                  fontSize: '0.725rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {g.name}
              </button>
            );
          })}
        </div>

        {/* Right controls: Custom URL input & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleCustomEmbed} style={{ display: 'flex', gap: '0.35rem' }}>
            <input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Embed URL..."
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 999,
                background: 'var(--k3)',
                border: '1px solid var(--line)',
                color: 'var(--w)',
                fontSize: '0.725rem',
                outline: 'none',
                width: 120,
              }}
            />
            <button
              type="submit"
              className="pill"
              style={{
                padding: '5px 12px',
                fontSize: '0.725rem',
              }}
            >
              Load
            </button>
          </form>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 999,
              background: isFullscreen ? 'var(--w)' : 'var(--k3)',
              color: isFullscreen ? 'var(--k)' : 'var(--w2)',
              border: '1px solid var(--line)',
              fontSize: '0.725rem',
              cursor: 'pointer',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Game'}
          >
            {isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Game Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: '#000',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {selectedGame.type === 'builtin' ? (
          /* Built-in Tic-Tac-Toe with Responsive Glass Tiles */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(1rem, 3vw, 2rem)',
              width: '100%',
              maxWidth: 440,
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 'clamp(10px, 2.5vw, 12px)',
                color: 'var(--w3)',
                letterSpacing: '0.08em',
                marginBottom: '0.35rem',
                textAlign: 'center',
              }}
            >
              TIC-TAC-TOE &middot; REAL-TIME SYNC
            </div>

            <div
              style={{
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                color: tttState.winner ? 'var(--w)' : 'var(--w2)',
                marginBottom: 'clamp(0.85rem, 2.5vw, 1.25rem)',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              {tttState.winner
                ? tttState.winner === 'Draw'
                  ? 'Game ended in a quiet draw.'
                  : `${tttState.winner === 'X' ? 'Player X (Solid)' : 'Player O (Outlined)'} wins! ✦`
                : `Current Turn: ${tttState.xIsNext ? 'X (Solid White)' : 'O (Outlined White)'}`}
            </div>

            {/* Responsive Board with Glass Tiles */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, clamp(65px, 22vw, 95px))',
                gridTemplateRows: 'repeat(3, clamp(65px, 22vw, 95px))',
                gap: 'clamp(8px, 2.5vw, 14px)',
                justifyContent: 'center',
              }}
            >
              {tttState.board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleTttClick(index)}
                  disabled={!!cell || !!tttState.winner}
                  style={{
                    background: 'var(--glass)',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    fontSize: 'clamp(1.5rem, 6vw, 2.2rem)',
                    fontWeight: 600,
                    color: 'var(--w)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: cell || tttState.winner ? 'default' : 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {cell && (
                    <span id={`live-ttt-${index}`} style={{ display: 'inline-block' }}>
                      {cell === 'X' ? (
                        <span style={{ color: '#fff' }}>✕</span>
                      ) : (
                        <span style={{ color: '#a8a8a8' }}>◯</span>
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleTttReset}
              className="pill-ghost"
              style={{
                marginTop: 'clamp(1rem, 3vw, 1.5rem)',
                padding: '7px 18px',
                fontSize: '0.8125rem',
              }}
            >
              Reset board
            </button>
          </div>
        ) : (
          /* Embedded Web Game Iframe (Responsive & Interactive) */
          <iframe
            src={gameUrl}
            title={selectedGame.name}
            allow="fullscreen; gamepad; autoplay"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              touchAction: 'manipulation',
            }}
          />
        )}
      </div>
    </div>
  );
}
