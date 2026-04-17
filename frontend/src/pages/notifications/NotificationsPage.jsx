/**
 * @file     frontend/src/pages/notifications/NotificationsPage.jsx
 * @theme    WHITE PLAIN - Sync with ContractsPage/TicketsPage
 */

import { useState, useEffect, useCallback } from 'react';
import notificationsService from '../../services/notificationsService';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const TYPE_CFG = {
  contract_warn_30: { icon: '⏰', colorClass: 'bg-amber-100 text-amber-800', label: 'HĐ sắp hết hạn 30 ngày' },
  contract_warn_7: { icon: '⚠️', colorClass: 'bg-red-100 text-red-800', label: 'HĐ sắp hết hạn 7 ngày' },
  contract_expired_unrenewed: { icon: '🔴', colorClass: 'bg-red-100 text-red-800', label: 'HĐ hết hạn chưa gia hạn' },
  ticket_stale: { icon: '⏰', colorClass: 'bg-amber-100 text-amber-800', label: 'Ticket chưa cập nhật' },
  ticket_resolved_remind: { icon: '📋', colorClass: 'bg-purple-100 text-purple-800', label: 'Ticket sắp tự đóng' },
  ticket_auto_closed: { icon: '✅', colorClass: 'bg-emerald-100 text-emerald-800', label: 'Ticket tự động đóng' },
};

const fmtTime = (d) => {
  if (!d) return '';
  const now = new Date();
  const date = new Date(d);
  const diff = Math.floor((now - date) / 60000);
  if (diff < 1) return 'Vừa xong';
  if (diff < 60) return `${diff} phút trước`;
  if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
  return date.toLocaleDateString('vi-VN');
};

const NotificationItem = ({ notification, onRead }) => {
  const cfg = TYPE_CFG[notification.type] || {
    icon: '🔔',
    colorClass: 'bg-blue-100 text-blue-800',
    label: notification.type,
  };
  const isUnread = !notification.is_read;

  return (
    <Card
      className={`border ${isUnread ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'} !rounded-none !shadow-none hover:bg-gray-50 transition-colors cursor-pointer`}
      onClick={() => isUnread && onRead(notification.id)}
    >
      <div className="p-6 flex gap-4">
        <div className={`w-12 h-12 rounded-lg ${cfg.colorClass} flex items-center justify-center flex-shrink-0`}>
          <span className="text-xl">{cfg.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="!rounded-none !shadow-none font-bold text-xs uppercase">
                {cfg.label}
              </Badge>
            </div>
            <div className="text-right text-xs text-gray-500">
              {fmtTime(notification.created_at)}
            </div>
          </div>

          <h3 className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
            {notification.title}
          </h3>

          <div
            className="text-sm text-gray-600 mt-2 line-clamp-3"
            dangerouslySetInnerHTML={{
              __html: notification.message
                .replace(/<b>/g, '<strong style="color:#1f2937;font-weight:700">')
                .replace(/<\/b>/g, '</strong>'),
            }}
          />

          {isUnread && (
            <div className="mt-2 text-xs text-blue-600 font-medium">Click để đánh dấu đã đọc</div>
          )}
        </div>
      </div>
    </Card>
  );
};

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState('');
  const LIMIT = 20;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationsService.getList({
        page,
        limit: LIMIT,
        unreadOnly: unreadOnly ? 'true' : undefined,
      });
      setItems(res.data || []);
      setTotal(res.total || 0);
      setUnread(res.unreadCount || 0);
    } catch {
      setError('Không thể tải thông báo.');
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRead = async (id) => {
    try {
      await notificationsService.markRead(id);
      fetchAll();
    } catch {
      // Silent fail
    }
  };

  const handleReadAll = async () => {
    try {
      await notificationsService.markAllRead();
      fetchAll();
    } catch {
      // Silent fail
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="bg-white min-h-screen p-1">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-1">
              Thông báo
            </h1>
            {unread > 0 && (
              <Badge variant="danger" className="!rounded-none !shadow-none font-bold">
                {unread} chưa đọc
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => {
                  setUnreadOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Chỉ chưa đọc
            </label>

            {unread > 0 && (
              <Button variant="secondary" onClick={handleReadAll} className="!rounded-none px-6">
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-none">
            {error}
          </div>
        )}

        {/* List */}
        <Card className="border border-gray-200 !rounded-none !shadow-none">
          {loading ? (
            <div className="p-16 flex justify-center">
              <Loading />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title={unreadOnly ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
              description="Thông báo sẽ xuất hiện ở đây khi có sự kiện hệ thống."
              className="py-20"
            />
          ) : (
            <div className="space-y-3 p-6">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleRead}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={LIMIT}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;