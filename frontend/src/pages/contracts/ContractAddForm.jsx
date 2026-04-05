import React, { useState, useEffect } from 'react';
import { Building2, User, Phone, Mail, Package, Calendar, DollarSign, Calculator } from 'lucide-react';
// Giả định bạn có các services này, có thể thay đổi đường dẫn import cho đúng với project của bạn
import contractsService from '../../services/contractsService';
import customerService from '../../services/customerService';
import solutionsService from '../../services/solutionsService';
import usersService from '../../services/usersService';

const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const ContractAddForm = ({ onCancel, onSaved, currentUser }) => {
  // Data sources
  const [customers, setCustomers] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);

  // Loading state
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState({
    contractNumber: `HD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, // Auto-generate mã
    customerId: '',
    solutionId: '',
    packageId: '',
    billingCycle: 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    value: 0,
    discount: 0,
    finalValue: 0,
    assignedTo: currentUser?.role === 'sales' ? currentUser.id : '', // Sales tự tạo thì assign mặc định cho mình
    notes: ''
  });

  // Computed objects for UI display
  const selectedCustomer = customers.find(c => c.id === Number(form.customerId));
  const selectedPackage = packages.find(p => p.id === Number(form.packageId));

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoadingData(true);
        // Gọi đồng thời các API lấy dữ liệu danh mục
        const [custRes, solRes, pkgRes, usersRes] = await Promise.all([
          customerService.getCustomers({ limit: 1000 }), // Lấy KH
          solutionsService.getSolutions(),                // Lấy giải pháp
          solutionsService.getPackages(),                 // Lấy gói
          usersService.listSalesUsers()                   // Lấy danh sách Sales
        ]);
        
        setCustomers(custRes.data?.data || custRes.data || []);
        setSolutions(solRes.data || []);
        setPackages(pkgRes.data || []);
        setSalesUsers(usersRes.data || []);
      } catch (err) {
        setError('Không thể tải dữ liệu danh mục. Vui lòng thử lại.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchMasterData();
  }, []);

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // Auto Calculate Prices when Package or Cycle changes
  useEffect(() => {
    if (selectedPackage) {
      const price = form.billingCycle === 'yearly' 
        ? Number(selectedPackage.price_yearly || 0) 
        : Number(selectedPackage.price_monthly || 0);
      setField('value', price);
    }
  }, [form.packageId, form.billingCycle, selectedPackage]);

  // Auto Calculate Final Value when Value or Discount changes
  useEffect(() => {
    const val = Number(form.value) || 0;
    const disc = Number(form.discount) || 0;
    const final = val * (1 - (disc / 100));
    setField('finalValue', Math.round(final));
  }, [form.value, form.discount]);

  // Auto Calculate End Date based on Start Date and Cycle
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
        end.setDate(end.getDate() - 1); // Trừ 1 ngày
        setField('endDate', end.toISOString().split('T')[0]);
      }
    }
  }, [form.startDate, form.billingCycle]);

  // Lọc Packages theo Solution đã chọn
  const availablePackages = packages.filter(p => p.solution_id === Number(form.solutionId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await contractsService.createContract(form);
      onSaved(); // Call parent to refresh list and close modal
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu hợp đồng.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingData) return <div className="p-12 text-center text-gray-500">Đang tải dữ liệu cấu hình...</div>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* BƯỚC 1: CHỌN KHÁCH HÀNG */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span> 
          Thông tin Khách hàng
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn Doanh nghiệp *</label>
            <select 
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all"
              value={form.customerId}
              onChange={e => setField('customerId', e.target.value)}
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.company_name} (MST: {c.tax_code || 'N/A'})</option>)}
            </select>
          </div>

          {/* Preview Khách hàng đã chọn */}
          {selectedCustomer && (
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold text-dark-900"><Building2 className="w-4 h-4 text-blue-500"/> {selectedCustomer.company_name}</div>
              <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4"/> NĐD: {selectedCustomer.representative_name || 'Chưa cập nhật'}</div>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1"><Phone className="w-4 h-4"/> {selectedCustomer.phone || 'N/A'}</span>
                <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {selectedCustomer.email || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BƯỚC 2: GIẢI PHÁP & GÓI DỊCH VỤ */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span> 
          Sản phẩm & Giải pháp
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Giải pháp phần mềm *</label>
            <select 
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400"
              value={form.solutionId}
              onChange={e => {
                setField('solutionId', e.target.value);
                setField('packageId', ''); // Reset gói khi đổi giải pháp
              }}
            >
              <option value="">-- Chọn giải pháp --</option>
              {solutions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gói dịch vụ *</label>
            <select 
              required
              disabled={!form.solutionId}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-400 disabled:bg-gray-100"
              value={form.packageId}
              onChange={e => setField('packageId', e.target.value)}
            >
              <option value="">-- Chọn gói dịch vụ --</option>
              {availablePackages.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.level.toUpperCase()})</option>
              ))}
            </select>
          </div>
        </div>

        {selectedPackage && (
          <div className="mt-4 bg-white p-4 rounded-xl border border-green-100 flex items-center gap-4 text-sm text-green-800">
            <Package className="w-5 h-5 text-green-600" />
            <span><strong>Giá tháng:</strong> {fmtVND(selectedPackage.price_monthly)}</span>
            <span>•</span>
            <span><strong>Giá năm:</strong> {fmtVND(selectedPackage.price_yearly)}</span>
          </div>
        )}
      </div>

      {/* BƯỚC 3: THỜI HẠN & TÀI CHÍNH */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span> 
          Thời hạn & Tài chính
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Chu kỳ thanh toán *</label>
            <select 
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl"
              value={form.billingCycle} onChange={e => setField('billingCycle', e.target.value)}
            >
              <option value="yearly">Theo Năm</option>
              <option value="monthly">Theo Tháng</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày bắt đầu *</label>
            <input type="date" required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl"
                   value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-blue-600 flex justify-between">Ngày kết thúc <Calculator className="w-4 h-4"/></label>
            <input type="date" required readOnly className="w-full px-4 py-3 bg-blue-50 text-blue-800 font-semibold border-2 border-blue-100 rounded-xl cursor-not-allowed"
                   value={form.endDate} title="Tự động tính dựa trên Chu kỳ" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Số hợp đồng *</label>
            <input required className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-mono text-gray-600"
                   value={form.contractNumber} onChange={e => setField('contractNumber', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-1">Giá trị gốc (VNĐ)</label>
            <input type="number" required className="w-full text-xl font-bold bg-transparent focus:outline-none border-b-2 border-gray-200 focus:border-blue-500 pb-1"
                   value={form.value} onChange={e => setField('value', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-1">Chiết khấu (%)</label>
            <input type="number" min="0" max="100" className="w-full text-xl font-bold text-orange-600 bg-transparent focus:outline-none border-b-2 border-gray-200 focus:border-orange-400 pb-1"
                   value={form.discount} onChange={e => setField('discount', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-1 flex items-center gap-1">Giá trị thu thực <DollarSign className="w-4 h-4 text-green-500"/></label>
            <div className="text-2xl font-black text-green-600 pb-1 border-b-2 border-transparent">
              {fmtVND(form.finalValue)}
            </div>
          </div>
        </div>
      </div>

      {/* BƯỚC 4: PHÂN CÔNG & LƯU TRỮ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sales phụ trách hợp đồng</label>
          <select 
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl"
            value={form.assignedTo} onChange={e => setField('assignedTo', e.target.value)}
          >
            <option value="">-- Để trống (Chưa phân công) --</option>
            {salesUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú hợp đồng</label>
          <input 
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl"
            placeholder="VD: KH yêu cầu thêm tính năng Zalo..."
            value={form.notes} onChange={e => setField('notes', e.target.value)}
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 mt-4 sticky bottom-0 bg-white py-4 z-10">
        <button type="button" className="px-8 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all" onClick={onCancel} disabled={isSaving}>
          Huỷ
        </button>
        <button type="submit" className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2" disabled={isSaving}>
          {isSaving ? 'Đang tạo hợp đồng...' : 'Tạo hợp đồng'}
        </button>
      </div>
    </form>
  );
};

export default ContractAddForm;