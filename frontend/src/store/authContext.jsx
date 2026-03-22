/**
 * @file     frontend/src/store/authContext.jsx
 * ─────────────────────────────────────────────────────────────────
 * FIX: Init không gọi qua interceptor → không bị redirect loop
 * FIX: isLoading = true trong khi init → RoleRedirect chờ xong
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import authService from '../services/authService';

const AuthContext = createContext(null);

const BASE_URL   = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const CLEAN_URL  = BASE_URL.replace(/\/api\/?$/, '');

export const AuthProvider = ({ children }) => {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true); // BẮT ĐẦU LÀ TRUE

  // ── Restore session khi app khởi động ──────────────────────────
  useEffect(() => {
    const init = async () => {
      const refreshToken = localStorage.getItem('refreshToken');

      // Không có token → thoát ngay, không gọi API
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      // Hiện user từ cache ngay để UX mượt hơn
      const saved = localStorage.getItem('user');
      if (saved) {
        try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
      }

      try {
        // ✅ Dùng axios THUẦN (không qua interceptor) để tránh loop
        const { data } = await axios.post(
          `${CLEAN_URL}/api/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken',  accessToken);
        localStorage.setItem('refreshToken', newRefresh);

        // Lấy user mới nhất từ server
        const meRes = await axios.get(`${CLEAN_URL}/api/auth/me`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const me = meRes.data.data;
        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));

      } catch {
        // Token hết hạn hoặc không hợp lệ → xoá, để /login tự hiện
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        // ✅ KHÔNG redirect ở đây — để React Router tự xử lý
      } finally {
        setIsLoading(false); // ← BẮT BUỘC luôn set false
      }
    };

    init();
  }, []);

  // ── login ───────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    return result;
  }, []);

  // ── logout ──────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // ── refreshUser ─────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me);
    localStorage.setItem('user', JSON.stringify(me));
    return me;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

export default AuthContext;