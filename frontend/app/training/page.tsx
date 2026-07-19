'use client';
import React, { useState, useMemo } from 'react';
import { GraduationCap, Play, CheckCircle, Clock, Star, BookOpen, Award, Users, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type CourseStatus = 'notStarted' | 'inProgress' | 'completed';
interface Course {
  id: string; title: string; instructor: string; category: string;
  duration: string; progress: number; status: CourseStatus;
  enrolled: number; rating: number; thumbnail: string;
}

const COURSES: Course[] = [
  { id: '1', title: 'Leadership Fundamentals', instructor: 'Dr. Kavitha R.', category: 'Leadership', duration: '6h 30m', progress: 75, status: 'inProgress', enrolled: 142, rating: 4.8, thumbnail: '#6366F1' },
  { id: '2', title: 'Data-Driven HR Analytics', instructor: 'Priya Sharma', category: 'Analytics', duration: '4h 15m', progress: 100, status: 'completed', enrolled: 89, rating: 4.6, thumbnail: '#10B981' },
  { id: '3', title: 'Effective Communication', instructor: 'Arjun Mehta', category: 'Soft Skills', duration: '3h 00m', progress: 0, status: 'notStarted', enrolled: 210, rating: 4.5, thumbnail: '#F59E0B' },
  { id: '4', title: 'Python for HR Professionals', instructor: 'Vikram Singh', category: 'Technical', duration: '8h 45m', progress: 30, status: 'inProgress', enrolled: 64, rating: 4.9, thumbnail: '#8B5CF6' },
  { id: '5', title: 'Compliance & Labour Law', instructor: 'Meena Iyer', category: 'Compliance', duration: '5h 00m', progress: 0, status: 'notStarted', enrolled: 177, rating: 4.3, thumbnail: '#F43F5E' },
  { id: '6', title: 'Diversity & Inclusion', instructor: 'Divya Krishnan', category: 'Culture', duration: '2h 30m', progress: 100, status: 'completed', enrolled: 305, rating: 4.7, thumbnail: '#06B6D4' },
];

const STATUS_META: Record<CourseStatus, { label: string; color: string; bg: string }> = {
  notStarted: { label: 'Not Started', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  inProgress:  { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  completed:   { label: 'Completed',   color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
};

const CATEGORIES = ['All', 'Leadership', 'Analytics', 'Soft Skills', 'Technical', 'Compliance', 'Culture'];

export default function TrainingPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [courses, setCourses] = useState(COURSES);

  const filtered = useMemo(() => courses.filter(c => 
    (filter === 'All' || c.category === filter) && 
    (c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase()))
  ), [courses, filter, search]);

  const completed = courses.filter(c => c.status === 'completed').length;
  const inProgress = courses.filter(c => c.status === 'inProgress').length;

  const handleAction = (id: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (c.status === 'notStarted') {
        return { ...c, status: 'inProgress' as CourseStatus, progress: 5 };
      }
      if (c.status === 'inProgress') {
        const newProgress = Math.min(100, c.progress + Math.floor(Math.random() * 15) + 5);
        return {
          ...c,
          progress: newProgress,
          status: newProgress >= 100 ? 'completed' as CourseStatus : 'inProgress' as CourseStatus,
        };
      }
      return c;
    }));
  };

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1><GraduationCap size={24} /> Training & Learning</h1>
          <p className="page-subtitle">Build skills, complete courses, earn certificates</p>
        </div>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', marginRight: 10 }} />
          <input 
            placeholder="Search courses..." 
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {[
          { label: 'Enrolled Courses', value: courses.length, icon: BookOpen, color: '#6366F1' },
          { label: 'In Progress', value: inProgress, icon: Clock, color: '#F59E0B' },
          { label: 'Completed', value: completed, icon: Award, color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: s.color + '18', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
            border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
            background: filter === cat ? '#6366F1' : 'transparent',
            borderColor: filter === cat ? '#6366F1' : 'var(--border-color)',
            color: filter === cat ? '#fff' : 'var(--text-secondary)',
          }}>{cat}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
        {filtered.map(course => (
          <div key={course.id} className="glass" style={{ overflow: 'hidden', transition: 'transform 0.3s ease' }}>
            <div style={{ height: 100, background: `linear-gradient(135deg, ${course.thumbnail}, ${course.thumbnail}88)`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem', color: '#fff' }}>{course.category}</div>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{course.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>by {course.instructor}</div>
              </div>
              {course.status !== 'notStarted' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: 4 }}>
                    <span>{course.status === 'completed' ? 'Finished' : 'Progress'}</span><span>{course.progress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ width: `${course.progress}%`, height: '100%', borderRadius: 3, background: course.status === 'completed' ? '#10B981' : '#6366F1', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', background: STATUS_META[course.status].bg, color: STATUS_META[course.status].color }}>{STATUS_META[course.status].label}</span>
                <button onClick={() => handleAction(course.id)} className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '0.78rem' }}>
                  {course.status === 'notStarted' ? 'Enroll' : course.status === 'completed' ? 'Review' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
