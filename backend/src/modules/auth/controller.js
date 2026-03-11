'use strict';

/**
 * Auth Controller – Module 1
 * ─────────────────────────────────────────────────────────────────
 * Nhận HTTP request, gọi service, trả về response chuẩn.
 * Toàn bộ logic nghiệp vụ nằm ở auth.service.js.
 * ─────────────────────────────────────────────────────────────────
 */

const authService = require('./auth.service');

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(email, password, ipAddress, userAgent);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Header: Authorization: Bearer <accessToken>
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.json({ success: true, message: 'Đăng xuất thành công.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Trả về thông tin user hiện tại từ DB (luôn mới nhất).
 */
const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/change-password
 * Body: { oldPassword, newPassword }
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/auth/sessions/:userId
 * Admin thu hồi phiên đăng nhập của nhân viên.
 */
const revokeSession = async (req, res, next) => {
  try {
    await authService.revokeSession(req.params.userId, req.user.id);
    res.json({ success: true, message: 'Phiên đăng nhập đã được thu hồi.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  me,
  changePassword,
  revokeSession,
};