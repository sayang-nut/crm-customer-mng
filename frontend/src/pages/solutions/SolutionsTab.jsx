/**
 * @file     frontend/src/pages/solutions/SolutionsTab.jsx
 * @theme    WHITE PLAIN - Tailwind + Common Components
 */

import React, { useState, useEffect, useCallback } from 'react';
import solutionsService from '../../services/solutionsService';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const SolutionsTab = ({ isAdmin }) => {
  const [groups, setGroups] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showSolutionForm, setShowSolutionForm] = useState(false);
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
      setShowGroupForm(false);
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
      setShowSolutionForm(false);
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
                setShowGroupForm(true);
              }}
            >
              + Nhóm
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSolutionData({ groupId: '', name: '', description: '' });
                setShowSolutionForm(true);
              }}
            >
              + Giải pháp
            </Button>
          </div>
        )}
      </div>

      {/* Group Form */}
      {showGroupForm && (
        <Card className="border-blue-200 bg-blue-50">
          <form onSubmit={handleGroupSubmit} className="space-y-4 p-6">
            <h3 className="text-lg font-semibold text-blue-900">
              {groupData.id ? 'Sửa nhóm giải pháp' : 'Thêm nhóm giải pháp'}
            </h3>
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
            <div className="flex gap-3">
              <Button type="submit" variant="primary" size="sm">
                Lưu
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowGroupForm(false);
                  setGroupData({ name: '', description: '' });
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Solution Form */}
      {showSolutionForm && (
        <Card className="border-green-200 bg-green-50">
          <form onSubmit={handleSolutionSubmit} className="space-y-4 p-6">
            <h3 className="text-lg font-semibold text-green-900">
              {solutionData.id ? 'Sửa giải pháp' : 'Thêm giải pháp'}
            </h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nhóm giải pháp *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                name="groupId"
                value={solutionData.groupId}
                onChange={(e) => setSolutionData({ ...solutionData, groupId: e.target.value })}
              >
                <option value="">Chọn nhóm</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
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
            <div className="flex gap-3">
              <Button type="submit" variant="primary" size="sm">
                Lưu
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSolutionForm(false);
                  setSolutionData({ groupId: '', name: '', description: '' });
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

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
                      onClick={() => {
                        setGroupData({ ...group, id: group.id });
                        setShowGroupForm(true);
                      }}
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
                              onClick={() => {
                                setSolutionData({ ...solution, id: solution.id });
                                setShowSolutionForm(true);
                              }}
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
    </div>
  );
};

export default SolutionsTab;