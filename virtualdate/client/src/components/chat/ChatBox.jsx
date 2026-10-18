import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import api from '../../services/api';

const MONO_REACTIONS = ['♡', '✦', '☾', '❋', '◌', '✧'];

export default function ChatBox({ roomId }) {
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage } = useRoomStore();
  const [text, setText] = useState('');
  const [particles, setParticles] = useState([]);
  const messagesEndRef = useRef(null);

  // 1. Fetch message history
  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      try {
        const { data } = await api.get(`/rooms/${roomId}/messages`);
        if (mounted && Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.warn('Could not fetch message history:', err.message);
      }
    };
    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [roomId, setMessages]);

  // 2. Direct socket listener on ChatBox for reaction particles
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceive = (msg) => {
      if (msg && (msg.type === 'emoji' || MONO_REACTIONS.includes(msg.text))) {
        spawnParticle(msg.text);
      }
    };

    socket.on('chat:receive', handleReceive);
    return () => {
      socket.off('chat:receive', handleReceive);
    };
  }, []);

  // 3. Smooth auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const spawnParticle = (glyph) => {
    const id = Date.now() + Math.random();
    setParticles((prev) => [
      ...prev,
      {
        id,
        glyph,
        x: Math.random() * 70 + 15,
      },
    ]);
    // Guaranteed removal after animation duration so icons never get stuck overlaying chat
    setTimeout(() => {
      setParticles((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const socket = getSocket();
    const tempId = 'temp_' + Date.now();
    const senderObj = {
      _id: user?._id || user?.id || 'me',
      username: user?.username || 'You',
      avatar: user?.avatar || '',
    };

    // Optimistic UI addition so user sees their note immediately
    const optimisticMsg = {
      _id: tempId,
      roomId,
      sender: senderObj,
      senderName: senderObj.username,
      senderAvatar: senderObj.avatar,
      text: trimmed,
      type: 'text',
      sentAt: new Date().toISOString(),
    };
    addMessage(optimisticMsg);

    // Emit over socket
    if (socket) {
      socket.emit('chat:send', {
        roomId,
        text: trimmed,
        type: 'text',
      });
    }

    setText('');
  };

  const sendQuickReaction = (reaction) => {
    const socket = getSocket();
    const tempId = 'temp_' + Date.now();
    const senderObj = {
      _id: user?._id || user?.id || 'me',
      username: user?.username || 'You',
      avatar: user?.avatar || '',
    };

    spawnParticle(reaction);

    addMessage({
      _id: tempId,
      roomId,
      sender: senderObj,
      text: reaction,
      type: 'emoji',
      sentAt: new Date().toISOString(),
    });

    if (socket) {
      socket.emit('chat:send', {
        roomId,
        text: reaction,
        type: 'emoji',
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--k1)',
        border: '1px solid var(--line)',
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Floating particles rising with blur */}
      {particles.map((p) => (
        <div
          key={p.id}
          onAnimationEnd={() => setParticles((prev) => prev.filter((item) => item.id !== p.id))}
          style={{
            position: 'absolute',
            bottom: 70,
            right: `${p.x}%`,
            fontSize: '1.45rem',
            color: 'var(--w)',
            textShadow: '0 0 16px rgba(255, 255, 255, 0.85)',
            pointerEvents: 'none',
            zIndex: 60,
            animation: 'riseAndBlur 2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {p.glyph}
        </div>
      ))}

      {/* Header */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--k2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--w)' }}>✦</span>
          <span
            style={{
              fontWeight: 500,
              fontSize: '0.9375rem',
              color: 'var(--w)',
              letterSpacing: '-0.02em',
            }}
          >
            Team Chat
          </span>
        </div>
        <span
          className="mono"
          style={{
            fontSize: '0.75rem',
            color: 'var(--w3)',
          }}
        >
          {messages.length} messages
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--w3)',
              margin: 'auto 0',
              fontSize: '0.8125rem',
              padding: '2rem 1rem',
            }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>💬</div>
            <p style={{ color: 'var(--w2)', fontWeight: 400, margin: 0 }}>No messages yet.</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--w3)', marginTop: '0.25rem' }}>
              Send a note or reaction pulse to your team.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const currentUserId = String(user?._id || user?.id || '');
            const currentUsername = String(user?.username || '').toLowerCase();
            const senderId = String(msg.sender?._id || msg.sender || '');
            const senderName = String(msg.sender?.username || msg.senderName || 'Teammate');
            const avatar = msg.sender?.avatar || msg.senderAvatar;

            const isMe =
              (currentUserId && senderId && currentUserId === senderId) ||
              (currentUsername && senderName.toLowerCase() === currentUsername);

            const isGlyphOnly =
              msg.type === 'emoji' ||
              MONO_REACTIONS.includes(msg.text) ||
              (msg.text.length <= 4 && /\p{Emoji}/u.test(msg.text));

            return (
              <div
                key={msg._id || idx}
                style={{
                  display: 'flex',
                  gap: '0.55rem',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                }}
              >
                {/* Tiny Avatar: Filled for you, outline for partner */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: avatar
                      ? `url(${avatar}) center/cover`
                      : isMe
                      ? 'var(--w)'
                      : 'transparent',
                    border: isMe ? 'none' : '1.5px solid var(--w)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: isMe ? 'var(--k)' : 'var(--w)',
                    flexShrink: 0,
                    marginBottom: 2,
                  }}
                >
                  {!avatar && (senderName?.[0]?.toUpperCase() || (isMe ? 'Y' : 'P'))}
                </div>

                <div>
                  <div
                    className="mono"
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--w3)',
                      marginBottom: '0.25rem',
                      textAlign: isMe ? 'right' : 'left',
                    }}
                  >
                    {isMe ? 'You' : senderName} &bull;{' '}
                    {new Date(msg.sentAt || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  <div
                    style={{
                      padding: isGlyphOnly ? '0.2rem' : '0.625rem 0.95rem',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isGlyphOnly
                        ? 'transparent'
                        : isMe
                        ? 'var(--w)'
                        : 'var(--glass)',
                      border: isGlyphOnly
                        ? 'none'
                        : isMe
                        ? 'none'
                        : '1px solid var(--line)',
                      color: isMe && !isGlyphOnly ? 'var(--k)' : 'var(--w1)',
                      fontWeight: isMe && !isGlyphOnly ? 500 : 400,
                      fontSize: isGlyphOnly ? '1.75rem' : '0.875rem',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Monochrome Quick Reactions Bar */}
      <div
        style={{
          padding: '0.45rem 0.75rem',
          background: 'var(--k2)',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        {MONO_REACTIONS.map((glyph) => (
          <button
            key={glyph}
            type="button"
            onClick={() => sendQuickReaction(glyph)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1rem',
              color: 'var(--w2)',
              cursor: 'pointer',
              padding: '0.2rem 0.45rem',
              borderRadius: 6,
              transition: 'color 0.2s, transform 0.2s',
            }}
            title="Send reaction"
          >
            {glyph}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '0.75rem',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: '0.5rem',
          background: 'var(--k1)',
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a team message or meeting note..."
          style={{
            flex: 1,
            padding: '0.625rem 0.95rem',
            borderRadius: 999,
            background: 'var(--k2)',
            border: '1px solid var(--line)',
            color: 'var(--w)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="pill"
          style={{
            padding: '8px 18px',
            fontSize: '0.8125rem',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
