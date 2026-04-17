import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Calendar,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import contractsService from '../../services/contractsService';
import solutionsService from '../../services/solutionsService';

import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const fmtVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const ContractRenewForm = ({ contract, onCancel, onSaved }) => {
  const [fullContract, setFullContract] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    newEndDate: '',
    newPackageId: '',
    newValue: 0,
    discount: 0,
    finalValue: 0,
    notes: '',
  });

  // Tải chi tiết Hợp đồng và danh sách Gói dịch vụ tương ứng
  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingData(true);
        // Phải gọi API lấy chi tiết để có được solution_id, package_id gốc
        const detail = await contractsService.getById(contract.id);
        setFullContract(detail);

        // Lấy danh sách packages và lọc theo giải pháp của hợp đồng hiện tại
        const pkgRes = await solutionsService.getPackages();
        const allPackages = pkgRes?.data || pkgRes || [];
        setPackages(allPackages.filter((p) => p.solution_id === detail.solution_id));

        // Tính ngày gia hạn mặc định dựa trên chu kỳ
        let newEndStr = '';
        if (detail.end_date) {
          const end = new Date(detail.end_date);
          if (!isNaN(end.getTime())) {
            if (detail.billing_cycle === 'yearly') end.setFullYear(end.getFullYear() + 1);
            else end.setMonth(end.getMonth() + 1);
            newEndStr = end.toISOString().split('T')[0];
          }
        }

        // Set giá trị mặc định cho form
        setForm(prev => ({
          ...prev,
          newEndDate: newEndStr,
          newPackageId: detail.package_id,
          newValue: detail.value,
          finalValue: detail.value, // Default discount 0 cho kỳ mới
        }));
      } catch (err) {
        setError('Không thể tải dữ liệu hợp đồng để gia hạn.');
      } finally {
        setLoadingData(false);
      }
    };
    if (contract?.id) initData();
  }, [contract.id]);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === Number(form.newPackageId)),
    [packages, form.newPackageId]
  );

  // Tự động điều chỉnh Giá trị khi người dùng đổi Gói dịch vụ
  useEffect(() => {
    if (fullContract && selectedPackage && form.newPackageId && form.newPackageId != fullContract.package_id) {
      const price =
        fullContract.billing_cycle === 'yearly'
          ? Number(selectedPackage.price_yearly || 0)
          : Number(selectedPackage.price_monthly || 0);
      setField('newValue', price);
    } else if (fullContract && form.newPackageId == fullContract.package_id) {
      setField('newValue', fullContract.value || 0);
    }
  }, [form.newPackageId, selectedPackage, fullContract]);

  // Tính toán lại Giá trị thu thực khi thay đổi Giảm giá/Giá gốc
  useEffect(() => {
    const val = Number(form.newValue) || 0;
    const disc = Number(form.discount) || 0;
    const final = val * (1 - disc / 100);
    setField('finalValue', Math.round(final));
  }, [form.newValue, form.discount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        newEndDate: form.newEndDate,
        newPackageId: Number(form.newPackageId),
        newValue: Number(form.newValue),
        discount: Number(form.discount),
        notes: form.notes,
      };
      await contractsService.renew(fullContract.id, payload);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý gia hạn.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingData) {
    return (
      <Card className="border border-gray-200 !rounded-none !shadow-none">
        <div className="min-h-[400px] flex items-center justify-center">
          <Loading text="Đang thu thập thông tin hợp đồng..." />
        </div>
      </Card>
    );
  }

  return (
    <div className="bg-white min-h-full">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại danh sách hợp đồng</span>
        </button>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
          Gia hạn hợp đồng
        </h1>
        <p className="text-lg text-gray-600">
          Khách hàng: <strong className="text-gray-900">{fullContract.company_name}</strong> — Số HĐ: <strong className="text-blue-600">{fullContract.contract_number}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-none text-sm">
            {error}
          </div>
        )}

        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Thời hạn gia hạn
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Ngày hết hạn hiện tại
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed font-medium">
                  {fmtDate(fullContract.end_date)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày hết hạn mới *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.newEndDate}
                  onChange={(e) => setField('newEndDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Gói dịch vụ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Giải pháp hiện tại
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed font-medium">
                  {fullContract.solution_name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lựa chọn nâng cấp (Mặc định giữ gói cũ) *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.newPackageId}
                  onChange={(e) => setField('newPackageId', e.target.value)}
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({String(p.level).toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Tài chính chu kỳ mới
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 border border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">Giá trị gốc (VNĐ)</label>
                <input type="number" required className="w-full px-0 py-2 text-2xl font-bold text-gray-900 border-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent" value={form.newValue} onChange={(e) => setField('newValue', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">Chiết khấu (%)</label>
                <input type="number" min="0" max="100" className="w-full px-0 py-2 text-2xl font-bold text-gray-900 border-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent" value={form.discount} onChange={(e) => setField('discount', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">Giá trị thu thực</label>
                <div className="px-0 py-2 text-2xl font-black text-green-700 border-0 border-b border-transparent">
                  {fmtVND(form.finalValue)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú gia hạn</label>
            <textarea className="w-full border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" rows={3} placeholder="Ví dụ: Khách hàng nâng cấp từ Basic lên Professional..." value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
          </div>
        </Card>

        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving} className="!rounded-none px-8">Huỷ</Button>
          <Button type="submit" variant="primary" disabled={isSaving} className="!rounded-none px-8 bg-blue-600 hover:bg-blue-700">
            {isSaving ? 'Đang xử lý...' : 'Xác nhận Gia hạn'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractRenewForm;