'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, DollarSign, Clock, Briefcase, BarChart2, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

const NAV = [
  { href:'/dashboard',   icon:LayoutDashboard, label:'Dashboard' },
  { href:'/employees',   icon:Users,           label:'Employees' },
  { href:'/payroll',     icon:DollarSign,      label:'Payroll' },
  { href:'/attendance',  icon:Clock,           label:'Attendance' },
  { href:'/recruitment', icon:Briefcase,       label:'Recruitment' },
  { href:'/analytics',   icon:BarChart2,       label:'Analytics' },
  { href:'/settings',    icon:Settings,        label:'Settings' },
];

/** @component Sidebar — collapsible navigation rail with active state */
export default function Sidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed?'collapsed':''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">🌟</div>
        {!collapsed && <span className="logo-text">HRMS</span>}
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path.startsWith(href);
          return (
            <Link key={href} href={href} className={`nav-item ${active?'active':''}`} title={collapsed?label:undefined}>
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && <div className="active-indicator" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" style={{background:'none',border:'none',cursor:'pointer',width:'100%'}} title="Logout" onClick={()=>{ localStorage.removeItem('hrms_access_token'); localStorage.removeItem('hrms_refresh_token'); localStorage.removeItem('hrms_user'); document.cookie='hrms_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; window.location.href='/login'; }}>
          <LogOut size={18}/>{!collapsed&&<span>Logout</span>}
        </button>
        <button className="collapse-btn" onClick={()=>setCollapsed(c=>!c)} title={collapsed?'Expand':'Collapse'}>
          {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>
      </div>

      <style>{sidebarStyles}</style>
    </aside>
  );
}

const sidebarStyles=`
.sidebar{display:flex;flex-direction:column;width:220px;min-height:100vh;background:#0D0E14;border-right:1px solid rgba(255,255,255,0.06);padding:16px 10px;transition:width 0.25s ease;flex-shrink:0;position:sticky;top:0;}
.sidebar.collapsed{width:60px;}
.sidebar-logo{display:flex;align-items:center;gap:10px;padding:8px 6px 20px;}
.logo-icon{font-size:1.2rem;flex-shrink:0;}
.logo-text{font-family:var(--font-sora,sans-serif);font-size:1rem;font-weight:800;color:#F0F2FF;white-space:nowrap;}
.sidebar-nav{display:flex;flex-direction:column;gap:2px;flex:1;}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 10px;border-radius:10px;text-decoration:none;color:#9BA3C0;font-size:0.84rem;font-weight:600;transition:all 0.15s;position:relative;white-space:nowrap;}
.nav-item:hover{background:rgba(255,255,255,0.05);color:#F0F2FF;}
.nav-item.active{background:rgba(99,102,241,0.12);color:#818CF8;}
.active-indicator{position:absolute;right:10px;width:5px;height:5px;border-radius:50%;background:#6366F1;}
.sidebar-footer{display:flex;flex-direction:column;gap:4px;border-top:1px solid rgba(255,255,255,0.05);padding-top:10px;}
.collapse-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;color:#4B5278;padding:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;margin-top:4px;}
.collapse-btn:hover{background:rgba(255,255,255,0.08);color:#F0F2FF;}
`;
