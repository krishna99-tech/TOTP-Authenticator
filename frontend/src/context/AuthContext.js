import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      window.location.href = '/500';
    } else if (error.response.status >= 500) {
      window.location.href = '/500';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const effectiveTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    document.documentElement.dataset.theme = effectiveTheme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      API.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => { localStorage.removeItem('token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user?.settings?.theme && user.settings.theme !== theme) {
      setTheme(user.settings.theme);
    }
  }, [user?.settings?.theme]);

  const login = async (email, password, totpToken) => {
    const r = await API.post('/auth/login', { email, password, totpToken });
    if (r.data.requiresTOTP) return { requiresTOTP: true };
    localStorage.setItem('token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
    if (r.data.user?.settings?.theme) setTheme(r.data.user.settings.theme);
    return r.data;
  };

  const register = async (data) => {
    const r = await API.post('/auth/register', data);
    localStorage.setItem('token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
    if (r.data.user?.settings?.theme) setTheme(r.data.user.settings.theme);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => setUser(prev => {
    const next = { ...prev, ...updated };
    if (updated.settings) {
      next.settings = { ...prev?.settings, ...updated.settings };
      if (updated.settings.theme && updated.settings.theme !== theme) {
        setTheme(updated.settings.theme);
      }
    }
    return next;
  });

  const api = {
    get: (url) => API.get(url),
    post: (url, data) => API.post(url, data),
    put: (url, data) => API.put(url, data),
    delete: (url) => API.delete(url),
  };

  return (
    <AuthContext.Provider value={{ user, loading, theme, setTheme, login, register, logout, updateUser, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
