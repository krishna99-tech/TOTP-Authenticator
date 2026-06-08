require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

function renderErrorPage(status, title, message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${status} ${title}</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#050810; color:#e8edf5; font-family:system-ui, sans-serif; }
    .page { max-width: 560px; width:100%; padding:32px; text-align:center; border:1px solid rgba(255,255,255,0.06); border-radius:24px; box-shadow:0 30px 80px rgba(0,0,0,0.4); background:rgba(8,15,30,0.95); position:relative; overflow:hidden; }
    .page::before { content:''; position:absolute; width:180px; height:180px; border-radius:50%; background:rgba(0,212,255,0.12); top:-60px; right:-60px; }
    .page::after { content:''; position:absolute; width:120px; height:120px; transform:rotate(45deg); background:rgba(124,58,237,0.14); bottom:-50px; left:-50px; }
    .status { font-size:96px; margin:0; letter-spacing:-6px; color:#00d4ff; }
    h1 { margin:0 0 16px; font-size:32px; }
    p { margin:0 0 24px; color:#8899bb; line-height:1.7; }
    .hint { margin-top:16px; font-size:13px; color:#4a5a7a; }
    a { display:inline-flex; align-items:center; justify-content:center; padding:12px 24px; color:#000; text-decoration:none; background:#00d4ff; border-radius:999px; font-weight:700; }
  </style>
</head>
<body>
  <div class="page">
    <div class="status">${status}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Go to home</a>
    <div class="hint">Server: ${process.env.APP_NAME || 'TOTP Authenticator'}</div>
  </div>
</body>
</html>`;
}

// Fallback page for a server-side 500 preview
app.get('/500', (req, res) => {
  res.status(500).send(renderErrorPage(500, 'Server Error', 'Oops! Something went wrong on the server.'));
});

// Catch-all route for non-existent backend endpoints
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }

  res.status(404).send(renderErrorPage(404, 'Page Not Found', 'The route you requested does not exist.'));
});

// Express error-handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected server error:', err);
  if (req.originalUrl.startsWith('/api')) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  res.status(500).send(renderErrorPage(500, 'Server Error', 'An unexpected error occurred on the server.'));
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://krishna:9154243400@127.0.0.1:27017/totp_app?authSource=admin';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`  API: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
