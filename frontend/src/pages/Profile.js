import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, api, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const initials = form.fullName
    ? form.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : form.username?.[0]?.toUpperCase() || '?';

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const r = await api.put('/auth/profile', {
        fullName: form.fullName,
        username: form.username,
        bio: form.bio,
        phone: form.phone
      });
      updateUser(r.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Profile</h2>
        <p>Manage your personal information</p>
      </div>

      <div className="page-body">
        {/* Avatar section */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">🪪</div>
            <div>
              <div className="card-title">Profile Picture</div>
              <div className="card-subtitle">Your public avatar</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div className="avatar" style={{ width: 80, height: 80, fontSize: 28 }}>{initials}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{form.fullName || form.username}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>@{form.username}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{form.email}</div>
              {user?.totp?.enabled && (
                <span className="badge badge-success" style={{ marginTop: 8, display: 'inline-flex' }}>🔐 TOTP Active</span>
              )}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon purple">✏️</div>
            <div>
              <div className="card-title">Edit Profile</div>
              <div className="card-subtitle">Update your information</div>
            </div>
          </div>

          {message && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          <form onSubmit={handleSave}>
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" type="text" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })} placeholder="username" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <div className="form-hint">Email cannot be changed. Contact support for assistance.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell us a bit about yourself..."
                style={{ resize: 'vertical', minHeight: 80 }} />
            </div>

            <div className="flex" style={{ gap: 12, marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? '⟳ Saving...' : '💾 Save Changes'}
              </button>
              <button className="btn btn-ghost" type="button"
                onClick={() => setForm({ fullName: user?.fullName || '', username: user?.username || '', bio: user?.bio || '', phone: user?.phone || '', email: user?.email || '' })}>
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Account info */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon yellow">ℹ️</div>
            <div><div className="card-title">Account Information</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['User ID', user?._id?.slice(-8) || '—'],
              ['Account Created', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'],
              ['Last Updated', user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '—'],
              ['TOTP Enabled', user?.totp?.enabled ? 'Yes' : 'No'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
