import React, { useEffect, useState } from 'react';
import { getSocket } from '../../services/socket';
import { useRoomStore } from '../../store/roomStore';

export default function YouTubePlayer({ roomId }) {
  const { movieState, setMovieState } = useRoomStore();
  const [urlInput, setUrlInput] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState('dQw4w9WgXcQ');
  const [isCopied, setIsCopied] = useState(false);

  // Parse YouTube video ID from any format (shorts, youtu.be, embed, watch)
  const extractVideoId = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.')) {
      return trimmed;
    }
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = trimmed.match(regExp);
    return match ? match[1] : trimmed;
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleSync = (data) => {
      if (data.url) {
        setMovieState({ url: data.url });
        const vid = extractVideoId(data.url);
        if (vid) setCurrentVideoId(vid);
      }
    };

    socket.on('movie:sync', handleSync);
    return () => {
      socket.off('movie:sync', handleSync);
    };
  }, [setMovieState]);

  const handleLoad = (e) => {
    e?.preventDefault();
    if (!urlInput.trim()) return;
    const vid = extractVideoId(urlInput);
    if (!vid) return;

    setCurrentVideoId(vid);
    setMovieState({ url: urlInput.trim() });

    const socket = getSocket();
    socket?.emit('movie:load', { roomId, url: urlInput.trim() });
    setUrlInput('');
  };

  const loadPreset = (url) => {
    const vid = extractVideoId(url);
    setCurrentVideoId(vid);
    setMovieState({ url });
    const socket = getSocket();
    socket?.emit('movie:load', { roomId, url });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(15, 12, 24, 0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: 18,
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Sleek Theater Header Bar */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: 'rgba(20, 16, 32, 0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📺</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
            Synchronized Presentation
          </span>
          <span style={{
            fontSize: '0.7rem',
            padding: '0.2rem 0.5rem',
            borderRadius: 999,
            background: 'rgba(244, 63, 94, 0.15)',
            color: 'var(--accent-rose-soft)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
          }}>
            Synchronized IFrame
          </span>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleLoad} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: 440 }}>
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste YouTube link (demo, sprint walkthrough, presentation)..."
            style={{
              flex: 1,
              padding: '0.5rem 0.85rem',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: '#fff',
              fontSize: '0.825rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-violet))',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              fontSize: '0.825rem',
            }}
          >
            Play
          </button>
        </form>
      </div>

      {/* Main YouTube IFrame Player */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <iframe
          key={currentVideoId}
          src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
          title="Movie Player"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Productive Stream Preset Suggestions */}
      <div style={{
        padding: '0.65rem 1.25rem',
        background: 'rgba(15, 12, 24, 0.7)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.6rem',
        fontSize: '0.8rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)' }}>Productivity Streams:</span>
          <button
            onClick={() => loadPreset('https://www.youtube.com/watch?v=TURbeWK2wwg')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '0.3rem 0.65rem',
              borderRadius: 8,
              fontSize: '0.75rem',
            }}
          >
            🌧️ Rain & Piano
          </button>
          <button
            onClick={() => loadPreset('https://www.youtube.com/watch?v=jfKfPfyJRdk')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '0.3rem 0.65rem',
              borderRadius: 8,
              fontSize: '0.75rem',
            }}
          >
            ☕ Lofi Focus
          </button>
          <button
            onClick={() => loadPreset('https://www.youtube.com/watch?v=5qap5aO4i9A')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: '0.3rem 0.65rem',
              borderRadius: 8,
              fontSize: '0.75rem',
            }}
          >
            ⚡ Midnight Flow
          </button>
        </div>

        <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>
          💡 When you paste a link, your team sees the same video instantly!
        </span>
      </div>
    </div>
  );
}
