import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCurrentUser } from '../../store/slices/authSlice';
import Loading from '../common/Loading';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);
  
  if (loading) {
    return <Loading fullScreen text="Đang tải thông tin người dùng..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

export default ProtectedRoute;