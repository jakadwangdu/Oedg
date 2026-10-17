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
        borderRadius: 24,
        border: '1px solid var(--line)',
        overflow: 'hidden',
      }}
    >
      {/* Game Selector Toolbar */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--k2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1rem', color: 'var(--w)' }}>✦</span>
          <div>
            <div
              style={{
                fontWeight: 500,
                fontSize: '0.9375rem',
                color: 'var(--w)',
                letterSpacing: '-0.02em',
              }}
            >
              Interactive Arcade
            </div>
            <div className="mono" style={{ fontSize: '0.725rem', color: 'var(--w3)' }}>
              Built-in strategy and embedded party games
            </div>
          </div>
        </div>

        {/* Game Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {CASUAL_GAMES.map((g) => {
            const isSelected = selectedGame.name === g.name;
            return (
              <button
                key={g.name}
                onClick={() => handleSelectGame(g)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 999,
                  background: isSelected ? 'var(--w)' : 'transparent',
                  border: isSelected ? '1px solid var(--w)' : '1px solid var(--line)',
                  color: isSelected ? 'var(--k)' : 'var(--w2)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {g.name}
              </button>
            );
          })}
        </div>

        {/* Custom Game URL input */}
        <form onSubmit={handleCustomEmbed} style={{ display: 'flex', gap: '0.4rem' }}>
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Embed web game URL..."
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 999,
              background: 'var(--k3)',
              border: '1px solid var(--line)',
              color: 'var(--w)',
              fontSize: '0.75rem',
              outline: 'none',
              width: 170,
            }}
          />
          <button
            type="submit"
            className="pill"
            style={{
              padding: '6px 14px',
              fontSize: '0.75rem',
            }}
          >
            Load
          </button>
        </form>
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
        }}
      >
        {selectedGame.type === 'builtin' ? (
          /* Built-in Tic-Tac-Toe with Glass Tiles & pop-in */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2.5rem',
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: 'var(--w3)',
                letterSpacing: '0.08em',
                marginBottom: '0.5rem',
              }}
            >
              TIC-TAC-TOE &middot; REAL-TIME SYNC
            </div>

            <div
              style={{
                fontSize: '1rem',
                color: tttState.winner ? 'var(--w)' : 'var(--w2)',
                marginBottom: '1.5rem',
                fontWeight: 500,
              }}
            >
              {tttState.winner
                ? tttState.winner === 'Draw'
                  ? 'Game ended in a quiet draw.'
                  : `${tttState.winner === 'X' ? 'Player X (Solid)' : 'Player O (Outlined)'} wins! ✦`
                : `Current Turn: ${tttState.xIsNext ? 'X (Solid White)' : 'O (Outlined White)'}`}
            </div>

            {/* Board with Glass Tiles */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 90px)',
                gridTemplateRows: 'repeat(3, 90px)',
                gap: 12,
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
                    fontSize: '2rem',
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
                marginTop: '1.75rem',
                padding: '8px 20px',
                fontSize: '0.8125rem',
              }}
            >
              Reset board
            </button>
          </div>
        ) : (
          /* Embedded Web Game Iframe */
          <iframe
            src={gameUrl}
            title={selectedGame.name}
            allow="fullscreen; gamepad; autoplay"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
      </div>
    </div>
  );
}
