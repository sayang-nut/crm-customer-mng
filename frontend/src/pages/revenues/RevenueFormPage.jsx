import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import revenuesService from '../../services/revenuesService';
import contractsService from '../../services/contractsService';
import customerService from '../../services/customerService';
import uploadService from '../../services/uploadService';
import { ArrowLeft, Paperclip, CheckCircle, Save, Info } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const RevenueFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [revenue, setRevenue] = useState(null);
  const [status, setStatus] = useState('pending');
  const [proofFile, setProofFile] = useState(null);

  // State phục vụ việc load danh sách hợp đồng theo ID Khách hàng
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [availableContracts, setAvailableContracts] = useState([]);
  const [fetchingContracts, setFetchingContracts] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [fetchingCustomers, setFetchingCustomers] = useState(false);

  // Hàm bóc tách mảng an toàn bất chấp cấu trúc bọc dữ liệu của Backend/Axios
  const extractArray = (obj) => {
    if (Array.isArray(obj)) return obj;
    if (obj?.data && Array.isArray(obj.data)) return obj.data;
    if (obj?.data?.data && Array.isArray(obj.data.data)) return obj.data.data;
    if (obj?.data?.data?.data && Array.isArray(obj.data.data.data)) return obj.data.data.data;
    if (obj && typeof obj === 'object') {
      const arr = Object.values(obj).find(Array.isArray);
      if (arr) return arr;
    }
    if (obj?.data && typeof obj.data === 'object') {
      const arr = Object.values(obj.data).find(Array.isArray);
      if (arr) return arr;
    }
    return [];
  };

  useEffect(() => {
    if (isNew) return;
    
    const fetchRevenue = async () => {
      try {
        // Giả sử service của bạn có hàm getById
        const res = await revenuesService.getById(id);
        const data = res.data || res;
        setRevenue(data);
        setStatus(data.status || 'pending');
      } catch (err) {
        setError('Không tìm thấy khoản thu hoặc bạn không có quyền xem.');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [id, isNew]);

  // Tự động tải danh sách Khách hàng khi ở chế độ tạo mới
  useEffect(() => {
    if (isNew) {
      const fetchCustomers = async () => {
        setFetchingCustomers(true);
        try {
          // Giảm limit xuống 100 để không vượt quá giới hạn validation (max: 100) của Backend
          const res = await customerService.getCustomers({ limit: 100 });
          const list = extractArray(res);
          setCustomers(list);
        } catch (err) {
          console.error('Lỗi tải danh sách khách hàng:', err);
        } finally {
          setFetchingCustomers(false);
        }
      };
      fetchCustomers();
    }
  }, [isNew]);

  // Hàm gọi API lấy hợp đồng khi người dùng gõ xong ID Khách hàng
  const fetchCustomerContracts = async (custId) => {
    if (!custId) {
      setAvailableContracts([]);
      return;
    }
    setFetchingContracts(true);
    try {
      // Lấy danh sách hợp đồng thuộc về customerId
      const res = await contractsService.getContracts({ customerId: custId, limit: 100 });
      const list = extractArray(res);
      setAvailableContracts(list);
    } catch (err) {
      setAvailableContracts([]);
    } finally {
      setFetchingContracts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    let uploadedUrl = revenue?.proof_url;
    
    if (status === 'paid' && proofFile) {
      try {
        const formData = new FormData();
        formData.append('file', proofFile);
        const uploadRes = await uploadService.uploadSingle(formData); 
        uploadedUrl = uploadRes.data.data.url;
      } catch (err) {
        setError('Lỗi khi tải lên chứng từ. Vui lòng thử lại.');
        setSubmitting(false);
        return;
      }
    }

    const fd = new FormData(e.target);
    const payload = {
      amount: Number(fd.get('amount')),
      status: status,
      paymentDate: fd.get('paymentDate') || undefined,
      paymentMethod: fd.get('paymentMethod'),
      billingPeriod: fd.get('billingPeriod') || undefined,
      notes: fd.get('notes') || undefined,
      proofUrl: uploadedUrl
    };

    if (isNew) {
      payload.contractId = Number(fd.get('contractId'));
      payload.customerId = Number(fd.get('customerId'));
    }

    try {
      if (!isNew) {
        await revenuesService.update(id, payload);
      } else {
        await revenuesService.create(payload);
      }
      navigate('/revenues'); // Quay lại danh sách
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu.');
      setSubmitting(false);
    }
  };

  const canEdit = isNew || revenue?.status === 'pending';

  if (loading) return <div className="p-6"><Loading /></div>;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/revenues')} className="!px-3" />
            <div>
              <h1 className="text-2xl font-black text-dark-900">
                {isNew ? 'Tạo khoản thu thủ công' : (revenue?.status === 'pending' ? `Thu tiền khoản thu #${id}` : `Chi tiết khoản thu #${id}`)}
              </h1>
              <p className="text-sm text-gray-500">
                {isNew ? 'Nhập thông tin ID Khách hàng và Hợp đồng để tạo khoản thu' : (revenue?.status === 'pending' ? 'Cập nhật trạng thái và tải lên chứng từ thanh toán' : 'Xem chi tiết thông tin khoản thu (Chỉ đọc)')}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cột trái: Thông tin hợp đồng (Chỉ hiện khi Edit) */}
          {!isNew && revenue && (
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-5 shadow-sm border-gray-200">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Thông tin liên quan</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Khách hàng</div>
                    <div className="font-bold text-gray-900">{revenue.company_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Số hợp đồng</div>
                    <div className="font-mono text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded">{revenue.contract_number}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Giải pháp</div>
                    <div className="font-medium text-gray-900">{revenue.solution_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Hạn thanh toán</div>
                    <div className="font-medium text-orange-600">{fmtDate(revenue.due_date)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Người tạo bản ghi</div>
                    <div className="font-medium text-gray-700">{revenue.created_by_name}</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Cột phải: Form nhập liệu */}
          <div className={isNew ? 'lg:col-span-3' : 'lg:col-span-2'}>
            <Card className="p-6 shadow-sm border-gray-200">
              <form id="revenue-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {isNew && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Khách hàng *</label>
                        {fetchingCustomers ? (
                          <div className="text-sm text-blue-600 py-2">Đang tải danh sách khách hàng...</div>
                        ) : (
                          <select
                            name="customerId"
                            required
                            value={customerIdInput}
                            onChange={(e) => {
                              setCustomerIdInput(e.target.value);
                              fetchCustomerContracts(e.target.value); // Tự động load hợp đồng khi chọn KH
                            }}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            {customers.length === 0 && !fetchingCustomers ? (
                              <option value="" disabled>Không có khách hàng nào thuộc phụ trách của bạn</option>
                            ) : (
                              <option value="">-- Chọn khách hàng --</option>
                            )}
                            {customers.map(c => (
                              <option key={c.id} value={c.id}>{c.company_name || c.companyName} (Mã: {c.id})</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Hợp đồng *</label>
                        {fetchingContracts ? (
                          <div className="text-sm text-blue-600 py-2">Đang tải danh sách hợp đồng...</div>
                        ) : (
                          <select name="contractId" required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="">-- Chọn hợp đồng --</option>
                            {availableContracts.map(c => (
                              <option key={c.id} value={c.id}>#{c.contract_number} ({fmtVND(c.final_value)})</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </>
                  )}

                  <Input
                    label="Số tiền cần thu (VNĐ) *"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue={revenue?.amount || ''}
                    disabled={!canEdit}
                  />
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái khoản thu *</label>
                    <select
                      name="status"
                      required
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={!canEdit}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="pending">🟠 Chờ khách thanh toán</option>
                      <option value="paid">🟢 Đã thu tiền thành công</option>
                      <option value="cancelled">⚫ Hủy bỏ khoản thu này</option>
                    </select>
                  </div>

                  <Input
                    label="Ngày thanh toán thực tế *"
                    name="paymentDate"
                    type="date"
                    defaultValue={revenue?.payment_date ? String(revenue.payment_date).substring(0, 10) : ''}
                    disabled={status !== 'paid' || !canEdit}
                    required={status === 'paid'}
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phương thức *</label>
                    <select
                      name="paymentMethod"
                      required
                      defaultValue={revenue?.payment_method || 'bank_transfer'}
                      disabled={status !== 'paid' || !canEdit}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="bank_transfer">Chuyển khoản</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>

                {/* Luôn hiển thị phần tải chứng từ nếu tạo mới, hoặc nếu trạng thái là Đã thu */}
                {(status === 'paid' || isNew) && (
                  <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg">
                    <label className="block text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" /> Đính kèm chứng từ (Bắt buộc)
                    </label>
                    {revenue?.proof_url && !proofFile && (
                      <div className="mb-3 text-sm flex items-center gap-1 text-green-700 font-medium">
                        <CheckCircle className="w-4 h-4" /> Đã có chứng từ. Tải lên file mới nếu muốn ghi đè.
                      </div>
                    )}
                    {canEdit ? (
                      <>
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => setProofFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" required={status === 'paid' && !revenue?.proof_url} />
                        <p className="text-xs text-gray-500 mt-2">Hỗ trợ định dạng Ảnh (JPG, PNG) hoặc PDF.</p>
                      </>
                    ) : (
                      revenue?.proof_url ? (
                        <a href={revenue.proof_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline inline-block mt-1">Bấm vào đây để xem file chứng từ</a>
                      ) : (
                        <span className="text-sm text-gray-500 italic mt-1 inline-block">Không có file đính kèm</span>
                      )
                    )}
                  </div>
                )}

                <Input label="Kỳ thanh toán (VD: 2025-01)" name="billingPeriod" defaultValue={revenue?.billing_period || ''} disabled={!canEdit} />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú {isNew && '*'}</label>
                  <textarea name="notes" rows={4} defaultValue={revenue?.notes || ''} disabled={!canEdit} required={isNew} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500" placeholder="Ghi chú về khoản thanh toán này..."></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button variant="secondary" onClick={() => navigate('/revenues')} type="button">{!canEdit ? 'Quay lại' : 'Hủy bỏ'}</Button>
                  {canEdit && <Button variant="primary" icon={Save} type="submit" loading={submitting}>{submitting ? 'Đang lưu...' : (isNew ? 'Lưu bản ghi' : 'Xác nhận thu tiền')}</Button>}
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueFormPage;