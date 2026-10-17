import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
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
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-void-canvas)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
    }}>
      {/* Background Accent Spotlight */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 480,
        height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(107, 98, 242, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(50px)',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 480,
        background: 'var(--color-graphite)',
        border: '1px solid var(--color-hairline)',
        borderRadius: 'var(--radius-card)', // 24px
        padding: '2.5rem 2rem',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}>
        {/* Navigation Link */}
        <div style={{ marginBottom: '1.75rem' }}>
          <Link to="/dashboard" style={{
            color: 'var(--color-slate)',
            fontSize: '0.8125rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <span>←</span>
            <span>Return to Dashboard</span>
          </Link>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '1.75rem',
          fontWeight: 500,
          color: 'var(--color-bone)',
          letterSpacing: '-0.035em',
          marginBottom: '2rem',
        }}>
          Personal Profile
        </h2>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            margin: '0 auto 1rem',
            background: avatarPreview ? `url(${avatarPreview}) center/cover` : '#222',
            border: '1px solid var(--color-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-bone)',
            fontSize: '1.75rem',
            fontWeight: 500,
          }}>
            {!avatarPreview && (user?.username?.[0]?.toUpperCase() || '?')}
          </div>
          <label style={{
            padding: '0.45rem 1.1rem',
            borderRadius: 'var(--radius-pill)',
            background: '#1a1a1a',
            border: '1px solid var(--color-hairline)',
            color: 'var(--color-bone)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-block',
          }}>
            Select Avatar
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '1.15rem' }}>
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
              placeholder="Tell your partner a little about yourself..."
              maxLength={200}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {msg && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-ui)',
              background: msg.includes('updated') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${msg.includes('updated') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: msg.includes('updated') ? 'var(--success)' : 'var(--danger)',
              fontSize: '0.8125rem',
            }}>
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-dimension-primary"
            style={{
              width: '100%',
              padding: '0.8125rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
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
  borderRadius: 'var(--radius-ui)',
  background: '#1a1a1a',
  border: '1px solid var(--color-hairline)',
  color: 'var(--color-bone)',
  fontSize: '0.9375rem',
  outline: 'none',
};
