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
        setPartnerNotice(`${data.updatedBy} synced the cinema ✦`);
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
    socket?.emit('movie:load', {
      roomId,
      url: cleanUrl,
      type: detected,
    });

    setUrlInput('');
  };

  // Direct HTML5 event handlers
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--k1)',
        borderRadius: 24,
        border: '1px solid var(--line)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top Controls Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  color: 'var(--w)',
                  letterSpacing: '-0.02em',
                }}
              >
                Universal Cinema Sync
              </span>
              <span
                className="mono"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 999,
                  background: 'var(--k3)',
                  border: '1px solid var(--line)',
                  color: 'var(--w2)',
                }}
              >
                Synced
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--w3)' }}>
              Sub-second video timeline synchronization across viewports
            </span>
          </div>
        </div>

        {/* Load URL Form */}
        <form onSubmit={handleLoad} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: 460 }}>
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste YouTube, MP4, or WebM URL..."
            style={{
              flex: 1,
              padding: '0.55rem 0.95rem',
              borderRadius: 999,
              background: 'var(--k3)',
              border: '1px solid var(--line)',
              color: 'var(--w)',
              fontSize: '0.8125rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="pill"
            style={{
              padding: '8px 18px',
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
            }}
          >
            Play
          </button>
        </form>
      </div>

      {/* Partner Action Toast */}
      {partnerNotice && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            background: 'var(--k1)',
            border: '1px solid var(--line)',
            color: 'var(--w)',
            padding: '0.4rem 1.1rem',
            borderRadius: 999,
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          {partnerNotice}
        </div>
      )}

      {/* Main Video Viewport: 20px radius frame, black canvas */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
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
              background: '#000000',
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

      {/* Preset Suggestions Bar */}
      <div
        style={{
          padding: '0.65rem 1.25rem',
          background: 'var(--k1)',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--w3)' }}>
          Curated streams:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Lofi Girl Live', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
            { label: 'Rainy Night In Tokyo', url: 'https://www.youtube.com/watch?v=5qap5aO4i9A' },
            { label: 'Big Buck Bunny (Direct HD)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setUrlInput(item.url);
                setCurrentUrl(item.url);
                const detected = detectType(item.url);
                setVideoType(detected);
                setMovieState({ url: item.url, type: detected });
                const socket = getSocket();
                socket?.emit('movie:load', { roomId, url: item.url, type: detected });
              }}
              className="pill-ghost"
              style={{
                padding: '4px 12px',
                fontSize: '0.75rem',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
