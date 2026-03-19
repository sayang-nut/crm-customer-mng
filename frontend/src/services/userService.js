/**
 * @file     frontend/src/services/usersService.js
 * @location frontend/src/services/usersService.js
 * ─────────────────────────────────────────────────────────────────
 * @requires ./authService → api (axios instance có interceptor)
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Tầng gọi API cho module Users.
 * Tất cả request đều dùng axios instance từ authService
 * (đã có auto-refresh token interceptor).
 * ─────────────────────────────────────────────────────────────────
 */

import { api } from './authService';

export const usersService = {

  /** Danh sách nhân viên */
  list: (params = {}) =>
    api.get('/api/users', { params }).then(r => r.data),

  /** Chi tiết 1 nhân viên */
  getById: (id) =>
    api.get(`/api/users/${id}`).then(r => r.data.data),

  /** Tạo nhân viên mới (Admin) */
  create: (payload) =>
    api.post('/api/users', payload).then(r => r.data.data),

  /** Cập nhật nhân viên (Admin) */
  update: (id, payload) =>
    api.put(`/api/users/${id}`, payload).then(r => r.data.data),

  /** Admin reset mật khẩu */
  resetPassword: (id, newPassword) =>
    api.put(`/api/users/${id}/reset-password`, { newPassword }).then(r => r.data),

  /** Admin đổi trạng thái */
  setStatus: (id, status) =>
    api.put(`/api/users/${id}/status`, { status }).then(r => r.data.data),

  /** Tự cập nhật profile */
  updateProfile: (payload) =>
    api.put('/api/users/profile', payload).then(r => r.data.data),

  /** Login logs toàn bộ (Admin) */
  getLoginLogs: (params = {}) =>
    api.get('/api/users/login-logs', { params }).then(r => r.data),

  /** Login logs theo userId */
  getUserLoginLogs: (userId, params = {}) =>
    api.get(`/api/users/${userId}/login-logs`, { params }).then(r => r.data),
};

export default usersService;