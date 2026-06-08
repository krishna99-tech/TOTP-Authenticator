import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/auth/login-history').then(r => setHistory(r.data.history)).catch(() => {});
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.[0]?.toUpperCase() || '?';

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back, {user?.fullName || user?.username}</p>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-value text-accent">{user?.totp?.enabled ? '✓' : '✗'}</div>
            <div className="stat-label">TOTP Status</div>
          </div>
          <div className="stat-card green">
            <div className="stat-value text-success">{history.length}</div>
            <div className="stat-label">Login Events</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-value" style={{ color: 'var(--accent2)', fontSize: 20 }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
            </div>
            <div className="stat-label">Member Since</div>
          </div>
          <div className="stat-card red">
            <div className="stat-value" style={{ color: user?.privacy?.twoFactorRequired ? 'var(--success)' : 'var(--danger)', fontSize: 20 }}>
              {user?.privacy?.twoFactorRequired ? 'ON' : 'OFF'}
            </div>
            <div className="stat-label">2FA Required</div>
          </div>
        </div>

        {/* Profile card */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">👤</div>
            <div>
              <div className="card-title">Account Overview</div>
              <div className="card-subtitle">@{user?.username}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800 }}>{user?.fullName || user?.username}</span>
                {user?.totp?.enabled && (
                  <span className="badge badge-success" style={{ marginLeft: 10 }}>🔐 TOTP Active</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                📧 {user?.email}
              </div>
              {user?.bio && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>{user.bio}</div>
              )}
            </div>
          </div>
        </div>

        {/* TOTP Status */}
        <div className="card">
          <div className="card-header">
            <div className={`card-icon ${user?.totp?.enabled ? 'green' : 'red'}`}>🔑</div>
            <div>
              <div className="card-title">Two-Factor Authentication</div>
              <div className="card-subtitle">TOTP via authenticator app</div>
            </div>
            <span className={`badge ${user?.totp?.enabled ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 'auto' }}>
              {user?.totp?.enabled ? '● ENABLED' : '○ DISABLED'}
            </span>
          </div>
          {user?.totp?.enabled ? (
            <div>
              <div className="alert alert-success">
                ✓ Your account is protected with TOTP. Enabled on {user.totp.enabledAt ? new Date(user.totp.enabledAt).toLocaleString() : 'N/A'}.
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/totp')}>
                Manage TOTP →
              </button>
            </div>
          ) : (
            <div>
              <div className="alert alert-warning">
                ⚠ Your account is not protected with two-factor authentication. Enable TOTP for enhanced security.
              </div>
              <button className="btn btn-success btn-sm" onClick={() => navigate('/totp')}>
                🔐 Enable TOTP Now
              </button>
            </div>
          )}
        </div>

        {/* Login History */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon yellow">📋</div>
            <div>
              <div className="card-title">Recent Login Activity</div>
              <div className="card-subtitle">Last 10 sessions</div>
            </div>
          </div>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No login history available.</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Time</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map((item, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${item.success ? 'badge-success' : 'badge-danger'}`}>
                        {item.success ? '✓ OK' : '✗ FAIL'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--text-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                      {item.ip || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
