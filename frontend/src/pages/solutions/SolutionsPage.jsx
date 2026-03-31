/**
 * @file     frontend/src/pages/solutions/SolutionsPage.jsx
 * @theme    WHITE PLAIN - Tailwind + Common Components
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/authContext';
import solutionsService from '../../services/solutionsService';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';

const LEVEL_LABELS = {
  support: 'Hỗ trợ',
  basic: 'Cơ bản', 
  professional: 'Chuyên nghiệp',
  multichannel: 'Đa kênh',
  enterprise: 'Doanh nghiệp',
};

const LEVEL_COLORS = {
  support: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  basic: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  professional: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  multichannel: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  enterprise: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

// ════════════════════════════════════════════════════════════════
// TAB 1: SOLUTIONS (Groups + Solutions tree)
// ════════════════════════════════════════════════════════════════
const SolutionsTab = ({ isAdmin }) => {
  const [groups, setGroups] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [groupData, setGroupData] = useState({ name: '', description: '' });
  const [solutionData, setSolutionData] = useState({ groupId: '', name: '', description: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [g, s] = await Promise.all([solutionsService.getGroups(), solutionsService.getSolutions()]);
      setGroups(g); setSolutions(s);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      if (groupData.id) {
        await solutionsService.updateGroup(groupData.id, groupData);
      } else {
        await solutionsService.createGroup(groupData);
      }
      setShowGroupModal(false);
      setGroupData({ name: '', description: '' });
      fetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi.');
    }
  };

  const handleSolutionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (solutionData.id) {
        await solutionsService.updateSolution(solutionData.id, solutionData);
      } else {
        await solutionsService.createSolution(solutionData);
      }
      setShowSolutionModal(false);
      setSolutionData({ groupId: '', name: '', description: '' });
      fetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi.');
    }
  };

  if (loading) return <Loading fullScreen={false} text="Đang tải giải pháp..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div className="text-sm text-gray-700">
          {groups.length} nhóm · {solutions.length} giải pháp
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGroupData({ name: '', description: '' });
                setShowGroupModal(true);
              }}
            >
              + Nhóm
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSolutionData({ groupId: '', name: '', description: '' });
                setShowSolutionModal(true);
              }}
            >
              + Giải pháp
            </Button>
          </div>
        )}
      </div>

      {/* Groups Tree */}
      <div className="space-y-4">
        {groups.map(group => {
          const groupSolutions = solutions.filter(s => s.solution_group_id === group.id);
          return (
            <Card key={group.id} className="border-gray-200 shadow-sm hover:shadow-md">
              {/* Group Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-dark-900">{group.name}</h3>
                  <p className="text-sm text-gray-600">{group.description}</p>
                  <span className="text-sm font-semibold text-blue-600">{groupSolutions.length} giải pháp</span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit2}
                      onClick={() => setGroupData({ ...group, id: group.id })}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={async () => {
                        if (window.confirm('Xác nhận xóa nhóm?')) {
                          await solutionsService.deleteGroup(group.id);
                          fetch();
                        }
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </div>

              {/* Solutions List */}
              <div className="divide-y divide-gray-100">
                {groupSolutions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 italic">Chưa có giải pháp nào</div>
                ) : (
                  groupSolutions.map((solution, i) => (
                    <div key={solution.id} className="p-5 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <div className="space-y-1">
                            <div className="font-semibold text-dark-900">{solution.name}</div>
                            {solution.description && (
                              <div className="text-sm text-gray-600">{solution.description}</div>
                            )}
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {solution.package_count} gói
                          </span>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Edit2}
                              onClick={() => setSolutionData({ ...solution, id: solution.id })}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={async () => {
                                if (window.confirm('Xác nhận xóa giải pháp?')) {
                                  await solutionsService.deleteSolution(solution.id);
                                  fetch();
                                }
                              }}
                            >
                              Xóa
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Group Modal */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setGroupData({ name: '', description: '' });
        }}
        title={groupData.id ? 'Sửa nhóm giải pháp' : 'Thêm nhóm giải pháp'}
      >
        <form onSubmit={handleGroupSubmit} className="space-y-6">
          <Input
            label="Tên nhóm *"
            name="name"
            value={groupData.name}
            onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
            required
          />
          <Input
            label="Mô tả"
            name="description"
            value={groupData.description}
            onChange={(e) => setGroupData({ ...groupData, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* Solution Modal */}
      <Modal
        isOpen={showSolutionModal}
        onClose={() => {
          setShowSolutionModal(false);
          setSolutionData({ groupId: '', name: '', description: '' });
        }}
        title={solutionData.id ? 'Sửa giải pháp' : 'Thêm giải pháp'}
      >
        <form onSubmit={handleSolutionSubmit} className="space-y-6">
          <Input
            label="Nhóm giải pháp *"
            as="select"
            name="groupId"
            value={solutionData.groupId}
            onChange={(e) => setSolutionData({ ...solutionData, groupId: e.target.value })}
            required
          >
            <option value="">Chọn nhóm</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Input>
          <Input
            label="Tên giải pháp *"
            name="name"
            value={solutionData.name}
            onChange={(e) => setSolutionData({ ...solutionData, name: e.target.value })}
            required
          />
          <Input
            label="Mô tả"
            name="description"
            value={solutionData.description}
            onChange={(e) => setSolutionData({ ...solutionData, description: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};

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