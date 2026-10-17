import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';
import { useRoomStore } from '../../store/roomStore';

export default function UniversalVideoPlayer({ roomId }) {
  const { movieState, setMovieState } = useRoomStore();
  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState(
    movieState?.url || 'https://www.youtube.com/watch?v=TURbeWK2wwg'
  );
  const [videoType, setVideoType] = useState('youtube'); // 'youtube' | 'direct' | 'embed'
  const [partnerNotice, setPartnerNotice] = useState('');
  const videoRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Helper: detect video type from URL
  const detectType = (url) => {
    if (!url) return 'youtube';
    const trimmed = url.trim().toLowerCase();
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      return 'youtube';
    }
    if (
      trimmed.endsWith('.mp4') ||
      trimmed.endsWith('.webm') ||
      trimmed.endsWith('.ogg') ||
      trimmed.endsWith('.mov') ||
      trimmed.endsWith('.m3u8') ||
      trimmed.includes('commondatastorage.googleapis.com') ||
      trimmed.includes('w3schools.com')
    ) {
      return 'direct';
    }
    return 'embed';
  };

  // Helper: extract YouTube embed ID
  const extractYouTubeId = (url) => {
    if (!url) return 'TURbeWK2wwg';
    const trimmed = url.trim();
    if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.')) {
      return trimmed;
    }
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = trimmed.match(regExp);
    return match ? match[1] : trimmed;
  };

  // Listen to incoming movie sync events from partner
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleSync = (data) => {
      if (data.url && data.url !== currentUrl) {
        setCurrentUrl(data.url);
        const detected = data.type || detectType(data.url);
        setVideoType(detected);
        setMovieState({ url: data.url, type: detected });
      }

      if (data.updatedBy) {
        setPartnerNotice(`${data.updatedBy} synced the cinema 🎬`);
        setTimeout(() => setPartnerNotice(''), 3000);
      }

      // Sync HTML5 direct video playback
      if (videoRef.current) {
        isSyncingRef.current = true;
        if (data.currentTime !== undefined && Math.abs(videoRef.current.currentTime - data.currentTime) > 1.5) {
          videoRef.current.currentTime = data.currentTime;
        }
        if (data.playing === true && videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        } else if (data.playing === false && !videoRef.current.paused) {
          videoRef.current.pause();
        }
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 500);
      }
    };

    socket.on('movie:sync', handleSync);
    return () => {
      socket.off('movie:sync', handleSync);
    };
  }, [currentUrl, setMovieState]);

  // Load new URL
  const handleLoad = (e) => {
    e?.preventDefault();
    if (!urlInput.trim()) return;
    const cleanUrl = urlInput.trim();
    const detected = detectType(cleanUrl);

    setCurrentUrl(cleanUrl);
    setVideoType(detected);
    setMovieState({ url: cleanUrl, type: detected });

    const socket = getSocket();
    socket?.emit('movie:load', { roomId, url: cleanUrl, type: detected });
    setUrlInput('');
  };

  const loadPreset = (url, name) => {
    const detected = detectType(url);
    setCurrentUrl(url);
    setVideoType(detected);
    setMovieState({ url, type: detected });
    const socket = getSocket();
    socket?.emit('movie:load', { roomId, url, type: detected });
  };

  const onDirectPlay = () => {
    if (isSyncingRef.current) return;
    const socket = getSocket();
    socket?.emit('movie:play', {
      roomId,
      currentTime: videoRef.current?.currentTime || 0,
    });
  };

  const onDirectPause = () => {
    if (isSyncingRef.current) return;
    const socket = getSocket();
    socket?.emit('movie:pause', {
      roomId,
      currentTime: videoRef.current?.currentTime || 0,
    });
  };

  const onDirectSeeked = () => {
    if (isSyncingRef.current) return;
    const socket = getSocket();
    socket?.emit('movie:seek', {
      roomId,
      currentTime: videoRef.current?.currentTime || 0,
    });
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
      position: 'relative',
    }}>
      {/* Dimension Header Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-dm-sans)',
                fontWeight: 500,
                fontSize: '0.9375rem',
                color: 'var(--color-bone)',
                letterSpacing: '-0.02em',
              }}>
                Universal Cinema
              </span>
              <span style={{
                fontSize: '0.6875rem',
                padding: '0.15rem 0.6rem',
                borderRadius: 'var(--radius-pill)',
                background: '#1a1a1a',
                border: '1px solid var(--color-hairline)',
                color: 'var(--color-ash)',
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
              }}>
                {videoType === 'youtube' ? 'YouTube' : videoType === 'direct' ? 'MP4/WebM' : 'Stream'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate)' }}>
              Paste YouTube or MP4/WebM video link to stream in real-time sync
            </span>
          </div>
        </div>

        {/* Video URL Input Bar */}
        <form onSubmit={handleLoad} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: 440 }}>
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste YouTube, MP4, or WebM URL..."
            style={{
              flex: 1,
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-ui)',
              background: '#1a1a1a',
              border: '1px solid var(--color-hairline)',
              color: 'var(--color-bone)',
              fontSize: '0.8125rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-snow-white)',
              color: 'var(--color-graphite)',
              fontWeight: 500,
              border: '1px solid var(--color-snow-white)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Play
          </button>
        </form>
      </div>

      {/* Partner Action Toast */}
      {partnerNotice && (
        <div style={{
          position: 'absolute',
          top: 64,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          background: 'rgba(22, 22, 22, 0.95)',
          border: '1px solid var(--color-hairline)',
          backdropFilter: 'blur(8px)',
          color: 'var(--color-bone)',
          padding: '0.4rem 1.1rem',
          borderRadius: 'var(--radius-pill)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          animation: 'fadeIn 180ms ease-out',
        }}>
          {partnerNotice}
        </div>
      )}

      {/* Main Video Viewport */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {videoType === 'youtube' ? (
          <iframe
            key={currentUrl}
            src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(currentUrl)}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
            title="Universal Video Player"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : videoType === 'direct' ? (
          <video
            ref={videoRef}
            src={currentUrl}
            controls
            autoPlay
            playsInline
            onPlay={onDirectPlay}
            onPause={onDirectPause}
            onSeeked={onDirectSeeked}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#0a0a0a',
            }}
          />
        ) : (
          <iframe
            key={currentUrl}
            src={currentUrl}
            title="External Video Player"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>

      {/* Dimension Presets Bar */}
      <div style={{
        padding: '0.65rem 1.25rem',
        background: 'var(--color-graphite)',
        borderTop: '1px solid var(--color-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.6rem',
        fontSize: '0.8125rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--color-slate)', fontSize: '0.75rem', fontWeight: 400 }}>
            Curated Streams:
          </span>
          <button
            onClick={() => loadPreset('https://www.youtube.com/watch?v=TURbeWK2wwg', 'Rain & Piano')}
            style={presetBtnStyle}
          >
            🌧️ Rain & Fireplace
          </button>
          <button
            onClick={() => loadPreset('https://www.youtube.com/watch?v=jfKfPfyJRdk', 'Lofi Cafe')}
            style={presetBtnStyle}
          >
            ☕ Lofi Cafe
          </button>
          <button
            onClick={() => loadPreset('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Big Buck Bunny (MP4)')}
            style={presetBtnStyle}
          >
            🎬 Big Buck Bunny (MP4)
          </button>
          <button
            onClick={() => loadPreset('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'Elephants Dream (MP4)')}
            style={presetBtnStyle}
          >
            🐘 Elephant's Dream (MP4)
          </button>
        </div>

        <span style={{ color: 'var(--color-slate)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          ✦ Synchronized playback active
        </span>
      </div>
    </div>
  );
}

const presetBtnStyle = {
  background: '#1a1a1a',
  border: '1px solid var(--color-hairline)',
  color: 'var(--color-ash)',
  padding: '0.35rem 0.8rem',
  borderRadius: 'var(--radius-pill)',
  fontSize: '0.75rem',
  cursor: 'pointer',
  transition: 'border-color var(--transition-fast), color var(--transition-fast)',
};
