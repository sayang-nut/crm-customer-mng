import React from 'react';

const Badge = ({ children, variant = 'primary', dot = false, className = '' }) => {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    gray: 'badge-gray',
  };
  
  const dotClasses = {
    primary: 'status-dot bg-primary-500',
    success: 'status-dot-success',
    warning: 'status-dot-warning',
    danger: 'status-dot-danger',
    info: 'status-dot-info',
    gray: 'status-dot bg-gray-500',
  };
  
  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {dot && <span className={dotClasses[variant]} />}
      {children}
    </span>
  );
};

export default Badge;