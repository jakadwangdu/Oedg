import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import YoupiCheckoutModal from '../components/payment/YoupiCheckoutModal';
import api from '../services/api';

export default function BuyPage() {
  const [searchParams] = useSearchParams();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('buy') === 'true' || searchParams.get('checkout') === 'true') {
      setCheckoutOpen(true);
    }
  }, [searchParams]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    inquiryType: 'Full Source Code & IP Purchase',
    budget: '$500 – $1,500',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '', refId: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage({ type: '', text: '', refId: '' });

    try {
      const { data } = await api.post('/inquiries/buy', form);
      setStatusMessage({
        type: 'success',
        text: data.message || 'Inquiry submitted successfully!',
        refId: data.referenceId,
      });
      setForm({
        name: '',
        email: '',
        inquiryType: 'Full Source Code & IP Purchase',
        budget: '$1,500 – $5,000',
        message: '',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit inquiry. Please try again.',
        refId: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { title: 'Peer Encrypted WebRTC Calls', desc: 'Direct browser-to-browser voice, video, and screen sharing with zero middleman recording.' },
    { title: 'Sub-Second Cinema Sync', desc: 'Synchronized cinema player with universal play, pause, and seek lockstep across devices.' },
    { title: 'Interactive Dhun & Canvas', desc: 'Collaborative ambient soundscapes, lofi music stream, and real-time whiteboard canvas.' },
    { title: 'Camera QR Code Scanner', desc: 'Instant frictionless guest entry: scan via phone camera or upload a QR image without registration.' },
    { title: 'Google OAuth & LocalDb', desc: 'Cryptographically verified Google Sign-In, plus zero-dependency local DB and MongoDB Atlas fallbacks.' },
    { title: 'Strict Monochrome UI/UX', desc: 'Distraction-free black & white aesthetic built with Geist typography, Lenis smooth scroll, and GSAP.' },
  ];

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
          ← Back to sanctuary
        </Link>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '4rem 1.5rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div
            className="mono"
            style={{
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'var(--w3)',
              marginBottom: '1rem',
            }}
          >
            COMMERCIAL & CODEBASE ACQUISITION
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
              fontWeight: 500,
              letterSpacing: '-0.04em',
              color: 'var(--w)',
              marginBottom: '1.25rem',
              lineHeight: 1.1,
            }}
          >
            Acquire or license Oedg.
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: 'var(--w2)',
              maxWidth: 680,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Own the complete, production-ready virtual sanctuary platform. Built from the ground up for privacy, real-time sync, and quiet elegance.
          </p>
        </div>

        {/* Feature Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '4.5rem',
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: 'var(--k1)',
                border: '1px solid var(--line)',
                borderRadius: 20,
                padding: '1.75rem',
              }}
            >
              <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', marginBottom: '0.5rem' }}>
                0{i + 1}
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--w)', marginBottom: '0.5rem' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--w2)', lineHeight: 1.55, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* INSTANT ACQUISITION CARD: ₹1 Test Mode via YouPI-PG */}
        <div
          style={{
            background: 'linear-gradient(180deg, var(--k2) 0%, var(--k1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 28,
            padding: 'clamp(2rem, 5vw, 3.5rem)',
            marginBottom: '3rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'var(--w3)',
              marginBottom: '0.75rem',
            }}
          >
            OFFICIAL PLATFORM SALE &middot; 0% FEE YOUPI-PG
          </div>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 500,
              letterSpacing: '-0.035em',
              color: 'var(--w)',
              marginBottom: '0.75rem',
            }}
          >
            Buy this Website for ₹1 (Test Mode)
          </h2>
          <p
            style={{
              color: 'var(--w2)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              maxWidth: 620,
              margin: '0 auto 2rem',
            }}
          >
            Instant ownership transfer. Includes complete frontend & backend source code, GitHub repository transfer, Vercel deployment credentials, and peer WebRTC video architecture.
          </p>

          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <button
              onClick={() => setCheckoutOpen(true)}
              className="pill"
              style={{
                fontSize: '1.1rem',
                padding: '16px 40px',
                background: '#fff',
                color: '#000',
                fontWeight: 600,
                boxShadow: '0 10px 30px rgba(255, 255, 255, 0.15)',
              }}
            >
              🏷️ Buy Website for ₹1 (Test Payment) →
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--w3)' }}>
              🔒 Powered by YouPI-PG UPI Gateway &middot; Enter your phone number for direct handover
            </span>
          </div>
        </div>

        {/* Contact / Custom Whitelabel Inquiry Form Card */}
        <div
          style={{
            background: 'var(--k1)',
            border: '1px solid var(--line)',
            borderRadius: 28,
            padding: 'clamp(2rem, 5vw, 3.5rem)',
            boxShadow: '0 40px 120px rgba(255, 255, 255, 0.04)',
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span style={{ fontSize: '2rem' }}>🏷️</span>
              <h2
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 500,
                  color: 'var(--w)',
                  letterSpacing: '-0.035em',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                Inquire to Purchase
              </h2>
              <p style={{ color: 'var(--w2)', fontSize: '0.9375rem', margin: 0 }}>
                Fill out the form below. The creator will get in touch with full documentation, repository transfer details, or licensing terms.
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
                {statusMessage.refId && (
                  <div className="mono" style={{ fontSize: 12, marginTop: '0.4rem', color: 'var(--w2)' }}>
                    Inquiry Ref: {statusMessage.refId}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Your Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Alex Rivera"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Business Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="alex@company.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Inquiry Type</label>
                  <select
                    name="inquiryType"
                    value={form.inquiryType}
                    onChange={handleChange}
                    style={selectStyle}
                  >
                    <option value="Full Source Code & IP Purchase">Full Source Code & IP Purchase</option>
                    <option value="Single Domain Whitelabel License">Single Domain Whitelabel License</option>
                    <option value="SaaS Partnership / Commercial Rights">SaaS Partnership / Commercial Rights</option>
                    <option value="Custom Tailored Deployment">Custom Tailored Deployment</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Proposed Budget Range</label>
                  <select
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    style={selectStyle}
                  >
                    <option value="$500 – $1,500">$500 – $1,500</option>
                    <option value="$1,500 – $5,000">$1,500 – $5,000</option>
                    <option value="$5,000 – $15,000">$5,000 – $15,000</option>
                    <option value="$15,000+">$15,000+</option>
                    <option value="Custom / Negotiable">Custom / Negotiable</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Message / Specific Requirements *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Tell us about your project, timeline, or any specific questions about the codebase..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="pill"
                style={{
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  marginTop: '0.75rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Submitting inquiry...' : 'Send Acquisition Inquiry'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* YouPI-PG Purchase & Transfer Modal */}
      <YoupiCheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />

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
