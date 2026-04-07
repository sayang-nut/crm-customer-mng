import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  User,
  Phone,
  Mail,
  Package,
  DollarSign,
  Calculator,
  ArrowLeft,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../../store/authContext';
import contractsService from '../../services/contractsService';
import customerService from '../../services/customerService';
import solutionsService from '../../services/solutionsService';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const fmtVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const ContractAddForm = ({ onCancel, onSaved }) => {
  const { user: currentUser } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [packages, setPackages] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    contractNumber: `HD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    customerId: '',
    solutionId: '',
    packageId: '',
    billingCycle: 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    value: 0,
    discount: 0,
    finalValue: 0,
    assignedTo: currentUser?.id || '',
    notes: '',
  });

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === Number(form.customerId)),
    [customers, form.customerId]
  );

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === Number(form.packageId)),
    [packages, form.packageId]
  );

  const availablePackages = useMemo(
    () => packages.filter((p) => p.solution_id === Number(form.solutionId)),
    [packages, form.solutionId]
  );

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoadingData(true);
        const [custRes, solRes, pkgRes] = await Promise.all([
          customerService.getCustomers({ page: 1, limit: 100 }),
          solutionsService.getSolutions(),
          solutionsService.getPackages(),
        ]);

        setCustomers(custRes?.data?.data || custRes?.data || custRes || []);
        setSolutions(solRes?.data || solRes || []);
        setPackages(pkgRes?.data || pkgRes || []);
      } catch (err) {
        setError('Không thể tải dữ liệu danh mục. Vui lòng thử lại.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchMasterData();
  }, []);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (selectedPackage) {
      const price =
        form.billingCycle === 'yearly'
          ? Number(selectedPackage.price_yearly || 0)
          : Number(selectedPackage.price_monthly || 0);
      setField('value', price);
    }
  }, [form.packageId, form.billingCycle, selectedPackage]);

  useEffect(() => {
    const val = Number(form.value) || 0;
    const disc = Number(form.discount) || 0;
    const final = val * (1 - disc / 100);
    setField('finalValue', Math.round(final));
  }, [form.value, form.discount]);

  useEffect(() => {
    if (form.startDate && form.billingCycle) {
      const start = new Date(form.startDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        if (form.billingCycle === 'yearly') {
          end.setFullYear(end.getFullYear() + 1);
        } else {
          end.setMonth(end.getMonth() + 1);
        }
        end.setDate(end.getDate() - 1);
        setField('endDate', end.toISOString().split('T')[0]);
      }
    }
  }, [form.startDate, form.billingCycle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const formData = new FormData();
      
      // Đưa các text field vào FormData
      Object.keys(form).forEach(key => {
        if (form[key] !== '' && form[key] !== null) {
          formData.append(key, form[key]);
        }
      });
      
      if (file) formData.append('file', file);

      await contractsService.create(formData);
      if (onSaved) onSaved(); 
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hợp đồng.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingData) {
    return (
      <Card className="border border-gray-200 !rounded-none !shadow-none">
        <div className="min-h-[400px] flex items-center justify-center">
          <Loading text="Đang tải dữ liệu cấu hình..." />
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
          Tạo hợp đồng mới
        </h1>        
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
              <span className="w-6 h-6 bg-blue-600 text-white flex items-center justify-center text-sm">
                1
              </span>
              Thông tin khách hàng
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chọn Doanh nghiệp *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={form.customerId}
                  onChange={(e) => setField('customerId', e.target.value)}
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} (MST: {c.tax_code || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="border border-gray-200 bg-gray-50 p-4 rounded-none text-sm space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    {selectedCustomer.company_name}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4" />
                    NĐD: {selectedCustomer.representative_name || 'Chưa cập nhật'}
                  </div>
                  <div className="flex flex-wrap gap-4 text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedCustomer.phone || 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedCustomer.email || 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white flex items-center justify-center text-sm">
                2
              </span>
              Sản phẩm & Giải pháp
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giải pháp phần mềm *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={form.solutionId}
                  onChange={(e) => {
                    setField('solutionId', e.target.value);
                    setField('packageId', '');
                  }}
                >
                  <option value="">-- Chọn giải pháp --</option>
                  {solutions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gói dịch vụ *
                </label>
                <select
                  required
                  disabled={!form.solutionId}
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  value={form.packageId}
                  onChange={(e) => setField('packageId', e.target.value)}
                >
                  <option value="">-- Chọn gói dịch vụ --</option>
                  {availablePackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({String(p.level).toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPackage && (
              <div className="mt-4 border border-gray-200 bg-white p-4 text-sm text-gray-700 flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <strong>Giá tháng:</strong> {fmtVND(selectedPackage.price_monthly)}
                </span>
                <span className="text-gray-300">|</span>
                <span>
                  <strong>Giá năm:</strong> {fmtVND(selectedPackage.price_yearly)}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="border border-gray-200 !rounded-none !shadow-none">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white flex items-center justify-center text-sm">
                3
              </span>
              Thời hạn & Tài chính
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chu kỳ thanh toán *
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.billingCycle}
                  onChange={(e) => setField('billingCycle', e.target.value)}
                >
                  <option value="yearly">Theo Năm</option>
                  <option value="monthly">Theo Tháng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.startDate}
                  onChange={(e) => setField('startDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  Ngày kết thúc
                  <Calculator className="w-4 h-4 text-blue-600" />
                </label>
                <input
                  type="date"
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed"
                  value={form.endDate}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số hợp đồng *
                </label>
                <input
                  required
                  className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.contractNumber}
                  onChange={(e) => setField('contractNumber', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-gray-200 bg-white p-6">
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Giá trị gốc (VNĐ)
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-0 py-2 text-2xl font-bold text-gray-900 border-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                  value={form.value}
                  onChange={(e) => setField('value', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Chiết khấu (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-0 py-2 text-2xl font-bold text-gray-900 border-0 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                  value={form.discount}
                  onChange={(e) => setField('discount', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                  Giá trị thu thực
                  <DollarSign className="w-4 h-4 text-green-600" />
                </label>
                <div className="px-0 py-2 text-2xl font-black text-green-700 border-0 border-b border-transparent">
                  {fmtVND(form.finalValue)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border border-gray-200 !rounded-none !shadow-none">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                Bản cứng hợp đồng (Bắt buộc)
              </label>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed cursor-pointer hover:border-blue-500 transition-colors">
                <div className="space-y-1 text-center">
                  <input
                    type="file"
                    required
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">Hỗ trợ PDF, DOCX, Ảnh chụp</p>
            </div>
          </Card>

          <Card className="border border-gray-200 !rounded-none !shadow-none">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sales phụ trách hợp đồng
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 bg-gray-50 text-gray-900 cursor-not-allowed flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{currentUser?.fullName}</span>
                <span className="text-gray-500">({currentUser?.email})</span>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 !rounded-none !shadow-none">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ghi chú hợp đồng
              </label>
              <textarea
                className="w-full border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                rows={4}
                placeholder="VD: KH yêu cầu thêm tính năng Zalo..."
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </div>
          </Card>
        </div>

        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSaving}
            className="!rounded-none px-8"
          >
            Huỷ
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="!rounded-none px-8"
          >
            {isSaving ? 'Đang tạo hợp đồng...' : 'Tạo hợp đồng'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractAddForm;