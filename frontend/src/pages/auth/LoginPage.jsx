/**
 * @file     frontend/src/pages/auth/LoginPage.jsx
 * @location frontend/src/pages/auth/
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang đăng nhập – cổng vào duy nhất của toàn hệ thống.
 *   - Form email + password với validation client-side
 *   - Gọi AuthContext.login()
 *   - Redirect về dashboard sau khi đăng nhập thành công
 *   - Hiển thị toast nếu có state.message (sau đổi mật khẩu)
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authContext';

// ── Helpers ───────────────────────────────────────────────────────
const ROLE_DASHBOARD = {
  admin:     '/dashboard',
  manager:   '/dashboard',
  sales:     '/dashboard/sales',
  cskh:      '/dashboard/cskh',
  technical: '/tickets',
};

// ── Icons ─────────────────────────────────────────────────────────
const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

// ── Animated background grid ──────────────────────────────────────
const GridBackground = () => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 0,
    background: 'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(37,99,235,0.08) 0%, transparent 70%), #080E1A',
    overflow: 'hidden',
  }}>
    {/* Grid lines */}
    <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.035 }}>
      <defs>
        <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M 56 0 L 0 0 0 56" fill="none" stroke="#60A5FA" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>

    {/* Glow orbs */}
    <div style={{
      position: 'absolute', width: 600, height: 600,
      borderRadius: '50%', filter: 'blur(120px)',
      background: 'rgba(37,99,235,0.12)',
      top: '-10%', right: '5%',
    }} />
    <div style={{
      position: 'absolute', width: 400, height: 400,
      borderRadius: '50%', filter: 'blur(100px)',
      background: 'rgba(139,92,246,0.08)',
      bottom: '10%', left: '-5%',
    }} />
  </div>
);

// ── Main Component ────────────────────────────────────────────────
const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [toast,    setToast]    = useState('');
  const [focused,  setFocused]  = useState('');
  const [mounted,  setMounted]  = useState(false);

  const emailRef   = useRef(null);
  const toastTimer = useRef(null);

  // Entrance animation
  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    emailRef.current?.focus();

    // Toast từ redirect (đổi mật khẩu xong)
    if (location.state?.message) {
      setToast(location.state.message);
      window.history.replaceState({}, document.title);
    }
    return () => clearTimeout(toastTimer.current);
  }, []);

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = ROLE_DASHBOARD[user.role] || '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Auto clear error
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // Auto clear toast
  useEffect(() => {
    if (!toast) return;
    toastTimer.current = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(toastTimer.current);
  }, [toast]);

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
      const status = err.response?.status;
      const msg    = err.response?.data?.message;
      if (status === 401) setError('Email hoặc mật khẩu không đúng.');
      else if (status === 403) setError(msg || 'Tài khoản không có quyền đăng nhập.');
      else if (status === 422) setError('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      else if (status === 429) setError('Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.');
      else setError('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────
  const s = {
    page: {
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: '20px', position: 'relative',
    },

    card: {
      position: 'relative', zIndex: 1,
      width: '100%', maxWidth: 440,
      background: 'rgba(13,20,36,0.85)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
      backdropFilter: 'blur(24px)',
      padding: '44px 40px 40px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
      opacity:   mounted ? 1 : 0,
      transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
    },

    logoRow: {
      display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: 32,
    },
    logoMark: {
      width: 42, height: 42, borderRadius: 12,
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 19, fontWeight: 900, color: '#fff',
      letterSpacing: -1, flexShrink: 0,
      boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
    },
    logoText: {
      fontSize: 22, fontWeight: 800, color: '#F1F5F9',
      letterSpacing: '-0.5px', lineHeight: 1.1,
    },
    logoSub: {
      fontSize: 11, color: '#64748B', fontWeight: 500, marginTop: 2,
      letterSpacing: '0.06em', textTransform: 'uppercase',
    },

    heading: {
      fontSize: 26, fontWeight: 700, color: '#F1F5F9',
      letterSpacing: '-0.5px', marginBottom: 6,
    },
    subheading: {
      fontSize: 14, color: '#64748B', marginBottom: 32, lineHeight: 1.5,
    },

    fieldWrap: { marginBottom: 18 },
    label: {
      display: 'block', fontSize: 13, fontWeight: 600,
      color: '#94A3B8', marginBottom: 8, letterSpacing: '0.02em',
    },
    inputWrap: {
      position: 'relative',
    },
    input: (name) => ({
      width: '100%', boxSizing: 'border-box',
      padding: '13px 16px',
      background: focused === name
        ? 'rgba(37,99,235,0.06)'
        : 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${focused === name ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10, color: '#F1F5F9',
      fontSize: 15, outline: 'none',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      boxShadow: focused === name ? '0 0 0 4px rgba(37,99,235,0.12)' : 'none',
    }),
    inputPw: (name) => ({
      ...s.input(name),
      paddingRight: 46,
    }),
    eyeBtn: {
      position: 'absolute', right: 14, top: '50%',
      transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#64748B', display: 'flex', padding: 4,
      transition: 'color 0.15s',
    },

    error: {
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px',
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 10, marginBottom: 20,
      fontSize: 13.5, color: '#FCA5A5', lineHeight: 1.5,
      animation: 'fadeIn 0.2s ease',
    },
    errorDot: {
      width: 6, height: 6, borderRadius: '50%',
      background: '#EF4444', flexShrink: 0, marginTop: 4,
    },

    btn: {
      width: '100%', padding: '14px',
      background: loading
        ? 'rgba(37,99,235,0.6)'
        : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      border: 'none', borderRadius: 10,
      color: '#fff', fontSize: 15, fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      letterSpacing: '-0.2px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      transition: 'all 0.2s ease',
      boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.35)',
      transform: loading ? 'scale(0.99)' : 'scale(1)',
      fontFamily: 'inherit',
    },

    spinner: {
      width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
      borderTop: '2px solid #fff', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    },

    divider: {
      display: 'flex', alignItems: 'center', gap: 12,
      margin: '24px 0',
    },
    dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' },
    dividerText: { fontSize: 12, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' },

    hint: {
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 10, padding: '12px 14px',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px',
    },
    hintItem: { fontSize: 12, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' },
    hintDot: { width: 4, height: 4, borderRadius: '50%', background: '#334155', flexShrink: 0 },

    footer: {
      marginTop: 28, textAlign: 'center',
      fontSize: 12, color: '#334155', lineHeight: 1.6,
    },

    toast: {
      position: 'fixed', top: 24, left: '50%',
      transform: toast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-16px)',
      opacity: toast ? 1 : 0,
      transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(16,185,129,0.15)',
      border: '1px solid rgba(16,185,129,0.35)',
      borderRadius: 12, padding: '12px 20px',
      backdropFilter: 'blur(16px)',
      color: '#6EE7B7', fontSize: 14, fontWeight: 500,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      maxWidth: 420, textAlign: 'center',
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px rgba(13,20,36,0.95) inset !important;
          -webkit-text-fill-color: #F1F5F9 !important;
          caret-color: #F1F5F9;
        }
      `}</style>

      <GridBackground />

      {/* Toast notification */}
      <div style={s.toast}>
        <CheckCircleIcon />
        {toast}
      </div>

      <div style={s.page}>
        <div style={s.card}>

          {/* Logo */}
          <div style={s.logoRow}>
            <div style={s.logoMark}>B</div>
            <div>
              <div style={s.logoText}>Bado CRM</div>
              <div style={s.logoSub}>Quản lý khách hàng</div>
            </div>
          </div>

          {/* Heading */}
          <h1 style={s.heading}>Đăng nhập</h1>
          <p style={s.subheading}>Nhập thông tin tài khoản được cấp bởi Admin</p>

          {/* Error */}
          {error && (
            <div style={s.error}>
              <div style={s.errorDot} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={s.fieldWrap}>
              <label style={s.label} htmlFor="email">Email</label>
              <div style={s.inputWrap}>
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  placeholder="ten@bado.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  style={s.input('email')}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div style={s.fieldWrap}>
              <label style={s.label} htmlFor="password">Mật khẩu</label>
              <div style={s.inputWrap}>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  style={s.inputPw('password')}
                  disabled={loading}
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={s.btn}
              disabled={loading}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.01)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? (
                <>
                  <div style={s.spinner} />
                  Đang đăng nhập…
                </>
              ) : 'Đăng nhập'}
            </button>
          </form>

          {/* Divider */}
          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>Tài khoản demo</span>
            <div style={s.dividerLine} />
          </div>

          {/* Hint */}
          <div style={s.hint}>
            {[
              ['Admin',    'admin@bado.vn'],
              ['Manager',  'manager@bado.vn'],
              ['Sales',    'sales@bado.vn'],
              ['CSKH',     'cskh@bado.vn'],
            ].map(([role, email]) => (
              <div
                key={role}
                style={{ ...s.hintItem, cursor: 'pointer' }}
                onClick={() => { setEmail(email); setPassword('Bado@123'); }}
                title="Click để điền tự động"
              >
                <div style={s.hintDot} />
                <span style={{ color: '#64748B', fontWeight: 600 }}>{role}:</span>
                <span style={{ color: '#475569' }}>{email}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={s.footer}>
            Quên mật khẩu? Liên hệ <span style={{ color: '#2563EB', fontWeight: 600 }}>Admin</span> để được cấp lại.
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;