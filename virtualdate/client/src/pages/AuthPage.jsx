import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';
import HeroField from '../components/HeroField';
import QRScannerModal from '../components/room/QRScannerModal';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const { login, register, googleLogin, loading, error } = useAuthStore();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  useEffect(() => {
    // Dynamically load Google Identity Services if not already present
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGoogleSignIn = async () => {
    setLocalError('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (window.google?.accounts?.id && clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (response?.credential) {
            const res = await googleLogin({ credential: response.credential });
            if (res.success) navigate('/dashboard');
            else setLocalError(res.error);
          }
        },
      });
      window.google.accounts.id.prompt();
      return;
    }

    // Direct Google Sign-In prompt
    const userEmail = prompt('Enter your Google account email to sign in directly:');
    if (!userEmail) return;
    const cleanEmail = userEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      return setLocalError('Please enter a valid Google email address.');
    }
    const res = await googleLogin({
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      googleId: 'g_' + btoa(cleanEmail).slice(0, 16),
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
    });
    if (res.success) navigate('/dashboard');
    else setLocalError(res.error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    let result;
    if (isRegister) {
      if (!form.username.trim() || !form.email.trim() || !form.password)
        return setLocalError('All fields are required. Enter your username, email, and password.');
      result = await register(form.username.trim(), form.email.trim(), form.password);
    } else {
      if (!form.email.trim() || !form.password)
        return setLocalError('Please enter your email or username and password.');
      result = await login(form.email.trim(), form.password);
    }
    if (result.success) navigate('/dashboard');
    else setLocalError(result.error);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Background swirl field with reduced density */}
      <HeroField densityMultiplier={0.35} interactive={false} />

      {/* Centred Glass Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
          background: 'var(--k1)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: '2.5rem 2rem',
          boxShadow: '0 40px 120px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Logo size={22} word={true} />
          </Link>
          <Link to="/" className="mono" style={{ color: 'var(--w3)', fontSize: 12, textDecoration: 'none' }}>
            ← Back
          </Link>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 500,
              color: 'var(--w)',
              letterSpacing: '-0.04em',
              lineHeight: 1.15,
              marginBottom: '0.4rem',
            }}
          >
            {isRegister ? 'Create an account' : 'Welcome back'}
          </h2>
          <p
            style={{
              color: 'var(--w2)',
              fontSize: '0.9rem',
              margin: 0,
            }}
          >
            {isRegister ? 'Create your room and invite someone special.' : 'Sign in to enter your private room.'}
          </p>
        </div>

        {/* Continue with Google button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 18px',
            borderRadius: 999,
            background: 'var(--k2)',
            border: '1px solid var(--line)',
            color: 'var(--w)',
            fontWeight: 500,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1.25rem',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#fff"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#ededed"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#a8a8a8"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#fff"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: '1.25rem 0',
            color: 'var(--w3)',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span>or with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. shaurya"
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>{isRegister ? 'Email address' : 'Email or username'}</label>
            <input
              name="email"
              type={isRegister ? 'email' : 'text'}
              value={form.email}
              onChange={handleChange}
              placeholder={isRegister ? 'you@domain.com' : 'you@domain.com or username'}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={labelStyle}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {(localError || error) && (
            <div
              style={{
                color: 'var(--w1)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                lineHeight: 1.45,
              }}
            >
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pill"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            color: 'var(--w3)',
            fontSize: '0.85rem',
          }}
        >
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            to={isRegister ? '/login' : '/register'}
            style={{ color: 'var(--w)', fontWeight: 500, textDecoration: 'underline' }}
          >
            {isRegister ? 'Sign in' : 'Register'}
          </Link>
        </p>

        {/* Scan Room QR Code */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--line)',
            textAlign: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setQrScannerOpen(true)}
            className="pill-ghost"
            style={{
              fontSize: '0.8125rem',
              padding: '8px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
            }}
          >
            <span>📱</span>
            <span>Scan room QR to join as guest</span>
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal isOpen={qrScannerOpen} onClose={() => setQrScannerOpen(false)} />
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
  padding: '0.75rem 1rem',
  borderRadius: 12,
  background: 'var(--k2)',
  border: '1px solid var(--line)',
  color: 'var(--w)',
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box',
};
