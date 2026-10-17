import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const { login, register, loading, error } = useAuthStore();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    let result;
    if (isRegister) {
      if (!form.username.trim() || !form.email.trim() || !form.password)
        return setLocalError('All fields are required');
      result = await register(form.username.trim(), form.email.trim(), form.password);
    } else {
      if (!form.email.trim() || !form.password)
        return setLocalError('Please enter your email or username and password');
      result = await login(form.email.trim(), form.password);
    }
    if (result.success) navigate('/dashboard');
    else setLocalError(result.error);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--color-void-canvas)',
    }}>
      {/* Dimension Dusk Violet Background Spotlight */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        height: 350,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(107, 98, 242, 0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(50px)',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 420,
        background: 'var(--color-graphite)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid var(--color-hairline)',
        borderRadius: 'var(--radius-card)', // 24px
        padding: '2.5rem 2rem',
      }}>
        {/* Back Link */}
        <Link to="/" style={{
          color: 'var(--color-slate)',
          fontSize: '0.8125rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '2rem',
          transition: 'color var(--transition-smooth)',
        }}>
          <span>←</span>
          <span>Return Home</span>
        </Link>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '1.75rem',
            fontWeight: 500,
            color: 'var(--color-bone)',
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            marginBottom: '0.5rem',
          }}>
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p style={{
            fontFamily: 'var(--font-geist)',
            color: 'var(--color-ash)',
            fontSize: '0.875rem',
            letterSpacing: '-0.01em',
          }}>
            {isRegister ? 'Set up your private dusk workspace.' : 'Sign in to access your date rooms.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '1.15rem' }}>
              <label style={labelStyle}>Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. shaurya or alex"
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: '1.15rem' }}>
            <label style={labelStyle}>
              {isRegister ? 'Email Address' : 'Email or Username'}
            </label>
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
            <div style={{
              color: '#f87171',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.08)',
              borderRadius: 'var(--radius-ui)', // 10px
              border: '1px solid rgba(239, 68, 68, 0.25)',
              lineHeight: 1.45,
            }}>
              {localError || error}
            </div>
          )}

          {/* Primary CTA: Snow White fill, Graphite text, 9999px pill */}
          <button
            type="submit"
            disabled={loading}
            className="btn-dimension-primary"
            style={{
              width: '100%',
              padding: '0.8125rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Workspace' : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: 'var(--color-slate)',
          fontSize: '0.8125rem',
        }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            to={isRegister ? '/login' : '/register'}
            style={{ color: 'var(--color-bone)', fontWeight: 500, textDecoration: 'underline' }}
          >
            {isRegister ? 'Sign In' : 'Register'}
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'var(--color-ash)',
  marginBottom: '0.45rem',
  fontWeight: 400,
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-ui)', // 10px
  background: '#1a1a1a',
  border: '1px solid var(--color-hairline)',
  color: 'var(--color-bone)',
  fontSize: '0.9375rem',
  outline: 'none',
};
