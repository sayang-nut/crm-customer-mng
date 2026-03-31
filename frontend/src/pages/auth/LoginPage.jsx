import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../store/authContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ROLE_DASHBOARD = {
  admin: '/dashboard',
  manager: '/dashboard',
  sales: '/dashboard/sales',
  cskh: '/dashboard/cskh',
  technical: '/tickets',
};

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

  useEffect(() => {
    setMounted(true);
    emailRef.current?.focus();
    if (location.state?.message) {
      setToast(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = ROLE_DASHBOARD[user.role] || '/dashboard';
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
      const dest = ROLE_DASHBOARD[result.user.role] || '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans text-slate-900">
      
      {/* Toast báo thành công */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 shadow-sm text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}

      <div className={`w-full max-w-[400px] transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white text-2xl font-bold rounded-lg mb-4">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bado CRM</h1>
          <p className="text-slate-500 text-sm mt-1">Đăng nhập vào hệ thống quản lý</p>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg mb-6 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email"
            ref={emailRef}
            type="email"
            placeholder="admin@bado.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          <div className="relative">
            <Input
              id="password"
              label="Mật khẩu"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 bottom-2.5 p-1 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPw(!showPw)}
              tabIndex={-1}
            >
              {showPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
            className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
          >
            Đăng nhập
          </Button>
        </form>

        

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          Quên mật khẩu? Vui lòng liên hệ <span className="text-blue-600 font-medium">Quản trị viên</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;