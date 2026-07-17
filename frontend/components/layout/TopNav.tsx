'use client';
import React from 'react';
import { Bell, Search } from 'lucide-react';

/** @component TopNav — top navigation bar with search and notifications */
export default function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-search">
        <Search size={15} className="search-icon"/>
        <input placeholder="Search employees, payroll, jobs…" className="search-input" />
      </div>
      <div className="topnav-right">
        <button className="notif-btn" aria-label="Notifications"><Bell size={17}/><span className="notif-dot"/></button>
        <div className="avatar-chip">
          <div className="av">HR</div>
        </div>
      </div>
      <style>{`
        .topnav{display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:56px;background:#0A0B0F;border-bottom:1px solid rgba(255,255,255,0.06);position:sticky;top:0;z-index:50;flex-shrink:0;}
        .topnav-search{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:0 14px;width:300px;}
        .search-icon{color:#4B5278;flex-shrink:0;}
        .search-input{background:none;border:none;outline:none;color:#F0F2FF;font-size:0.83rem;padding:9px 0;width:100%;}
        .search-input::placeholder{color:#4B5278;}
        .topnav-right{display:flex;align-items:center;gap:12px;}
        .notif-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;color:#9BA3C0;cursor:pointer;position:relative;}
        .notif-dot{position:absolute;top:8px;right:9px;width:6px;height:6px;border-radius:50%;background:#F43F5E;border:1px solid #0A0B0F;}
        .avatar-chip{display:flex;align-items:center;gap:8px;}
        .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:800;color:#fff;}
      `}</style>
    </header>
  );
}
