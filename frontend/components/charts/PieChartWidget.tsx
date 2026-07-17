'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS: Record<string, string> = { MALE: '#6366F1', FEMALE: '#EC4899', OTHER: '#10B981', PREFER_NOT_TO_SAY: '#9BA3C0', UNKNOWN: '#4B5278' };

export default function PieChartWidget({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={900}>
          {data.map((d, i) => <Cell key={i} fill={COLORS[d.name] ?? '#6366F1'} />)}
        </Pie>
        <Tooltip contentStyle={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0F2FF', fontSize: 12 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#9BA3C0' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
