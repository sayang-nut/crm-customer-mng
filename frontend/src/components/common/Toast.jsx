import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeNotification } from '../../store/slices/notificationSlice';

const Toast = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications.items);
  
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };
  
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };
  
  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500',
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.map((notification) => {
        const Icon = icons[notification.type] || Info;
        
        return (
          <ToastItem
            key={notification.id}
            notification={notification}
            Icon={Icon}
            colors={colors}
            iconColors={iconColors}
            onClose={() => dispatch(removeNotification(notification.id))}
          />
        );
      })}
    </div>
  );
};

const ToastItem = ({ notification, Icon, colors, iconColors, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, notification.duration || 5000);
    
    return () => clearTimeout(timer);
  }, [notification, onClose]);
  
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-down ${
        colors[notification.type]
      }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[notification.type]}`} />
      
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className="font-semibold text-sm">{notification.title}</p>
        )}
        <p className="text-sm mt-1">{notification.message}</p>
      </div>
      
      <button
        onClick={onClose}
        className="p-1 hover:bg-black hover:bg-opacity-5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;