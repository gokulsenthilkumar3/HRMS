'use client';
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { UserPlus, CheckCircle2, AlertCircle, Loader2, ChevronLeft, Copy, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type DirectoryOptions = {
  departments: Array<{ name: string; designations: string[] }>;
  managers: Array<{ id: string; fullName: string; employeeId: string | null; department: string | null }>;
};

type FormState = {
  fullName: string; email: string; phone: string;
  department: string; designation: string;
  employmentType: string; hireDate: string;
  gender: string; city: string; state: string; country: string;
  managerId: string; role: 'USER' | 'MANAGER';
};

type Errors = Partial<Record<keyof FormState, string>>;

function localToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const PHONE_RE = /^\+?[0-9][0-9\s().-]{6,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormState): Errors {
  const e: Errors = {};
  if (!form.fullName.trim())                    e.fullName    = 'Full name is required';
  else if (form.fullName.trim().length < 2)     e.fullName    = 'Name must be at least 2 characters';

  if (!form.email.trim())                       e.email       = 'Email is required';
  else if (!EMAIL_RE.test(form.email))          e.email       = 'Enter a valid email address';

  if (form.phone && !PHONE_RE.test(form.phone)) e.phone       = 'Enter a valid phone number, including the country code';

  if (!form.department)                         e.department  = 'Select a department';
  if (!form.hireDate)                           e.hireDate    = 'Hire date is required';

  return e;
}

export default function AddEmployeePage() {
  const { isAdmin, isManager } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({
    fullName: '', email: '', phone: '',
    department: '', designation: '', employmentType: 'FULL_TIME',
    hireDate: localToday(),
    gender: 'PREFER_NOT_TO_SAY', city: '', state: '', country: '',
    managerId: '', role: 'USER',
  });
  const [errors, setErrors]   = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ employeeId: string; employeeCode: string; temporaryPassword: string } | null>(null);
  const [copied, setCopied]   = useState(false);
  const [apiErr, setApiErr]   = useState('');
  const { data: directoryOptions, isLoading: optionsLoading } = useQuery({
    queryKey: ['directory-options'],
    queryFn: () => api.get<DirectoryOptions>('/users/directory-options'),
    enabled: isManager,
    staleTime: 60_000,
  });

  const selectedDepartment = directoryOptions?.departments.find(
    ({ name }) => name.toLocaleLowerCase() === form.department.trim().toLocaleLowerCase(),
  );
  const designationOptions = selectedDepartment?.designations ?? Array.from(new Set(
    directoryOptions?.departments.flatMap(({ designations }) => designations) ?? [],
  )).sort((a, b) => a.localeCompare(b));

  if (!isAdmin && !isManager) {
    return <div className="no-access">You do not have permission to add employees.</div>;
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((err) => ({ ...err, [k]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true); setApiErr('');
    try {
      const res = await api.post<any>('/users', {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLocaleLowerCase(),
        phone: form.phone || undefined,
        department: form.department.trim(),
        designation: form.designation || undefined,
        employmentType: form.employmentType,
        hireDate: form.hireDate,
        gender: form.gender,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        managerId: form.managerId || undefined,
        role: isAdmin ? form.role : undefined,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['employees'] }),
        queryClient.invalidateQueries({ queryKey: ['directory-options'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      ]);
      setResult({ employeeId: res.employeeId, employeeCode: res.employeeCode, temporaryPassword: res.temporaryPassword });
    } catch (err: any) {
      setApiErr(err.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const text = `Employee ID: ${result.employeeId}\nCode: ${result.employeeCode}\nTemp Password: ${result.temporaryPassword}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (result) {
    return (
      <div className="success-screen">
        <div className="success-card">
          <div className="success-icon"><CheckCircle2 size={48} color="#10B981" /></div>
          <h2>Employee Added Successfully!</h2>
          <p>Share these credentials with the new employee.</p>
          <div className="cred-box">
            <div className="cred-row"><span className="cred-label">Employee ID</span><span className="cred-val">{result.employeeId}</span></div>
            <div className="cred-row"><span className="cred-label">Code</span><span className="cred-val">{result.employeeCode}</span></div>
            <div className="cred-row"><span className="cred-label">Temp Password</span><span className="cred-val pw">{result.temporaryPassword}</span></div>
          </div>
          <div className="success-actions">
            <button className="btn btn-copy" onClick={copyAll}>
              {copied ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Copy Credentials</>}
            </button>
            <button className="btn btn-primary" onClick={() => { setResult(null); setForm({ fullName:'',email:'',phone:'',department:'',designation:'',employmentType:'FULL_TIME',hireDate:localToday(),gender:'PREFER_NOT_TO_SAY',city:'',state:'',country:'',managerId:'',role:'USER' }); }}>
              Add Another Employee
            </button>
            <button className="btn btn-outline" onClick={() => router.push('/hr')}>Go to Employee List</button>
          </div>
          <p className="cred-warning">⚠️ This password is shown only once. Ensure you share it securely.</p>
        </div>
        <style>{successStyles}</style>
      </div>
    );
  }

  return (
    <div className="add-page">
      <div className="add-header">
        <button className="back-btn" onClick={() => router.back()}><ChevronLeft size={18}/> Back</button>
        <div>
          <h1 className="add-title"><UserPlus size={22}/> Add New Employee</h1>
          <p className="add-sub">Fill in the details below. Employee ID and login credentials will be auto-generated.</p>
        </div>
      </div>

      {apiErr && <div className="api-error"><AlertCircle size={14}/> {apiErr}</div>}

      <form className="add-form" onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="form-grid">
            <Field label="Full Name *" error={errors.fullName}>
              <input type="text" placeholder="e.g. Arjun Krishnamurthy" value={form.fullName} onChange={set('fullName')} className={errors.fullName ? 'input-error' : ''} />
            </Field>
            <Field label="Work Email *" error={errors.email}>
              <input type="email" placeholder="emp@company.com" value={form.email} onChange={set('email')} className={errors.email ? 'input-error' : ''} />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input type="tel" placeholder="Include country code" value={form.phone} onChange={set('phone')} className={errors.phone ? 'input-error' : ''} autoComplete="tel" />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={set('gender')}>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="City"><input type="text" value={form.city} onChange={set('city')} autoComplete="address-level2" /></Field>
            <Field label="State / Region"><input type="text" value={form.state} onChange={set('state')} autoComplete="address-level1" /></Field>
            <Field label="Country"><input type="text" value={form.country} onChange={set('country')} autoComplete="country-name" /></Field>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Employment Details</h3>
          <div className="form-grid">
            <Field label="Department *" error={errors.department}>
              <input list="department-options" value={form.department} onChange={set('department')} className={errors.department ? 'input-error' : ''} placeholder={optionsLoading ? 'Loading departments…' : 'Type or select a department'} />
              <datalist id="department-options">{directoryOptions?.departments.map(({ name }) => <option key={name} value={name} />)}</datalist>
            </Field>
            <Field label="Designation">
              <input list="designation-options" value={form.designation} onChange={set('designation')} placeholder="Type or select a job title" />
              <datalist id="designation-options">{designationOptions.map((item) => <option key={item} value={item} />)}</datalist>
            </Field>
            <Field label="Employment Type">
              <select value={form.employmentType} onChange={set('employmentType')}>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </Field>
            <Field label="Hire Date *" error={errors.hireDate}>
              <input type="date" value={form.hireDate} onChange={set('hireDate')} className={errors.hireDate ? 'input-error' : ''} />
            </Field>
            <Field label="Manager">
              <select value={form.managerId} onChange={set('managerId')}>
                <option value="">No manager assigned</option>
                {directoryOptions?.managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>{manager.fullName}{manager.department ? ` · ${manager.department}` : ''}</option>
                ))}
              </select>
            </Field>
            {isAdmin && <Field label="Access Role">
              <select value={form.role} onChange={set('role')}>
                <option value="USER">Employee</option>
                <option value="MANAGER">Manager</option>
              </select>
            </Field>}
          </div>
        </div>

        <div className="info-note">
          🔐 A secure, one-time temporary password will be generated after submission. It is not derived from the employee ID.
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? <><Loader2 size={16} className="spin"/> Creating Employee...</> : <><UserPlus size={16}/> Add Employee</>}
        </button>
      </form>

      <style>{formStyles}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

const formStyles = `
  .add-page { padding: 28px 32px; max-width: 860px; display: flex; flex-direction: column; gap: 24px; }
  .add-header { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
  .back-btn { display: flex; align-items: center; gap: 4px; background: none; border: 1px solid var(--border-color,rgba(255,255,255,0.08)); color: var(--text-secondary,#9BA3C0); border-radius: 8px; padding: 8px 12px; font-size: 0.82rem; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .back-btn:hover { background: rgba(255,255,255,0.05); }
  .add-title { display: flex; align-items: center; gap: 10px; font-size: 1.4rem; font-weight: 800; font-family: var(--font-sora,sans-serif); color: var(--text-primary,#F0F2FF); margin: 0; }
  .add-sub { font-size: 0.83rem; color: var(--text-secondary,#9BA3C0); margin: 4px 0 0; }
  .api-error { display: flex; align-items: center; gap: 8px; background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.2); color: #F43F5E; border-radius: 10px; padding: 12px 16px; font-size: 0.83rem; }
  .add-form { display: flex; flex-direction: column; gap: 24px; }
  .form-section { background: var(--card-bg,rgba(255,255,255,0.03)); border: 1px solid var(--border-color,rgba(255,255,255,0.07)); border-radius: 14px; padding: 22px 24px; display: flex; flex-direction: column; gap: 18px; }
  .section-title { font-size: 0.88rem; font-weight: 700; color: var(--text-secondary,#9BA3C0); text-transform: uppercase; letter-spacing: 0.06em; margin: 0; }
  .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .add-page { padding: 16px; } }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary,#9BA3C0); }
  .field input, .field select { background: rgba(255,255,255,0.04); border: 1px solid var(--border-color,rgba(255,255,255,0.07)); border-radius: 9px; padding: 10px 12px; color: var(--text-primary,#F0F2FF); font-size: 0.88rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; width: 100%; }
  .field input:focus, .field select:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .field input.input-error, .field select.input-error { border-color: #F43F5E; }
  .field-error { font-size: 0.72rem; color: #F43F5E; }
  .info-note { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 10px; padding: 12px 16px; font-size: 0.82rem; color: var(--text-secondary,#9BA3C0); }
  .submit-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg,#6366F1,#8B5CF6); color: #fff; border: none; border-radius: 12px; padding: 14px 24px; font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s, transform 0.15s; box-shadow: 0 8px 24px rgba(99,102,241,0.25); }
  .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .spin { animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const successStyles = `
  .success-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--bg-primary,#0A0B0F); }
  .success-card { background: var(--card-bg,rgba(255,255,255,0.03)); border: 1px solid var(--border-color,rgba(255,255,255,0.07)); border-radius: 20px; padding: 40px; max-width: 440px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; animation: slideUp 0.4s ease; }
  .success-icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(16,185,129,0.1); display: flex; align-items: center; justify-content: center; }
  .success-card h2 { font-family: var(--font-sora,sans-serif); font-size: 1.3rem; font-weight: 800; color: var(--text-primary,#F0F2FF); margin: 0; }
  .success-card p { font-size: 0.85rem; color: var(--text-secondary,#9BA3C0); margin: -8px 0 0; }
  .cred-box { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px 20px; width: 100%; display: flex; flex-direction: column; gap: 10px; }
  .cred-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .cred-label { font-size: 0.75rem; color: var(--text-muted,#4B5278); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .cred-val { font-size: 0.88rem; font-weight: 700; color: var(--text-primary,#F0F2FF); font-family: monospace; }
  .cred-val.pw { color: #10B981; }
  .success-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
  .btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 16px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; }
  .btn-primary { background: linear-gradient(135deg,#6366F1,#8B5CF6); color: #fff; }
  .btn-copy { background: rgba(16,185,129,0.1); color: #10B981; border: 1px solid rgba(16,185,129,0.2); }
  .btn-outline { background: transparent; border: 1px solid var(--border-color,rgba(255,255,255,0.08)); color: var(--text-secondary,#9BA3C0); }
  .cred-warning { font-size: 0.72rem; color: #F59E0B; }
  .no-access { padding: 48px; text-align: center; color: #F43F5E; font-size: 1rem; }
  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
`;
