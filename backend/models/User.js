const mongoose = require('mongoose');
const { hash, compare } = require('../utils/crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  // TOTP fields
  totp: {
    enabled: { type: Boolean, default: false },
    secret: { type: String, default: null },
    verified: { type: Boolean, default: false },
    enabledAt: { type: Date, default: null }
  },
  // Privacy settings
  privacy: {
    profileVisible: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    twoFactorRequired: { type: Boolean, default: false }
  },
  // Account settings
  settings: {
    theme: { type: String, default: 'dark' },
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 30 },
    autoLogout: { type: Boolean, default: true },
    require2FA: { type: Boolean, default: false }
  },
  // Security log
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    success: Boolean
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await hash(this.password);
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.totp.secret;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
