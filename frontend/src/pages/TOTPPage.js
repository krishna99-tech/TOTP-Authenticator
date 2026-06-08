import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function TOTPPage() {
  const { user, api, updateUser } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [disableForm, setDisableForm] = useState({ password: '', token: '' });
  const [testToken, setTestToken] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [liveToken, setLiveToken] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [step, setStep] = useState('overview'); // overview | setup | disable | test

  // Live countdown timer
  useEffect(() => {
    const tick = () => {
      const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTimeRemaining(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateQR = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const r = await api.post('/auth/totp/generate');
      setQrData(r.data);
      setStep('setup');
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to generate QR' });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verifyToken.length !== 6) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/auth/totp/verify', { token: verifyToken });
      updateUser({ totp: { ...user.totp, enabled: true, verified: true, enabledAt: new Date() } });
      setMessage({ type: 'success', text: '🎉 TOTP enabled successfully! Your account is now protected.' });
      setStep('overview');
      setQrData(null);
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  const disableTOTP = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/auth/totp/disable', disableForm);
      updateUser({ totp: { enabled: false, verified: false, secret: null, enabledAt: null } });
      setMessage({ type: 'success', text: 'TOTP has been disabled.' });
      setStep('overview');
      setDisableForm({ password: '', token: '' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to disable TOTP' });
    } finally {
      setLoading(false);
    }
  };

  const testTOTP = async () => {
    if (testToken.length !== 6) return;
    setLoading(true);
    try {
      const r = await api.post('/auth/totp/test', { token: testToken });
      setTestResult(r.data);
    } catch (err) {
      setTestResult({ valid: false, message: err.response?.data?.error || 'Test failed' });
    } finally {
      setLoading(false);
    }
  };

  const progressPct = (timeRemaining / 30) * 100;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>TOTP Authenticator</h2>
        <p>Manage two-factor authentication for your account</p>
      </div>

      <div className="page-body">
        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {/* Status Overview */}
        <div className="card">
          <div className="card-header">
            <div className={`card-icon ${user?.totp?.enabled ? 'green' : 'red'}`}>
              {user?.totp?.enabled ? '🔐' : '🔓'}
            </div>
            <div>
              <div className="card-title">TOTP Status</div>
              <div className="card-subtitle">Time-based One-Time Password</div>
            </div>
            <span className={`badge ${user?.totp?.enabled ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 'auto' }}>
              {user?.totp?.enabled ? '● PROTECTED' : '○ UNPROTECTED'}
            </span>
          </div>

          {user?.totp?.enabled ? (
            <div>
              <div className="alert alert-success">
                ✓ TOTP is active. Your account requires an authenticator code on every login.
                {user.totp.enabledAt && (
                  <span style={{ display: 'block', marginTop: 4, fontSize: 11, opacity: 0.7 }}>
                    Enabled: {new Date(user.totp.enabledAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setStep('test')}>🧪 Test TOTP Token</button>
                <button className="btn btn-danger" onClick={() => setStep('disable')}>🗑 Disable TOTP</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="alert alert-warning">
                ⚠ TOTP is not enabled. Enable it to add an extra layer of security to your account.
              </div>
              <button className="btn btn-success" onClick={generateQR} disabled={loading}>
                {loading ? '⟳ Generating...' : '🔐 Enable TOTP'}
              </button>
            </div>
          )}
        </div>

        {/* Setup Flow */}
        {step === 'setup' && qrData && (
          <div className="card">
            <div className="card-header">
              <div className="card-icon purple">📱</div>
              <div>
                <div className="card-title">Setup Authenticator</div>
                <div className="card-subtitle">Scan QR code or enter secret manually</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
                <strong>Step 1:</strong> Open your authenticator app (Google Authenticator, Authy, etc.)<br />
                <strong>Step 2:</strong> Scan the QR code below or enter the secret key manually<br />
                <strong>Step 3:</strong> Enter the 6-digit code to confirm setup
              </div>

              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Space Mono, monospace' }}>
                    QR Code
                  </div>
                  <div className="qr-container">
                    <img src={qrData.qrCode} alt="TOTP QR Code" style={{ width: 200, height: 200 }} />
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Space Mono, monospace' }}>
                    Manual Entry
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {[
                        ['Account', qrData.manualEntry.account],
                        ['Key', qrData.manualEntry.key],
                        ['Type', qrData.manualEntry.type],
                        ['Algorithm', qrData.manualEntry.algorithm],
                        ['Digits', qrData.manualEntry.digits],
                        ['Period', `${qrData.manualEntry.period}s`],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 72, flexShrink: 0, fontFamily: 'Space Mono, monospace', paddingTop: 1 }}>{k}:</span>
                          <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color: 'var(--accent)', wordBreak: 'break-all' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input className="form-input mono" type="text" placeholder="000000" maxLength="6"
                value={verifyToken}
                onChange={e => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                style={{ maxWidth: 200 }} />
              <div className="form-hint">Enter the 6-digit code from your authenticator app to confirm setup</div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-success" onClick={verifyAndEnable}
                disabled={loading || verifyToken.length !== 6}>
                {loading ? '⟳ Verifying...' : '✓ Verify & Enable'}
              </button>
              <button className="btn btn-ghost" onClick={() => { setStep('overview'); setQrData(null); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Disable TOTP */}
        {step === 'disable' && (
          <div className="card">
            <div className="card-header">
              <div className="card-icon red">⚠️</div>
              <div>
                <div className="card-title">Disable TOTP</div>
                <div className="card-subtitle">This will remove two-factor protection</div>
              </div>
            </div>

            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              ⚠ Warning: Disabling TOTP will make your account less secure. Enter your password and current TOTP code to confirm.
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Your account password"
                value={disableForm.password}
                onChange={e => setDisableForm({ ...disableForm, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Current TOTP Code</label>
              <input className="form-input mono" type="text" placeholder="000000" maxLength="6"
                value={disableForm.token}
                onChange={e => setDisableForm({ ...disableForm, token: e.target.value.replace(/\D/g, '') })}
                style={{ maxWidth: 200 }} />
            </div>

            <div className="flex gap-2">
              <button className="btn btn-danger" onClick={disableTOTP}
                disabled={loading || !disableForm.password || disableForm.token.length !== 6}>
                {loading ? '⟳ Disabling...' : '🗑 Confirm Disable'}
              </button>
              <button className="btn btn-ghost" onClick={() => setStep('overview')}>Cancel</button>
            </div>
          </div>
        )}

        {/* Test TOTP */}
        {step === 'test' && (
          <div className="card">
            <div className="card-header">
              <div className="card-icon blue">🧪</div>
              <div>
                <div className="card-title">Test TOTP Token</div>
                <div className="card-subtitle">Verify your authenticator is working correctly</div>
              </div>
            </div>

            {/* Live timer */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'Space Mono, monospace' }}>
                TOKEN WINDOW
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 48, fontFamily: 'Space Mono, monospace', color: timeRemaining <= 5 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700, lineHeight: 1 }}>
                  {String(timeRemaining).padStart(2, '0')}s
                </div>
                <div style={{ flex: 1 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${progressPct}%`,
                      background: timeRemaining <= 5 ? 'var(--danger)' : undefined
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {timeRemaining > 5 ? 'Token valid' : 'New token generating soon...'}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Enter TOTP Code</label>
              <input className="form-input mono" type="text" placeholder="000000" maxLength="6"
                value={testToken}
                onChange={e => { setTestToken(e.target.value.replace(/\D/g, '')); setTestResult(null); }}
                style={{ maxWidth: 200 }} />
            </div>

            {testResult && (
              <div className={`alert alert-${testResult.valid ? 'success' : 'danger'}`} style={{ marginBottom: 16 }}>
                {testResult.message}
                {testResult.timestamp && (
                  <span style={{ display: 'block', fontSize: 11, opacity: 0.7, marginTop: 4, fontFamily: 'Space Mono, monospace' }}>
                    {testResult.timestamp}
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={testTOTP}
                disabled={loading || testToken.length !== 6}>
                {loading ? '⟳ Testing...' : '🧪 Test Token'}
              </button>
              <button className="btn btn-ghost" onClick={() => { setStep('overview'); setTestResult(null); setTestToken(''); }}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="card">
          <div className="card-header">
            <div className="card-icon yellow">💡</div>
            <div><div className="card-title">About TOTP</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[
              ['🔄 Time-based', 'Codes refresh every 30 seconds and are unique to each moment in time.'],
              ['📲 App-based', 'Works with Google Authenticator, Authy, Bitwarden, 1Password, and more.'],
              ['🔒 Secure', 'Even if your password is compromised, attackers cannot access your account without the code.'],
              ['⚡ Offline', 'Authenticator apps work without internet — no SMS dependency.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
