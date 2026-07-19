'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import {
  Package, Plus, Search, Eye, ChevronLeft, ChevronRight,
  CheckSquare, ArrowLeftRight, Wrench, AlertTriangle, X,
  BarChart3, MapPin, Tag, DollarSign, Calendar, User,
  Filter, Download, ShieldCheck, Layers, TrendingDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type AssetStatus = 'ACTIVE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED' | 'LOST';
type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | string;

interface Asset {
  id: string; modelName: string; tagId: string; serialNumber: string;
  status: AssetStatus; purchasePrice: number; purchaseDate: string;
  type: { id: string; name: string; lifespanYears: number };
  location: { id: string; name: string };
  assignments?: any[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META: Record<AssetStatus, { label: string; color: string; bg: string; dot: string }> = {
  ACTIVE:      { label: 'Available',   color: '#10B981', bg: 'rgba(16,185,129,0.1)',  dot: '#10B981' },
  ASSIGNED:    { label: 'Assigned',    color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  dot: '#6366F1' },
  MAINTENANCE: { label: 'Maintenance', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  dot: '#F59E0B' },
  RETIRED:     { label: 'Retired',     color: '#64748B', bg: 'rgba(100,116,139,0.1)', dot: '#64748B' },
  LOST:        { label: 'Lost',        color: '#F43F5E', bg: 'rgba(244,63,94,0.1)',   dot: '#F43F5E' },
};

const TYPE_ICONS: Record<string, string> = {
  laptop: '💻', macbook: '💻', desktop: '🖥️', monitor: '🖥️',
  phone: '📱', tablet: '📱', printer: '🖨️', router: '📡',
  keyboard: '⌨️', mouse: '🖱️', server: '🗄️', chair: '🪑',
  default: '📦',
};

function getTypeIcon(typeName: string): string {
  const key = Object.keys(TYPE_ICONS).find(k => typeName.toLowerCase().includes(k));
  return key ? TYPE_ICONS[key] : TYPE_ICONS.default;
}

function canWrite(role: UserRole) { return role === 'ADMIN' || role === 'MANAGER'; }
function isAdmin(role: UserRole) { return role === 'ADMIN'; }

function exportAssetsCSV(assets: Asset[]) {
  const headers = ['Tag ID', 'Model', 'Serial Number', 'Type', 'Location', 'Status', 'Purchase Price', 'Purchase Date'];
  const rows = assets.map(a => [
    a.tagId, a.modelName, a.serialNumber,
    a.type?.name ?? '', a.location?.name ?? '',
    a.status, a.purchasePrice ?? '', a.purchaseDate ?? '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `assets-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: AssetStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.ACTIVE;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:m.bg, color:m.color, fontSize:'0.72rem', fontWeight:700 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:m.dot, display:'inline-block' }} />
      {m.label}
    </span>
  );
}

// ─── RBAC Banner ─────────────────────────────────────────────────────────────
function RbacBadge({ role }: { role: UserRole }) {
  const meta = role === 'ADMIN'
    ? { label: 'Admin — Full Access', color: '#F43F5E', bg: 'rgba(244,63,94,0.08)', icon: <ShieldCheck size={13}/> }
    : role === 'MANAGER'
    ? { label: 'Manager — Read & Assign', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon: <User size={13}/> }
    : { label: 'Employee — View Assigned Assets', color: '#6366F1', bg: 'rgba(99,102,241,0.08)', icon: <Package size={13}/> };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, background:meta.bg, color:meta.color, fontSize:'0.74rem', fontWeight:700, border:`1px solid ${meta.color}22` }}>
      {meta.icon} {meta.label}
    </span>
  );
}

// ─── Add Asset Modal (ADMIN / MANAGER only) ───────────────────────────────────
function AddAssetModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    modelName: '', serialNumber: '', tagId: `AST-${Math.floor(Math.random()*90000+10000)}`,
    typeId: '', locationId: '', purchasePrice: '', purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [step, setStep] = useState<'scan'|'manual'>('scan');

  const { data: types = [] }     = useQuery({ queryKey: ['asset-types'],     queryFn: () => api.get<any[]>('/assets/types'),     staleTime: 300_000 });
  const { data: locations = [] } = useQuery({ queryKey: ['asset-locations'], queryFn: () => api.get<any[]>('/assets/locations'), staleTime: 300_000 });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: any) => api.post('/assets', data),
    onSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.modelName || form.modelName.length < 3) { setError('Model name must be at least 3 characters'); return; }
    if (!form.serialNumber || form.serialNumber.length < 4) { setError('Serial number is too short'); return; }
    if (!form.tagId.startsWith('AST-') && !form.tagId.startsWith('VIQ-')) { setError('Tag ID must start with AST- or VIQ-'); return; }
    if (!form.typeId) { setError('Asset type is required'); return; }
    if (!form.locationId) { setError('Location is required'); return; }
    try {
      await mutateAsync({ ...form, purchasePrice: parseFloat(form.purchasePrice) || 0 });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to register asset');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ fontFamily:'var(--font-sora,sans-serif)', fontSize:'1.05rem', fontWeight:800, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:8 }}>
            <Package size={18} color="#6366F1" /> Register New Asset
          </div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>

        {error && <div style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.25)', borderRadius:8, padding:'10px 14px', color:'#F43F5E', fontSize:'0.82rem', marginBottom:16 }}>{error}</div>}

        {step === 'scan' ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, padding:'20px 0' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Search size={32} color="#6366F1" />
            </div>
            <p style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:'0.875rem', lineHeight:1.6 }}>
              Scan the manufacturer barcode or NFC tag to automatically fetch asset metadata and register instantly.
            </p>
            <button className="btn btn-primary" style={{ width:'100%', padding:'12px', justifyContent:'center', fontSize:'0.875rem' }} onClick={() => {
              setForm(f => ({ ...f, modelName:'Dell XPS 15 (9530)', serialNumber:`SN-${Math.random().toString(36).substr(2,8).toUpperCase()}`, tagId:`AST-${Math.floor(Math.random()*90000+10000)}` }));
              setStep('manual');
            }}>
              Scan Barcode / NFC Tag
            </button>
            <button onClick={() => setStep('manual')} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit' }}>
              Enter details manually instead
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-grid">
              <div className="field">
                <label>Model Name *</label>
                <input value={form.modelName} onChange={e=>setForm(f=>({...f,modelName:e.target.value}))} placeholder="e.g. Dell XPS 15 (9530)" required />
              </div>
              <div className="field">
                <label>Serial Number *</label>
                <input value={form.serialNumber} onChange={e=>setForm(f=>({...f,serialNumber:e.target.value}))} placeholder="SN-XXXX" required />
              </div>
              <div className="field">
                <label>Tag ID *</label>
                <input value={form.tagId} onChange={e=>setForm(f=>({...f,tagId:e.target.value}))} placeholder="AST-12345" required />
              </div>
              <div className="field">
                <label>Purchase Price (₹)</label>
                <input type="number" value={form.purchasePrice} onChange={e=>setForm(f=>({...f,purchasePrice:e.target.value}))} placeholder="85000" />
              </div>
              <div className="field">
                <label>Asset Type *</label>
                <select value={form.typeId} onChange={e=>setForm(f=>({...f,typeId:e.target.value}))} required>
                  <option value="">Select type…</option>
                  {(types as any[]).map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Location *</label>
                <select value={form.locationId} onChange={e=>setForm(f=>({...f,locationId:e.target.value}))} required>
                  <option value="">Select location…</option>
                  {(locations as any[]).map((l:any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ gridColumn:'1/-1' }}>
                <label>Purchase Date</label>
                <input type="date" value={form.purchaseDate} onChange={e=>setForm(f=>({...f,purchaseDate:e.target.value}))} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isPending} style={{ flex:1, justifyContent:'center' }}>
                {isPending ? 'Registering…' : 'Register Asset'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Checkout Modal (ADMIN / MANAGER) ─────────────────────────────────────────
function CheckoutModal({ asset, onClose, onSuccess }: { asset: Asset; onClose: ()=>void; onSuccess: ()=>void }) {
  const [userId, setUserId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [error, setError] = useState('');
  const qc = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => api.post(`/assets/${asset.id}/checkout`, { userId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); onSuccess(); },
  });
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ maxWidth:480 }}>
        <div className="modal-header">
          <span style={{ fontWeight:800, color:'var(--text-primary)', fontSize:'1rem' }}>Assign Asset</span>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div style={{ fontSize:'0.875rem', color:'var(--text-secondary)', marginBottom:16 }}>
          Assigning: <strong style={{ color:'var(--text-primary)' }}>{asset.modelName}</strong>{' '}
          <span style={{ fontFamily:'monospace', fontSize:'0.78rem', color:'#6366F1' }}>{asset.tagId}</span>
        </div>
        {error && <div style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.25)', borderRadius:8, padding:'10px 14px', color:'#F43F5E', fontSize:'0.82rem', marginBottom:12 }}>{error}</div>}
        <div className="field" style={{ marginBottom:12 }}>
          <label>Employee Name / Email</label>
          <input value={employeeName} onChange={e=>setEmployeeName(e.target.value)} placeholder="Search employee name or email..." />
        </div>
        <div className="field" style={{ marginBottom:16 }}>
          <label>Employee ID (UUID)</label>
          <input value={userId} onChange={e=>setUserId(e.target.value)} placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" />
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>Enter the employee&apos;s UUID from the HR directory</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!userId || isPending} style={{ flex:1, justifyContent:'center' }}
            onClick={async () => { try { await mutateAsync(); } catch(e:any){ setError(e?.response?.data?.message ?? 'Failed to assign'); } }}>
            {isPending ? 'Assigning…' : 'Assign Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Asset Card ───────────────────────────────────────────────────────────────
function AssetCard({ asset, role, onAssign }: { asset: Asset; role: UserRole; onAssign: (a: Asset)=>void }) {
  const emoji = getTypeIcon(asset.type?.name ?? '');
  const currentUser = asset.assignments?.find((a:any) => !a.returnedAt);
  const deprecPct = Math.max(0, Math.min(100, Math.round((
    (new Date().getFullYear() - new Date(asset.purchaseDate).getFullYear()) / (asset.type?.lifespanYears || 5)
  ) * 100)));

  return (
    <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14, padding:22, display:'flex', flexDirection:'column', gap:16, transition:'transform 0.2s,box-shadow 0.2s,border-color 0.2s' }}
      onMouseEnter={e => { const d = e.currentTarget; d.style.transform='translateY(-3px)'; d.style.boxShadow='0 12px 40px rgba(0,0,0,0.25)'; d.style.borderColor='rgba(99,102,241,0.3)'; }}
      onMouseLeave={e => { const d = e.currentTarget; d.style.transform=''; d.style.boxShadow=''; d.style.borderColor=''; }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:46, height:46, borderRadius:12, background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
            {emoji}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary)', lineHeight:1.3 }}>{asset.modelName}</div>
            <div style={{ fontFamily:'monospace', fontSize:'0.7rem', color:'#6366F1', marginTop:2, background:'rgba(99,102,241,0.08)', padding:'2px 7px', borderRadius:4, display:'inline-block' }}>{asset.tagId}</div>
          </div>
        </div>
        <StatusPill status={asset.status} />
      </div>

      {/* Meta grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, background:'rgba(0,0,0,0.15)', padding:12, borderRadius:10 }}>
        {[
          { icon:<Layers size={11}/>, label:'Type', val:asset.type?.name },
          { icon:<MapPin size={11}/>, label:'Location', val:asset.location?.name },
          { icon:<Tag size={11}/>, label:'Serial', val:asset.serialNumber },
          { icon:<DollarSign size={11}/>, label:'Value', val:`₹${asset.purchasePrice?.toLocaleString('en-IN') ?? '—'}` },
        ].map(m => (
          <div key={m.label} style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <span style={{ fontSize:'0.62rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:3 }}>{m.icon} {m.label}</span>
            <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-secondary)' }}>{m.val ?? '—'}</span>
          </div>
        ))}
      </div>

      {/* Depreciation bar (only ADMIN/MANAGER) */}
      {canWrite(role) && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:4 }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><TrendingDown size={10}/> Depreciation</span>
            <span>{deprecPct}% of lifespan used</span>
          </div>
          <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)' }}>
            <div style={{ width:`${deprecPct}%`, height:'100%', borderRadius:2, background: deprecPct > 80 ? '#F43F5E' : deprecPct > 50 ? '#F59E0B' : '#10B981', transition:'width 0.6s ease' }} />
          </div>
        </div>
      )}

      {/* Assigned to (if applicable) */}
      {asset.status === 'ASSIGNED' && currentUser && canWrite(role) && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.06)', borderRadius:8, padding:'8px 12px', fontSize:'0.78rem' }}>
          <User size={13} color="#6366F1" />
          <span style={{ color:'var(--text-secondary)' }}>Assigned to: </span>
          <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{currentUser.user?.name ?? currentUser.user?.email ?? 'Unknown'}</span>
        </div>
      )}

      {/* Actions — RBAC */}
      <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
        <Link href={`/assets/${asset.id}`} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 12px', borderRadius:8, fontSize:'0.78rem', fontWeight:600, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-color)', color:'var(--text-secondary)', textDecoration:'none', transition:'all 0.15s' }}
          onMouseEnter={e=>{(e.currentTarget as any).style.background='rgba(255,255,255,0.08)'; (e.currentTarget as any).style.color='var(--text-primary)';}}
          onMouseLeave={e=>{(e.currentTarget as any).style.background='rgba(255,255,255,0.04)'; (e.currentTarget as any).style.color='var(--text-secondary)';}}>
          <Eye size={13}/> Details
        </Link>
        {canWrite(role) && asset.status === 'ACTIVE' && (
          <button onClick={() => onAssign(asset)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 12px', borderRadius:8, fontSize:'0.78rem', fontWeight:700, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', border:'none', cursor:'pointer', transition:'opacity 0.15s' }}
            onMouseEnter={e=>(e.currentTarget.style.opacity='0.85')} onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
            <ArrowLeftRight size={13}/> Assign
          </button>
        )}
        {isAdmin(role) && asset.status === 'ASSIGNED' && (
          <button style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 12px', borderRadius:8, fontSize:'0.78rem', fontWeight:600, background:'rgba(245,158,11,0.1)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.2)', cursor:'pointer' }}>
            <CheckSquare size={13}/> Check In
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Summary Cards ─────────────────────────────────────────────────────────────
function SummaryCards({ summary, role }: { summary: any; role: UserRole }) {
  if (!canWrite(role)) return null;
  const cards = [
    { label:'Total Assets', value: summary?.total ?? summary?.stats?.total ?? '—', icon: Package, color:'#6366F1' },
    { label:'Available', value: summary?.byStatus?.ACTIVE ?? summary?.stats?.available ?? '—', icon: CheckSquare, color:'#10B981' },
    { label:'Assigned', value: summary?.byStatus?.ASSIGNED ?? summary?.stats?.assigned ?? '—', icon: ArrowLeftRight, color:'#8B5CF6' },
    { label:'In Maintenance', value: summary?.byStatus?.MAINTENANCE ?? summary?.stats?.maintenance ?? '—', icon: Wrench, color:'#F59E0B' },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16 }}>
      {cards.map(c => (
        <div key={c.label} className="glass" style={{ padding:20, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:11, background:c.color+'18', color:c.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <c.icon size={20} />
          </div>
          <div>
            <div style={{ fontSize:'1.55rem', fontWeight:800, color:'var(--text-primary)', lineHeight:1, fontFamily:'var(--font-sora,sans-serif)' }}>{c.value}</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:3 }}>{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssetsPage() {
  const { user } = useAuth();
  const role: UserRole = (user?.role ?? 'USER') as UserRole;
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [checkoutAsset, setCheckoutAsset] = useState<Asset | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    return `/assets?${params}`;
  }, [page, debouncedSearch, statusFilter]);

  // For regular users — only show their assigned assets
  const userQueryKey = role === 'USER'
    ? ['assets', 'my-assets']
    : ['assets', page, debouncedSearch, statusFilter];

  const { data, isLoading } = useQuery({
    queryKey: userQueryKey,
    queryFn: () => {
      if (role === 'USER') return api.get<any>('/assets?status=ASSIGNED&limit=50');
      return api.get<any>(buildQuery());
    },
    staleTime: 30_000,
  });

  const { data: summary } = useQuery({
    queryKey: ['assets-summary'],
    queryFn: () => api.get<any>('/assets/summary'),
    staleTime: 60_000,
    enabled: canWrite(role),
  });

  const assets: Asset[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 12) || 1;

  return (
    <div style={{ padding:'28px 32px', display:'flex', flexDirection:'column', gap:24, maxWidth:1400 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><Package size={24}/> Asset Management</h1>
          <p className="page-subtitle" style={{ marginTop:6 }}>
            {canWrite(role)
              ? `${total} assets in inventory — track, assign, and manage office resources`
              : 'Your assigned assets and equipment'}
          </p>
        </div>
        <div className="header-actions">
          <RbacBadge role={role} />
          {canWrite(role) && (
            <>
              <button className="btn btn-secondary" style={{ gap:6 }} onClick={() => exportAssetsCSV(assets)}>
                <Download size={14}/> Export CSV
              </button>
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={15}/> Register Asset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary (ADMIN/MANAGER only) */}
      {canWrite(role) && <SummaryCards summary={summary} role={role} />}

      {/* USER view: personal assigned assets info box */}
      {!canWrite(role) && (
        <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, fontSize:'0.85rem', color:'var(--text-secondary)' }}>
          <Package size={18} color="#6366F1" />
          <span>You can view and track assets currently assigned to you. Contact your manager to request new equipment.</span>
        </div>
      )}

      {/* Filters (ADMIN/MANAGER only) */}
      {canWrite(role) && (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:240 }}>
            <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by model name or tag ID…"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-color)', borderRadius:8, padding:'9px 36px', color:'var(--text-primary)', fontSize:'0.875rem', outline:'none', fontFamily:'inherit' }} />
            {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center' }}><X size={14}/></button>}
          </div>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value); setPage(1);}}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-color)', borderRadius:8, padding:'9px 14px', color:'var(--text-primary)', fontSize:'0.83rem', outline:'none', cursor:'pointer', fontFamily:'inherit' }}>
            <option value="">All Statuses</option>
            {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}

      {/* Asset Grid */}
      {isLoading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
          {Array(6).fill(0).map((_,i) => (
            <div key={i} style={{ height:280, borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid var(--card-border)', animation:'shimmer 1.4s infinite', backgroundSize:'200% 100%', backgroundImage:'linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%)' }} />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:'60px 0', color:'var(--text-muted)' }}>
          <Package size={48} strokeWidth={1} />
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:6 }}>
              {role === 'USER' ? 'No assets assigned to you' : 'No assets found'}
            </div>
            <div style={{ fontSize:'0.82rem' }}>
              {role === 'USER' ? 'Contact your manager to request equipment assignment.' : search ? 'Try a different search term or clear filters.' : 'Register your first asset to get started.'}
            </div>
          </div>
          {canWrite(role) && !search && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={14}/> Register First Asset
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
            {assets.map(asset => (
              <AssetCard key={asset.id} asset={asset} role={role} onAssign={setCheckoutAsset} />
            ))}
          </div>

          {/* Pagination */}
          {canWrite(role) && totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:20, marginTop:8 }}>
              <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p-1)}>
                <ChevronLeft size={15}/> Previous
              </button>
              <span style={{ fontSize:'0.83rem', color:'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>
                Next <ChevronRight size={15}/>
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAdd && <AddAssetModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['assets'] }); }} />}
      {checkoutAsset && <CheckoutModal asset={checkoutAsset} onClose={() => setCheckoutAsset(null)} onSuccess={() => setCheckoutAsset(null)} />}

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        [data-theme='light'] .glass { background: #fff !important; }
      `}</style>
    </div>
  );
}
