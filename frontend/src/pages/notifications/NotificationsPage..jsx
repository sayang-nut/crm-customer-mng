/**
 * @file     frontend/src/pages/notifications/NotificationsPage.jsx
 * @location frontend/src/pages/notifications/NotificationsPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../services/notificationsService
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang thông báo in-app.
 *   - Danh sách thông báo, phân biệt đã đọc / chưa đọc
 *   - Filter chỉ hiện chưa đọc
 *   - Đánh dấu 1 hoặc tất cả đã đọc
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import notificationsService from '../../services/notificationsService';

const TYPE_CFG = {
  contract_warn_30:          { icon:'⏰', color:'#FCD34D', label:'HĐ sắp hết hạn 30 ngày' },
  contract_warn_7:           { icon:'⚠️',  color:'#FCA5A5', label:'HĐ sắp hết hạn 7 ngày' },
  contract_expired_unrenewed:{ icon:'🔴', color:'#FCA5A5', label:'HĐ hết hạn chưa gia hạn' },
  ticket_stale:              { icon:'⏰', color:'#FCD34D', label:'Ticket chưa cập nhật' },
  ticket_resolved_remind:    { icon:'📋', color:'#D8B4FE', label:'Ticket sắp tự đóng' },
  ticket_auto_closed:        { icon:'✅', color:'#6EE7B7', label:'Ticket tự động đóng' },
};

const fmtTime = (d) => {
  if (!d) return '';
  const now = new Date(), date = new Date(d);
  const diff = Math.floor((now - date) / 60000);
  if (diff < 1)   return 'Vừa xong';
  if (diff < 60)  return `${diff} phút trước`;
  if (diff < 1440)return `${Math.floor(diff/60)} giờ trước`;
  return date.toLocaleDateString('vi-VN');
};

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const LIMIT = 20;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsService.getList({ page, limit:LIMIT, unreadOnly:unreadOnly?'true':undefined });
      setItems(res.data||[]);
      setTotal(res.total||0);
      setUnread(res.unreadCount||0);
    } finally { setLoading(false); }
  }, [page, unreadOnly]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRead = async (id) => {
    await notificationsService.markRead(id);
    fetchAll();
  };

  const handleReadAll = async () => {
    await notificationsService.markAllRead();
    fetchAll();
  };

  const totalPages = Math.ceil(total / LIMIT);

  const s = {
    page:  { minHeight:'100vh', background:'#080E1A', fontFamily:"'DM Sans','Segoe UI',sans-serif", color:'#F1F5F9' },
    inner: { maxWidth:800, margin:'0 auto', padding:'32px 24px' },
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *,*::before,*::after{box-sizing:border-box} body{margin:0}`}</style>
      <div style={s.page}><div style={s.inner}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.4px',margin:'0 0 4px'}}>
              Thông báo
              {unread > 0 && <span style={{marginLeft:10,fontSize:14,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'rgba(239,68,68,0.2)',color:'#FCA5A5',border:'1px solid rgba(239,68,68,0.3)'}}>{unread} chưa đọc</span>}
            </h1>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <label style={{display:'flex',alignItems:'center',gap:7,fontSize:13,color:'#94A3B8',cursor:'pointer'}}>
              <input type="checkbox" checked={unreadOnly} onChange={e=>{setUnreadOnly(e.target.checked);setPage(1);}} style={{accentColor:'#2563EB'}}/>
              Chỉ chưa đọc
            </label>
            {unread > 0 && (
              <button onClick={handleReadAll} style={{padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,background:'rgba(37,99,235,0.15)',color:'#93C5FD',border:'1px solid rgba(37,99,235,0.3)',cursor:'pointer',fontFamily:'inherit'}}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{color:'#64748B',textAlign:'center',padding:60}}>Đang tải…</div>
        ) : items.length === 0 ? (
          <div style={{color:'#64748B',textAlign:'center',padding:60,fontSize:15}}>
            {unreadOnly ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {items.map(n => {
              const cfg = TYPE_CFG[n.type] || { icon:'🔔', color:'#93C5FD', label:n.type };
              return (
                <div key={n.id} style={{
                  padding:'14px 18px',
                  background: n.is_read ? 'rgba(13,20,36,0.5)' : 'rgba(37,99,235,0.08)',
                  border: `1px solid ${n.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.25)'}`,
                  borderLeft: `3px solid ${n.is_read ? 'transparent' : cfg.color}`,
                  borderRadius:12,
                  display:'flex',gap:14,alignItems:'flex-start',
                  cursor: n.is_read ? 'default' : 'pointer',
                  transition:'background 0.15s',
                }}
                onClick={() => !n.is_read && handleRead(n.id)}>
                  <div style={{fontSize:22,lineHeight:1,flexShrink:0,marginTop:2}}>{cfg.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                      <div>
                        <span style={{fontSize:11,fontWeight:700,color:cfg.color,textTransform:'uppercase',letterSpacing:'0.05em'}}>{cfg.label}</span>
                        <div style={{fontSize:14,fontWeight:n.is_read?400:600,color:n.is_read?'#94A3B8':'#F1F5F9',marginTop:3}}>{n.title}</div>
                      </div>
                      <div style={{flexShrink:0,textAlign:'right'}}>
                        <div style={{fontSize:11,color:'#475569'}}>{fmtTime(n.created_at)}</div>
                        {!n.is_read && <div style={{fontSize:10,color:'#60A5FA',marginTop:3}}>Click để đánh dấu đọc</div>}
                      </div>
                    </div>
                    <div style={{fontSize:13,color:'#64748B',marginTop:5,lineHeight:1.5}}
                      dangerouslySetInnerHTML={{__html:n.message.replace(/<b>/g,'<strong style="color:#E2E8F0">').replace(/<\/b>/g,'<\/strong>')}}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20,fontSize:13,color:'#64748B'}}>
            <span>Trang {page} / {totalPages}</span>
            <div style={{display:'flex',gap:8}}>
              {[{l:'← Trước',d:page<=1,f:()=>setPage(p=>p-1)},{l:'Sau →',d:page>=totalPages,f:()=>setPage(p=>p+1)}].map(b=>(
                <button key={b.l} disabled={b.d} onClick={b.f} style={{padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:600,background:'rgba(255,255,255,0.05)',color:b.d?'#334155':'#94A3B8',border:'1px solid rgba(255,255,255,0.08)',cursor:b.d?'not-allowed':'pointer',fontFamily:'inherit'}}>{b.l}</button>
              ))}
            </div>
          </div>
        )}

      </div></div>
    </>
  );
};
export default NotificationsPage;