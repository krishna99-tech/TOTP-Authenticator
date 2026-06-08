const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const requestIp = require('request-ip');
const User = require('../models/User');
const auth = require('../middleware/auth');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'Username, email, and password are required' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res.status(400).json({ error: 'Username or email already exists' });

    const user = await User.create({ username, email, password, fullName: fullName || username });
    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, totpToken } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid email or password' });

    // If TOTP is enabled, verify the token
    if (user.totp.enabled) {
      if (!totpToken)
        return res.status(200).json({ requiresTOTP: true, message: 'TOTP token required' });

      const verified = speakeasy.totp.verify({
        secret: user.totp.secret,
        encoding: 'base32',
        token: totpToken,
        window: 2
      });

      if (!verified)
        return res.status(401).json({ error: 'Invalid TOTP token' });
    }

    // Log login with real client IP when available
    const clientIp = requestIp.getClientIp(req) || req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    user.loginHistory.unshift({
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      success: true,
      timestamp: new Date()
    });
    if (user.loginHistory.length > 10) user.loginHistory = user.loginHistory.slice(0, 10);
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, bio, phone, username } = req.body;
    const user = req.user;

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(400).json({ error: 'Username already taken' });
      user.username = username;
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    user.updatedAt = Date.now();

    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password (requires current password)
router.put('/reset-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current and new passwords are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = req.user;
    const valid = await user.comparePassword(currentPassword);
    if (!valid)
      return res.status(401).json({ error: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new password (without current — e.g. after TOTP verify reset flow)
router.put('/create-password', auth, async (req, res) => {
  try {
    const { newPassword, confirmPassword, totpToken } = req.body;
    if (!newPassword || !confirmPassword)
      return res.status(400).json({ error: 'Both password fields are required' });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ error: 'Passwords do not match' });
    if (newPassword.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const user = req.user;

    // If TOTP enabled, require token to change password
    if (user.totp.enabled) {
      if (!totpToken)
        return res.status(400).json({ error: 'TOTP token required to change password' });
      const verified = speakeasy.totp.verify({
        secret: user.totp.secret,
        encoding: 'base32',
        token: totpToken,
        window: 2
      });
      if (!verified)
        return res.status(401).json({ error: 'Invalid TOTP token' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'New password created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { theme, language, notifications, sessionTimeout, autoLogout, require2FA, twoFactorRequired } = req.body;
    const user = req.user;
    if (theme !== undefined) user.settings.theme = theme;
    if (language !== undefined) user.settings.language = language;
    if (notifications !== undefined) user.settings.notifications = notifications;
    if (sessionTimeout !== undefined) user.settings.sessionTimeout = sessionTimeout;
    if (autoLogout !== undefined) user.settings.autoLogout = autoLogout;
    if (require2FA !== undefined) {
      user.settings.require2FA = require2FA;
      user.privacy.twoFactorRequired = require2FA;
    }
    if (twoFactorRequired !== undefined) {
      user.privacy.twoFactorRequired = twoFactorRequired;
      user.settings.require2FA = twoFactorRequired;
    }
    await user.save();
    res.json({ settings: user.settings, privacy: user.privacy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update privacy
router.put('/privacy', auth, async (req, res) => {
  try {
    const { profileVisible, showEmail, showPhone, twoFactorRequired } = req.body;
    const user = req.user;
    if (profileVisible !== undefined) user.privacy.profileVisible = profileVisible;
    if (showEmail !== undefined) user.privacy.showEmail = showEmail;
    if (showPhone !== undefined) user.privacy.showPhone = showPhone;
    if (twoFactorRequired !== undefined) user.privacy.twoFactorRequired = twoFactorRequired;
    await user.save();
    res.json({ privacy: user.privacy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate TOTP secret + QR code
router.post('/totp/generate', auth, async (req, res) => {
  try {
    const user = req.user;
    const secret = speakeasy.generateSecret({
      name: `${process.env.APP_NAME} (${user.email})`,
      length: 32
    });

    // Store secret but don't enable yet (need verification)
    user.totp.secret = secret.base32;
    user.totp.verified = false;
    await user.save();

    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({
      secret: secret.base32,
      otpauthUrl,
      qrCode: qrCodeDataUrl,
      manualEntry: {
        account: user.email,
        key: secret.base32,
        type: 'TOTP',
        algorithm: 'SHA1',
        digits: 6,
        period: 30
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify and enable TOTP
router.post('/totp/verify', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!user.totp.secret)
      return res.status(400).json({ error: 'Generate TOTP secret first' });

    const verified = speakeasy.totp.verify({
      secret: user.totp.secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified)
      return res.status(400).json({ error: 'Invalid TOTP token. Please try again.' });

    user.totp.enabled = true;
    user.totp.verified = true;
    user.totp.enabledAt = new Date();
    await user.save();

    res.json({ message: 'TOTP enabled successfully', totpEnabled: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disable TOTP
router.post('/totp/disable', auth, async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = req.user;

    const validPassword = await user.comparePassword(password);
    if (!validPassword)
      return res.status(401).json({ error: 'Invalid password' });

    if (user.totp.enabled) {
      const verified = speakeasy.totp.verify({
        secret: user.totp.secret,
        encoding: 'base32',
        token,
        window: 2
      });
      if (!verified)
        return res.status(400).json({ error: 'Invalid TOTP token' });
    }

    user.totp.enabled = false;
    user.totp.secret = null;
    user.totp.verified = false;
    user.totp.enabledAt = null;
    await user.save();

    res.json({ message: 'TOTP disabled successfully', totpEnabled: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test TOTP token (for testing page)
router.post('/totp/test', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!user.totp.enabled || !user.totp.secret)
      return res.status(400).json({ error: 'TOTP is not enabled' });

    const verified = speakeasy.totp.verify({
      secret: user.totp.secret,
      encoding: 'base32',
      token,
      window: 2
    });

    const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);

    res.json({
      valid: verified,
      message: verified ? '✓ Token is valid' : '✗ Token is invalid',
      timeRemaining: remaining,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get login history
router.get('/login-history', auth, async (req, res) => {
  res.json({ history: req.user.loginHistory });
});

module.exports = router;
