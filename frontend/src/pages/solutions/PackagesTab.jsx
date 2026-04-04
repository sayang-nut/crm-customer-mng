/**
 * @file     frontend/src/pages/solutions/PackagesTab.jsx
 * @theme    WHITE PLAIN - Tailwind + Common Components
 */

import React, { useState, useEffect, useCallback } from 'react';
import solutionsService from '../../services/solutionsService';
import { Edit2, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';

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

const PackagesTab = ({ isAdmin }) => {
  const [packages, setPackages] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [selectedSolutionId, setSelectedSolutionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    solutionId: '', name: '', level: 'basic',
    priceMonthly: 0, priceYearly: 0, description: '', status: 'active'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgData, solData] = await Promise.all([
        solutionsService.getPackages(selectedSolutionId ? { solutionId: selectedSolutionId } : {}),
        solutionsService.getSolutions()
      ]);
      setPackages(pkgData);
      setSolutions(solData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedSolutionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await solutionsService.updatePackage(formData.id, formData);
      } else {
        await solutionsService.createPackage(formData);
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu gói dịch vụ.');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Tên gói',
      render: (val, row) => {
        const record = row || val;
        const text = (val && typeof val === 'object') ? val.name : val;
        return (
          <div className="space-y-1">
            <div className="font-semibold text-dark-900">{text}</div>
            <div className="text-xs text-gray-500">{record?.solution_name || 'N/A'}</div>
          </div>
        );
      }
    },
    {
      key: 'level',
      label: 'Cấp độ',
      render: (val) => {
        const v = (val && typeof val === 'object') ? val.level : val;
        const conf = LEVEL_COLORS[v] || LEVEL_COLORS.basic;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${conf.bg} ${conf.text} ${conf.border}`}>
            {LEVEL_LABELS[v] || v}
          </span>
        );
      }
    },
    {
      key: 'price_monthly',
      label: 'Giá tháng',
      render: (val) => {
        const v = (val && typeof val === 'object') ? val.price_monthly : val;
        const num = Number(v);
        return <span className="font-medium text-gray-900">{isNaN(num) ? 0 : new Intl.NumberFormat('vi-VN').format(num)} đ</span>;
      }
    },
    {
      key: 'price_yearly',
      label: 'Giá năm',
      render: (val) => {
        const v = (val && typeof val === 'object') ? val.price_yearly : val;
        const num = Number(v);
        return <span className="font-medium text-gray-900">{isNaN(num) ? 0 : new Intl.NumberFormat('vi-VN').format(num)} đ</span>;
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (val) => {
        const v = (val && typeof val === 'object') ? val.status : val;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {v === 'active' ? 'Đang bán' : 'Ngừng bán'}
          </span>
        );
      }
    },
  ];

  if (isAdmin) {
    columns.push({
      key: 'actions',
      label: 'Thao tác',
      render: (_, row) => {
        const record = row || _;
        return (
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm" icon={Edit2}
            onClick={() => {
              setFormData({
                id: record.id,
                solutionId: record.solution_id,
                name: record.name,
                level: record.level,
                priceMonthly: record.price_monthly,
                priceYearly: record.price_yearly,
                description: record.description || '',
                status: record.status
              });
              setShowForm(true);
            }}
          />
          <Button
            variant="danger" size="sm" icon={Trash2}
            onClick={async () => {
              if (window.confirm('Xác nhận xóa gói dịch vụ?')) {
                await solutionsService.deletePackage(record.id);
                fetchData();
              }
            }}
          />
        </div>
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:w-1/3">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            value={selectedSolutionId}
            onChange={(e) => setSelectedSolutionId(e.target.value)}
          >
            <option value="">-- Tất cả giải pháp --</option>
            {Array.isArray(solutions) && solutions.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.group_name})</option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              setFormData({
                solutionId: selectedSolutionId || (solutions.length > 0 ? solutions[0].id : ''),
                name: '', level: 'basic', priceMonthly: 0, priceYearly: 0, description: '', status: 'active'
              });
              setShowForm(true);
            }}
          >
            + Thêm Gói dịch vụ
          </Button>
        )}
      </div>

      {/* Package Form */}
      {showForm && (
        <Card className="border-purple-200 bg-purple-50">
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <h3 className="text-lg font-semibold text-purple-900">
              {formData.id ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Giải pháp *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  value={formData.solutionId}
                  onChange={(e) => setFormData({ ...formData, solutionId: e.target.value })}
                >
                  <option value="">Chọn giải pháp</option>
                  {Array.isArray(solutions) && solutions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cấp độ *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  {Object.entries(LEVEL_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Tên gói hiển thị *" required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Bado Retail - Cơ bản"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Giá theo tháng (VNĐ) *" type="number" min="0" required
                value={formData.priceMonthly}
                onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
              />
              <Input
                label="Giá theo năm (VNĐ) *" type="number" min="0" required
                value={formData.priceYearly}
                onChange={(e) => setFormData({ ...formData, priceYearly: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Đang bán</option>
                <option value="inactive">Ngừng bán</option>
              </select>
            </div>

            <Input
              label="Mô tả / Tính năng" as="textarea" rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="flex gap-3">
              <Button type="submit" variant="primary" size="sm">
                Lưu
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden shadow-sm border-gray-200">
        <Table
          columns={columns}
          data={Array.isArray(packages) ? packages : []}
          loading={loading}
          emptyMessage="Không tìm thấy gói dịch vụ nào."
        />
      </Card>
    </div>
  );
};

export default PackagesTab;