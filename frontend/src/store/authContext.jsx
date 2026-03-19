/**
 * @file     frontend/src/store/authContext.jsx
 * @location frontend/src/store/
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Global auth state dùng React Context.
 *   - Lưu user, isAuthenticated, isLoading
 *   - Expose: login(), logout(), refreshUser()
 *   - Tự động restore session từ localStorage khi app load
 * ─────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { setAccessToken, clearAccessToken, api } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true khi đang init

  // ── Restore session khi app khởi động ──────────────────────────
  useEffect(() => {
    const init = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }
      try {
        const tokens = await authService.refresh(refreshToken);
        setAccessToken(tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        const me = await authService.getMe();
        setUser(me);
      } catch {
        clearAccessToken();
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // ── login ───────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    setAccessToken(result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    setUser(result.user);
    return result;
  }, []);

  // ── logout ──────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    clearAccessToken();
    setUser(null);
  }, []);

  // ── refresh user từ DB ──────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

export default AuthContext;