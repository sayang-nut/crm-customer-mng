/**
 * @file     frontend/src/pages/dashboard/DashboardPage.jsx
 * @location frontend/src/pages/dashboard/DashboardPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * @requires ../../services/dashboardService
 * @requires ../../store/authContext → useAuth
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Trang Dashboard – hiển thị KPI theo role.
 *   Admin/Manager → Admin Dashboard (full overview)
 *   Sales         → Sales Dashboard (my KPIs)
 *   CSKH          → CSKH Dashboard (my tickets)
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../store/authContext';
import dashboardService from '../../services/dashboardService';

const fmtVND = (n) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',notation:'compact',maximumFractionDigits:1}).format(n||0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const StatCard = ({ label, value, sub, color='#60A5FA' }) => (
  <div style={{background:'rgba(13,20,36,0.7)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'16px 20px'}}>
    <div style={{fontSize:11,color:'#64748B',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{label}</div>
    <div style={{fontSize:28,fontWeight:800,color,letterSpacing:'-0.5px'}}>{value}</div>
    {sub && <div style={{fontSize:12,color:'#475569',marginTop:4}}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 style={{fontSize:16,fontWeight:700,color:'#94A3B8',margin:'24px 0 12px',letterSpacing:'0.04em',textTransform:'uppercase'}}>{children}</h2>
);

const AdminDash = ({ data }) => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:8}}>
      <StatCard label="Khách hàng"  value={data.customerStats?.total||0} sub={`${data.customerStats?.active_count||0} active`}/>
      <StatCard label="Hợp đồng"    value={data.contractStats?.total||0} sub={`${data.contractStats?.active_count||0} active`} color="#6EE7B7"/>
      <StatCard label="Tickets"     value={data.ticketStats?.total||0}   sub={`${data.ticketStats?.open_count||0} mở`}  color="#FCD34D"/>
      <StatCard label="Doanh thu tháng" value={fmtVND(data.revenue?.currentMonth)} color="#A78BFA" sub="Tháng hiện tại"/>
    </div>

    {data.expiringContracts?.length > 0 && <>
      <SectionTitle>⚠ HĐ sắp hết hạn 30 ngày ({data.expiringContracts.length})</SectionTitle>
      <div style={{background:'rgba(13,20,36,0.7)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden'}}>
        {data.expiringContracts.map((c,i) => (
          <div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:'11px 16px',borderBottom:i<data.expiringContracts.length-1?'1px solid rgba(255,255,255,0.04)':'none',background:i%2===0?'transparent':'rgba(255,255,255,0.015)'}}>
            <div>
              <span style={{fontFamily:'Courier New',fontSize:12,color:'#93C5FD'}}>{c.contract_number}</span>
              <span style={{fontSize:13,color:'#E2E8F0',marginLeft:12}}>{c.company_name}</span>
            </div>
            <div style={{display:'flex',gap:16,alignItems:'center'}}>
              <span style={{fontSize:12,color:'#64748B'}}>{c.sales_name}</span>
              <span style={{fontSize:12,fontWeight:700,color:c.days_left<=7?'#FCA5A5':'#FCD34D'}}>Còn {c.days_left} ngày</span>
            </div>
          </div>
        ))}
      </div>
    </>}

    {data.overdueTickets?.length > 0 && <>
      <SectionTitle>⏰ Ticket stale ({data.overdueTickets.length})</SectionTitle>
      <div style={{background:'rgba(13,20,36,0.7)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden'}}>
        {data.overdueTickets.map((t,i) => (
          <div key={t.id} style={{display:'flex',justifyContent:'space-between',padding:'11px 16px',borderBottom:i<data.overdueTickets.length-1?'1px solid rgba(255,255,255,0.04)':'none',background:i%2===0?'transparent':'rgba(255,255,255,0.015)'}}>
            <div>
              <span style={{fontSize:12,color:'#64748B'}}>#{t.id}</span>
              <span style={{fontSize:13,color:'#E2E8F0',marginLeft:10}}>{t.title}</span>
              <span style={{fontSize:12,color:'#94A3B8',marginLeft:8}}>· {t.company_name}</span>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:'#FCD34D'}}>{Math.floor(t.stale_hours)}h</span>
          </div>
        ))}
      </div>
    </>}
  </div>
);

const SalesDash = ({ data }) => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:8}}>
      <StatCard label="KH của tôi"      value={data.myCustomers?.total||0} sub={`${data.myCustomers?.lead||0} lead · ${data.myCustomers?.active||0} active`}/>
      <StatCard label="Doanh thu tháng" value={fmtVND(data.myRevenue?.month_total)} color="#6EE7B7"/>
    </div>
    {data.myExpiringContracts?.length > 0 && <>
      <SectionTitle>HĐ sắp hết hạn của tôi</SectionTitle>
      <div style={{background:'rgba(13,20,36,0.7)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden'}}>
        {data.myExpiringContracts.map((c,i) => (
          <div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:'11px 16px',borderBottom:i<data.myExpiringContracts.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}>
            <div><span style={{fontFamily:'Courier New',fontSize:12,color:'#93C5FD'}}>{c.contract_number}</span><span style={{fontSize:13,color:'#E2E8F0',marginLeft:12}}>{c.company_name}</span></div>
            <span style={{fontSize:12,fontWeight:700,color:c.days_left<=7?'#FCA5A5':'#FCD34D'}}>Còn {c.days_left}n</span>
          </div>
        ))}
      </div>
    </>}
  </div>
);

const CSKHDash = ({ data }) => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:8}}>
      <StatCard label="Ticket của tôi"  value={data.myTickets?.total||0}      sub={`${data.myTickets?.open||0} mở`}/>
      <StatCard label="Đang xử lý"      value={data.myTickets?.processing||0} color="#93C5FD"/>
      <StatCard label="Đã giải quyết"   value={data.myTickets?.resolved||0}   color="#6EE7B7"/>
    </div>
    {data.myOverdueTickets?.length > 0 && <>
      <SectionTitle>Ticket stale của tôi</SectionTitle>
      <div style={{background:'rgba(13,20,36,0.7)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden'}}>
        {data.myOverdueTickets.map((t,i) => (
          <div key={t.id} style={{display:'flex',justifyContent:'space-between',padding:'11px 16px',borderBottom:i<data.myOverdueTickets.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}>
            <div><span style={{fontSize:12,color:'#64748B'}}>#{t.id}</span><span style={{fontSize:13,color:'#E2E8F0',marginLeft:10}}>{t.title}</span></div>
            <span style={{fontSize:12,fontWeight:700,color:'#FCD34D'}}>{Math.floor(t.stale_hours)}h</span>
          </div>
        ))}
      </div>
    </>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        if (['admin','manager'].includes(user?.role)) setData(await dashboardService.getAdmin());
        else if (user?.role === 'sales')              setData(await dashboardService.getSales());
        else if (user?.role === 'cskh')               setData(await dashboardService.getCSKH());
        else if (user?.role === 'technical')          setData({}); // technical chỉ dùng Tickets page
      } finally { setLoading(false); }
    };
    if (user) fetch();
  }, [user]);

  const s = {
    page:  { minHeight:'100vh', background:'#080E1A', fontFamily:"'DM Sans','Segoe UI',sans-serif", color:'#F1F5F9' },
    inner: { maxWidth:1280, margin:'0 auto', padding:'32px 24px' },
  };

  const roleName = { admin:'Admin', manager:'Manager', sales:'Sales', cskh:'CSKH', technical:'Kỹ thuật' };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *,*::before,*::after{box-sizing:border-box} body{margin:0}`}</style>
      <div style={s.page}><div style={s.inner}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.4px',margin:'0 0 4px'}}>Dashboard</h1>
          <p style={{fontSize:14,color:'#64748B',margin:0}}>Xin chào, {user?.fullName} · {roleName[user?.role]}</p>
        </div>
        {loading ? (
          <div style={{color:'#64748B',textAlign:'center',padding:60}}>Đang tải…</div>
        ) : !data ? (
          <div style={{color:'#64748B',textAlign:'center',padding:60}}>Không có dữ liệu cho role này.</div>
        ) : (
          <>
            {['admin','manager'].includes(user?.role) && <AdminDash data={data}/>}
            {user?.role === 'sales'  && <SalesDash data={data}/>}
            {user?.role === 'cskh'   && <CSKHDash  data={data}/>}
          </>
        )}
      </div></div>
    </>
  );
};
export default DashboardPage;