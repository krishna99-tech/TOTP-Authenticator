import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', totpToken: '' });
  const [step, setStep] = useState('credentials'); // 'credentials' | 'totp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form.email, form.password, step === 'totp' ? form.totpToken : undefined);
      if (result.requiresTOTP) {
        setStep('totp');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="logo-mark">🔐</div>
          <h1>TOTP Auth</h1>
          <p>{step === 'totp' ? 'Enter your authenticator code' : 'Sign in to your account'}</p>
        </div>

        {error && <div className="alert alert-danger">⚠ {error}</div>}

        {step === 'totp' && (
          <div className="alert alert-info">📱 Open your authenticator app and enter the 6-digit code</div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 'credentials' && (
            <>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
            </>
          )}

          {step === 'totp' && (
            <div className="form-group">
              <label className="form-label">TOTP Code</label>
              <input className="form-input mono" type="text" placeholder="000000" maxLength="6"
                value={form.totpToken}
                onChange={e => setForm({ ...form, totpToken: e.target.value.replace(/\D/g, '') })}
                autoFocus required />
              <div className="form-hint">Enter the 6-digit code from your authenticator app</div>
            </div>
          )}

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? '⟳ Signing in...' : step === 'totp' ? '🔓 Verify Code' : '→ Sign In'}
          </button>

          {step === 'totp' && (
            <button type="button" className="btn btn-ghost btn-full mt-3"
              onClick={() => { setStep('credentials'); setForm({ ...form, totpToken: '' }); }}>
              ← Back
            </button>
          )}
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
