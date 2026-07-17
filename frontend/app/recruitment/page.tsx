'use client';
import React, { useState } from 'react';
import { Plus, Users, ChevronRight, Mail, Phone, Briefcase, X } from 'lucide-react';

type Stage = 'screening' | 'interview' | 'offer' | 'joined';

interface Applicant {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  appliedDate: string;
  stage: Stage;
  rating: number; // 1-5
  source: string;
}

const STAGE_META: Record<Stage, { label: string; color: string; bg: string }> = {
  screening:  { label: 'Screening',  color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
  interview:  { label: 'Interview',  color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  offer:      { label: 'Offer',      color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  joined:     { label: 'Hired',      color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
};

const INITIAL_APPLICANTS: Applicant[] = [
  { id: 'A1', name: 'Ananya Patel',    role: 'Frontend Engineer',   email: 'ananya@mail.com', phone: '+91 9876540001', appliedDate: '2026-07-01', stage: 'screening', rating: 4, source: 'LinkedIn' },
  { id: 'A2', name: 'Rajan Verma',     role: 'Backend Engineer',    email: 'rajan@mail.com',  phone: '+91 9876540002', appliedDate: '2026-07-02', stage: 'screening', rating: 3, source: 'Naukri' },
  { id: 'A3', name: 'Sneha Iyer',      role: 'HR Executive',        email: 'sneha@mail.com',  phone: '+91 9876540003', appliedDate: '2026-06-28', stage: 'interview', rating: 5, source: 'Referral' },
  { id: 'A4', name: 'Manoj Kumar',     role: 'DevOps Engineer',     email: 'manoj@mail.com',  phone: '+91 9876540004', appliedDate: '2026-06-25', stage: 'interview', rating: 4, source: 'LinkedIn' },
  { id: 'A5', name: 'Pooja Reddy',     role: 'Product Manager',     email: 'pooja@mail.com',  phone: '+91 9876540005', appliedDate: '2026-06-20', stage: 'offer',     rating: 5, source: 'Direct' },
  { id: 'A6', name: 'Kiran Shankar',   role: 'Data Analyst',        email: 'kiran@mail.com',  phone: '+91 9876540006', appliedDate: '2026-06-15', stage: 'joined',    rating: 4, source: 'Campus' },
];

const STAGES: Stage[] = ['screening', 'interview', 'offer', 'joined'];

function ApplicantCard({
  applicant,
  onAdvance,
}: {
  applicant: Applicant;
  onAdvance: (id: string) => void;
}) {
  const currentIdx = STAGES.indexOf(applicant.stage);
  const canAdvance = currentIdx < STAGES.length - 1;
  const initials = applicant.name.split(' ').map((n) => n[0]).slice(0, 2).join('');

  return (
    <div className="app-card card-premium">
      <div className="app-header">
        <div className="app-avatar">{initials}</div>
        <div className="app-info">
          <div className="app-name">{applicant.name}</div>
          <div className="app-role">{applicant.role}</div>
        </div>
        <div className="app-stars">
          {'★'.repeat(applicant.rating)}{'☆'.repeat(5 - applicant.rating)}
        </div>
      </div>
      <div className="app-meta">
        <span><Mail size={11} /> {applicant.email}</span>
        <span><Briefcase size={11} /> {applicant.source}</span>
      </div>
      <div className="app-footer">
        <span className="app-date">Applied {applicant.appliedDate}</span>
        {canAdvance && (
          <button className="btn-advance" onClick={() => onAdvance(applicant.id)}>
            Move to {STAGE_META[STAGES[currentIdx + 1]].label} <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function RecruitmentPage() {
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);

  const advance = (id: string) => {
    setApplicants((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const idx = STAGES.indexOf(a.stage);
        return { ...a, stage: STAGES[Math.min(idx + 1, STAGES.length - 1)] };
      })
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recruitment</h1>
          <p className="page-subtitle">{applicants.length} applicants · {applicants.filter((a) => a.stage === 'joined').length} hired this cycle</p>
        </div>
        <button className="btn btn-primary"><Plus size={15} /> Post Job</button>
      </div>

      {/* Kanban board */}
      <div className="kanban-board">
        {STAGES.map((stage) => {
          const cards = applicants.filter((a) => a.stage === stage);
          const meta = STAGE_META[stage];
          return (
            <div key={stage} className="kanban-col">
              <div
                className="kanban-header"
                style={{ borderTop: `3px solid ${meta.color}` }}
              >
                <span className="kanban-label" style={{ color: meta.color }}>{meta.label}</span>
                <span className="kanban-count" style={{ background: meta.bg, color: meta.color }}>
                  {cards.length}
                </span>
              </div>
              <div className="kanban-cards">
                {cards.map((a) => (
                  <ApplicantCard key={a.id} applicant={a} onAdvance={advance} />
                ))}
                {cards.length === 0 && (
                  <div className="kanban-empty">No applicants in this stage</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .page-container { padding: 28px 32px; display: flex; flex-direction: column; gap: 22px; max-width: 1400px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .page-title { font-size: 1.6rem; font-weight: 800; font-family: var(--font-sora, sans-serif); color: var(--text-primary); margin: 0; }
        .page-subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 0; }
        .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background: #6366F1; color: #fff; } .btn-primary:hover { background: #4F46E5; }

        .kanban-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; align-items: start; }
        @media (max-width: 1100px) { .kanban-board { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .kanban-board { grid-template-columns: 1fr; } }

        .kanban-col { display: flex; flex-direction: column; gap: 0; }
        .kanban-header { background: rgba(255,255,255,0.03); border-radius: 10px 10px 0 0; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color); border-bottom: none; }
        .kanban-label { font-size: 0.85rem; font-weight: 700; }
        .kanban-count { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; font-size: 0.72rem; font-weight: 800; }
        .kanban-cards { display: flex; flex-direction: column; gap: 0; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-top: none; border-radius: 0 0 10px 10px; padding: 8px; min-height: 100px; }
        .kanban-empty { color: var(--text-muted); font-size: 0.78rem; text-align: center; padding: 24px 0; }

        .app-card { padding: 14px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px; }
        .app-header { display: flex; align-items: flex-start; gap: 9px; }
        .app-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #8B5CF6); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 800; color: #fff; flex-shrink: 0; }
        .app-info { flex: 1; min-width: 0; }
        .app-name { font-size: 0.83rem; font-weight: 700; color: var(--text-primary); }
        .app-role { font-size: 0.72rem; color: var(--text-secondary); }
        .app-stars { font-size: 0.7rem; color: #F59E0B; flex-shrink: 0; }
        .app-meta { display: flex; flex-direction: column; gap: 3px; }
        .app-meta span { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; color: var(--text-muted); }
        .app-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
        .app-date { font-size: 0.7rem; color: var(--text-muted); }
        .btn-advance { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; background: rgba(99,102,241,0.1); color: #818CF8; border: 1px solid rgba(99,102,241,0.2); cursor: pointer; transition: background 0.2s; }
        .btn-advance:hover { background: rgba(99,102,241,0.2); }
      `}</style>
    </div>
  );
}
