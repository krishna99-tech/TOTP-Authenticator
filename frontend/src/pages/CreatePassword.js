import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function CreatePassword() {
  const { user, api } = useAuth();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '', totpToken: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [strength, setStrength] = useState(0);
  const [generated, setGenerated] = useState('');

  const calcStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 16; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    setGenerated(pwd);
    setForm(f => ({ ...f, newPassword: pwd, confirmPassword: pwd }));
    setStrength(calcStrength(pwd));
  };

  const strengthColors = ['var(--danger)', 'var(--danger)', 'var(--warning)', 'var(--warning)', 'var(--success)', 'var(--success)'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'danger', text: 'Passwords do not match' });
      return;
    }
    if (form.newPassword.length < 8) {
      setMessage({ type: 'danger', text: 'Password must be at least 8 characters' });
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/create-password', {
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
        totpToken: form.totpToken || undefined
      });
      setMessage({ type: 'success', text: '🎉 New password created successfully!' });
      setForm({ newPassword: '', confirmPassword: '', totpToken: '' });
      setStrength(0);
      setGenerated('');
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to create password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Create New Password</h2>
        <p>Set a new password without entering the current one (requires TOTP if enabled)</p>
      </div>

      <div className="page-body">
        <div className="alert alert-info">
          ℹ This flow allows creating a new password directly. If TOTP is enabled on your account, you must provide a valid TOTP code to confirm this operation.
        </div>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div className="card">
          <div className="card-header">
            <div className="card-icon purple">✨</div>
            <div>
              <div className="card-title">Create Password</div>
              <div className="card-subtitle">
                {user?.totp?.enabled ? 'TOTP verification required' : 'No TOTP required'}
              </div>
            </div>
            {user?.totp?.enabled && (
              <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>🔐 TOTP Required</span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>New Password</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={generatePassword}
                  style={{ fontSize: 11 }}>
                  ⚡ Generate Strong
                </button>
              </div>
              <input className="form-input" type="text" placeholder="Create a strong password"
                value={form.newPassword}
                onChange={e => { setForm({ ...form, newPassword: e.target.value }); setStrength(calcStrength(e.target.value)); setGenerated(''); }}
                required />
              {form.newPassword && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i < strength ? strengthColors[strength] : 'var(--border)',
                        transition: 'background 0.3s'
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColors[strength], fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>
                    Strength: {strengthLabels[strength]}
                  </div>
                </div>
              )}
            </div>

            {generated && (
              <div className="alert alert-info" style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, letterSpacing: 1 }}>
                Generated: <strong>{generated}</strong>
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>⚠ Save this password in a secure password manager before continuing.</div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Repeat the password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required
                style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.newPassword ? 'var(--danger)' : undefined }} />
              {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 6 }}>Passwords do not match</div>
              )}
            </div>

            {user?.totp?.enabled && (
              <>
                <div className="divider" />
                <div className="form-group">
                  <label className="form-label">TOTP Verification Code</label>
                  <input className="form-input mono" type="text" placeholder="000000" maxLength="6"
                    value={form.totpToken}
                    onChange={e => setForm({ ...form, totpToken: e.target.value.replace(/\D/g, '') })}
                    style={{ maxWidth: 200 }} required />
                  <div className="form-hint">Enter the 6-digit code from your authenticator app</div>
                </div>
              </>
            )}

            <button className="btn btn-purple" type="submit" disabled={loading}>
              {loading ? '⟳ Creating...' : '✨ Create New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
