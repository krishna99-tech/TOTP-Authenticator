import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { path: '/profile', icon: '👤', label: 'Profile' },
  { path: '/totp', icon: '🔐', label: 'Authenticator', isTOTP: true },
];

const securityItems = [
  { path: '/reset-password', icon: '🔑', label: 'Reset Password' },
  { path: '/create-password', icon: '✨', label: 'Create Password' },
];

const prefItems = [
  { path: '/settings', icon: '⚙️', label: 'Settings' },
  { path: '/privacy', icon: '🛡️', label: 'Privacy' },
];

export default function Layout({ children }) {
  const { user, logout, theme, setTheme } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.[0]?.toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const handleNavigation = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-layout">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header-mobile">
          <div className="sidebar-logo">
            <div className="logo-icon">🔐</div>
            <div>
              <h1>TOTP Auth</h1>
              <span>Security Center</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">✕</button>
        </div>

        {!mobileOpen && (
          <div className="sidebar-logo desktop-logo">
            <div className="logo-icon">🔐</div>
            <h1>TOTP Auth</h1>
            <span>SECURITY TESTER</span>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavigation}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.isTOTP && user?.totp?.enabled && (
                <span className="totp-badge">ON</span>
              )}
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: 12 }}>Security</div>
          {securityItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavigation}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: 12 }}>Preferences</div>
          {prefItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavigation}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.fullName || user?.username}</div>
              <div className="email">{user?.email}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
          </div>

          <div className="security-summary">
            <div className="summary-row">
              <span>2FA</span>
              <span className={user?.totp?.enabled ? 'summary-status active' : 'summary-status'}>
                {user?.totp?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="summary-row">
              <span>Theme</span>
              <button className="theme-switcher" onClick={toggleTheme}>
                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} data-open={mobileOpen} />

      <main className="main-content">
        <div className="layout-topbar">
          <button className="sidebar-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">☰</button>
          <div className="topbar-title">Secure account dashboard</div>
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}
