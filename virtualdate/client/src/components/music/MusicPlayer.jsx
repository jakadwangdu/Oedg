import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';
import { useRoomStore } from '../../store/roomStore';

const ROMANTIC_TRACKS = [
  {
    id: 'lofi-1',
    title: 'Midnight Candlelight Lofi',
    artist: 'VirtualDate Sanctuary',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'lofi-2',
    title: 'Rain on Window Glass',
    artist: 'Cozy Raindrops',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=rain-and-nostalgia-chill-lofi-song-8193.mp3',
  },
  {
    id: 'piano-1',
    title: 'Starlight Romance Piano',
    artist: 'Moonlit Melody',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=relaxed-vlog-131746.mp3',
  },
  {
    id: 'cafe-1',
    title: 'Parisian Velvet Evening',
    artist: 'Champs-Élysées Whisper',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=lofi-chill-medium-version-12099.mp3',
  },
];

export default function MusicPlayer({ roomId }) {
  const { musicState, setMusicState } = useRoomStore();
  const [activeMode, setActiveMode] = useState('sync'); // 'sync' | 'dhun'
  const [currentTrack, setCurrentTrack] = useState(ROMANTIC_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [customUrl, setCustomUrl] = useState('');
  const [djNotice, setDjNotice] = useState('');

  const audioRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Sync with incoming socket music events from partner
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMusicSync = (data) => {
      isSyncingRef.current = true;

      if (data.url && (!currentTrack || currentTrack.url !== data.url)) {
        const found = ROMANTIC_TRACKS.find((t) => t.url === data.url);
        if (found) {
          setCurrentTrack(found);
        } else {
          setCurrentTrack({
            id: 'custom-' + Date.now(),
            title: data.title || 'Partner Shared Audio',
            artist: data.artist || 'Web Stream',
            url: data.url,
          });
        }
      }

      if (data.updatedBy) {
        setDjNotice(`${data.updatedBy} synced the music ✦`);
        setTimeout(() => setDjNotice(''), 3000);
      }

      if (audioRef.current) {
        if (data.currentTime !== undefined && Math.abs(audioRef.current.currentTime - data.currentTime) > 1.5) {
          audioRef.current.currentTime = data.currentTime;
        }

        if (data.playing === true && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else if (data.playing === false && !audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }

      setTimeout(() => {
        isSyncingRef.current = false;
      }, 400);
    };

    socket.on('music:sync', handleMusicSync);
    return () => {
      socket.off('music:sync', handleMusicSync);
    };
  }, [currentTrack]);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const socket = getSocket();
    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true);
        socket?.emit('music:play', { roomId, currentTime: audio.currentTime });
      }).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
      socket?.emit('music:pause', { roomId, currentTime: audio.currentTime });
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    const socket = getSocket();
    socket?.emit('music:seek', { roomId, currentTime: time });
  };

  const selectTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    const socket = getSocket();
    socket?.emit('music:load', {
      roomId,
      url: track.url,
      title: track.title,
      artist: track.artist,
    });
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleLoadCustom = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const customTrack = {
      id: 'custom-' + Date.now(),
      title: 'Direct Stream Track',
      artist: 'Custom Stream URL',
      url: customUrl.trim(),
    };

    selectTrack(customTrack);
    setCustomUrl('');
  };

  const formatSec = (s) => {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
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
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--line)',
          background: 'var(--k2)',
          flexWrap: 'wrap',
          gap: '0.75rem',
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
                Dhun Player
              </span>
              <span
                className="mono"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.6rem',
                  borderRadius: 999,
                  background: 'var(--k3)',
                  border: '1px solid var(--line)',
                  color: 'var(--w2)',
                }}
              >
                2-Way Sync
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--w3)' }}>
              Shared audio playback across connected devices
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--k3)',
            padding: 3,
            borderRadius: 999,
            border: '1px solid var(--line)',
            gap: 2,
          }}
        >
          <button
            onClick={() => setActiveMode('sync')}
            style={{
              padding: '0.4rem 0.95rem',
              borderRadius: 999,
              background: activeMode === 'sync' ? 'var(--w)' : 'transparent',
              color: activeMode === 'sync' ? 'var(--k)' : 'var(--w3)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
            }}
          >
            Synced Audio
          </button>
          <button
            onClick={() => setActiveMode('dhun')}
            style={{
              padding: '0.4rem 0.95rem',
              borderRadius: 999,
              background: activeMode === 'dhun' ? 'var(--w)' : 'transparent',
              color: activeMode === 'dhun' ? 'var(--k)' : 'var(--w3)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
            }}
          >
            Dhun Web (lancebuddy.in)
          </button>
        </div>
      </div>

      {/* Partner Notice Toast */}
      {djNotice && (
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
          {djNotice}
        </div>
      )}

      {/* Synchronized Mode View */}
      {activeMode === 'sync' ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            gap: '1.5rem',
            overflowY: 'auto',
          }}
        >
          {/* Main Visual Player Card */}
          <div
            style={{
              background: 'var(--k2)',
              border: '1px solid var(--line)',
              borderRadius: 24,
              padding: '2.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Spinning Grey Vinyl from Section 8 */}
            <div
              className={`vinyl ${isPlaying ? '' : 'paused'}`}
              style={{ margin: '0 auto 1.5rem' }}
            >
              <i />
            </div>

            <h3
              style={{
                fontSize: '1.35rem',
                fontWeight: 500,
                color: 'var(--w)',
                letterSpacing: '-0.035em',
                marginBottom: '0.35rem',
              }}
            >
              {currentTrack?.title}
            </h3>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--w3)',
                marginBottom: '1.5rem',
              }}
            >
              {currentTrack?.artist}
            </p>

            {/* Scrubber */}
            <div
              style={{
                width: '100%',
                maxWidth: 420,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--w3)', minWidth: 35 }}>
                {formatSec(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  flex: 1,
                  accentColor: 'var(--w)',
                  cursor: 'pointer',
                }}
              />
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--w3)', minWidth: 35 }}>
                {formatSec(duration)}
              </span>
            </div>

            {/* Play/Pause Button: Solid white round pill */}
            <button
              onClick={togglePlay}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--w)',
                color: 'var(--k)',
                border: 'none',
                fontSize: '1.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          {/* Preset Tracks Grid */}
          <div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', marginBottom: '0.75rem' }}>
              DHUN STATIONS
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {ROMANTIC_TRACKS.map((t) => {
                const isSelected = currentTrack?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => selectTrack(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 16,
                      background: isSelected ? 'var(--glass)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--w)' : 'var(--line)'}`,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: isSelected ? 'var(--w)' : 'var(--w2)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {t.title}
                      </div>
                      <div className="mono" style={{ fontSize: '0.725rem', color: 'var(--w3)' }}>
                        {t.artist}
                      </div>
                    </div>

                    {/* Animated Equaliser Bars */}
                    {isSelected && isPlaying && (
                      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
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

          {/* Custom Stream URL input */}
          <form onSubmit={handleLoadCustom} style={{ display: 'flex', gap: '0.65rem' }}>
            <input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste direct audio stream URL (.mp3, .aac, radio stream)..."
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: 999,
                background: 'var(--k2)',
                border: '1px solid var(--line)',
                color: 'var(--w)',
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
            <button type="submit" className="pill" style={{ padding: '8px 18px', fontSize: 13 }}>
              Sync Stream
            </button>
          </form>
        </div>
      ) : (
        /* Dhun Embed Frame */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <iframe
            src="https://music.lancebuddy.in"
            title="Dhun Music Player"
            allow="autoplay; encrypted-media; fullscreen"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )}
    </div>
  );
}
