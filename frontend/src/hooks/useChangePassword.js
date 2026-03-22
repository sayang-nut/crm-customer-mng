/**
 * @file     frontend/src/hooks/useChangePassword.js
 * @location frontend/src/hooks/
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Custom hook đổi mật khẩu.
 *   - Gọi authService.changePassword()
 *   - Trả về { loading, error, success, submit }
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react';
import authService from '../services/authService';
import { useAuth } from '../store/authContext';
import { useNavigate } from 'react-router-dom';

const useChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const submit = useCallback(async (oldPassword, newPassword) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setSuccess(true);
      // Server revoke token → force logout sau 2s
      setTimeout(async () => {
        await logout();
        navigate('/login', { state: { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' } });
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  return { loading, error, success, submit };
};

export default useChangePassword;