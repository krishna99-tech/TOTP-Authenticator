import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { api } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [strength, setStrength] = useState(0);

  const calcStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['var(--danger)', 'var(--danger)', 'var(--warning)', 'var(--warning)', 'var(--success)', 'var(--success)'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'danger', text: 'New passwords do not match' });
      return;
    }
    if (form.newPassword.length < 6) {
      setMessage({ type: 'danger', text: 'Password must be at least 6 characters' });
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/reset-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setMessage({ type: 'success', text: '✓ Password updated successfully!' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStrength(0);
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Reset Password</h2>
        <p>Change your current account password</p>
      </div>

      <div className="page-body">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">🔑</div>
            <div>
              <div className="card-title">Change Password</div>
              <div className="card-subtitle">Requires current password for verification</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" placeholder="Enter current password"
                value={form.currentPassword}
                onChange={e => setForm({ ...form, currentPassword: e.target.value })} required />
            </div>

            <div className="divider" />

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" placeholder="Enter new password"
                value={form.newPassword}
                onChange={e => { setForm({ ...form, newPassword: e.target.value }); setStrength(calcStrength(e.target.value)); }}
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
                    {strengthLabels[strength]}
                  </div>
                </div>
              )}
              <div className="form-hint">Min 8 chars, include uppercase, numbers, and symbols for a strong password</div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required
                style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.newPassword ? 'var(--danger)' : undefined }} />
              {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 6 }}>Passwords do not match</div>
              )}
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '⟳ Updating...' : '🔐 Update Password'}
            </button>
          </form>
        </div>

        {/* Tips */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon yellow">💡</div>
            <div><div className="card-title">Password Best Practices</div></div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              '✓ Use at least 12 characters',
              '✓ Mix uppercase and lowercase letters',
              '✓ Include numbers and special characters',
              '✓ Avoid common words or personal information',
              '✓ Use a unique password not used elsewhere',
              '✓ Consider using a password manager',
            ].map(tip => (
              <div key={tip} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
