/**
 * @file     src/components/layout/Header.jsx
 * @theme    WHITE PLAIN - Sync LoginPage
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, User, Settings, LogOut, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Click outside logic giữ nguyên
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-primary-500" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {showNotifications && (
              <div className="dropdown-menu right-0 w-80 shadow-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                  <h3 className="font-semibold text-dark-900 text-sm uppercase tracking-wide">Thông báo</h3>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {/* Demo notifications */}
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-900">Hợp đồng sắp hết hạn</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          Hợp đồng ABC Company sẽ hết hạn trong 7 ngày
                        </p>
                        <p className="text-xs text-gray-500 mt-1">2 giờ trước</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-900">Ticket mới</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          XYZ Restaurant tạo ticket hỗ trợ kỹ thuật
                        </p>
                        <p className="text-xs text-gray-500 mt-1">5 giờ trước</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 border-t border-gray-200 text-center bg-gray-50 rounded-b-lg">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
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