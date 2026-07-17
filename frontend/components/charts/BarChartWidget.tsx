'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366F1','#8B5CF6','#EC4899','#10B981','#F59E0B','#06B6D4','#F43F5E','#84CC16'];

export default function BarChartWidget({ data, xKey, dataKey, color }: { data: any[]; xKey: string; dataKey: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey={xKey} tick={{ fill: '#9BA3C0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9BA3C0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0F2FF', fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey={dataKey} radius={[6,6,0,0]}>
          {data.map((_, i) => <Cell key={i} fill={color ?? COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
