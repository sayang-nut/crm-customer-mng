/**
 * @file     frontend/src/services/authService.js
 * @location frontend/src/services/authService.js
 * ─────────────────────────────────────────────────────────────────
 * Thin wrapper trên api.js cho module Auth.
 * KHÔNG tự cấu hình axios – dùng instance từ api.js.
 *
 * Token storage: localStorage (nhất quán với api.js)
 *   accessToken  → localStorage
 *   refreshToken → localStorage
 *   user         → localStorage
 * ─────────────────────────────────────────────────────────────────
 */

import api from './api';

// ── Token helpers (dùng chung cho authContext) ────────────────────
export const setAccessToken   = (t) => localStorage.setItem('accessToken', t);
export const getAccessToken   = ()  => localStorage.getItem('accessToken');
export const clearAccessToken = ()  => localStorage.removeItem('accessToken');

// Re-export api instance để các file cũ import { api } from './authService' vẫn hoạt động
export { api };

// ── Auth API functions ────────────────────────────────────────────
export const authService = {

  /**
   * Đăng nhập.
   * Lưu accessToken + refreshToken + user vào localStorage.
   */
  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    const { accessToken, refreshToken, user } = data.data;

    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user',         JSON.stringify(user));

    return data.data;
  },

  /**
   * Làm mới token (gọi thủ công nếu cần, thường do interceptor tự xử lý).
   */
  refresh: async (refreshToken) => {
    const { data } = await api.post('/api/auth/refresh', { refreshToken });
    const { accessToken: newAccess, refreshToken: newRefresh } = data.data;

    localStorage.setItem('accessToken',  newAccess);
    localStorage.setItem('refreshToken', newRefresh);

    return data.data;
  },

  /**
   * Đăng xuất.
   */
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Bỏ qua lỗi mạng khi logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Lấy profile user từ DB (luôn mới nhất).
   */
  getMe: async () => {
    const { data } = await api.get('/api/auth/me');
    return data.data;
  },

  /**
   * Đổi mật khẩu.
   */
  changePassword: async (oldPassword, newPassword) => {
    const { data } = await api.put('/api/auth/change-password', { oldPassword, newPassword });
    return data;
  },
};

export default authService;