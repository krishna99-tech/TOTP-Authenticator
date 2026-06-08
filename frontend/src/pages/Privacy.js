import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Privacy() {
  const { user, api, updateUser } = useAuth();
  const [privacy, setPrivacy] = useState({
    profileVisible: user?.privacy?.profileVisible ?? true,
    showEmail: user?.privacy?.showEmail ?? false,
    showPhone: user?.privacy?.showPhone ?? false,
    twoFactorRequired: user?.privacy?.twoFactorRequired ?? false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const r = await api.put('/auth/privacy', privacy);
      updateUser({ privacy: r.data.privacy });
      setMessage({ type: 'success', text: '✓ Privacy settings saved!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  const Toggle = ({ label, desc, field }) => (
    <div className="toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        <div className="toggle-desc">{desc}</div>
      </div>
      <label className="toggle-switch">
        <input type="checkbox" checked={privacy[field]}
          onChange={e => setPrivacy({ ...privacy, [field]: e.target.checked })} />
        <span className="toggle-slider" />
      </label>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Privacy</h2>
        <p>Control who can see your information and how your data is used</p>
      </div>

      <div className="page-body">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {/* Profile visibility */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">👁</div>
            <div>
              <div className="card-title">Profile Visibility</div>
              <div className="card-subtitle">Control what others can see</div>
            </div>
          </div>
          <Toggle label="Public Profile" desc="Allow others to view your profile information" field="profileVisible" />
          <Toggle label="Show Email Address" desc="Display your email address on your public profile" field="showEmail" />
          <Toggle label="Show Phone Number" desc="Display your phone number on your public profile" field="showPhone" />
        </div>

        {/* Security */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon green">🔐</div>
            <div>
              <div className="card-title">Security & Authentication</div>
              <div className="card-subtitle">Additional security requirements</div>
            </div>
          </div>
          <Toggle
            label="Require 2FA for Sensitive Actions"
            desc="Always require TOTP verification when performing password changes or account modifications"
            field="twoFactorRequired"
          />
          {privacy.twoFactorRequired && !user?.totp?.enabled && (
            <div className="alert alert-warning" style={{ marginTop: 12 }}>
              ⚠ This option requires TOTP to be enabled. Please enable TOTP first in the Authenticator section.
            </div>
          )}
        </div>

        {/* Data summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon yellow">📊</div>
            <div><div className="card-title">Current Privacy Status</div></div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['Public Profile', privacy.profileVisible],
              ['Email Visible', privacy.showEmail],
              ['Phone Visible', privacy.showPhone],
              ['2FA Required', privacy.twoFactorRequired],
              ['TOTP Enabled', user?.totp?.enabled],
            ].map(([label, active]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>{label}</span>
                <span className={`badge ${active ? 'badge-success' : 'badge-danger'}`}>
                  {active ? '● ON' : '○ OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon purple">🛡️</div>
            <div><div className="card-title">Privacy Policy Summary</div></div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>• Your data is stored securely and never sold to third parties.</p>
            <p>• Passwords are hashed using bcrypt and never stored in plain text.</p>
            <p>• TOTP secrets are encrypted in the database.</p>
            <p>• Login history is kept for the last 10 sessions only.</p>
            <p>• You can delete your account and all associated data at any time.</p>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={loading}>
          {loading ? '⟳ Saving...' : '🛡️ Save Privacy Settings'}
        </button>
      </div>
    </div>
  );
}
