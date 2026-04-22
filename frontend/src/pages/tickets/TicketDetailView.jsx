import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Paperclip, Trash2, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/authContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import uploadService from '../../services/uploadService';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';

const PRIORITY_CFG = {
  urgent: { label: 'Khẩn cấp', variant: 'danger' },
  high: { label: 'Cao', variant: 'warning' },
  medium: { label: 'Trung bình', variant: 'info' },
  low: { label: 'Thấp', variant: 'gray' },
};

const STATUS_CFG = {
  open: { label: 'Mở', variant: 'success', next: null }, // Chuyển sang processing tự động qua Assign
  processing: { label: 'Đang xử lý', variant: 'primary', next: 'resolved', nextLabel: 'Đánh dấu Đã giải quyết' },
  resolved: { label: 'Đã giải quyết', variant: 'purple', next: 'closed', nextLabel: 'Đóng Ticket' },
  closed: { label: 'Đã đóng', variant: 'gray', next: null },
};

const fmtTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const TicketDetailView = ({ id, onBack, onRefresh }) => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [techUsers, setTechUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const loadTicket = useCallback(async () => {
    try {
      const res = await api.get(`/api/tickets/${id}`);
      const data = res.data?.data || res.data;
      setTicket(data);
      setNotes(data.resolution_notes || '');
      setSelectedAssignee(data.assigned_to || '');
    } catch (err) {
      toast.error('Không thể tải chi tiết Ticket. Bạn có thể không có quyền truy cập.');
      onBack();
    } finally {
      setLoading(false);
    }
  }, [id, onBack]);

  useEffect(() => {
    loadTicket();
    // Load Technical list for Assignment if Admin/Manager
    if (isAdminOrManager) {
      api.get('/api/users', { params: { role: 'technical', status: 'active', limit: 100 } })
        .then(res => {
          const payload = res.data?.data || res.data;
          const usersList = Array.isArray(payload) ? payload : (payload?.data || []);
          setTechUsers(usersList);
        }).catch(err => console.error('Không tải được danh sách kỹ thuật', err));
    }
  }, [loadTicket, isAdminOrManager]);

  const handleSaveNotes = async () => {
    try {
      await api.put(`/api/tickets/${id}`, { resolutionNotes: notes });
      toast.success('Đã lưu Ghi chú giải quyết');
      loadTicket();
      onRefresh(); // Refresh danh sách phía sau
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu ghi chú');
    }
  };

  const handleChangeStatus = async (newStatus) => {
    // Ràng buộc Hệ thống: Phải nhập cách giải quyết trước khi Resolved
    if (newStatus === 'resolved' && !notes?.trim()) {
      toast.error('Vui lòng nhập và lưu [Ghi chú cách giải quyết] trước khi Hoàn thành Ticket!');
      return;
    }

    try {
      await api.put(`/api/tickets/${id}/status`, { status: newStatus });
      toast.success('Đã chuyển đổi trạng thái thành công');
      loadTicket();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi chuyển trạng thái');
    }
  };

  const handleSaveAssign = async () => {
    if (!selectedAssignee) return;
    try {
      await api.put(`/api/tickets/${id}/assign`, { assignedTo: selectedAssignee });
      toast.success('Đã phân công người xử lý');
      loadTicket();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi phân công');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const toastId = toast.loading('Đang tải lên...');

      // Bước 1: Upload file thông qua service dùng chung
      const uploadRes = await uploadService.uploadSingle(formData);
      
      // Bóc tách URL dự phòng nhiều cấu trúc trả về từ Service
      const resData = uploadRes?.data || uploadRes; // Nếu uploadRes là Axios Response thì lấy phần .data
      let fileUrl = null;
      
      if (typeof resData === 'string') {
        fileUrl = resData; 
      } else if (resData) {
        fileUrl = resData.url || resData.fileUrl || resData.file_url || 
                  resData.data?.url || resData.data?.fileUrl || resData.data?.file_url ||
                  (typeof resData.data === 'string' ? resData.data : null);
      }
      
      if (!fileUrl) {
        // Ném thẳng dữ liệu raw ra thông báo lỗi để xem nó có hình thù gì
        throw new Error('Dữ liệu BE trả về: ' + JSON.stringify(resData || 'Rỗng').substring(0, 150));
      }

      // Bước 2: Gắn URL và siêu dữ liệu file vào Ticket
      await api.post(`/api/tickets/${id}/attachments`, {
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.type
      });

      toast.success('Tải file lên thành công', { id: toastId });
      loadTicket();
    } catch (err) {
      // IN LỖI RA CONSOLE ĐỂ DEBUG
      console.error('Chi tiết lỗi upload:', err, err.response?.data);
      toast.error(err.response?.data?.message || err.message || 'Lỗi tải file. Vui lòng thử lại.');
    } finally {
      e.target.value = null; // Reset input để có thể chọn lại cùng 1 file
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa file này?')) return;
    try {
      await api.delete(`/api/tickets/${id}/attachments/${attachmentId}`);
      toast.success('Đã xóa file');
      loadTicket();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa file');
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loading /></div>;
  if (!ticket) return null;

  const isClosed = ticket.status === 'closed';
  const currentStatusCfg = STATUS_CFG[ticket.status];
  const priorityCfg = PRIORITY_CFG[ticket.priority] || PRIORITY_CFG.medium;
  
  // Khóa ô Ghi chú: Nếu Ticket đã đóng HOẶC người dùng là Admin/Manager
  const isNotesReadOnly = isClosed || isAdminOrManager;
  // Ẩn bảng Chuyển trạng thái: Trừ phi là nhân viên kỹ thuật xử lý, hoặc Admin thực hiện đóng Ticket đã giải quyết
  const showStatusChange = !isAdminOrManager || ticket.status === 'resolved';

  return (
    <div className="bg-white min-h-full">
      {/* HEADER */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại danh sách Ticket</span>
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              #{ticket.id} - {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>Khách hàng: <strong className="text-gray-900">{ticket.company_name}</strong></span>
              <span>•</span>
              <span>Người tạo: <strong>{ticket.created_by_name}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {fmtTime(ticket.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={priorityCfg.variant} className="px-3 py-1 text-sm font-bold uppercase">{priorityCfg.label}</Badge>
            <Badge variant={currentStatusCfg.variant} className="px-3 py-1 text-sm font-bold uppercase">{currentStatusCfg.label}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-200 !shadow-none">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Mô tả vấn đề</h3>
              <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 border border-gray-100">
                {ticket.description}
              </div>
            </div>
          </Card>

          <Card className="border border-gray-200 !shadow-none">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" /> Ghi chú cách giải quyết (SLA)
              </h3>
              {isNotesReadOnly ? (
                <div className="bg-gray-50 p-4 border border-gray-200 text-gray-700 whitespace-pre-wrap">
                  {ticket.resolution_notes || <span className="italic text-gray-400">Không có ghi chú giải quyết.</span>}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập nguyên nhân lỗi, các bước đã thực hiện..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotes} variant="primary" className="px-6">
                      <Save className="w-4 h-4 mr-2" /> Lưu ghi chú
                    </Button>
                  </div>
                </div>
              )}

              {/* KHU VỰC FILE ĐÍNH KÈM */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> File đính kèm ({ticket.attachments?.length || 0})
                </h3>
                <div className="space-y-2 mb-4">
                  {ticket.attachments?.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
                      <a href={file.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                        {file.file_name}
                      </a>
                      {!isClosed && (isAdminOrManager || file.uploaded_by === user.id) && (
                        <button onClick={() => handleDeleteAttachment(file.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {!isClosed && (
                  <div>
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} />
                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <Paperclip className="w-4 h-4" /> Tải file lên
                    </label>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR ACTIONS */}
        <div className="lg:col-span-1 space-y-6">
          {/* STATUS CHANGE */}
          {showStatusChange && (
            <Card className="border border-gray-200 !shadow-none">
              <div className="p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Xử lý Ticket</h3>
                {ticket.status === 'open' ? (
                  <div className="text-center p-3 bg-blue-50 text-blue-800 text-sm font-medium border border-blue-200">
                    Trạng thái sẽ tự động chuyển sang "Đang xử lý" khi được phân công.
                  </div>
                ) : currentStatusCfg.next && !isClosed ? (
                  <Button
                    onClick={() => handleChangeStatus(currentStatusCfg.next)}
                    variant="primary"
                    className="w-full justify-center h-12 font-bold"
                  >
                    {currentStatusCfg.nextLabel}
                  </Button>
                ) : (
                  <div className="text-center p-3 bg-gray-100 text-gray-500 text-sm font-medium border border-gray-200">
                    Ticket đã hoàn tất vòng đời.
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ASSIGNMENT */}
          <Card className="border border-gray-200 !shadow-none">
            <div className="p-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Phân công cho</h3>
              {isAdminOrManager && !isClosed ? (
                <div className="space-y-4">
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn kỹ thuật viên --</option>
                    {techUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.fullName}</option>)}
                  </select>
                  <Button
                    onClick={handleSaveAssign}
                    variant="primary"
                    className="w-full justify-center font-bold"
                    disabled={selectedAssignee == (ticket.assigned_to || '')}
                  >
                    Lưu phân công
                  </Button>
                </div>
              ) : (
                <div className="text-gray-900 font-medium">{ticket.assigned_to_name || 'Chưa có người xử lý'}</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailView;