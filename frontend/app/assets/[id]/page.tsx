'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import {
  ArrowLeft, Edit, AlertCircle, CheckCircle, ShieldCheck,
  Package, MapPin, Tag, DollarSign, Calendar, User,
  Wrench, Clock, TrendingDown, History, QrCode,
} from 'lucide-react';

type AssetStatus = 'ACTIVE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:      { label: 'Available',   color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  ASSIGNED:    { label: 'Assigned',    color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  MAINTENANCE: { label: 'Maintenance', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  RETIRED:     { label: 'Retired',     color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  LOST:        { label: 'Lost',        color: '#F43F5E', bg: 'rgba(244,63,94,0.1)'  },
};

const TYPE_EMOJIS: Record<string, string> = {
  laptop:'💻', macbook:'💻', desktop:'🖥️', monitor:'🖥️',
  phone:'📱', tablet:'📱', printer:'🖨️', router:'📡',
  keyboard:'⌨️', mouse:'🖱️', server:'🗄️', default:'📦',
};

function getEmoji(typeName: string): string {
  const key = Object.keys(TYPE_EMOJIS).find(k => typeName?.toLowerCase().includes(k));
  return key ? TYPE_EMOJIS[key] : TYPE_EMOJIS.default;
}

function canWrite(role: string) { return role === 'ADMIN' || role === 'MANAGER'; }

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role ?? 'USER';
  const id = params.id as string;

  const [verification, setVerification] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: asset, isLoading, error } = useQuery<any>({
    queryKey: ['asset', id],
    queryFn: () => api.get<any>(`/assets/${id}`),
    staleTime: 30_000,
    enabled: !!id,
  });

  const verifyAudit = async () => {
    setIsVerifying(true);
    try {
      const res = await api.get<any>(`/assets/${id}/verify-audit`);
      setVerification(res);
    } catch {
      setVerification({ isValid: false, message: 'Failed to verify audit chain' });
    }
    setIsVerifying(false);
  };

  if (isLoading) return (
    <div style={{ padding:40, display:'flex', flexDirection:'column', gap:20 }}>
      {[200, 300, 150, 200].map((w,i) => (
        <div key={i} style={{ height:24, width:w, borderRadius:6, background:'rgba(255,255,255,0.05)', animation:'shimmer 1.4s infinite', backgroundSize:'200% 100%', backgroundImage:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)' }} />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );

  if (error || !asset) return (
    <div style={{ padding:40, display:'flex', flexDirection:'column', alignItems:'center', gap:16, color:'var(--text-muted)' }}>
      <AlertCircle size={48} strokeWidth={1} color="#F43F5E" />
      <div style={{ fontWeight:600, color:'var(--text-secondary)' }}>Asset not found</div>
      <button onClick={() => router.push('/assets')} style={{ background:'none', border:'none', color:'#6366F1', cursor:'pointer', fontFamily:'inherit', fontSize:'0.875rem' }}>← Back to Asset Management</button>
    </div>
  );

  const statusMeta = STATUS_META[asset.status] ?? STATUS_META.ACTIVE;
  const emoji = getEmoji(asset.type?.name ?? '');
  const currentAssignment = asset.assignments?.find((a:any) => !a.returnedAt);

  const purchaseDateObj = new Date(asset.purchaseDate);
  const yearsOld = (new Date().getFullYear() - purchaseDateObj.getFullYear());
  const lifespanYears = asset.type?.lifespanYears || 5;
  const deprecPct = Math.max(0, Math.min(100, Math.round((yearsOld / lifespanYears) * 100)));
  const bookValue = Math.max(0, asset.purchasePrice * (1 - deprecPct / 100));

  const metaFields = [
    { icon: <Tag size={14}/>,      label: 'Tag ID',         value: asset.tagId, mono: true },
    { icon: <Package size={14}/>,  label: 'Serial Number',  value: asset.serialNumber, mono: true },
    { icon: <Wrench size={14}/>,   label: 'Asset Type',     value: asset.type?.name },
    { icon: <MapPin size={14}/>,   label: 'Location',       value: asset.location?.name },
    { icon: <DollarSign size={14}/>, label: 'Purchase Price', value: `₹${asset.purchasePrice?.toLocaleString('en-IN')}` },
    { icon: <Calendar size={14}/>, label: 'Purchase Date',  value: purchaseDateObj.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) },
    { icon: <Clock size={14}/>,    label: 'Age',            value: `${yearsOld} year${yearsOld !== 1 ? 's' : ''}` },
    { icon: <TrendingDown size={14}/>, label: 'Book Value',  value: `₹${Math.round(bookValue).toLocaleString('en-IN')}`, highlight: true },
  ];

  return (
    <div style={{ padding:'28px 32px', display:'flex', flexDirection:'column', gap:24, maxWidth:1200 }}>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => router.push('/assets')} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-color)', borderRadius:8, padding:'7px 14px', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.82rem', fontWeight:600, transition:'all 0.15s' }}
          onMouseEnter={e=>{(e.currentTarget as any).style.background='rgba(255,255,255,0.08)'; (e.currentTarget as any).style.color='var(--text-primary)';}}
          onMouseLeave={e=>{(e.currentTarget as any).style.background='rgba(255,255,255,0.04)'; (e.currentTarget as any).style.color='var(--text-secondary)';}}>
          <ArrowLeft size={14}/> Asset Management
        </button>
        <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>/</span>
        <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)', fontFamily:'monospace' }}>{asset.tagId}</span>
      </div>

      {/* Hero section */}
      <div className="asset-hero" style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
        <div style={{ width:72, height:72, borderRadius:16, background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', flexShrink:0 }}>{emoji}</div>
        <div style={{ flex:1, minWidth:200 }}>
          <h1 style={{ margin:0, fontFamily:'var(--font-sora,sans-serif)', fontSize:'1.65rem', fontWeight:800, color:'var(--text-primary)', lineHeight:1.2 }}>{asset.modelName}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'#6366F1', background:'rgba(99,102,241,0.1)', padding:'3px 8px', borderRadius:5 }}>{asset.tagId}</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:statusMeta.bg, color:statusMeta.color, fontSize:'0.72rem', fontWeight:700 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:statusMeta.color }} />{statusMeta.label}
            </span>
          </div>
        </div>
        {canWrite(role) && (
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <button onClick={verifyAudit} disabled={isVerifying}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, fontSize:'0.83rem', fontWeight:600, border:'1px solid var(--border-color)', background:'rgba(255,255,255,0.04)', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
              <ShieldCheck size={15}/> {isVerifying ? 'Verifying…' : 'Verify Audit'}
            </button>
            <button style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, fontSize:'0.83rem', fontWeight:600, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
              <Edit size={15}/> Edit Asset
            </button>
          </div>
        )}
      </div>

      {/* Verification alert */}
      {verification && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderRadius:10, border:`1px solid ${verification.isValid ? '#10B981' : '#F43F5E'}`, background: verification.isValid ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', color: verification.isValid ? '#10B981' : '#F43F5E' }}>
          {verification.isValid ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
          <span style={{ fontSize:'0.875rem', fontWeight:600 }}>{verification.message}</span>
          {verification.blocksVerified !== undefined && <span style={{ fontSize:'0.78rem', opacity:0.75 }}>({verification.blocksVerified} blocks verified)</span>}
        </div>
      )}

      {/* Two-column layout */}
      <div className="asset-detail-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
        {/* Asset Details */}
        <div className="glass" style={{ padding:24 }}>
          <h3 style={{ margin:'0 0 18px', fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:8 }}>
            <Package size={14}/> Asset Details
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {metaFields.map(f => (
              <div key={f.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.8rem', color:'var(--text-muted)' }}>{f.icon}{f.label}</span>
                <span style={{ fontSize:'0.875rem', fontWeight:600, color: f.highlight ? '#10B981' : 'var(--text-primary)', fontFamily: f.mono ? 'monospace' : 'inherit' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Depreciation & Assignment */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Depreciation */}
          <div className="glass" style={{ padding:24 }}>
            <h3 style={{ margin:'0 0 16px', fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:8 }}>
              <TrendingDown size={14}/> Depreciation ({lifespanYears}yr lifespan)
            </h3>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:8 }}>
              <span>Depreciation</span><span>{deprecPct}% used</span>
            </div>
            <div style={{ height:10, borderRadius:5, background:'rgba(255,255,255,0.06)', marginBottom:14 }}>
              <div style={{ width:`${deprecPct}%`, height:'100%', borderRadius:5, background: deprecPct > 80 ? '#F43F5E' : deprecPct > 50 ? '#F59E0B' : '#10B981', transition:'width 0.6s ease' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { label:'Purchase Value', val:`₹${asset.purchasePrice?.toLocaleString('en-IN')}`, color:'var(--text-primary)' },
                { label:'Book Value Today', val:`₹${Math.round(bookValue).toLocaleString('en-IN')}`, color:'#10B981' },
                { label:'Years Old', val:`${yearsOld}yr`, color:'var(--text-secondary)' },
                { label:'Remaining Life', val:`${Math.max(0, lifespanYears - yearsOld)}yr`, color: lifespanYears - yearsOld < 1 ? '#F43F5E' : '#F59E0B' },
              ].map(s => (
                <div key={s.label} style={{ background:'rgba(0,0,0,0.15)', padding:'12px 14px', borderRadius:10 }}>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:'1rem', fontWeight:700, color:s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Assignment */}
          <div className="glass" style={{ padding:24 }}>
            <h3 style={{ margin:'0 0 14px', fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:8 }}>
              <User size={14}/> Current Assignment
            </h3>
            {currentAssignment ? (
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {(currentAssignment.user?.name ?? 'U').charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{currentAssignment.user?.name ?? currentAssignment.user?.email}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:2 }}>
                    Assigned {new Date(currentAssignment.assignedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color:'var(--text-muted)', fontSize:'0.875rem', display:'flex', alignItems:'center', gap:8 }}>
                <Package size={16}/> Not currently assigned — asset is available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment History */}
      {canWrite(role) && asset.assignments?.length > 0 && (
        <div className="glass" style={{ padding:24 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:8 }}>
            <History size={14}/> Assignment History
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {asset.assignments.slice(0, 8).map((a:any, i:number) => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom: i < asset.assignments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background: a.returnedAt ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color: a.returnedAt ? '#10B981' : '#6366F1', flexShrink:0 }}>
                  {a.returnedAt ? <CheckCircle size={14}/> : <User size={14}/>}
                </div>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>{a.user?.name ?? a.user?.email ?? 'Unknown'}</span>
                  <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginLeft:8 }}>
                    {new Date(a.assignedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    {a.returnedAt && ` → ${new Date(a.returnedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`}
                  </span>
                </div>
                <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:20, background: a.returnedAt ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', color: a.returnedAt ? '#10B981' : '#6366F1', fontWeight:700 }}>
                  {a.returnedAt ? 'Returned' : 'Current'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance History */}
      {canWrite(role) && asset.maintenance?.length > 0 && (
        <div className="glass" style={{ padding:24 }}>
          <h3 style={{ margin:'0 0 16px', fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:8 }}>
            <Wrench size={14}/> Maintenance Records
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {asset.maintenance.slice(0, 5).map((m:any) => (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'rgba(0,0,0,0.12)', borderRadius:10, border:'1px solid rgba(255,255,255,0.04)' }}>
                {m.status === 'OPEN' ? <AlertCircle size={16} color="#F59E0B"/> : <CheckCircle size={16} color="#10B981"/>}
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--text-primary)' }}>{m.issueType}</div>
                  {m.notes && <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:2 }}>{m.notes}</div>}
                </div>
                <span style={{ fontSize:'0.75rem', fontFamily:'monospace', color:'var(--text-muted)' }}>{new Date(m.scheduledDate).toLocaleDateString('en-IN')}</span>
                <span style={{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:20, background: m.status === 'OPEN' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: m.status === 'OPEN' ? '#F59E0B' : '#10B981', fontWeight:700 }}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .asset-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
        @media(max-width:768px) {
          .asset-detail-grid { grid-template-columns: 1fr !important; }
          .asset-hero { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}
