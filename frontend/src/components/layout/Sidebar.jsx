import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, FileText, Ticket, 
  Package, DollarSign, Settings, ChevronRight,
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Khách hàng', icon: Building2, path: '/customers' },
    { title: 'Hợp đồng', icon: FileText, path: '/contracts' },
    { title: 'Tickets', icon: Ticket, path: '/tickets' },
    { title: 'Giải pháp & Gói', icon: Package, path: '/solutions' },
    { title: 'Doanh thu', icon: DollarSign, path: '/revenues' },
    { title: 'Người dùng', icon: Users, path: '/users' },
  ];

  return (  
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
      
      {/* Logo - Plain white */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 
                          rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-dark-900 tracking-tight">BADO CRM</h1>
            <p className="text-xs text-gray-500 font-medium">Quản lý khách hàng</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item rounded-lg transition-colors ${
                  isActive 
                    ? 'sidebar-nav-item-active bg-primary-50 border-l-4 border-primary-500 shadow-sm' 
                    : 'hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="sidebar-nav-icon text-gray-600 group-hover:text-primary-500" />
              <span className="flex-1 font-medium">{item.title}</span>
              
              {item.badge && (
                <span className={`
                  px-2 py-1 text-xs font-semibold rounded-full ml-2 shadow-sm
                  ${item.badgeColor || 'bg-gray-200 text-gray-800'}
                `}>
                  {item.badge}
                </span>
              )}
              
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-50 text-gray-400" />
            </NavLink>
          ))}
        </div>
      </nav>
      
      
    </aside>
  );
};

export default Sidebar;