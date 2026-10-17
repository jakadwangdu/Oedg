import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import { useRoomStore } from '../../store/roomStore';
import api from '../../services/api';

const QUICK_REACTIONS = ['❤️', '✨', '🥰', '🍿', '🌹', '🥂', '🧸', '💖', '🔥', '👀'];

export default function ChatBox({ roomId }) {
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage } = useRoomStore();
  const [text, setText] = useState('');
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

  // 2. Direct socket listener on ChatBox for 100% reliable reception
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceive = (msg) => {
      if (msg) {
        addMessage(msg);
      }
    };

    socket.on('chat:receive', handleReceive);
    return () => {
      socket.off('chat:receive', handleReceive);
    };
  }, [addMessage]);

  // 3. Smooth auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--color-graphite)',
      border: '1px solid var(--color-hairline)',
      borderRadius: 'var(--radius-card)', // 24px
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid var(--color-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(22, 22, 22, 0.9)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--accent-violet)' }}>✦</span>
          <span style={{
            fontFamily: 'var(--font-dm-sans)',
            fontWeight: 500,
            fontSize: '0.9375rem',
            color: 'var(--color-bone)',
            letterSpacing: '-0.02em',
          }}>
            Whisper Notes
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--color-slate)',
        }}>
          {messages.length} notes
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--color-slate)',
            margin: 'auto 0',
            fontSize: '0.8125rem',
            padding: '2rem 1rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.8 }}>✉️</div>
            <p style={{ color: 'var(--color-ash)', fontWeight: 400 }}>No whispers yet.</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-slate)', marginTop: '0.25rem' }}>
              Send a note or reaction to make your partner smile!
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const currentUserId = String(user?._id || user?.id || '');
            const currentUsername = String(user?.username || '').toLowerCase();
            const senderId = String(msg.sender?._id || msg.sender || '');
            const senderName = String(msg.sender?.username || msg.senderName || 'Partner');
            const avatar = msg.sender?.avatar || msg.senderAvatar;

            const isMe = (currentUserId && senderId && currentUserId === senderId) ||
                         (currentUsername && senderName.toLowerCase() === currentUsername);

            const isEmojiOnly = msg.type === 'emoji' || (msg.text.length <= 4 && /\p{Emoji}/u.test(msg.text));

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
                {/* Tiny Avatar */}
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: avatar ? `url(${avatar}) center/cover` : '#222',
                  border: '1px solid var(--color-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  color: 'var(--color-bone)',
                  flexShrink: 0,
                  marginBottom: 2,
                }}>
                  {!avatar && (senderName?.[0]?.toUpperCase() || '?')}
                </div>

                <div>
                  <div style={{
                    fontSize: '0.6875rem',
                    color: 'var(--color-slate)',
                    marginBottom: '0.25rem',
                    textAlign: isMe ? 'right' : 'left',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {isMe ? 'You' : senderName} &bull; {new Date(msg.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div style={{
                    padding: isEmojiOnly ? '0.2rem' : '0.625rem 0.95rem',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isEmojiOnly
                      ? 'transparent'
                      : isMe
                      ? 'var(--color-snow-white)'
                      : '#1e1e1e',
                    border: isEmojiOnly
                      ? 'none'
                      : isMe
                      ? '1px solid var(--color-snow-white)'
                      : '1px solid var(--color-hairline)',
                    color: isMe && !isEmojiOnly ? 'var(--color-graphite)' : 'var(--color-bone)',
                    fontWeight: isMe && !isEmojiOnly ? 500 : 400,
                    fontSize: isEmojiOnly ? '1.875rem' : '0.875rem',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reactions Bar */}
      <div style={{
        padding: '0.45rem 0.75rem',
        background: '#131313',
        borderTop: '1px solid var(--color-hairline)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        overflowX: 'auto',
      }}>
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => sendQuickReaction(emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.05rem',
              cursor: 'pointer',
              padding: '0.2rem 0.35rem',
              borderRadius: 6,
            }}
            title="Send reaction"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Field with Enter-to-send */}
      <form onSubmit={handleSend} style={{
        padding: '0.75rem',
        borderTop: '1px solid var(--color-hairline)',
        display: 'flex',
        gap: '0.5rem',
        background: 'var(--color-graphite)',
      }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Whisper a message (Enter to send)..."
          style={{
            flex: 1,
            padding: '0.625rem 0.95rem',
            borderRadius: 'var(--radius-ui)',
            background: '#1a1a1a',
            border: '1px solid var(--color-hairline)',
            color: 'var(--color-bone)',
            fontSize: '0.875rem',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.625rem 1.15rem',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-snow-white)',
            color: 'var(--color-graphite)',
            fontWeight: 500,
            border: '1px solid var(--color-snow-white)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
