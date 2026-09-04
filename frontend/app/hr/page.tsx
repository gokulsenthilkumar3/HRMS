'use client';

import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, BriefcaseBusiness, CalendarDays, CheckCircle2, Download, Eye,
  Loader2, Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Search, ShieldCheck,
  UserCheck, Users, UserX, X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type UserRole = 'ADMIN' | 'MANAGER' | 'USER';
type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
type StatusFilter = 'all' | 'active' | 'inactive';
type SortMode = 'newest' | 'name' | 'department' | 'hireDate';

interface Employee {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string | null;
  designation: string | null;
  employeeId: string | null;
  phone: string | null;
  hireDate: string | null;
  isActive: boolean;
  avatarUrl: string | null;
  gender: string | null;
  employmentType: EmploymentType;
  performanceRating: number | null;
  city: string | null;
  state: string | null;
  managerId: string | null;
  createdAt: string;
}

interface EmployeePatch {
  fullName: string;
  email: string;
  phone: string | null;
  department: string;
  designation: string | null;
  hireDate: string | null;
  employmentType: EmploymentType;
  city: string | null;
  state: string | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  USER: 'Employee',
};

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: string | string[] }).message;
    if (Array.isArray(message)) return message.join('. ');
    if (message) return message;
  }
  return fallback;
}

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function inputDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function initials(name: string) {
  return name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '—';
}

function avatarBackground(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = id.charCodeAt(index) + ((hash << 5) - hash);
  return `linear-gradient(135deg, hsl(${Math.abs(hash) % 360} 72% 58%), hsl(${(Math.abs(hash) + 42) % 360} 72% 48%))`;
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportToCSV(employees: Employee[]) {
  const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Access role', 'Employment type', 'Status', 'Hire date', 'City'];
  const rows = employees.map((employee) => [
    employee.employeeId, employee.fullName, employee.email, employee.phone,
    employee.department, employee.designation, ROLE_LABELS[employee.role],
    EMPLOYMENT_LABELS[employee.employmentType], employee.isActive ? 'Active' : 'Inactive',
    employee.hireDate ? inputDate(employee.hireDate) : '', employee.city,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function StatusPill({ active }: { active: boolean }) {
  return <span className={`status-pill ${active ? 'active' : 'inactive'}`}><span aria-hidden="true" />{active ? 'Active' : 'Inactive'}</span>;
}

function Modal({ title, description, onClose, children, wide = false }: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="employee-modal-title">
        <header className="modal-header">
          <div><h2 id="employee-modal-title">{title}</h2>{description && <p>{description}</p>}</div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value?: string | null }) {
  return <div className="detail-item"><span className="detail-icon">{icon}</span><div><small>{label}</small><strong>{value || 'Not set'}</strong></div></div>;
}

function ViewEmployeeModal({ employee, onClose, onEdit, canEdit }: {
  employee: Employee;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
}) {
  return (
    <Modal title="Employee profile" description="Directory information stored for this employee." onClose={onClose} wide>
      <div className="profile-hero">
        <div className="profile-avatar" style={{ background: avatarBackground(employee.id) }}>{initials(employee.fullName)}</div>
        <div className="profile-title">
          <div className="profile-heading"><h3>{employee.fullName}</h3><StatusPill active={employee.isActive} /></div>
          <p>{employee.designation || 'No designation'}{employee.department ? ` · ${employee.department}` : ''}</p>
          <span>{employee.employeeId || 'Employee ID pending'}</span>
        </div>
      </div>
      <div className="detail-grid">
        <Detail icon={<Mail size={16} />} label="Work email" value={employee.email} />
        <Detail icon={<Phone size={16} />} label="Phone" value={employee.phone} />
        <Detail icon={<BriefcaseBusiness size={16} />} label="Employment" value={EMPLOYMENT_LABELS[employee.employmentType]} />
        <Detail icon={<ShieldCheck size={16} />} label="Access role" value={ROLE_LABELS[employee.role]} />
        <Detail icon={<CalendarDays size={16} />} label="Hire date" value={formatDate(employee.hireDate)} />
        <Detail icon={<MapPin size={16} />} label="Location" value={[employee.city, employee.state].filter(Boolean).join(', ')} />
      </div>
      <footer className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        {canEdit && <button type="button" className="btn btn-primary" onClick={onEdit}><Pencil size={15} /> Edit employee</button>}
      </footer>
    </Modal>
  );
}

function EditEmployeeModal({ employee, departments, designations, onClose, onSave, saving }: {
  employee: Employee;
  departments: string[];
  designations: string[];
  onClose: () => void;
  onSave: (patch: EmployeePatch) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone || '',
    department: employee.department || '',
    designation: employee.designation || '',
    hireDate: inputDate(employee.hireDate),
    employmentType: employee.employmentType,
    city: employee.city || '',
    state: employee.state || '',
  });
  const [error, setError] = useState('');
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.fullName.trim().length < 2) return setError('Enter the employee’s full name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid work email.');
    if (!form.department.trim()) return setError('Department is required.');
    try {
      await onSave({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLocaleLowerCase(),
        phone: form.phone.trim() || null,
        department: form.department.trim(),
        designation: form.designation.trim() || null,
        hireDate: form.hireDate || null,
        employmentType: form.employmentType,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
      });
    } catch (mutationError) {
      setError(errorMessage(mutationError, 'The employee could not be updated.'));
    }
  };

  return (
    <Modal title="Edit employee" description={`Update ${employee.fullName}’s directory details.`} onClose={onClose} wide>
      <form onSubmit={submit} className="edit-form">
        {error && <div className="inline-error" role="alert"><AlertCircle size={15} />{error}</div>}
        <div className="form-grid">
          <label>Full name<input required value={form.fullName} onChange={(event) => update('fullName', event.target.value)} autoComplete="name" /></label>
          <label>Work email<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" /></label>
          <label>Phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="Include country code" autoComplete="tel" /></label>
          <label>Department
            <input required list="edit-department-options" value={form.department} onChange={(event) => update('department', event.target.value)} />
            <datalist id="edit-department-options">{departments.map((item) => <option key={item} value={item} />)}</datalist>
          </label>
          <label>Designation
            <input list="edit-designation-options" value={form.designation} onChange={(event) => update('designation', event.target.value)} />
            <datalist id="edit-designation-options">{designations.map((item) => <option key={item} value={item} />)}</datalist>
          </label>
          <label>Employment type
            <select value={form.employmentType} onChange={(event) => update('employmentType', event.target.value)}>
              {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Hire date<input type="date" value={form.hireDate} onChange={(event) => update('hireDate', event.target.value)} /></label>
          <label>City<input value={form.city} onChange={(event) => update('city', event.target.value)} autoComplete="address-level2" /></label>
          <label>State / region<input value={form.state} onChange={(event) => update('state', event.target.value)} autoComplete="address-level1" /></label>
        </div>
        <footer className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><Loader2 size={15} className="spin" /> Saving…</> : <><CheckCircle2 size={15} /> Save changes</>}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function StatusConfirmModal({ employee, onClose, onConfirm, saving }: {
  employee: Employee;
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  const deactivate = employee.isActive;
  return (
    <Modal title={`${deactivate ? 'Deactivate' : 'Reactivate'} employee`} onClose={onClose}>
      <div className={`confirm-icon ${deactivate ? 'danger' : 'success'}`}>{deactivate ? <UserX size={24} /> : <UserCheck size={24} />}</div>
      <p className="confirm-copy">{deactivate
        ? `${employee.fullName} will immediately lose access. Their records will remain in the directory.`
        : `${employee.fullName} will be able to sign in and use the workspace again.`}</p>
      <footer className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className={`btn ${deactivate ? 'btn-danger' : 'btn-success'}`} onClick={onConfirm} disabled={saving}>
          {saving ? <><Loader2 size={15} className="spin" /> Updating…</> : deactivate ? 'Deactivate' : 'Reactivate'}
        </button>
      </footer>
    </Modal>
  );
}

export default function HRPage() {
  const { user, isAdmin, isManager } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [statusTarget, setStatusTarget] = useState<Employee | null>(null);
  const [notice, setNotice] = useState('');

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<Employee[]>('/users'),
    staleTime: 30_000,
  });
  const employees = employeesQuery.data ?? [];

  const departments = useMemo(() => Array.from(new Set(
    employees.map((employee) => employee.department?.trim()).filter((value): value is string => Boolean(value)),
  )).sort((a, b) => a.localeCompare(b)), [employees]);

  const designations = useMemo(() => Array.from(new Set(
    employees.map((employee) => employee.designation?.trim()).filter((value): value is string => Boolean(value)),
  )).sort((a, b) => a.localeCompare(b)), [employees]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matching = employees.filter((employee) => {
      const searchable = [employee.fullName, employee.email, employee.employeeId, employee.department, employee.designation, employee.phone]
        .filter(Boolean).join(' ').toLocaleLowerCase();
      return (!query || searchable.includes(query))
        && (department === 'all' || employee.department === department)
        && (status === 'all' || employee.isActive === (status === 'active'));
    });
    return [...matching].sort((left, right) => {
      if (sort === 'name') return left.fullName.localeCompare(right.fullName);
      if (sort === 'department') return (left.department || '').localeCompare(right.department || '') || left.fullName.localeCompare(right.fullName);
      if (sort === 'hireDate') return new Date(right.hireDate || 0).getTime() - new Date(left.hireDate || 0).getTime();
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [employees, search, department, status, sort]);

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EmployeePatch }) => api.patch<Partial<Employee>>(`/users/${id}`, patch),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData<Employee[]>(['employees'], (current = []) => current.map((employee) => employee.id === variables.id ? { ...employee, ...updated } : employee));
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['directory-options'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setEditing(null);
      setViewing(null);
      setNotice('Employee details saved.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (employee: Employee) => employee.isActive
      ? api.patch<Partial<Employee>>(`/users/${employee.id}/deactivate`, {})
      : api.patch<Partial<Employee>>(`/users/${employee.id}`, { isActive: true }),
    onSuccess: (updated, employee) => {
      queryClient.setQueryData<Employee[]>(['employees'], (current = []) => current.map((item) => item.id === employee.id ? { ...item, ...updated } : item));
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setNotice(`${employee.fullName} was ${employee.isActive ? 'deactivated' : 'reactivated'}.`);
      setStatusTarget(null);
    },
  });

  const activeCount = employees.filter((employee) => employee.isActive).length;
  const hasFilters = Boolean(search || department !== 'all' || status !== 'all');
  const clearFilters = () => { setSearch(''); setDepartment('all'); setStatus('all'); };

  return (
    <div className="employees-page">
      <header className="page-header">
        <div>
          <div className="eyebrow"><span /> Database-backed directory</div>
          <h1>Employees</h1>
          <p>{employeesQuery.isLoading ? 'Loading your people directory…' : `${employees.length} people · ${activeCount} active · ${departments.length} departments`}</p>
        </div>
        <div className="header-actions">
          <button className="icon-button refresh-button" onClick={() => employeesQuery.refetch()} disabled={employeesQuery.isFetching} aria-label="Refresh employees" title="Refresh employees"><RefreshCw size={16} className={employeesQuery.isFetching ? 'spin' : ''} /></button>
          <button className="btn btn-secondary" onClick={() => exportToCSV(filtered)} disabled={!filtered.length}><Download size={15} /> Export {hasFilters ? 'results' : 'CSV'}</button>
          {isManager && <Link className="btn btn-primary" href="/hr/add"><Plus size={15} /> Add employee</Link>}
        </div>
      </header>

      {notice && <div className="notice" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}
      {statusMutation.isError && <div className="inline-error" role="alert"><AlertCircle size={15} />{errorMessage(statusMutation.error, 'The account status could not be changed.')}</div>}

      <section className="directory-toolbar" aria-label="Employee filters">
        <label className="search-box"><Search size={16} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, ID or job title" aria-label="Search employees" />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}</label>
        <label className="select-field"><span>Department</span><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="select-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label className="select-field"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="newest">Recently added</option><option value="name">Name A–Z</option><option value="department">Department</option><option value="hireDate">Hire date</option></select></label>
        {hasFilters && <button className="clear-filters" onClick={clearFilters}><X size={14} /> Clear</button>}
      </section>

      {employeesQuery.isError ? (
        <section className="state-card error-state"><div className="state-icon"><AlertCircle size={24} /></div><h2>Couldn’t load employees</h2><p>{errorMessage(employeesQuery.error, 'Check the service connection and try again.')}</p><button className="btn btn-primary" onClick={() => employeesQuery.refetch()}><RefreshCw size={15} /> Try again</button></section>
      ) : (
        <section className="directory-card">
          <div className="results-bar"><span>{employeesQuery.isLoading ? 'Loading records' : `${filtered.length} ${filtered.length === 1 ? 'employee' : 'employees'}`}</span>{hasFilters && <small>Filtered from {employees.length}</small>}</div>
          <div className="table-scroll" tabIndex={0} aria-label="Employee directory table">
            <table className={`employee-table ${isManager ? 'with-actions' : 'viewer-only'}`}>
              <thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Employment</th><th>Status</th><th>Hire date</th>{isManager && <th><span className="sr-only">Actions</span></th>}</tr></thead>
              <tbody>
                {employeesQuery.isLoading ? Array.from({ length: 6 }, (_, index) => <tr key={index} className="skeleton-row"><td><div className="skeleton employee-skeleton" /></td><td><div className="skeleton short" /></td><td><div className="skeleton short" /></td><td><div className="skeleton short" /></td><td><div className="skeleton short" /></td><td><div className="skeleton short" /></td>{isManager && <td />}</tr>) : filtered.map((employee) => (
                  <tr key={employee.id}>
                    <td><button className="employee-cell" onClick={() => setViewing(employee)} aria-label={`View ${employee.fullName}'s profile`}><span className="employee-avatar" style={{ background: avatarBackground(employee.id) }}>{initials(employee.fullName)}</span><span><strong>{employee.fullName}</strong><small>{employee.employeeId || 'ID pending'} · {employee.email}</small></span></button></td>
                    <td><strong className="cell-primary">{employee.department || 'Unassigned'}</strong><small className="cell-secondary">{employee.designation || 'No designation'}</small></td>
                    <td><span className={`role-pill ${employee.role.toLocaleLowerCase()}`}>{ROLE_LABELS[employee.role]}</span></td>
                    <td>{EMPLOYMENT_LABELS[employee.employmentType]}</td>
                    <td><StatusPill active={employee.isActive} /></td>
                    <td>{formatDate(employee.hireDate)}</td>
                    {isManager && <td><div className="row-actions"><button onClick={() => setViewing(employee)} aria-label={`View ${employee.fullName}`} title="View profile"><Eye size={15} /></button><button onClick={() => setEditing(employee)} aria-label={`Edit ${employee.fullName}`} title="Edit employee"><Pencil size={15} /></button>{isAdmin && <button className={employee.isActive ? 'danger-action' : 'success-action'} onClick={() => setStatusTarget(employee)} disabled={employee.id === user?.id} aria-label={`${employee.isActive ? 'Deactivate' : 'Reactivate'} ${employee.fullName}`} title={employee.id === user?.id ? 'You cannot deactivate your own account' : employee.isActive ? 'Deactivate employee' : 'Reactivate employee'}>{employee.isActive ? <UserX size={15} /> : <UserCheck size={15} />}</button>}</div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!employeesQuery.isLoading && filtered.length === 0 && <div className="empty-state"><div className="state-icon"><Users size={24} /></div><h2>{employees.length ? 'No matching employees' : 'No employees yet'}</h2><p>{employees.length ? 'Try changing or clearing the filters.' : 'Employee records will appear here after they are added.'}</p>{hasFilters && <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>}</div>}
        </section>
      )}

      {viewing && <ViewEmployeeModal employee={viewing} onClose={() => setViewing(null)} canEdit={isManager} onEdit={() => { setEditing(viewing); setViewing(null); }} />}
      {editing && <EditEmployeeModal employee={editing} departments={departments} designations={designations} onClose={() => setEditing(null)} saving={updateMutation.isPending} onSave={async (patch) => { await updateMutation.mutateAsync({ id: editing.id, patch }); }} />}
      {statusTarget && <StatusConfirmModal employee={statusTarget} onClose={() => setStatusTarget(null)} saving={statusMutation.isPending} onConfirm={() => statusMutation.mutate(statusTarget)} />}
      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .employees-page{max-width:1440px;padding:28px 32px 44px;display:flex;flex-direction:column;gap:18px}.page-header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;flex-wrap:wrap}.page-header h1{margin:0;color:var(--text-primary);font:800 1.65rem var(--font-sora,sans-serif);letter-spacing:-.035em}.page-header p{margin:5px 0 0;color:var(--text-secondary);font-size:.82rem}.eyebrow{display:flex;align-items:center;gap:7px;margin-bottom:7px;color:#818cf8;font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.eyebrow span{width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 0 4px rgba(16,185,129,.12)}.header-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.btn{min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 15px;border:1px solid transparent;border-radius:9px;font:700 .79rem var(--font-sans,sans-serif);text-decoration:none;cursor:pointer;transition:transform .15s,background .15s,border-color .15s,opacity .15s}.btn:hover:not(:disabled){transform:translateY(-1px)}.btn:disabled{opacity:.5;cursor:not-allowed}.btn-primary{color:#fff;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 6px 18px rgba(99,102,241,.22)}.btn-secondary{color:var(--text-secondary);background:var(--card-bg);border-color:var(--border-color)}.btn-secondary:hover:not(:disabled){color:var(--text-primary);background:rgba(255,255,255,.07)}.btn-danger{color:#fff;background:#e11d48}.btn-success{color:#071b13;background:#34d399}.icon-button{width:36px;height:36px;border:1px solid var(--border-color);border-radius:9px;background:var(--card-bg);color:var(--text-secondary);display:grid;place-items:center;cursor:pointer}.icon-button:hover:not(:disabled){color:var(--text-primary);background:rgba(255,255,255,.07)}.icon-button:disabled{opacity:.5}.refresh-button{flex:0 0 auto}.notice,.inline-error{display:flex;align-items:center;gap:9px;padding:11px 13px;border-radius:10px;font-size:.79rem}.notice{color:#6ee7b7;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2)}.notice span{flex:1}.notice button{display:grid;place-items:center;border:0;background:transparent;color:inherit;cursor:pointer}.inline-error{color:#fda4af;background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.22)}
  .directory-toolbar{display:grid;grid-template-columns:minmax(250px,1fr) repeat(3,minmax(145px,auto)) auto;gap:9px;align-items:end;padding:12px;border:1px solid var(--border-color);border-radius:13px;background:var(--card-bg)}.search-box{height:40px;display:flex;align-items:center;gap:9px;padding:0 11px;border:1px solid var(--border-color);border-radius:9px;background:rgba(255,255,255,.025);color:var(--text-muted)}.search-box:focus-within,.select-field select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.11)}.search-box input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--text-primary);font-size:.8rem}.search-box button{display:grid;place-items:center;border:0;background:transparent;color:var(--text-muted);cursor:pointer}.select-field{display:flex;flex-direction:column;gap:4px}.select-field span{padding-left:2px;color:var(--text-muted);font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.select-field select{height:40px;max-width:190px;padding:0 30px 0 10px;border:1px solid var(--border-color);border-radius:9px;outline:0;background:rgba(255,255,255,.025);color:var(--text-primary);font-size:.76rem;cursor:pointer}.clear-filters{height:40px;display:flex;align-items:center;gap:5px;padding:0 10px;border:1px solid rgba(244,63,94,.18);border-radius:9px;background:rgba(244,63,94,.07);color:#fda4af;font-size:.73rem;font-weight:700;cursor:pointer}
  .directory-card{overflow:hidden;border:1px solid var(--border-color);border-radius:14px;background:var(--card-bg);box-shadow:0 16px 44px rgba(0,0,0,.08)}.results-bar{min-height:42px;display:flex;align-items:center;gap:8px;padding:0 16px;border-bottom:1px solid var(--border-color);color:var(--text-primary);font-size:.75rem;font-weight:700}.results-bar small{color:var(--text-muted);font-weight:500}.table-scroll{overflow:auto;outline:none}.table-scroll:focus-visible{box-shadow:inset 0 0 0 2px #6366f1}.employee-table{width:100%;min-width:930px;border-collapse:collapse;font-size:.78rem}.employee-table th{padding:11px 14px;text-align:left;border-bottom:1px solid var(--border-color);background:rgba(255,255,255,.018);color:var(--text-muted);font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap}.employee-table td{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.04);color:var(--text-secondary);vertical-align:middle}.employee-table tbody tr:last-child td{border-bottom:0}.employee-table tbody tr:hover{background:rgba(99,102,241,.035)}.employee-cell{width:100%;min-width:250px;display:flex;align-items:center;gap:10px;padding:0;border:0;background:transparent;text-align:left;cursor:pointer}.employee-avatar,.profile-avatar{display:grid;place-items:center;flex:0 0 auto;color:#fff;font-weight:800;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}.employee-avatar{width:36px;height:36px;border-radius:11px;font-size:.68rem}.employee-cell>span:last-child{min-width:0;display:flex;flex-direction:column;gap:3px}.employee-cell strong,.cell-primary{overflow:hidden;color:var(--text-primary);font-size:.8rem;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.employee-cell small,.cell-secondary{display:block;max-width:250px;overflow:hidden;color:var(--text-muted);font-size:.66rem;text-overflow:ellipsis;white-space:nowrap}.cell-secondary{margin-top:3px}.status-pill,.role-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;font-size:.65rem;font-weight:800;white-space:nowrap}.status-pill span{width:6px;height:6px;border-radius:50%}.status-pill.active{color:#6ee7b7;background:rgba(16,185,129,.09)}.status-pill.active span{background:#10b981}.status-pill.inactive{color:#fda4af;background:rgba(244,63,94,.09)}.status-pill.inactive span{background:#f43f5e}.role-pill{color:#c7d2fe;background:rgba(99,102,241,.1)}.role-pill.admin{color:#f0abfc;background:rgba(192,38,211,.1)}.role-pill.manager{color:#fcd34d;background:rgba(245,158,11,.1)}.row-actions{display:flex;justify-content:flex-end;gap:4px}.row-actions button{width:31px;height:31px;display:grid;place-items:center;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--text-muted);cursor:pointer}.row-actions button:hover:not(:disabled){border-color:var(--border-color);background:rgba(255,255,255,.06);color:var(--text-primary)}.row-actions .danger-action:hover:not(:disabled){color:#fda4af;background:rgba(244,63,94,.08);border-color:rgba(244,63,94,.18)}.row-actions .success-action:hover:not(:disabled){color:#6ee7b7;background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.18)}.row-actions button:disabled{opacity:.25;cursor:not-allowed}.state-card,.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.state-card{min-height:330px;padding:40px;border:1px solid var(--border-color);border-radius:14px;background:var(--card-bg)}.empty-state{min-height:300px;padding:44px 20px}.state-icon{width:48px;height:48px;display:grid;place-items:center;margin-bottom:12px;border-radius:14px;color:#a5b4fc;background:rgba(99,102,241,.1)}.error-state .state-icon{color:#fda4af;background:rgba(244,63,94,.1)}.state-card h2,.empty-state h2{margin:0;color:var(--text-primary);font:750 .95rem var(--font-sora,sans-serif)}.state-card p,.empty-state p{max-width:420px;margin:6px 0 16px;color:var(--text-secondary);font-size:.76rem}.skeleton{height:12px;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,.035) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.035) 75%);background-size:200% 100%;animation:shimmer 1.25s infinite}.employee-skeleton{width:210px;height:34px}.skeleton.short{width:92px}
  .modal-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:20px;background:rgba(3,5,11,.72);backdrop-filter:blur(7px);animation:fadeIn .15s ease}.modal-card{width:min(460px,100%);max-height:min(88vh,780px);overflow:auto;padding:22px;border:1px solid var(--border-color);border-radius:17px;background:var(--bg-secondary);box-shadow:0 30px 100px rgba(0,0,0,.48);animation:modalIn .18s ease}.modal-card.wide{width:min(720px,100%)}.modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px}.modal-header h2{margin:0;color:var(--text-primary);font:800 1.05rem var(--font-sora,sans-serif)}.modal-header p{margin:5px 0 0;color:var(--text-secondary);font-size:.74rem}.profile-hero{display:flex;align-items:center;gap:14px;padding:15px;border:1px solid var(--border-color);border-radius:13px;background:rgba(255,255,255,.025)}.profile-avatar{width:58px;height:58px;border-radius:16px;font-size:.9rem}.profile-title{min-width:0}.profile-heading{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.profile-heading h3{margin:0;color:var(--text-primary);font-size:1rem}.profile-title p{margin:4px 0;color:var(--text-secondary);font-size:.76rem}.profile-title>span{color:var(--text-muted);font:.68rem var(--font-mono,monospace)}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.detail-item{display:flex;align-items:center;gap:10px;min-width:0;padding:12px;border:1px solid var(--border-color);border-radius:11px;background:rgba(255,255,255,.018)}.detail-icon{width:31px;height:31px;display:grid;place-items:center;flex:0 0 auto;border-radius:8px;color:#a5b4fc;background:rgba(99,102,241,.1)}.detail-item div{min-width:0;display:flex;flex-direction:column;gap:3px}.detail-item small{color:var(--text-muted);font-size:.61rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em}.detail-item strong{overflow:hidden;color:var(--text-primary);font-size:.74rem;font-weight:650;text-overflow:ellipsis;white-space:nowrap}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color)}.edit-form{display:flex;flex-direction:column}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.form-grid label{display:flex;flex-direction:column;gap:6px;color:var(--text-secondary);font-size:.7rem;font-weight:700}.form-grid input,.form-grid select{width:100%;height:40px;padding:0 11px;border:1px solid var(--border-color);border-radius:9px;outline:0;background:rgba(255,255,255,.035);color:var(--text-primary);font:400 .78rem var(--font-sans,sans-serif)}.form-grid input:focus,.form-grid select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.11)}.confirm-icon{width:48px;height:48px;display:grid;place-items:center;margin:4px auto 12px;border-radius:14px}.confirm-icon.danger{color:#fda4af;background:rgba(244,63,94,.1)}.confirm-icon.success{color:#6ee7b7;background:rgba(16,185,129,.1)}.confirm-copy{margin:0;color:var(--text-secondary);font-size:.8rem;line-height:1.65;text-align:center}.spin{animation:spin .7s linear infinite}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@keyframes spin{to{transform:rotate(360deg)}}@keyframes shimmer{to{background-position:-200% 0}}@keyframes fadeIn{from{opacity:0}}@keyframes modalIn{from{opacity:0;transform:translateY(8px) scale(.985)}}
  @media(max-width:1100px){.directory-toolbar{grid-template-columns:repeat(3,minmax(120px,1fr)) auto}.search-box{grid-column:1/-1}.employee-table{min-width:560px}.employee-table.viewer-only{min-width:0}.employee-table.with-actions th:last-child,.employee-table.with-actions td:last-child{position:sticky;right:0;background:var(--bg-secondary);box-shadow:-8px 0 16px rgba(0,0,0,.12)}.employee-table th,.employee-table td{padding-left:10px;padding-right:10px}.employee-cell{min-width:210px}.employee-table th:nth-child(3),.employee-table td:nth-child(3),.employee-table th:nth-child(4),.employee-table td:nth-child(4),.employee-table th:nth-child(6),.employee-table td:nth-child(6){display:none}}
  @media(max-width:720px){.employees-page{padding:20px 16px 36px}.page-header{align-items:stretch}.header-actions{width:100%}.header-actions .btn{flex:1}.directory-toolbar{grid-template-columns:1fr 1fr}.search-box{grid-column:1/-1}.select-field:last-of-type{grid-column:1/-1}.select-field select{max-width:none;width:100%}.clear-filters{width:100%;justify-content:center}.detail-grid,.form-grid{grid-template-columns:1fr}.modal-card{padding:18px}.employee-table{min-width:560px}}
  @media(max-width:460px){.header-actions .refresh-button{flex:0 0 38px}.directory-toolbar{grid-template-columns:1fr}.search-box,.select-field:last-of-type{grid-column:1}.page-header h1{font-size:1.45rem}.profile-hero{align-items:flex-start}.profile-heading{align-items:flex-start;flex-direction:column;gap:5px}.modal-actions{flex-direction:column-reverse}.modal-actions .btn{width:100%}.employee-table{min-width:360px}.employee-table th:nth-child(2),.employee-table td:nth-child(2){display:none}.employee-cell{min-width:210px}}
`;
