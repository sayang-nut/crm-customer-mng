import { useState, useEffect } from 'react';
import usersService from '../../services/usersService';

const ROLES = ['admin', 'manager', 'sales', 'cskh', 'technical'];
const ROLE_LABELS = { 
  admin: 'Admin', 
  manager: 'Manager', 
  sales: 'Sales', 
  cskh: 'CSKH', 
  technical: 'Kỹ thuật' 
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'locked', label: 'Bị khoá' },
];

const UserEditForm = ({ user, onSaved, onCancel }) => {
  const [form, setForm] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    role: user?.role || 'sales',
    status: user?.status || 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.full_name || '',
        email: user.email || '',
        role: user.role || 'sales',
        status: user.status || 'active',
      });
    }
  }, [user]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
        setError('Họ tên là bắt buộc.');
        return;
    }
    setLoading(true);
    setError('');
    try {
      await usersService.update(user.id, {
        fullName: form.fullName,
        role: form.role,
        status: form.status,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhân viên.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-lg mb-8 border border-blue-200 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa nhân viên</h3>
          <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin cho tài khoản <span className="font-semibold text-blue-600">{form.email}</span></p>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Họ tên *</label>
            <input className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" value={form.fullName} onChange={e => setField('fullName', e.target.value)} required placeholder="Nguyễn Văn A" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Không thể thay đổi)</label>
            <input className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" type="email" value={form.email} disabled />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vai trò *</label>
            <select className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer" value={form.role} onChange={e => setField('role', e.target.value)}>
              {ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái *</label>
            <select className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer" value={form.status} onChange={e => setField('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-6 mt-6 border-t border-gray-200">
          <button type="button" className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all" onClick={onCancel} disabled={loading}>Huỷ</button>
          <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50" disabled={loading}>{loading ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
        </div>
      </form>
    </div>
  );
};

export default UserEditForm;