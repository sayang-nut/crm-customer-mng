import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Close dropdowns when clicking outside
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
    await dispatch(logout());
    navigate('/login');
  };
  
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-30">
      <div className="flex items-center justify-between w-full">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng, hợp đồng..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-4 ml-6">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            
            {showNotifications && (
              <div className="dropdown-menu right-0 w-80">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-dark-900">Thông báo</h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {/* Notification items */}
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-dark-900">
                          Hợp đồng sắp hết hạn
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Hợp đồng của ABC Company sẽ hết hạn trong 7 ngày
                        </p>
                        <p className="text-xs text-gray-500 mt-1">2 giờ trước</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-sm text-dark-900">Ticket mới được tạo</p>
                        <p className="text-xs text-gray-600 mt-1">
                          XYZ Restaurant vừa tạo ticket hỗ trợ kỹ thuật
                        </p>
                        <p className="text-xs text-gray-500 mt-1">5 giờ trước</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 border-t border-gray-200 text-center">
                  <button className="text-sm text-primary-500 hover:text-primary-600 font-medium">
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
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-dark-900">
                  {user?.full_name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-600 capitalize">{user?.role || 'admin'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
            
            {showUserMenu && (
              <div className="dropdown-menu right-0 w-56">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-dark-900">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="dropdown-item"
                >
                  <User className="w-4 h-4" />
                  <span>Thông tin cá nhân</span>
                </button>
                
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="dropdown-item"
                >
                  <Settings className="w-4 h-4" />
                  <span>Cài đặt</span>
                </button>
                
                <div className="dropdown-divider" />
                
                <button onClick={handleLogout} className="dropdown-item text-red-600">
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