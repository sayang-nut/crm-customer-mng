/**
 * @file     frontend/src/App.jsx
 * @location frontend/src/
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Root component – React Router + AuthProvider.
 *
 * MODULE ĐÃ HOÀN THÀNH:
 *   Module 1 – Auth    : /login, /change-password
 *   Module 2 – Users   : /users, /users/login-logs
 *
 * MODULE TIẾP THEO (placeholder):
 *   Module 3 – Customers, Module 4 – Solutions, ...
 * ─────────────────────────────────────────────────────────────────
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// ── Module 1: Auth ────────────────────────────────────────────────
import LoginPage          from './pages/auth/LoginPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import { Page403, Page404 } from './pages/auth/ErrorPages';

// ── Module 2: Users ───────────────────────────────────────────────
import UsersPage     from './pages/users/UsersPage';
import LoginLogsPage from './pages/users/LoginLogsPage';

// ── Dashboard placeholder ─────────────────────────────────────────
const DashboardPlaceholder = ({ title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  return (
    <div style={{
      minHeight: '100vh', background: '#080E1A',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&display=swap');`}</style>
      <div style={{
        background: 'rgba(13,20,36,0.9)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: '48px 56px', textAlign: 'center', maxWidth: 440,
      }}>
        <div style={{ fontSize: 13, color: '#2563EB', fontWeight: 700, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Đang phát triển
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9', margin: '0 0 10px', letterSpacing: '-0.5px' }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 28 }}>
          <strong style={{ color: '#F1F5F9' }}>{user?.fullName}</strong>
          <br />({user?.role})
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/users" style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'rgba(37,99,235,0.15)', color: '#60A5FA', border: '1px solid rgba(37,99,235,0.3)', textDecoration: 'none' }}>
            Quản lý nhân viên
          </a>
          <a href="/change-password" style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
            Đổi mật khẩu
          </a>
          <button onClick={logout} style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Routes ────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>

    {/* ── Public ── */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/403"   element={<Page403 />} />
    <Route path="/404"   element={<Page404 />} />

    {/* ── Module 1: Auth ── */}
    <Route path="/change-password" element={
      <ProtectedRoute><ChangePasswordPage /></ProtectedRoute>
    } />

    {/* ── Module 2: Users ── */}
    <Route path="/users" element={
      <ProtectedRoute allowedRoles={['admin', 'manager']}>
        <UsersPage />
      </ProtectedRoute>
    } />
    <Route path="/users/login-logs" element={
      <ProtectedRoute allowedRoles={['admin']}>
        <LoginLogsPage />
      </ProtectedRoute>
    } />

    {/* ── Dashboards (placeholder → thay bằng module thật sau) ── */}
    <Route path="/dashboard" element={
      <ProtectedRoute allowedRoles={['admin', 'manager']}>
        <DashboardPlaceholder title="Admin Dashboard" />
      </ProtectedRoute>
    } />
    <Route path="/dashboard/sales" element={
      <ProtectedRoute allowedRoles={['admin', 'manager', 'sales']}>
        <DashboardPlaceholder title="Sales Dashboard" />
      </ProtectedRoute>
    } />
    <Route path="/dashboard/cskh" element={
      <ProtectedRoute allowedRoles={['admin', 'manager', 'cskh']}>
        <DashboardPlaceholder title="CSKH Dashboard" />
      </ProtectedRoute>
    } />
    <Route path="/tickets" element={
      <ProtectedRoute>
        <DashboardPlaceholder title="Tickets" />
      </ProtectedRoute>
    } />

    {/* ── Default ── */}
    <Route path="/"  element={<Navigate to="/login" replace />} />
    <Route path="*"  element={<Page404 />} />

  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;