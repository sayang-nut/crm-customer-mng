/**
 * @file     src/components/layout/Header.jsx
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Bell, User, Settings, LogOut, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authContext';
import notificationsService from '../../services/notificationsService';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  
  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError('');

    try {
      const res = await notificationsService.getList({ page: 1, limit: 5 });
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      setNotificationsError('Không thể tải thông báo.');
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications, loadNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatTime = (value) => {
    if (!value) return '';
    const now = new Date();
    const date = new Date(value);
    const diffMinutes = Math.floor((now - date) / 60000);
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleNotificationClick = async (notification) => {
    if (!notification?.is_read) {
      try {
        await notificationsService.markRead(notification.id);
      } catch (err) {
        // ignore failure
      }
    }
    setShowNotifications(false);
    navigate('/notifications');
  };

  const initials = user?.fullName?.charAt(0)?.toUpperCase() || 'A';

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        
        {/* Search - Sync Login input style */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng, hợp đồng..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg 
                         bg-white text-dark-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-primary-500 
                         focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Right side - Plain white */}
        <div className="flex items-center gap-2 ml-6">
          
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-primary-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="dropdown-menu right-0 w-80 shadow-lg border border-gray-200 bg-white rounded-xl">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                  <h3 className="font-semibold text-dark-900 text-sm uppercase tracking-wide">Thông báo</h3>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-6 text-center text-sm text-gray-500">Đang tải thông báo...</div>
                  ) : notificationsError ? (
                    <div className="p-6 text-center text-sm text-red-600">{notificationsError}</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">Không có thông báo mới.</div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${notification.is_read ? 'bg-gray-400' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-dark-900 truncate">{notification.title}</p>
                              <span className="text-xs text-gray-500">{formatTime(notification.created_at)}</span>
                            </div>
                            <p
                              className="text-xs text-gray-600 mt-1 line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html: notification.message
                                  .replace(/<b>/g, '<strong style="color:#1f2937;font-weight:700">')
                                  .replace(/<\/b>/g, '</strong>'),
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="px-4 py-3 border-t border-gray-200 text-center bg-gray-50 rounded-b-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              aria-label="Tài khoản của bạn"
            >
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user?.fullName || 'Avatar'} 
                  className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-200"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 
                                rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white font-semibold text-sm">{initials}</span>
                </div>
              )}
              <div className="hidden md:block min-w-0">
                <p className="text-sm font-medium text-dark-900 truncate max-w-40">
                  {user?.fullName || 'Người dùng'}
                </p>
                <p className="text-xs text-gray-600 capitalize">{user?.role || 'Chưa xác định'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 ml-1 transition-transform 
                                     group-hover:-rotate-180" />
            </button>

            {showUserMenu && (
              <div className="dropdown-menu right-0 w-56 shadow-lg border border-gray-200 rounded-xl">
                {/* Profile header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <p className="text-sm font-semibold text-dark-900 truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 truncate">{user?.email}</p>
                </div>

                {/* Menu items */}
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="dropdown-item flex items-center gap-3"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Thông tin cá nhân</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="dropdown-item flex items-center gap-3"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Cài đặt</span>
                </button>

                <hr className="border-gray-200 mx-4 my-1" />

                <button 
                  onClick={handleLogout}
                  className="dropdown-item flex items-center gap-3 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;