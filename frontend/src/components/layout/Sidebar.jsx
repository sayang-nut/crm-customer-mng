import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Ticket,
  Package,
  DollarSign,
  Settings,
  ChevronRight,
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      title: 'Khách hàng',
      icon: Building2,
      path: '/customers',
      badge: '1,234',
    },
    {
      title: 'Hợp đồng',
      icon: FileText,
      path: '/contracts',
      badge: '856',
    },
    {
      title: 'Tickets',
      icon: Ticket,
      path: '/tickets',
      badge: '24',
      badgeColor: 'bg-red-500',
    },
    {
      title: 'Giải pháp & Gói',
      icon: Package,
      path: '/solutions',
    },
    {
      title: 'Doanh thu',
      icon: DollarSign,
      path: '/revenues',
    },
    {
      title: 'Người dùng',
      icon: Users,
      path: '/users',
    },
    {
      title: 'Cài đặt',
      icon: Settings,
      path: '/settings',
    },
  ];
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">BADO CRM</h1>
            <p className="text-xs text-gray-500">Quản lý khách hàng</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`
              }
            >
              <item.icon className="sidebar-nav-icon" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    item.badgeColor || 'bg-primary-100 text-primary-700'
                  } ${item.badgeColor ? 'text-white' : ''}`}
                >
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-dark-900 mb-1">
            Nâng cấp gói Pro
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            Mở khóa tất cả tính năng nâng cao
          </p>
          <button className="w-full btn btn-primary-gradient btn-sm">
            Nâng cấp ngay
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;