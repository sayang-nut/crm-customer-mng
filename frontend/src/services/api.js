/**
 * @file     frontend/src/services/api.js
 * @location frontend/src/services/api.js
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Axios instance dùng chung cho tất cả Redux slices.
 *
 * - Tự động attach Authorization header từ localStorage
 * - Auto-refresh token khi nhận 401
 * - Redirect /login khi refresh thất bại
 *
 * NOTE: File này song song với authService.js (dùng cho Redux pattern).
 *       authService.js dùng cho Auth module (React Context).
 *       api.js dùng cho các module còn lại (Redux slices).
 * ─────────────────────────────────────────────────────────────────
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request: gắn access token ─────────────────────────────────────
api.interceptors.request.use((config) => {
  // Lấy access token từ memory (được set bởi authService)
  // Dùng cùng key với authService để share token
  const token = window.__ACCESS_TOKEN__ || null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: auto-refresh khi 401 ───────────────────────────────
let _refreshing = false;
let _queue = [];

const processQueue = (error, token = null) => {
  _queue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  _queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (_refreshing) {
        return new Promise((resolve, reject) => _queue.push({ resolve, reject }))
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          });
      }
      original._retry = true;
      _refreshing = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        const newToken = data.data.accessToken;

        window.__ACCESS_TOKEN__ = newToken;
        localStorage.setItem('refreshToken', data.data.refreshToken);
        processQueue(null, newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        window.__ACCESS_TOKEN__ = null;
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        _refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Helper: set token từ authService (gọi sau login thành công)
export const setApiToken = (token) => { window.__ACCESS_TOKEN__ = token; };
export const clearApiToken = () => { window.__ACCESS_TOKEN__ = null; };

export default api;