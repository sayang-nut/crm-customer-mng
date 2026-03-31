/**
 * @file     frontend/src/pages/auth/ErrorPages.jsx
 * @location frontend/src/pages/auth/ErrorPages.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires react-router-dom        → Link, useNavigate
 * @requires ../../store/authContext → useAuth
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang lỗi dùng chung toàn app.
 *   Page403 – 403 Forbidden  (không đủ quyền)
 *   Page404 – 404 Not Found  (route không tồn tại)
 *
 * Cả hai đều KHÔNG có sidebar layout – render standalone.
 * ─────────────────────────────────────────────────────────────────
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
import { ROLE_HOME } from '../../constants';

const ErrorLayout = ({ code, title, description, action }) => (
  <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; }
    `}</style>
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(37,99,235,0.06) 0%, transparent 70%), #080E1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          fontSize: 120, fontWeight: 900,
          background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(124,58,237,0.3))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1, marginBottom: 8, letterSpacing: -8,
          userSelect: 'none',
        }}>
          {code}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9', marginBottom: 12, letterSpacing: '-0.4px' }}>
          {title}
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', marginBottom: 32, lineHeight: 1.6 }}>
          {description}
        </p>
        {action}
      </div>
    </div>
  </>
);

// ── 403 Forbidden ─────────────────────────────────────────────────
export const Page403 = () => {
  const { user } = useAuth();
  const dest = user ? (ROLE_HOME[user.role] || '/dashboard') : '/login';

  return (
    <ErrorLayout
      code="403"
      title="Không có quyền truy cập"
      description="Bạn không có quyền xem trang này. Vui lòng liên hệ Admin nếu bạn cho rằng đây là lỗi."
      action={
        <Link to={dest} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          borderRadius: 10, color: '#fff',
          fontSize: 15, fontWeight: 700, textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
        }}>
          ← Về trang chủ
        </Link>
      }
    />
  );
};

// ── 404 Not Found ─────────────────────────────────────────────────
export const Page404 = () => {
  const navigate = useNavigate();
  return (
    <ErrorLayout
      code="404"
      title="Trang không tồn tại"
      description="Đường dẫn bạn truy cập không hợp lệ hoặc đã bị xóa."
      action={
        <button onClick={() => navigate(-1)} style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          border: 'none', borderRadius: 10, color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 4px 20px rgba(37,99,235,0.3)',
        }}>
          ← Quay lại
        </button>
      }
    />
  );
};