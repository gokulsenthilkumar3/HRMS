'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users, Plus, Search, Download, Filter,
  ChevronDown, MoreHorizontal, X, Eye, Edit, UserX,
} from 'lucide-react';
import { useForm } from 'react-hook-form';

// ─ Types
export type EmployeeStatus = 'active' | 'onLeave' | 'terminated' | 'probation';
export type Department = 'engineering' | 'hr' | 'finance' | 'marketing' | 'sales' | 'operations' | 'legal' | 'design';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  designation: string;
  status: EmployeeStatus;
  joinDate: string;
  salary: number;
}

// ─ Mock data
const MOCK_EMPLOYEES: Employee[] = [
  { id: 'EMP001', name: 'Priya Sharma', email: 'priya@hrms.com', phone: '+91 98765 43210', department: 'engineering', designation: 'Senior Engineer', status: 'active', joinDate: '2023-01-15', salary: 120000 },
  { id: 'EMP002', name: 'Arjun Mehta', email: 'arjun@hrms.com', phone: '+91 98765 43211', department: 'sales', designation: 'Sales Executive', status: 'onLeave', joinDate: '2022-06-01', salary: 65000 },
  { id: 'EMP003', name: 'Kavitha R.', email: 'kavitha@hrms.com', phone: '+91 98765 43212', department: 'hr', designation: 'HR Manager', status: 'active', joinDate: '2021-03-20', salary: 90000 },
  { id: 'EMP004', name: 'Rahul Nair', email: 'rahul@hrms.com', phone: '+91 98765 43213', department: 'finance', designation: 'Finance Analyst', status: 'probation', joinDate: '2026-05-01', salary: 55000 },
  { id: 'EMP005', name: 'Divya Krishnan', email: 'divya@hrms.com', phone: '+91 98765 43214', department: 'design', designation: 'UI/UX Designer', status: 'active', joinDate: '2023-08-12', salary: 80000 },
  { id: 'EMP006', name: 'Suresh Babu', email: 'suresh@hrms.com', phone: '+91 98765 43215', department: 'operations', designation: 'Ops Lead', status: 'terminated', joinDate: '2020-11-01', salary: 0 },
  { id: 'EMP007', name: 'Meena Iyer', email: 'meena@hrms.com', phone: '+91 98765 43216', department: 'marketing', designation: 'Marketing Manager', status: 'active', joinDate: '2022-02-14', salary: 85000 },
  { id: 'EMP008', name: 'Vikram Singh', email: 'vikram@hrms.com', phone: '+91 98765 43217', department: 'engineering', designation: 'Backend Developer', status: 'active', joinDate: '2024-01-08', salary: 95000 },
];

const STATUS_META: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
  active:     { label: 'Active',     color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  onLeave:    { label: 'On Leave',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  terminated: { label: 'Terminated', color: '#F43F5E', bg: 'rgba(244,63,94,0.1)' },
  probation:  { label: 'Probation',  color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
};

const DEPT_LABELS: Record<Department, string> = {
  engineering: 'Engineering', hr: 'HR & Admin', finance: 'Finance',
  marketing: 'Marketing', sales: 'Sales', operations: 'Operations',
  legal: 'Legal', design: 'Design',
};

// ─ Status pill
function StatusPill({ status }: { status: EmployeeStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20,
        background: meta.bg, color: meta.color,
        fontSize: '0.75rem', fontWeight: 700,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
      {meta.label}
    </span>
  );
}

// ─ Add Employee Modal (React Hook Form, client-side Zod-like validation)
interface AddEmpForm {
  name: string; email: string; phone: string;
  department: Department; designation: string;
  joinDate: string; salary: string;
}

function AddEmployeeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: Employee) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AddEmpForm>();

  const onSubmit = (data: AddEmpForm) => {
    const newEmp: Employee = {
      id: `EMP${Math.floor(Math.random() * 9000) + 1000}`,
      name: data.name, email: data.email, phone: data.phone,
      department: data.department, designation: data.designation,
      status: 'probation', joinDate: data.joinDate,
      salary: parseFloat(data.salary),
    };
    onAdd(newEmp);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box card-premium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Employee</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="emp-form">
          <div className="form-grid">
            <div className="field">
              <label>Full Name *</label>
              <input
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Min 2 characters' },
                  pattern: { value: /^[a-zA-Z\s.]+$/, message: 'Letters only' },
                })}
                placeholder="e.g. Priya Sharma"
              />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>

            <div className="field">
              <label>Email *</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
                placeholder="priya@company.com"
              />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>

            <div className="field">
              <label>Phone *</label>
              <input
                {...register('phone', {
                  required: 'Phone is required',
                  pattern: { value: /^\+?[6-9]\d{9}$/, message: 'Invalid Indian mobile number' },
                })}
                placeholder="+91 9876543210"
              />
              {errors.phone && <span className="field-error">{errors.phone.message}</span>}
            </div>

            <div className="field">
              <label>Department *</label>
              <select {...register('department', { required: 'Select a department' })}>
                <option value="">Select department</option>
                {Object.entries(DEPT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {errors.department && <span className="field-error">{errors.department.message}</span>}
            </div>

            <div className="field">
              <label>Designation *</label>
              <input
                {...register('designation', { required: 'Designation is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                placeholder="e.g. Software Engineer"
              />
              {errors.designation && <span className="field-error">{errors.designation.message}</span>}
            </div>

            <div className="field">
              <label>Date of Joining *</label>
              <input
                type="date"
                {...register('joinDate', { required: 'Join date is required' })}
              />
              {errors.joinDate && <span className="field-error">{errors.joinDate.message}</span>}
            </div>

            <div className="field full-width">
              <label>Monthly Salary (₹) *</label>
              <input
                type="number"
                {...register('salary', {
                  required: 'Salary is required',
                  min: { value: 1, message: 'Must be positive' },
                })}
                placeholder="e.g. 75000"
              />
              {errors.salary && <span className="field-error">{errors.salary.message}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Employee</button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(6px); z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease; }
        .modal-box { width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 28px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .modal-title { font-size: 1.15rem; font-weight: 800; font-family: var(--font-sora, sans-serif); color: var(--text-primary); margin: 0; }
        .modal-close { background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); color: var(--text-secondary); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
        .modal-close:hover { background: rgba(255,255,255,0.12); }
        .emp-form { display: flex; flex-direction: column; gap: 20px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 500px) { .form-grid { grid-template-columns: 1fr; } }
        .full-width { grid-column: 1 / -1; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
        .field input, .field select {
          background: rgba(255,255,255,0.04); border: 1px solid var(--border-color);
          border-radius: 8px; padding: 9px 12px; color: var(--text-primary);
          font-size: 0.875rem; transition: border-color 0.2s; outline: none;
        }
        .field input:focus, .field select:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .field-error { font-size: 0.72rem; color: #F43F5E; margin-top: -3px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; border-top: 1px solid var(--border-color); }
        .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background: #6366F1; color: #fff; }
        .btn-primary:hover { background: #4F46E5; }
        .btn-ghost { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); }
        .btn-ghost:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }
      `}</style>
    </div>
  );
}

// ─ CSV export
function exportToCSV(employees: Employee[]) {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Status', 'Join Date', 'Salary'];
  const rows = employees.map((e) => [
    e.id, e.name, e.email, e.phone,
    DEPT_LABELS[e.department], e.designation,
    STATUS_META[e.status].label, e.joinDate,
    e.salary,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'employees.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─ Main page
export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenu(null);
      }
    }
    if (actionMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [actionMenu]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase());
      const matchDept = filterDept ? e.department === filterDept : true;
      const matchStatus = filterStatus ? e.status === filterStatus : true;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, search, filterDept, filterStatus]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.length} total · {employees.filter((e) => e.status === 'active').length} active</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => exportToCSV(filtered)}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by name, email or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}><X size={13} /></button>
          )}
        </div>
        <select
          className="filter-select"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {Object.entries(DEPT_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as EmployeeStatus | '')}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_META).map(([v, m]) => (
            <option key={v} value={v}>{m.label}</option>
          ))}
        </select>
        {(search || filterDept || filterStatus) && (
          <button className="btn btn-ghost-sm" onClick={() => { setSearch(''); setFilterDept(''); setFilterStatus(''); }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap card-premium table-scroll">
        <table className="emp-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Salary (&#8377;)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No employees match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className="emp-row">
                  <td>
                    <div className="emp-cell">
                      <div className="emp-avatar">
                        {emp.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-meta">{emp.id} &middot; {emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{DEPT_LABELS[emp.department]}</td>
                  <td>{emp.designation}</td>
                  <td><StatusPill status={emp.status} /></td>
                  <td className="font-mono">{emp.joinDate}</td>
                  <td className="font-mono">{emp.status === 'terminated' ? '—' : `₹${emp.salary.toLocaleString('en-IN')}`}</td>
                  <td style={{ position: 'relative' }}>
                    <button className="row-action" onClick={() => setActionMenu(actionMenu === emp.id ? null : emp.id)}>
                      <MoreHorizontal size={16} />
                    </button>
                    {actionMenu === emp.id && (
                      <div ref={menuRef} style={{
                        position: 'absolute', right: 0, top: '100%', zIndex: 50,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: 10, padding: '6px', minWidth: 160,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'fadeIn 0.15s ease',
                      }}>
                        {[
                          { icon: <Eye size={13}/>, label: 'View Profile', action: () => {} },
                          { icon: <Edit size={13}/>, label: 'Edit Details', action: () => {} },
                          { icon: <UserX size={13}/>, label: 'Deactivate', action: () => {
                            setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: 'terminated' as EmployeeStatus } : e));
                            setActionMenu(null);
                          }, danger: true },
                        ].map(item => (
                          <button key={item.label} onClick={item.action} style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                            background: 'transparent', color: (item as any).danger ? '#F43F5E' : 'var(--text-secondary)',
                            fontSize: '0.82rem', fontWeight: 500, fontFamily: 'inherit', textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = (item as any).danger ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.06)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            {item.icon}{item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="table-footer">
          Showing {filtered.length} of {employees.length} employees
        </div>
      </div>

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onAdd={(e) => setEmployees((prev) => [e, ...prev])}
        />
      )}

      <style>{`
        .page-container { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 1400px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .page-title { font-size: 1.6rem; font-weight: 800; font-family: var(--font-sora, sans-serif); color: var(--text-primary); margin: 0; }
        .page-subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 0; }
        .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background: #6366F1; color: #fff; }
        .btn-primary:hover { background: #4F46E5; }
        .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-secondary); }
        .btn-secondary:hover { background: rgba(255,255,255,0.09); color: var(--text-primary); }
        .btn-ghost-sm { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 7px; font-size: 0.78rem; font-weight: 600; cursor: pointer; background: rgba(244,63,94,0.07); color: #F43F5E; border: 1px solid rgba(244,63,94,0.2); transition: all 0.2s; }

        .filter-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .search-wrap { position: relative; flex: 1; min-width: 220px; }
        .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .search-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-radius: 8px; padding: 9px 36px; color: var(--text-primary); font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        .search-input:focus { border-color: #6366F1; }
        .search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; }
        .filter-select { background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-radius: 8px; padding: 9px 14px; color: var(--text-primary); font-size: 0.83rem; outline: none; cursor: pointer; }
        .filter-select:focus { border-color: #6366F1; }

        .table-wrap { border-radius: 12px; overflow: hidden; }
        .emp-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .emp-table th { background: rgba(255,255,255,0.02); color: var(--text-muted); font-weight: 600; text-align: left; padding: 12px 16px; font-size: 0.73rem; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border-color); white-space: nowrap; }
        .emp-table td { padding: 13px 16px; border-bottom: 1px solid rgba(255,255,255,0.03); color: var(--text-secondary); vertical-align: middle; }
        .emp-row { transition: background 0.15s; }
        .emp-row:hover { background: rgba(255,255,255,0.02); }
        .emp-row:last-child td { border-bottom: none; }
        .emp-cell { display: flex; align-items: center; gap: 11px; }
        .emp-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; color: #fff; flex-shrink: 0; }
        .emp-name { font-weight: 600; color: var(--text-primary); font-size: 0.875rem; }
        .emp-meta { font-size: 0.72rem; color: var(--text-muted); margin-top: 1px; }
        .font-mono { font-family: var(--font-mono, monospace); font-size: 0.83rem; }
        .row-action { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 5px; border-radius: 6px; transition: all 0.2s; }
        .row-action:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
        .table-footer { padding: 12px 16px; font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border-color); }
      `}</style>
    </div>
  );
}
