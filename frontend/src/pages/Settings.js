import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, api, updateUser, theme, setTheme } = useAuth();
  const [settings, setSettings] = useState({
    theme: user?.settings?.theme || theme || 'dark',
    language: user?.settings?.language || 'en',
    notifications: user?.settings?.notifications ?? true,
    sessionTimeout: user?.settings?.sessionTimeout || 30,
    require2FA: user?.settings?.require2FA ?? !!user?.totp?.enabled,
    autoLogout: user?.settings?.autoLogout ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const r = await api.put('/auth/settings', settings);
      updateUser({ settings: r.data.settings });
      setMessage({ type: 'success', text: '✓ Settings saved successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Settings</h2>
        <p>Customize your application preferences</p>
      </div>

      <div className="page-body">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {/* Appearance */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">🎨</div>
            <div>
              <div className="card-title">Appearance</div>
              <div className="card-subtitle">Customize how the app looks</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Theme Mode</label>
            <div className="theme-options">
              {[
                { value: 'dark', label: '🌙 Dark' },
                { value: 'light', label: '☀️ Light' },
                { value: 'system', label: '💻 System' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`theme-option ${settings.theme === option.value ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, theme: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="form-hint">Switch between dark, light, or system appearance.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Language</label>
            <select className="form-select" value={settings.language}
              onChange={e => setSettings({ ...settings, language: e.target.value })}>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon yellow">🔔</div>
            <div>
              <div className="card-title">Notifications</div>
              <div className="card-subtitle">Manage your notification preferences</div>
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <div className="toggle-label">Enable Notifications</div>
              <div className="toggle-desc">Receive alerts for security events and account activity</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.notifications}
                onChange={e => setSettings({ ...settings, notifications: e.target.checked })} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon green">🔒</div>
            <div>
              <div className="card-title">Security Settings</div>
              <div className="card-subtitle">Session, 2FA and access controls</div>
            </div>
          </div>

          <div className="toggle-row">
            <div>
              <div className="toggle-label">Require 2FA for every login</div>
              <div className="toggle-desc">Enforce TOTP verification when signing in.</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.require2FA}
                onChange={e => setSettings({ ...settings, require2FA: e.target.checked })} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div>
              <div className="toggle-label">Auto logout inactive sessions</div>
              <div className="toggle-desc">Sign out after inactivity to reduce risk.</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.autoLogout}
                onChange={e => setSettings({ ...settings, autoLogout: e.target.checked })} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Session Timeout (minutes)</label>
            <select className="form-select" value={settings.sessionTimeout}
              onChange={e => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
              <option value={1440}>24 hours</option>
            </select>
            <div className="form-hint">Automatically log out after this period of inactivity.</div>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon purple">ℹ️</div>
            <div><div className="card-title">About</div></div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['Application', 'TOTP Authenticator'],
              ['Version', '1.0.0'],
              ['Backend', 'Node.js + Express'],
              ['Database', 'MongoDB'],
              ['Frontend', 'React'],
              ['TOTP Standard', 'RFC 6238'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{k}</span>
                <span style={{ fontSize: 13, fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={loading}>
          {loading ? '⟳ Saving...' : '💾 Save All Settings'}
        </button>
      </div>
    </div>
  );
}
