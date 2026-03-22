/**
 * @file     frontend/src/components/auth/ProtectedRoute.jsx
 * FIX: Chờ isLoading = false trước khi quyết định redirect
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // ✅ Chờ init xong
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080E1A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'sans-serif', color: '#64748B', fontSize: 14,
      }}>
        Đang tải...
      </div>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Sai role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;