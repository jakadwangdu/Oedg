import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import api from '../../services/api';

const PRICE_INR = 4500; // 4.5K INR

export default function YoupiCheckoutModal({ isOpen, onClose }) {
  // Steps: 'confirm' -> 'phone' -> 'pay' -> 'success'
  const [step, setStep] = useState('confirm');
  
  // Buyer input state
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Payment order state
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (YouPI-PG window)
  const [copiedVpa, setCopiedVpa] = useState(false);

  // UTR submission state
  const [utr, setUtr] = useState('');
  const [verifyingUtr, setVerifyingUtr] = useState(false);
  const pollIntervalRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setErrorMsg('');
      setOrder(null);
      setQrDataUrl('');
      setUtr('');
      setTimeLeft(300);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen]);

  // Countdown timer for YouPI 5-minute checkout window
  useEffect(() => {
    if (step !== 'pay') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Status polling during payment step
  useEffect(() => {
    if (step === 'pay' && order?.orderId) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const { data } = await api.get(`/payment/status/${order.orderId}`);
          if (data?.status === 'SUCCESS') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStep('success');
          }
        } catch (e) {
          // ignore transient poll error
        }
      }, 4000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [step, order]);

  if (!isOpen) return null;

  // STEP 1 -> STEP 2
  const handleConfirmBuy = () => {
    setStep('phone');
    setErrorMsg('');
  };

  // STEP 2 -> STEP 3: Create YouPI Payment Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number so we can transfer the website to you.');
      return;
    }

    const fullPhone = `${countryCode} ${cleanPhoneDigits}`;
    setLoading(true);

    try {
      const { data } = await api.post('/payment/create-order', {
        buyerPhone: fullPhone,
        buyerName: name,
        buyerEmail: email,
      });

      setOrder(data);

      // Generate dynamic QR Code for UPI intent
      if (data.upiIntentUrl) {
        const url = await QRCode.toDataURL(data.upiIntentUrl, {
          width: 260,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      }

      setStep('pay');
      setTimeLeft(300);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to initialize YouPI payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit UTR manually
  const handleVerifyUtr = async (e) => {
    e.preventDefault();
    if (!utr || utr.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR reference number.');
      return;
    }

    setVerifyingUtr(true);
    setErrorMsg('');

    try {
      const { data } = await api.post('/payment/verify-utr', {
        orderId: order?.orderId,
        utr: utr.trim(),
      });

      if (data?.success) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setStep('success');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to verify transaction. Please check your UTR.');
    } finally {
      setVerifyingUtr(false);
    }
  };

  const copyVpa = () => {
    if (order?.upiVpa) {
      navigator.clipboard.writeText(order.upiVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--k1)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: '2rem',
          position: 'relative',
          color: 'var(--w)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--w3)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
          title="Close"
        >
          ✕
        </button>

        {/* STEP 1: ASK IF USER WANTS TO BUY THE WEBSITE */}
        {step === 'confirm' && (
          <div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--w3)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              ACQUISITION & OWNERSHIP
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              Buy Oedg Website
            </h2>
            <p style={{ color: 'var(--w2)', fontSize: '0.9375rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              Acquire full ownership, complete source code, and commercial rights for the Oedg platform.
            </p>

            {/* Price Highlight Badge */}
            <div
              style={{
                background: 'var(--k2)',
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--w3)', marginBottom: '0.2rem' }}>
                  Total Purchase Price
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--w)' }}>
                  ₹4,500 <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--w2)' }}>(4.5K INR)</span>
                </div>
              </div>
              <div
                style={{
                  background: 'var(--w)',
                  color: 'var(--k)',
                  borderRadius: 999,
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                ONE-TIME
              </div>
            </div>

            {/* Inclusions */}
            <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                'Full React + Node.js + WebRTC + Socket.IO codebase',
                'Universal Cinema Sync, Music, Whiteboard & Tic-Tac-Toe',
                'Integrated zero-fee YouPI-PG sovereign payment gateway',
                'Production Vercel deployment & GitHub repository transfer',
                'Direct engineering handover to your phone / WhatsApp',
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--w2)' }}>
                  <span style={{ color: 'var(--w)' }}>✦</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Decision prompt */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleConfirmBuy}
                className="pill"
                style={{
                  flex: 2,
                  padding: '13px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                }}
              >
                Yes, Buy for ₹4,500 →
              </button>
              <button
                onClick={onClose}
                className="pill-ghost"
                style={{
                  flex: 1,
                  padding: '13px',
                  fontSize: '0.9375rem',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TAKE USER PHONE NUMBER TO TRANSFER THE WEBSITE */}
        {step === 'phone' && (
          <div>
            <button
              onClick={() => setStep('confirm')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--w3)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginBottom: '1rem',
                padding: 0,
              }}
            >
              ← Back to Overview
            </button>

            <div className="mono" style={{ fontSize: 11, color: 'var(--w3)', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
              STEP 2 OF 3
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '0.6rem' }}>
              Transfer Details
            </h2>
            <p style={{ color: 'var(--w2)', fontSize: '0.875rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              Please provide your mobile or WhatsApp number. Our team will contact you immediately upon payment to transfer repository ownership and credentials.
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  background: 'rgba(255, 60, 60, 0.1)',
                  border: '1px solid rgba(255, 60, 60, 0.3)',
                  color: '#ff6b6b',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={labelStyle}>Phone / WhatsApp Number * (For Website Transfer)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{
                      ...inputStyle,
                      width: '95px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+61">🇦🇺 +61</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={14}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--w3)', marginTop: '0.3rem', display: 'block' }}>
                  We will ping this number to transfer repository rights & administrative keys.
                </span>
              </div>

              <div>
                <label style={labelStyle}>Your Full Name (Optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address (Optional backup)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="pill"
                style={{
                  padding: '13px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  marginTop: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Setting up YouPI Payment...' : 'Proceed to Payment (₹4,500) →'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: YOUPI-PG PAYMENT TERMINAL */}
        {step === 'pay' && order && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--w3)', letterSpacing: '0.06em' }}>
                YOUPI-PG SOVEREIGN UPI
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 12,
                  color: timeLeft < 60 ? '#ff6b6b' : 'var(--w2)',
                  background: 'var(--k2)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--line)',
                }}
              >
                ⏱ {formatTimer(timeLeft)}
              </div>
            </div>

            <div style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--w)', marginBottom: '0.25rem' }}>
              ₹{order.amount.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--w2)', marginBottom: '1.25rem' }}>
              Transferring Oedg ownership to: <strong style={{ color: 'var(--w)' }}>{order.buyerPhone}</strong>
            </div>

            {/* Dynamic QR Code Box */}
            <div
              style={{
                background: '#ffffff',
                padding: '12px',
                borderRadius: 16,
                display: 'inline-block',
                margin: '0 auto 1.25rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="YouPI-PG UPI QR Code"
                  style={{ width: 220, height: 220, display: 'block' }}
                />
              ) : (
                <div style={{ width: 220, height: 220, display: 'grid', placeItems: 'center', color: '#000' }}>
                  Generating QR...
                </div>
              )}
            </div>

            {/* UPI ID & Copy */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <span className="mono" style={{ fontSize: 12, color: 'var(--w2)' }}>
                UPI ID: <strong style={{ color: 'var(--w)' }}>{order.upiVpa}</strong>
              </span>
              <button
                onClick={copyVpa}
                style={{
                  background: 'var(--k2)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  color: 'var(--w2)',
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  cursor: 'pointer',
                }}
              >
                {copiedVpa ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Mobile 1-Tap App Shortcuts */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--w3)', marginBottom: '0.5rem' }}>
                Or tap to pay directly on your phone:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <a
                  href={order.appLinks?.gpay || order.upiIntentUrl}
                  style={appBtnStyle}
                >
                  <span>Google Pay</span>
                </a>
                <a
                  href={order.appLinks?.phonepe || order.upiIntentUrl}
                  style={appBtnStyle}
                >
                  <span>PhonePe</span>
                </a>
                <a
                  href={order.appLinks?.paytm || order.upiIntentUrl}
                  style={appBtnStyle}
                >
                  <span>Paytm</span>
                </a>
                <a
                  href={order.appLinks?.bhim || order.upiIntentUrl}
                  style={appBtnStyle}
                >
                  <span>Any UPI App</span>
                </a>
              </div>
            </div>

            {/* Manual UTR Verification Input */}
            <div
              style={{
                background: 'var(--k2)',
                borderRadius: 14,
                border: '1px solid var(--line)',
                padding: '1rem',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '0.8125rem', color: 'var(--w2)', marginBottom: '0.5rem' }}>
                Already paid? Enter 12-digit UPI UTR / Reference ID:
              </div>

              {errorMsg && (
                <div style={{ color: '#ff6b6b', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleVerifyUtr} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. 428901847291"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  maxLength={18}
                  style={{ ...inputStyle, flex: 1, padding: '0.6rem 0.85rem', fontSize: '0.875rem' }}
                />
                <button
                  type="submit"
                  disabled={verifyingUtr}
                  className="pill"
                  style={{
                    padding: '0.6rem 1rem',
                    fontSize: '0.8125rem',
                    cursor: verifyingUtr ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {verifyingUtr ? 'Verifying...' : 'Confirm'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--w)',
                color: 'var(--k)',
                fontSize: '1.75rem',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 1.25rem',
                fontWeight: 600,
              }}
            >
              ✓
            </div>

            <div className="mono" style={{ fontSize: 12, color: 'var(--w3)', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
              PAYMENT VERIFIED & RECORDED
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              Acquisition Confirmed!
            </h2>
            <p style={{ color: 'var(--w2)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Payment of <strong style={{ color: 'var(--w)' }}>₹4,500 INR</strong> was received. Transfer of Oedg repository ownership and credentials has been queued for:
            </p>

            <div
              style={{
                background: 'var(--k2)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: '1rem 1.25rem',
                marginBottom: '1.75rem',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--w3)' }}>Transfer Phone:</span>
                <span className="mono" style={{ color: 'var(--w)' }}>{order?.buyerPhone || phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--w3)' }}>Order Reference:</span>
                <span className="mono" style={{ color: 'var(--w2)', fontSize: '0.8rem' }}>{order?.orderId}</span>
              </div>
              {utr && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--w3)' }}>UTR / Transaction ID:</span>
                  <span className="mono" style={{ color: 'var(--w2)', fontSize: '0.8rem' }}>{utr}</span>
                </div>
              )}
            </div>

            <p style={{ color: 'var(--w3)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
              Our developer will reach out to your phone / WhatsApp shortly to complete repository and hosting handover.
            </p>

            <button
              onClick={onClose}
              className="pill"
              style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
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

const appBtnStyle = {
  padding: '10px',
  borderRadius: 10,
  background: 'var(--k2)',
  border: '1px solid var(--line)',
  color: 'var(--w)',
  fontSize: '0.8125rem',
  fontWeight: 500,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};
