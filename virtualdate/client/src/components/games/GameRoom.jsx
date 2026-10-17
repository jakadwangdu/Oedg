import React, { useEffect, useState } from 'react';
import { getSocket } from '../../services/socket';

const CASUAL_GAMES = [
  { name: 'Tic-Tac-Toe', type: 'builtin' },
  { name: 'Skribbl.io (Pictionary)', url: 'https://skribbl.io', type: 'embed' },
  { name: 'Gartic Phone', url: 'https://garticphone.com', type: 'embed' },
  { name: 'Smash Karts', url: 'https://smashkarts.io', type: 'embed' },
  { name: 'Lichess (Chess)', url: 'https://lichess.org', type: 'embed' },
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--color-graphite)',
      borderRadius: 'var(--radius-card)', // 24px
      border: '1px solid var(--color-hairline)',
      overflow: 'hidden',
    }}>
      {/* Game Selector Toolbar */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--color-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: 'rgba(22, 22, 22, 0.9)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1rem', color: 'var(--accent-violet)' }}>✦</span>
          <div>
            <div style={{
              fontFamily: 'var(--font-dm-sans)',
              fontWeight: 500,
              fontSize: '0.9375rem',
              color: 'var(--color-bone)',
              letterSpacing: '-0.02em',
            }}>
              Interactive Arcade
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate)' }}>
              Built-in strategy and embedded party games
            </div>
          </div>
        </div>

        {/* Game Tabs: 9999px pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {CASUAL_GAMES.map((g) => {
            const isSelected = selectedGame.name === g.name;
            return (
              <button
                key={g.name}
                onClick={() => handleSelectGame(g)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-pill)',
                  background: isSelected ? 'var(--color-snow-white)' : '#1a1a1a',
                  border: isSelected ? '1px solid var(--color-snow-white)' : '1px solid var(--color-hairline)',
                  color: isSelected ? 'var(--color-graphite)' : 'var(--color-ash)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
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
              borderRadius: 'var(--radius-ui)',
              background: '#1a1a1a',
              border: '1px solid var(--color-hairline)',
              color: 'var(--color-bone)',
              fontSize: '0.75rem',
              outline: 'none',
              width: 170,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-snow-white)',
              color: 'var(--color-graphite)',
              fontWeight: 500,
              border: 'none',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Load
          </button>
        </form>
      </div>

      {/* Game Content Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#0e0e0e' }}>
        {selectedGame.type === 'builtin' ? (
          /* Built-in Tic-Tac-Toe */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2.5rem',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '1.25rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: 'var(--color-bone)',
              letterSpacing: '-0.025em',
            }}>
              {tttState.winner
                ? tttState.winner === 'Draw'
                  ? "It's a draw 🤝"
                  : `Winner: ${tttState.winner} ✦`
                : `Next turn: ${tttState.xIsNext ? 'X' : 'O'}`}
            </h3>

            {/* 3x3 Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 90px)',
              gridTemplateRows: 'repeat(3, 90px)',
              gap: '8px',
              background: '#161616',
              border: '1px solid var(--color-hairline)',
              padding: '8px',
              borderRadius: 'var(--radius-card)',
              margin: '1.5rem 0',
            }}>
              {tttState.board.map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTttClick(idx)}
                  style={{
                    background: '#1f1f1f',
                    border: '1px solid var(--color-hairline-subtle)',
                    borderRadius: 'var(--radius-ui)',
                    fontSize: '1.75rem',
                    fontWeight: 500,
                    color: cell === 'X' ? 'var(--color-snow-white)' : 'var(--accent-violet)',
                    cursor: cell || tttState.winner ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-dm-sans)',
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  {cell}
                </button>
              ))}
            </div>

            <button
              onClick={handleTttReset}
              className="btn-dimension-secondary"
              style={{
                padding: '0.5rem 1.4rem',
                fontSize: '0.8125rem',
                marginTop: '0.5rem',
              }}
            >
              Restart Game
            </button>
          </div>
        ) : (
          /* Embedded Web Game iframe */
          <iframe
            src={gameUrl || selectedGame.url}
            title={selectedGame.name}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#0a0a0a',
            }}
          />
        )}
      </div>
    </div>
  );
}
