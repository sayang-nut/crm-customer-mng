/**
 * @file     frontend/src/pages/solutions/SolutionsPage.jsx
 * @theme    WHITE PLAIN - Tailwind + Common Components
 */

import React, { useState } from 'react';
import { useAuth } from '../../store/authContext';
import SolutionsTab from './SolutionsTab';
import PackagesTab from './PackagesTab';
import IndustriesTab from './IndustriesTab';

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
const SolutionsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('solutions');

  const tabs = [
    { key: 'solutions', label: 'Giải pháp' },
    { key: 'packages', label: 'Gói dịch vụ' },
    { key: 'industries', label: 'Ngành nghề' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'solutions':
        return <SolutionsTab isAdmin={isAdmin} />;
      case 'packages':
        return <PackagesTab isAdmin={isAdmin} />;
      case 'industries':
        return <IndustriesTab isAdmin={isAdmin} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white min-h-screen space-y-8 p-6">
      {/* Header */}
      <div className="pb-8 border-b border-gray-200">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-dark-900">Danh mục sản phẩm</h1>
          <p className="text-xl text-gray-700">Quản lý nhóm giải pháp, gói dịch vụ và ngành nghề khách hàng</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px bg-white">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`group flex items-center gap-2.5 py-4 px-6 rounded-t-lg font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white border-b-2 border-primary-500 text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-dark-900 hover:bg-gray-50 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{renderTabContent()}</div>
    </div>
  );
};

export default SolutionsPage;