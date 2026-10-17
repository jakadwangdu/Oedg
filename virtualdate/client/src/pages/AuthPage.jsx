import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';
import HeroField from '../components/HeroField';

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
            marginTop: '2rem',
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
  padding: '0.75rem 1rem',
  borderRadius: 12,
  background: 'var(--k2)',
  border: '1px solid var(--line)',
  color: 'var(--w)',
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box',
};
