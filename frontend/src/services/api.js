/**
 * @file     frontend/src/services/api.js
 * Single Source of Truth cho Axios.
 * FIX: Chỉ redirect /login khi chưa ở /login (tránh loop)
 */
import axios from 'axios';

const BASE_URL  = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CLEAN_URL = BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: CLEAN_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request: gắn token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: auto-refresh khi 401
let _refreshing = false;
let _queue      = [];

const processQueue = (error, token = null) => {
  _queue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  _queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!error.response || error.response.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const url = original.url || '';
    if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (_refreshing) {
      return new Promise((resolve, reject) => _queue.push({ resolve, reject }))
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
    }

    original._retry = true;
    _refreshing     = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(
        `${CLEAN_URL}/api/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const newAccess  = data.data.accessToken;
      const newRefresh = data.data.refreshToken;

      localStorage.setItem('accessToken',  newAccess);
      localStorage.setItem('refreshToken', newRefresh);

      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);

    } catch (err) {
      processQueue(err, null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // ✅ Chỉ redirect khi chưa ở trang login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }

      return Promise.reject(err);
    } finally {
      _refreshing = false;
    }
  }
);

export default api;