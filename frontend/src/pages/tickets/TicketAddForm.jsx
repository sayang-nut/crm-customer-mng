import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import ticketsService from '../../services/ticketsService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const TicketAddForm = ({ onCancel, onSaved }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const res = await ticketsService.getTypes();
        setTypes(res || []);
      } catch {
        setTypes([]);
      }
    };
    loadTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.target);

    try {
      await ticketsService.create({
        title: fd.get('title'),
        description: fd.get('description'),
        customerId: Number(fd.get('customerId')),
        ticketTypeId: Number(fd.get('ticketTypeId')),
        priority: fd.get('priority'),
        contractId: fd.get('contractId') ? Number(fd.get('contractId')) : undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-full">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại danh sách Ticket</span>
        </button>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
          Tạo Ticket mới
        </h1>
        <p className="text-lg text-gray-600">Điền thông tin chi tiết để ghi nhận yêu cầu hỗ trợ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-none text-sm">
            {error}
          </div>
        )}

        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin chung</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer ID *</label>
                <Input
                  name="customerId"
                  type="number"
                  min="1"
                  required
                  placeholder="ID khách hàng"
                  className="!rounded-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Loại ticket *</label>
                <select
                  name="ticketTypeId"
                  required
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Chọn loại</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ưu tiên</label>
                <select
                  name="priority"
                  defaultValue="medium"
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="urgent">Khẩn cấp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contract ID (tuỳ chọn)</label>
                <Input
                  name="contractId"
                  type="number"
                  min="1"
                  placeholder="Liên kết hợp đồng nếu có"
                  className="!rounded-none"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết vấn đề</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề *</label>
                <Input name="title" required placeholder="Mô tả ngắn vấn đề..." className="!rounded-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả chi tiết *</label>
                <textarea
                  name="description"
                  required
                  placeholder="Mô tả vấn đề cần hỗ trợ..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[120px]"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onCancel} className="!rounded-none px-8">
            Huỷ
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="!rounded-none px-8">
            {loading ? 'Đang tạo…' : 'Tạo ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TicketAddForm;