/**
 * @file     frontend/src/pages/auth/LoginPage.jsx
 * @theme    WHITE PLAIN - Hình chữ nhật to, màu đơn giản, không hiệu ứng
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import Input from '../../components/common/Input';
import { ROLE_HOME } from '../../constants';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [mounted, setMounted] = useState(false);

  const emailRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    emailRef.current?.focus();
    if (location.state?.message) {
      setToast(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = ROLE_HOME[user.role] || '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await login(email.trim(), password);
      const dest = ROLE_HOME[result.user.role] || '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 401) setError('Email hoặc mật khẩu không đúng.');
      else if (status === 403) setError(msg || 'Tài khoản không có quyền đăng nhập.');
      else if (status === 422) setError('Dữ liệu không hợp lệ.');
      else if (status === 429) setError('Quá nhiều yêu cầu. Thử lại sau 15 phút.');
      else setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-100 flex items-center justify-center p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg border border-green-600">
          <CheckCircle className="w-5 h-5" />
          {toast}
        </div>
      )}

      {/* Main Card */}
      <div className="card w-full max-w-4xl p-12">
        
        {/* Logo & Title */}
        <div className="text-center mb-12">
         
          <h1 className="text-4xl font-black text-gray-900 mb-2">ĐĂNG NHẬP </h1>
          <p className="text-lg text-gray-600 mb-4">Hệ thống quản lý khách hàng</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger max-w-md mx-auto mb-8 text-sm">
            <div className="status-dot status-dot-danger mt-1.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <div>
            <Input
              ref={emailRef}
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="ten@bado.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ? ' ' : ''}
              disabled={loading}
              required
            />
          </div>

          <div>
            <Input
              label="Mật khẩu"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error ? ' ' : ''}
              disabled={loading}
              required
              icon={showPw ? EyeOff : Eye}
              onIconClick={() => setShowPw(!showPw)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full h-14 text-lg font-bold gap-2"
            disabled={loading}
          >
            {loading && <span className="spinner"></span>}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Demo Accounts */}
       

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-gray-200 text-center max-w-md mx-auto">
          <p className="text-sm text-gray-500">
            Quên mật khẩu?{' '}
            <button className="font-semibold text-blue-600 hover:text-blue-700">
              Liên hệ Admin
            </button>{' '}
            để được cấp lại.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;