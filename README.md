# 🔐 TOTP Authenticator — Full-Stack Testing Application

A complete TOTP (Time-based One-Time Password) testing application built with **React**, **Node.js**, and **MongoDB**.

---

## 📁 Project Structure

```
totp-app/
├── backend/
│   ├── models/
│   │   └── User.js          # Mongoose user schema (TOTP, privacy, settings)
│   ├── middleware/
│   │   └── auth.js          # JWT auth middleware
│   ├── routes/
│   │   └── auth.js          # All API routes
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── server.js            # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   └── Layout.js       # Sidebar navigation layout
        ├── context/
        │   └── AuthContext.js  # React auth state + API client
        ├── pages/
        │   ├── Login.js        # Login with TOTP step
        │   ├── Register.js     # Account creation
        │   ├── Dashboard.js    # Overview + login history
        │   ├── Profile.js      # Edit profile info
        │   ├── TOTPPage.js     # QR gen, enable, disable, test
        │   ├── ResetPassword.js   # Change password (requires current)
        │   ├── CreatePassword.js  # New password + TOTP verify
        │   ├── Settings.js     # Theme, language, session timeout
        │   └── Privacy.js      # Visibility & 2FA policy settings
        ├── App.js              # Routes + protected routes
        ├── index.css           # Dark cyberpunk design system
        └── index.js
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd totp-app/backend
npm install
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/totp_app
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
APP_NAME=TOTP Authenticator
```

Start backend:
```bash
npm start
# or with hot reload:
npm run dev
```

### 2. Frontend Setup

```bash
cd totp-app/frontend
npm install
npm start
```

App opens at **http://localhost:3000**

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login (TOTP-aware) |
| GET | `/api/auth/me` | Yes | Get current user |
| PUT | `/api/auth/profile` | Yes | Update profile |
| PUT | `/api/auth/reset-password` | Yes | Change password (needs current) |
| PUT | `/api/auth/create-password` | Yes | New password (TOTP-verified) |
| PUT | `/api/auth/settings` | Yes | Update app settings |
| PUT | `/api/auth/privacy` | Yes | Update privacy settings |
| POST | `/api/auth/totp/generate` | Yes | Generate secret + QR code |
| POST | `/api/auth/totp/verify` | Yes | Verify token & enable TOTP |
| POST | `/api/auth/totp/disable` | Yes | Disable TOTP (password + token) |
| POST | `/api/auth/totp/test` | Yes | Test a TOTP token |
| GET | `/api/auth/login-history` | Yes | Get last 10 logins |
| GET | `/api/health` | No | Server health check |

---

## 📱 Features

### Dashboard
- Security status overview (TOTP on/off, 2FA required)
- Login history table
- Quick-action buttons

### Profile
- Edit full name, username, bio, phone
- Avatar with initials
- Account metadata display

### TOTP Authenticator
- **Generate QR Code** → scan with Google Authenticator, Authy, Bitwarden
- **Manual Entry** details (secret, type, algorithm, period)
- **Verify & Enable** with live token validation
- **Test Token** with live 30-second countdown bar
- **Disable TOTP** with password + current token confirmation

### Reset Password
- Requires current password
- Strength meter (5-level visual indicator)

### Create New Password
- No current password needed
- Requires TOTP verification if enabled
- Built-in strong password generator
- Strength meter

### Settings
- Theme / Language / Notification preferences
- Session timeout configuration

### Privacy
- Profile visibility toggles
- Email/phone display controls
- Require 2FA for sensitive operations toggle

---

## 🔐 TOTP Flow

```
User registers → Go to Authenticator → Click "Enable TOTP"
   ↓
Backend generates secret → QR code displayed
   ↓
User scans QR in authenticator app (Google Authenticator, Authy, etc.)
   ↓
User enters 6-digit code → Backend verifies → TOTP enabled
   ↓
On next login: email + password → TOTP code prompt → granted
```

---

## 🧪 Testing TOTP

Use the **Test Token** feature on the TOTP page:
1. Navigate to Authenticator → "Test TOTP Token"
2. Open your authenticator app
3. Enter the current 6-digit code
4. See real-time validation with timestamp

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS design system (dark theme) |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (jsonwebtoken) |
| TOTP | speakeasy (RFC 6238) |
| QR Code | qrcode |
| Passwords | bcryptjs |

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- TOTP window of ±2 steps (accounts for clock drift)
- TOTP secret not returned in user object
- Login history limited to last 10 entries
- TOTP disable requires both password AND current TOTP code
