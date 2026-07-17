'use client';
import React, { useState } from 'react';
import { Target, MessageCircle, Star, Plus, ChevronRight } from 'lucide-react';

type GoalStatus = 'onTrack' | 'atRisk' | 'completed' | 'notStarted';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: GoalStatus;
  dueDate: string;
  kpiMetric: string;
}

interface ReviewCycle {
  period: string;
  rating: number;
  reviewer: string;
  status: 'completed' | 'pending' | 'upcoming';
}

const GOALS: Goal[] = [
  { id: '1', title: 'Ship HRMS v2.0',         description: 'Complete full redesign & new features', progress: 72, status: 'onTrack',    dueDate: '2026-09-30', kpiMetric: 'Features shipped' },
  { id: '2', title: 'Reduce attrition to <5%', description: 'HR initiatives to improve retention',  progress: 40, status: 'atRisk',     dueDate: '2026-12-31', kpiMetric: 'Attrition rate' },
  { id: '3', title: 'Complete AWS certification', description: 'Pass AWS Solutions Architect exam', progress: 100, status: 'completed', dueDate: '2026-06-30', kpiMetric: 'Cert obtained' },
  { id: '4', title: 'Hire 5 engineers',         description: 'Fill open engineering positions',     progress: 0,   status: 'notStarted', dueDate: '2026-08-31', kpiMetric: 'Hires made' },
];

const REVIEWS: ReviewCycle[] = [
  { period: 'Q2 2026', rating: 4.2, reviewer: 'Kavitha R.', status: 'completed' },
  { period: 'Q1 2026', rating: 3.8, reviewer: 'Kavitha R.', status: 'completed' },
  { period: 'Q3 2026', rating: 0,   reviewer: 'Kavitha R.', status: 'upcoming' },
];

const GOAL_STATUS_META: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  onTrack:    { label: 'On Track',    color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  atRisk:     { label: 'At Risk',     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  completed:  { label: 'Completed',  color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  notStarted: { label: 'Not Started', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map((s) => (
        <Star
          key={s}
          size={14}
          fill={s <= Math.round(rating) ? '#F59E0B' : 'transparent'}
          color={s <= Math.round(rating) ? '#F59E0B' : 'var(--text-muted)'}
        />
      ))}
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function PerformancePage() {
  const [tab, setTab] = useState<'goals' | 'reviews' | 'feedback'>('goals');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance</h1>
          <p className="page-subtitle">Goals, reviews & feedback · FY 2026</p>
        </div>
        <button className="btn btn-primary"><Plus size={15} /> Add Goal</button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['goals', 'reviews', 'feedback'] as const).map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'goals' && <Target size={14} />}
            {t === 'reviews' && <Star size={14} />}
            {t === 'feedback' && <MessageCircle size={14} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Goals tab */}
      {tab === 'goals' && (
        <div className="goals-list">
          {GOALS.map((goal) => {
            const meta = GOAL_STATUS_META[goal.status];
            return (
              <div key={goal.id} className="goal-card card-premium">
                <div className="goal-header">
                  <div>
                    <h3 className="goal-title">{goal.title}</h3>
                    <p className="goal-desc">{goal.description}</p>
                  </div>
                  <span className="status-pill" style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                </div>
                <div className="goal-progress-wrap">
                  <div className="goal-progress-bar">
                    <div
                      className="goal-progress-fill"
                      style={{ width: `${goal.progress}%`, background: meta.color }}
                    />
                  </div>
                  <span className="goal-progress-pct" style={{ color: meta.color }}>{goal.progress}%</span>
                </div>
                <div className="goal-footer">
                  <span className="goal-meta">Due: {goal.dueDate}</span>
                  <span className="goal-meta">KPI: {goal.kpiMetric}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <div className="reviews-list">
          {REVIEWS.map((r) => (
            <div key={r.period} className="review-card card-premium">
              <div className="review-header">
                <div>
                  <div className="review-period">{r.period}</div>
                  <div className="review-by">Reviewed by {r.reviewer}</div>
                </div>
                <span className={`review-status status-${r.status}`}>
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </div>
              {r.status === 'completed' && <StarRating rating={r.rating} />}
              {r.status === 'upcoming' && <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0 }}>Scheduled for Q3 2026</p>}
              {r.status !== 'upcoming' && (
                <button className="btn btn-ghost-sm" style={{ marginTop: 8 }}>
                  View Feedback <ChevronRight size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback tab */}
      {tab === 'feedback' && (
        <div className="card-premium" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          <MessageCircle size={40} opacity={0.3} style={{ margin: '0 auto 12px' }} />
          <p>360° feedback collection opens at the end of Q3 2026.</p>
        </div>
      )}

      <style>{`
        .page-container { padding: 28px 32px; display: flex; flex-direction: column; gap: 22px; max-width: 1400px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .page-title { font-size: 1.6rem; font-weight: 800; font-family: var(--font-sora, sans-serif); color: var(--text-primary); margin: 0; }
        .page-subtitle { font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 0; }
        .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 8px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background: #6366F1; color: #fff; } .btn-primary:hover { background: #4F46E5; }
        .btn-ghost-sm { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 7px; font-size: 0.78rem; font-weight: 600; cursor: pointer; background: rgba(255,255,255,0.04); color: var(--text-secondary); border: 1px solid var(--border-color); transition: all 0.2s; }

        .tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 10px; width: fit-content; border: 1px solid var(--border-color); }
        .tab { display: flex; align-items: center; gap: 7px; padding: 8px 18px; border-radius: 7px; font-size: 0.83rem; font-weight: 600; cursor: pointer; background: none; border: none; color: var(--text-secondary); transition: all 0.2s; }
        .tab:hover { color: var(--text-primary); }
        .tab.active { background: rgba(99,102,241,0.15); color: #818CF8; }

        .goals-list { display: flex; flex-direction: column; gap: 14px; }
        .goal-card { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .goal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
        .goal-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
        .goal-desc { font-size: 0.8rem; color: var(--text-secondary); margin: 0; }
        .status-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.73rem; font-weight: 700; flex-shrink: 0; }
        .goal-progress-wrap { display: flex; align-items: center; gap: 10px; }
        .goal-progress-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
        .goal-progress-fill { height: 100%; border-radius: 3px; transition: width 1s ease; }
        .goal-progress-pct { font-size: 0.8rem; font-weight: 800; min-width: 38px; text-align: right; font-family: var(--font-sora, sans-serif); }
        .goal-footer { display: flex; gap: 20px; }
        .goal-meta { font-size: 0.75rem; color: var(--text-muted); }

        .reviews-list { display: flex; flex-direction: column; gap: 14px; }
        .review-card { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .review-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .review-period { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
        .review-by { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
        .review-status { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.73rem; font-weight: 700; }
        .status-completed { background: rgba(99,102,241,0.1); color: #818CF8; }
        .status-pending   { background: rgba(245,158,11,0.1); color: #F59E0B; }
        .status-upcoming  { background: rgba(100,116,139,0.1); color: #94A3B8; }
      `}</style>
    </div>
  );
}
