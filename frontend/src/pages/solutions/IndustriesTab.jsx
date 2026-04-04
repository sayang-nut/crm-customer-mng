/**
 * @file     frontend/src/pages/solutions/IndustriesTab.jsx
 * @theme    WHITE PLAIN - Tailwind + Common Components
 */

import React, { useState, useEffect, useCallback } from 'react';
import solutionsService from '../../services/solutionsService';
import { Edit2, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';

const IndustriesTab = ({ isAdmin }) => {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await solutionsService.getIndustries();
      console.log('Dữ liệu API Ngành nghề trả về:', data); // Log để dễ debug
      
      // Service đã quét và đảm bảo trả về mảng
      setIndustries(data || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách ngành nghề:', err.response?.data || err.message);
      setIndustries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await solutionsService.updateIndustry(formData.id, formData.name);
        alert('Cập nhật ngành nghề thành công!');
      } else {
        await solutionsService.createIndustry(formData.name);
        alert('Thêm ngành nghề thành công!');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu ngành nghề.');
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'Tên ngành nghề', 
      render: (val) => {
        const text = (val && typeof val === 'object') ? val.name : val;
        return <span className="font-semibold text-gray-900">{text}</span>;
      }
    },
    { 
      key: 'created_at', 
      label: 'Ngày tạo', 
      render: (val) => {
        const dateVal = (val && typeof val === 'object') ? val.created_at : val;
        if (!dateVal) return 'N/A';
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN');
      } 
    },
  ];

  if (isAdmin) {
    columns.push({
      key: 'actions', label: 'Thao tác',
      render: (_, row) => {
        const record = row || _;
        return (
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm" icon={Edit2}
            onClick={() => { setFormData({ id: record.id, name: record.name }); setShowForm(true); }}
          />
          <Button
            variant="danger" size="sm" icon={Trash2}
            onClick={async () => {
              if (window.confirm('Xác nhận xóa ngành nghề này?')) {
                try {
                  await solutionsService.deleteIndustry(record.id);
                  alert('Xóa ngành nghề thành công!');
                  fetchData();
                } catch (err) {
                  alert(err.response?.data?.message || 'Không thể xóa do dữ liệu đang được sử dụng.');
                }
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
      <div className="flex justify-end">
        {isAdmin && (
          <Button variant="primary" onClick={() => { setFormData({ name: '' }); setShowForm(true); }}>
            + Thêm Ngành nghề
          </Button>
        )}
      </div>

      {/* Industry Form */}
      {showForm && (
        <Card className="border-orange-200 bg-orange-50">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <h3 className="text-lg font-semibold text-orange-900">
              {formData.id ? 'Sửa ngành nghề' : 'Thêm ngành nghề'}
            </h3>
            <Input
              label="Tên ngành nghề *" required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
        <Table columns={columns} data={industries} loading={loading} emptyMessage="Chưa có ngành nghề nào." />
      </Card>
    </div>
  );
};

export default IndustriesTab;