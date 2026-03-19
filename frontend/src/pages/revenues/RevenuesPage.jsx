/**
 * @file     frontend/src/pages/revenues/RevenuesPage.jsx
 * @location frontend/src/pages/revenues/RevenuesPage.jsx
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/authContext';
import revenuesService from '../../services/revenuesService';

const fmtVND  = (n) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(n||0);
const fmtCpct = (n) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',notation:'compact',maximumFractionDigits:1}).format(n||0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const PM_LABELS = { bank_transfer:'Chuyển khoản', cash:'Tiền mặt', online:'Online' };

const StatCard = ({ label, value, sub, color='#60A5FA', growth }) => (
  <div style={{background:'rgba(13,20,36,0.7)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'16px 20px'}}>
    <div style={{fontSize:11,color:'#64748B',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{label}</div>
    <div style={{fontSize:24,fontWeight:800,color,letterSpacing:'-0.4px'}}>{value}</div>
    {sub && <div style={{fontSize:12,color:'#475569',marginTop:4}}>{sub}</div>}
    {growth != null && <div style={{fontSize:12,fontWeight:600,marginTop:4,color:growth>=0?'#6EE7B7':'#FCA5A5'}}>{growth>=0?'▲':'▼'} {Math.abs(growth)}% so tháng trước</div>}
  </div>
);

const inp  = {width:'100%',boxSizing:'border-box',padding:'10px 12px',marginBottom:12,background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#F1F5F9',fontSize:14,outline:'none',fontFamily:'inherit'};
const lbl  = {display:'block',fontSize:12,fontWeight:600,color:'#94A3B8',marginBottom:5};
const btnP = {padding:'9px 18px',borderRadius:8,fontSize:14,fontWeight:600,background:'linear-gradient(135deg,#2563EB,#1D4ED8)',color:'#fff',border:'none',cursor:'pointer',fontFamily:'inherit'};
const btnS = {padding:'9px 18px',borderRadius:8,fontSize:14,fontWeight:600,background:'rgba(255,255,255,0.06)',color:'#94A3B8',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',fontFamily:'inherit'};

const RevModal = ({ data, onClose, onSaved }) => {
  const isEdit = !!data?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    const fd = new FormData(e.target);
    const payload = { contractId:Number(fd.get('contractId')), customerId:Number(fd.get('customerId')), amount:Number(fd.get('amount')), paymentDate:fd.get('paymentDate'), paymentMethod:fd.get('paymentMethod'), billingPeriod:fd.get('billingPeriod')||undefined, notes:fd.get('notes')||undefined };
    try { if(isEdit) await revenuesService.update(data.id,payload); else await revenuesService.create(payload); onSaved(); }
    catch(err) { setError(err.response?.data?.message||'Có lỗi xảy ra.'); }
    finally { setLoading(false); }
  };
  return (
    <div style={{position:'fixed',inset:0,zIndex:50,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:'100%',maxWidth:460,background:'#0D1424',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:28,boxShadow:'0 24px 60px rgba(0,0,0,0.5)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:700,color:'#F1F5F9'}}>{isEdit?'Sửa bản ghi':'Ghi nhận thanh toán'}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:22,lineHeight:1,padding:0}}>×</button>
        </div>
        {error && <div style={{padding:'10px 12px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:8,color:'#FCA5A5',fontSize:13,marginBottom:12}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
            <div><label style={lbl}>Contract ID *</label><input style={inp} name="contractId" type="number" min="1" required defaultValue={data?.contract_id}/></div>
            <div><label style={lbl}>Customer ID *</label><input style={inp} name="customerId" type="number" min="1" required defaultValue={data?.customer_id}/></div>
            <div><label style={lbl}>Số tiền (VNĐ) *</label><input style={inp} name="amount" type="number" min="0.01" step="1000" required defaultValue={data?.amount}/></div>
            <div><label style={lbl}>Ngày thanh toán *</label><input style={inp} name="paymentDate" type="date" required defaultValue={data?.payment_date?.slice(0,10)}/></div>
          </div>
          <label style={lbl}>Phương thức</label>
          <select style={{...inp,cursor:'pointer'}} name="paymentMethod" defaultValue={data?.payment_method||'bank_transfer'}>
            <option value="bank_transfer">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
            <option value="online">Online</option>
          </select>
          <label style={lbl}>Kỳ thanh toán (VD: 2025-01)</label>
          <input style={inp} name="billingPeriod" placeholder="YYYY-MM" defaultValue={data?.billing_period||''}/>
          <label style={lbl}>Ghi chú</label>
          <textarea style={{...inp,resize:'vertical',minHeight:60,marginBottom:16}} name="notes" defaultValue={data?.notes||''}/>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button type="button" style={btnS} onClick={onClose}>Huỷ</button>
            <button type="submit" style={btnP} disabled={loading}>{loading?'Đang lưu…':isEdit?'Cập nhật':'Ghi nhận'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RevenuesPage = () => {
  const { user } = useAuth();
  const canWrite = ['admin','sales'].includes(user?.role);
  const isAdmin  = user?.role === 'admin';
  const [revenues,setRevenues]=useState([]);
  const [stats,setStats]=useState(null);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(true);
  const LIMIT=15;
  const [fFrom,setFFrom]=useState('');
  const [fTo,setFTo]=useState('');
  const [fMethod,setFMethod]=useState('');
  const [modal,setModal]=useState(null);

  const fetchAll = useCallback(async()=>{
    setLoading(true);
    try {
      const [res,st]=await Promise.all([revenuesService.getRevenues({page,limit:LIMIT,fromDate:fFrom||undefined,toDate:fTo||undefined,paymentMethod:fMethod||undefined}),revenuesService.getStats()]);
      setRevenues(res.data||[]); setTotal(res.total||0); setStats(st);
    } finally { setLoading(false); }
  },[page,fFrom,fTo,fMethod]);

  useEffect(()=>{fetchAll();},[fetchAll]);

  const handleDelete = async(id)=>{
    if(!window.confirm('Xóa bản ghi này?'))return;
    try{await revenuesService.remove(id);fetchAll();}
    catch(err){alert(err.response?.data?.message||'Lỗi.');}
  };

  const totalPages=Math.ceil(total/LIMIT);
  const s={
    page:{minHeight:'100vh',background:'#080E1A',fontFamily:"'DM Sans','Segoe UI',sans-serif",color:'#F1F5F9'},
    inner:{maxWidth:1280,margin:'0 auto',padding:'32px 24px'},
    th:{padding:'12px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#64748B',letterSpacing:'0.06em',textTransform:'uppercase',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'},
    td:{padding:'13px 14px',fontSize:13,color:'#CBD5E1',borderBottom:'1px solid rgba(255,255,255,0.04)'},
    fi:{padding:'9px 14px',background:'rgba(255,255,255,0.05)',border:'1.5px solid rgba(255,255,255,0.08)',borderRadius:9,color:'#F1F5F9',fontSize:14,outline:'none',fontFamily:'inherit'},
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *,*::before,*::after{box-sizing:border-box} body{margin:0}`}</style>
      {modal!==null&&<RevModal data={modal.id?modal:null} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);fetchAll();}}/>}
      <div style={s.page}><div style={s.inner}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
          <div><h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-0.4px',margin:'0 0 4px'}}>Doanh thu</h1><p style={{fontSize:14,color:'#64748B',margin:0}}>Ghi nhận và theo dõi thanh toán từ khách hàng</p></div>
          {canWrite&&<button style={{...btnP,fontSize:15}} onClick={()=>setModal({})}>+ Ghi nhận thanh toán</button>}
        </div>
        {stats&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:24}}>
          <StatCard label="Tháng này" value={fmtCpct(stats.thisMonth)} color="#6EE7B7" growth={stats.momGrowth}/>
          <StatCard label="Năm nay"   value={fmtCpct(stats.thisYear)}  color="#60A5FA" sub={`${stats.totalCount} bản ghi`}/>
          <StatCard label="Tháng trước" value={fmtCpct(stats.lastMonth)} color="#94A3B8"/>
          <StatCard label="Tổng tất cả" value={fmtCpct(stats.totalAll)} color="#A78BFA"/>
        </div>}
        <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:13,color:'#64748B'}}>Từ:</span><input style={{...s.fi,width:140}} type="date" value={fFrom} onChange={e=>{setFFrom(e.target.value);setPage(1);}}/></div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:13,color:'#64748B'}}>Đến:</span><input style={{...s.fi,width:140}} type="date" value={fTo} onChange={e=>{setFTo(e.target.value);setPage(1);}}/></div>
          <select style={{...s.fi,cursor:'pointer'}} value={fMethod} onChange={e=>{setFMethod(e.target.value);setPage(1);}}>
            <option value="">Tất cả phương thức</option>
            <option value="bank_transfer">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',background:'rgba(13,20,36,0.7)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden'}}>
            <thead><tr>{['#','Khách hàng','Hợp đồng','Giải pháp','Số tiền','Ngày TT','Phương thức','Kỳ',''].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {loading?<tr><td colSpan={9} style={{...s.td,textAlign:'center',color:'#475569',padding:40}}>Đang tải…</td></tr>
              :revenues.length===0?<tr><td colSpan={9} style={{...s.td,textAlign:'center',color:'#475569',padding:40}}>Chưa có bản ghi nào</td></tr>
              :revenues.map((r,i)=>(
                <tr key={r.id} style={{background:i%2===0?'transparent':'rgba(255,255,255,0.015)'}}>
                  <td style={{...s.td,color:'#64748B',fontSize:12}}>#{r.id}</td>
                  <td style={{...s.td,fontWeight:600,color:'#F1F5F9'}}>{r.company_name}</td>
                  <td style={{...s.td,fontFamily:'Courier New',fontSize:12,color:'#93C5FD'}}>{r.contract_number}</td>
                  <td style={{...s.td,fontSize:12,color:'#94A3B8'}}>{r.solution_name}</td>
                  <td style={{...s.td,fontWeight:700,color:'#6EE7B7'}}>{fmtVND(r.amount)}</td>
                  <td style={{...s.td,fontSize:12,color:'#64748B'}}>{fmtDate(r.payment_date)}</td>
                  <td style={{...s.td,fontSize:12}}>{PM_LABELS[r.payment_method]||r.payment_method}</td>
                  <td style={{...s.td,fontSize:12,color:'#64748B'}}>{r.billing_period||'—'}</td>
                  <td style={s.td}>
                    <div style={{display:'flex',gap:6}}>
                      {canWrite&&<button style={{padding:'5px 10px',borderRadius:7,fontSize:11,fontWeight:600,background:'rgba(99,179,237,0.1)',color:'#93C5FD',border:'1px solid rgba(99,179,237,0.25)',cursor:'pointer',fontFamily:'inherit'}} onClick={()=>setModal(r)}>Sửa</button>}
                      {isAdmin&&<button style={{padding:'5px 10px',borderRadius:7,fontSize:11,fontWeight:600,background:'rgba(239,68,68,0.1)',color:'#FCA5A5',border:'1px solid rgba(239,68,68,0.25)',cursor:'pointer',fontFamily:'inherit'}} onClick={()=>handleDelete(r.id)}>Xóa</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages>1&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16,fontSize:13,color:'#64748B'}}>
          <span>Trang {page} / {totalPages} · {total} bản ghi</span>
          <div style={{display:'flex',gap:8}}>
            {[{l:'← Trước',d:page<=1,f:()=>setPage(p=>p-1)},{l:'Sau →',d:page>=totalPages,f:()=>setPage(p=>p+1)}].map(b=><button key={b.l} disabled={b.d} onClick={b.f} style={{padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:600,background:'rgba(255,255,255,0.05)',color:b.d?'#334155':'#94A3B8',border:'1px solid rgba(255,255,255,0.08)',cursor:b.d?'not-allowed':'pointer',fontFamily:'inherit'}}>{b.l}</button>)}
          </div>
        </div>}
      </div></div>
    </>
  );
};
export default RevenuesPage;