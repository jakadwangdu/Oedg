import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../services/socket';
import { useRoomStore } from '../../store/roomStore';

const ROMANTIC_TRACKS = [
  {
    id: 'lofi-1',
    title: 'Midnight Candlelight Lofi',
    artist: 'VirtualDate Sanctuary',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    cover: '🕯️',
  },
  {
    id: 'lofi-2',
    title: 'Rain on the Window Glass',
    artist: 'Cozy Raindrops',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=rain-and-nostalgia-chill-lofi-song-8193.mp3',
    cover: '🌧️',
  },
  {
    id: 'piano-1',
    title: 'Starlight Romance Piano',
    artist: 'Moonlit Melody',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=relaxed-vlog-131746.mp3',
    cover: '✨',
  },
  {
    id: 'cafe-1',
    title: 'Parisian Velvet Evening',
    artist: 'Champs-Élysées Whisper',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=lofi-chill-medium-version-12099.mp3',
    cover: '🍷',
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
            cover: '🎵',
          });
        }
      }

      if (data.updatedBy) {
        setDjNotice(`${data.updatedBy} synced the music 🎵`);
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

  const selectTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    const socket = getSocket();
    socket?.emit('music:load', {
      roomId,
      url: track.url,
      title: track.title,
      artist: track.artist,
      cover: track.cover,
    });
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    const socket = getSocket();
    socket?.emit('music:seek', { roomId, currentTime: newTime });
  };

  const handleCustomAudio = (e) => {
    e?.preventDefault();
    if (!customUrl.trim()) return;
    const track = {
      id: 'custom-' + Date.now(),
      title: 'Custom Audio Stream',
      artist: 'Shared Link',
      url: customUrl.trim(),
      cover: '📻',
    };
    selectTrack(track);
    setCustomUrl('');
  };

  const formatSec = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />

      {/* Header with Dimension Mode Switcher */}
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
                Acoustic Lounge
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
                2-Way Sync
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate)' }}>
              Shared audio playback across connected devices
            </span>
          </div>
        </div>

        {/* Dimension Pill Mode Switcher */}
        <div style={{
          display: 'flex',
          background: '#141414',
          padding: '0.25rem',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--color-hairline)',
          gap: '0.25rem',
        }}>
          <button
            onClick={() => setActiveMode('sync')}
            style={{
              padding: '0.4rem 0.95rem',
              borderRadius: 'var(--radius-pill)',
              border: activeMode === 'sync' ? '1px solid var(--color-snow-white)' : '1px solid transparent',
              background: activeMode === 'sync' ? 'var(--color-snow-white)' : 'transparent',
              color: activeMode === 'sync' ? 'var(--color-graphite)' : 'var(--color-ash)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Synced Audio 🎧
          </button>
          <button
            onClick={() => setActiveMode('dhun')}
            style={{
              padding: '0.4rem 0.95rem',
              borderRadius: 'var(--radius-pill)',
              border: activeMode === 'dhun' ? '1px solid var(--color-snow-white)' : '1px solid transparent',
              background: activeMode === 'dhun' ? 'var(--color-snow-white)' : 'transparent',
              color: activeMode === 'dhun' ? 'var(--color-graphite)' : 'var(--color-ash)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Dhun Player (lancebuddy.in) 🌐
          </button>
        </div>
      </div>

      {/* Partner Notice Toast */}
      {djNotice && (
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
          {djNotice}
        </div>
      )}

      {/* Synchronized Mode View */}
      {activeMode === 'sync' ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          gap: '1.5rem',
          overflowY: 'auto',
        }}>
          {/* Main Visual Player Card */}
          <div style={{
            background: '#121212',
            border: '1px solid var(--color-hairline)',
            borderRadius: 'var(--radius-card)', // 24px
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}>
            {/* Minimalist Spinning Artwork Circle */}
            <div style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: '#1a1a1a',
              border: '1px solid var(--color-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              marginBottom: '1.25rem',
              animation: isPlaying ? 'spin 14s linear infinite' : 'none',
            }}>
              {currentTrack?.cover || '🎵'}
            </div>

            <h3 style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: 'var(--color-bone)',
              letterSpacing: '-0.025em',
              marginBottom: '0.25rem',
            }}>
              {currentTrack?.title}
            </h3>
            <p style={{
              fontFamily: 'var(--font-geist)',
              fontSize: '0.875rem',
              color: 'var(--color-ash)',
              marginBottom: '1.5rem',
            }}>
              {currentTrack?.artist}
            </p>

            {/* Scrubber */}
            <div style={{ width: '100%', maxWidth: 380, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate)', minWidth: 35, fontFamily: 'var(--font-mono)' }}>
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
                  accentColor: 'var(--color-snow-white)',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate)', minWidth: 35, fontFamily: 'var(--font-mono)' }}>
                {formatSec(duration)}
              </span>
            </div>

            {/* Play/Pause Button: Snow White pill button */}
            <button
              onClick={togglePlay}
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--color-snow-white)',
                color: 'var(--color-graphite)',
                border: 'none',
                fontSize: '1.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform var(--transition-fast)',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          {/* Preset Tracks Grid */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.875rem',
              color: 'var(--color-slate)',
              marginBottom: '0.75rem',
              fontWeight: 500,
            }}>
              Curated Workspace Tracks:
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '0.75rem',
            }}>
              {ROMANTIC_TRACKS.map((t) => {
                const isSelected = currentTrack?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => selectTrack(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-card)',
                      background: isSelected ? '#1c1c1c' : '#141414',
                      border: `1px solid ${isSelected ? 'var(--color-hairline-strong)' : 'var(--color-hairline)'}`,
                      cursor: 'pointer',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{t.cover}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: isSelected ? 'var(--color-bone)' : 'var(--color-ash)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-slate)' }}>{t.artist}</div>
                    </div>
                    {isSelected && isPlaying && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-violet)' }}>▶</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Audio URL Input */}
          <form onSubmit={handleCustomAudio} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste direct audio MP3 stream link..."
              style={{
                flex: 1,
                padding: '0.625rem 0.95rem',
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
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-snow-white)',
                color: 'var(--color-graphite)',
                fontWeight: 500,
                border: '1px solid var(--color-snow-white)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Play
            </button>
          </form>
        </div>
      ) : (
        /* Dhun Music Player IFrame */
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', background: '#0a0a0a' }}>
          <iframe
            src="https://music.lancebuddy.in"
            title="Dhun Music Player"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; encrypted-media; fullscreen"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
