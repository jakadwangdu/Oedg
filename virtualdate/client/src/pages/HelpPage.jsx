import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import api from '../services/api';

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState({
    name: '',
    email: '',
    category: 'Video Call & Screen Share',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '', ticketId: '' });

  const faqs = [
    {
      q: 'How do I allow camera and microphone permissions?',
      a: 'When you click "Start Video Call", your browser displays a permission prompt. Click "Allow". If you accidentally blocked permissions, click the camera / padlock icon in your browser address bar (on desktop or mobile) and set Camera and Microphone to "Allow", then refresh the room.',
    },
    {
      q: 'How does Screen Share work on mobile and desktop?',
      a: 'On desktop, click "Share Screen" in the Video Workspace. You can choose to share your entire screen, an application window, or a specific browser tab. Your live screen preview will appear immediately, with a Fullscreen toggle and optional camera picture-in-picture. On smartphones, screen sharing requires iOS 15.1+ or Android 10+ with browser screen capture support.',
    },
    {
      q: 'Can team members enter a room without creating an account?',
      a: 'Yes, completely! When you create a room, you can copy the room link or open the QR code. Attendees can scan the QR code directly from their phone camera or our website QR scanner, and they will immediately enter the workspace as an anonymous guest with full video, chat, presentation, and canvas access.',
    },
    {
      q: 'How does Presentation and Audio synchronization work?',
      a: 'In the Present tab, paste any YouTube link or direct video URL. When you hit play, pause, or seek to a different timestamp, Socket.IO broadcasts the action to your team with millisecond precision, ensuring all attendees are viewing the exact same timestamp.',
    },
    {
      q: 'What should I do if I hear an audio echo or feedback?',
      a: 'Echo occurs when a microphone picks up speaker output. To prevent echo, attendees should use headphones or earbuds, or click "Mute" when not speaking. Oedg also has built-in WebRTC echo cancellation and noise suppression enabled automatically.',
    },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: '', text: '', ticketId: '' });

    try {
      const deviceInfo = `${navigator.userAgent} (Screen: ${window.innerWidth}x${window.innerHeight})`;
      const { data } = await api.post('/inquiries/help', {
        ...form,
        deviceInfo,
      });

      setStatusMessage({
        type: 'success',
        text: data.message || 'Help request submitted successfully!',
        ticketId: data.ticketId,
      });

      setForm({
        name: '',
        email: '',
        category: 'Video Call & Screen Share',
        message: '',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit help ticket. Please try again.',
        ticketId: '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--k)', color: 'var(--w1)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <nav
        style={{
          borderBottom: '1px solid var(--line)',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--k1)',
        }}
      >
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Logo size={24} word={true} />
        </Link>
        <Link to="/" className="mono" style={{ color: 'var(--w2)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to workspace
        </Link>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div
            className="mono"
            style={{
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'var(--w3)',
              marginBottom: '1rem',
            }}
          >
            WORKSPACE SUPPORT
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 500,
              letterSpacing: '-0.04em',
              color: 'var(--w)',
              marginBottom: '1rem',
              lineHeight: 1.15,
            }}
          >
            Help & Troubleshooting
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--w2)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Quick solutions to common questions, device troubleshooting, and direct support.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div style={{ marginBottom: '4.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 500, color: 'var(--w)', marginBottom: '1.5rem' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--k1)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--w)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '1rem',
                    fontWeight: 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    gap: '1rem',
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '1.25rem', color: 'var(--w3)', transform: openFaq === idx ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
                    +
                  </span>
                </button>
                {openFaq === idx && (
                  <div
                    style={{
                      padding: '0 1.5rem 1.25rem',
                      color: 'var(--w2)',
                      fontSize: '0.925rem',
                      lineHeight: 1.6,
                      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Support Request Form Card */}
        <div
          style={{
            background: 'var(--k1)',
            border: '1px solid var(--line)',
            borderRadius: 24,
            padding: 'clamp(2rem, 4vw, 3rem)',
            boxShadow: '0 30px 90px rgba(255, 255, 255, 0.03)',
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.5rem' }}>
              Submit a Support Request
            </h2>
            <p style={{ color: 'var(--w2)', fontSize: '0.9rem', margin: 0 }}>
              Facing an issue with your room, audio/video call, or screen sharing? Send us the details and we will investigate.
            </p>
          </div>

          {statusMessage.text && (
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 14,
                marginBottom: '1.75rem',
                background: statusMessage.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${statusMessage.type === 'success' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: statusMessage.type === 'success' ? '#4ade80' : '#f87171',
                fontSize: '0.9rem',
                lineHeight: 1.5,
              }}
            >
              <div>{statusMessage.text}</div>
              {statusMessage.ticketId && (
                <div className="mono" style={{ fontSize: 12, marginTop: '0.4rem', color: 'var(--w2)' }}>
                  Support Ticket: {statusMessage.ticketId}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Your Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your display name"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Contact Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@domain.com"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Issue Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={selectStyle}
              >
                <option value="Video Call & Screen Share">Video Call & Screen Share</option>
                <option value="Audio / Microphone Issues">Audio / Microphone Issues</option>
                <option value="Cinema & Music Sync">Cinema & Music Sync</option>
                <option value="Room Link & QR Scanner">Room Link & QR Scanner</option>
                <option value="Account / Google Login">Account / Google Login</option>
                <option value="Other Technical Question">Other Technical Question</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Describe the Issue in Detail *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                placeholder="What happened? Include any error messages, browser names, or steps to reproduce..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="pill"
              style={{
                padding: '13px',
                fontSize: '0.95rem',
                fontWeight: 500,
                marginTop: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Submitting ticket...' : 'Submit Help Request'}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'var(--w2)',
  marginBottom: '0.45rem',
  fontWeight: 400,
};

const inputStyle = {
  width: '100%',
  padding: '0.85rem 1.1rem',
  borderRadius: 12,
  background: 'var(--k2)',
  border: '1px solid var(--line)',
  color: 'var(--w)',
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle = {
  width: '100%',
  padding: '0.85rem 1.1rem',
  borderRadius: 12,
  background: 'var(--k2)',
  border: '1px solid var(--line)',
  color: 'var(--w)',
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'pointer',
};
