'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { UserPlus, CheckCircle2, AlertCircle, Loader2, ChevronLeft, Copy, Check } from 'lucide-react';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Human Resources', 'Finance', 'Marketing', 'Operations', 'Legal', 'Sales', 'Customer Support'];
const DESIGNATIONS: Record<string, string[]> = {
  Engineering: ['Junior Engineer', 'Software Engineer', 'Senior Engineer', 'Lead Engineer', 'Staff Engineer', 'Principal Engineer', 'Engineering Manager'],
  Product:     ['Associate PM', 'Product Manager', 'Senior PM', 'Group PM', 'Director of Product'],
  Design:      ['UI Designer', 'UX Designer', 'UI/UX Designer', 'Senior Designer', 'Design Lead', 'Head of Design'],
  'Human Resources': ['HR Executive', 'HR Generalist', 'HR Manager', 'HRBP', 'Head of HR', 'Chief People Officer'],
  Finance:     ['Analyst', 'Senior Analyst', 'Finance Manager', 'Controller', 'CFO'],
  Marketing:   ['Marketing Executive', 'Digital Marketer', 'Marketing Manager', 'Growth Manager'],
  Operations:  ['Operations Executive', 'Operations Manager', 'VP Operations'],
  Legal:       ['Legal Executive', 'Legal Counsel', 'Head of Legal'],
  Sales:       ['Sales Executive', 'Senior Sales', 'Account Manager', 'Sales Manager', 'VP Sales'],
  'Customer Support': ['Support Executive', 'Support Lead', 'Customer Success Manager'],
};

type FormState = {
  fullName: string; email: string; phone: string;
  department: string; designation: string;
  employmentType: string; hireDate: string;
  gender: string; city: string; state: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const PHONE_RE = /^\+91\s?[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE  = /^[A-Za-z\s\.]+$/;

function validate(form: FormState): Errors {
  const e: Errors = {};
  if (!form.fullName.trim())                    e.fullName    = 'Full name is required';
  else if (!NAME_RE.test(form.fullName))        e.fullName    = 'Name should contain only letters and spaces';
  else if (form.fullName.trim().length < 3)     e.fullName    = 'Name must be at least 3 characters';

  if (!form.email.trim())                       e.email       = 'Email is required';
  else if (!EMAIL_RE.test(form.email))          e.email       = 'Enter a valid email address';

  if (form.phone && !PHONE_RE.test(form.phone)) e.phone       = 'Enter a valid Indian mobile (+91 9XXXXXXXXX)';

  if (!form.department)                         e.department  = 'Select a department';
  if (!form.hireDate)                           e.hireDate    = 'Hire date is required';

  return e;
}

export default function AddEmployeePage() {
  const { isAdmin, isManager } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    fullName: '', email: '', phone: '',
    department: '', designation: '', employmentType: 'FULL_TIME',
    hireDate: new Date().toISOString().split('T')[0],
    gender: 'PREFER_NOT_TO_SAY', city: '', state: '',
  });
  const [errors, setErrors]   = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ employeeId: string; employeeCode: string; temporaryPassword: string } | null>(null);
  const [copied, setCopied]   = useState(false);
  const [apiErr, setApiErr]   = useState('');

  if (!isAdmin && !isManager) {
    return <div className="no-access">You do not have permission to add employees.</div>;
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((err) => ({ ...err, [k]: undefined }));
    if (k === 'department') setForm((f) => ({ ...f, department: e.target.value, designation: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true); setApiErr('');
    try {
      const res = await api.post<any>('/users', {
        ...form,
        phone: form.phone || undefined,
        designation: form.designation || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
      });
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
            <button className="btn btn-primary" onClick={() => { setResult(null); setForm({ fullName:'',email:'',phone:'',department:'',designation:'',employmentType:'FULL_TIME',hireDate:new Date().toISOString().split('T')[0],gender:'PREFER_NOT_TO_SAY',city:'',state:'' }); }}>
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
            <Field label="Mobile (+91)" error={errors.phone}>
              <input type="tel" placeholder="+91 9XXXXXXXXX" value={form.phone} onChange={set('phone')} className={errors.phone ? 'input-error' : ''} />
            </Field>
            <Field label="Gender">
              <select value={form.gender} onChange={set('gender')}>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="City"><input type="text" placeholder="Chennai" value={form.city} onChange={set('city')} /></Field>
            <Field label="State"><input type="text" placeholder="Tamil Nadu" value={form.state} onChange={set('state')} /></Field>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Employment Details</h3>
          <div className="form-grid">
            <Field label="Department *" error={errors.department}>
              <select value={form.department} onChange={set('department')} className={errors.department ? 'input-error' : ''}>
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Designation">
              <select value={form.designation} onChange={set('designation')} disabled={!form.department}>
                <option value="">{form.department ? 'Select designation' : 'Select dept first'}</option>
                {(DESIGNATIONS[form.department] || []).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
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
          </div>
        </div>

        <div className="info-note">
          🔐 A temporary password will be auto-generated as <strong>Emp@{'{XXXX}'}</strong> where XXXX is the employee code suffix. You can share it after submission.
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
