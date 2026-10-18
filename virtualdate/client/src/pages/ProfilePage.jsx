import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import Logo from '../components/Logo';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ username: user?.username || '', bio: user?.bio || '' });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setAvatarBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = { username: form.username, bio: form.bio };
      if (avatarBase64) payload.avatarBase64 = avatarBase64;
      const { data } = await api.put(`/users/${user._id}`, payload);
      updateUser(data);
      setMsg('Profile updated!');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--k)',
        color: 'var(--w1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 480,
          background: 'var(--k1)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          padding: '2.5rem 2rem',
          boxShadow: '0 40px 120px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Logo size={22} word={true} />
          </Link>
          <Link to="/dashboard" className="mono" style={{ color: 'var(--w3)', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={13} strokeWidth={2} />
            <span>Dashboard</span>
          </Link>
        </div>

        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 500,
            color: 'var(--w)',
            letterSpacing: '-0.04em',
            marginBottom: '2rem',
          }}
        >
          Your profile
        </h2>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              margin: '0 auto 1rem',
              background: avatarPreview ? `url(${avatarPreview}) center/cover` : 'var(--w)',
              color: 'var(--k)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 600,
            }}
          >
            {!avatarPreview && (user?.username?.[0]?.toUpperCase() || '?')}
          </div>
          <label
            className="pill-ghost"
            style={{
              padding: '6px 16px',
              fontSize: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Camera size={13} strokeWidth={1.75} />
            <span>Change avatar</span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              style={inputStyle}
              placeholder="Your display name"
            />
          </div>
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              placeholder="Tell your team or co-founders a little about yourself..."
              maxLength={200}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {msg && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                background: 'var(--glass)',
                border: '1px solid var(--line)',
                color: 'var(--w)',
                fontSize: '0.85rem',
              }}
            >
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="pill"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {saving ? 'Saving...' : (
              <>
                <Check size={15} strokeWidth={2} />
                <span>Save changes</span>
              </>
            )}
          </button>
        </form>
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
