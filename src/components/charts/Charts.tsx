import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import type { AnalysisRecord, EmotionLabel } from '@/types';

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#f59e0b',
  negative: '#ef4444',
};

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  happy: '#fbbf24',
  excited: '#f472b6',
  appreciative: '#34d399',
  angry: '#ef4444',
  sad: '#60a5fa',
  frustrated: '#fb923c',
  confused: '#c084fc',
  disappointed: '#f87171',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15, 15, 25, 0.95)',
  border: '1px solid rgba(34, 197, 94, 0.25)',
  borderRadius: '16px',
  backdropFilter: 'blur(12px)',
};

export function SentimentPieChart({ record }: { record: AnalysisRecord }) {
  const data = [
    { name: 'Positive', value: Math.round(record.overall.positive * 100), color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: Math.round(record.overall.neutral * 100), color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: Math.round(record.overall.negative * 100), color: SENTIMENT_COLORS.negative },
  ];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          animationDuration={900}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} stroke="rgba(10,10,20,0.8)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} contentStyle={TOOLTIP_STYLE} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: '#cbd5e1' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SentimentBarChart({ record }: { record: AnalysisRecord }) {
  const data = [
    { name: 'Positive', count: record.items.filter((i) => i.result.label === 'positive').length, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', count: record.items.filter((i) => i.result.label === 'neutral').length, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', count: record.items.filter((i) => i.result.label === 'negative').length, color: SENTIMENT_COLORS.negative },
  ];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={900}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SentimentLineChart({ record }: { record: AnalysisRecord }) {
  if (!record.trendData || record.trendData.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={record.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#cbd5e1' }} />
        <Line type="monotone" dataKey="positive" stroke={SENTIMENT_COLORS.positive} strokeWidth={2.5} dot={false} animationDuration={900} />
        <Line type="monotone" dataKey="neutral" stroke={SENTIMENT_COLORS.neutral} strokeWidth={2.5} dot={false} animationDuration={900} />
        <Line type="monotone" dataKey="negative" stroke={SENTIMENT_COLORS.negative} strokeWidth={2.5} dot={false} animationDuration={900} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EmotionChart({ record }: { record: AnalysisRecord }) {
  const data = (Object.keys(record.emotionTotals) as EmotionLabel[])
    .map((e) => ({
      emotion: e.charAt(0).toUpperCase() + e.slice(1),
      count: Math.round(record.emotionTotals[e] * 10) / 10,
      color: EMOTION_COLORS[e],
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="emotion" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" radius={[0, 8, 8, 0]} animationDuration={900}>
          {data.map((d) => (
            <Cell key={d.emotion} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatCard({
  label,
  value,
  sub,
  color = 'cyan',
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: 'cyan' | 'rose' | 'violet' | 'amber' | 'blue' | 'emerald';
  delay?: number;
}) {
  const colors: Record<string, { text: string; border: string; bg: string; glow: string }> = {
    cyan: { text: 'text-cyan-400', border: 'border-cyan-400/30', bg: 'bg-cyan-400/15', glow: 'shadow-cyan-400/20' },
    rose: { text: 'text-rose-400', border: 'border-rose-400/30', bg: 'bg-rose-400/15', glow: 'shadow-rose-400/20' },
    violet: { text: 'text-violet-400', border: 'border-violet-400/30', bg: 'bg-violet-400/15', glow: 'shadow-violet-400/20' },
    amber: { text: 'text-amber-400', border: 'border-amber-400/30', bg: 'bg-amber-400/15', glow: 'shadow-amber-400/20' },
    blue: { text: 'text-blue-400', border: 'border-blue-400/30', bg: 'bg-blue-400/15', glow: 'shadow-blue-400/20' },
    emerald: { text: 'text-emerald-400', border: 'border-emerald-400/30', bg: 'bg-emerald-400/15', glow: 'shadow-emerald-400/20' },
  };
  const c = colors[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 140, bounce: 0.4 }}
      whileHover={{ y: -6, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-3xl border p-5 ${c.border}`}
      style={{ background: `var(--tint-${color === 'cyan' ? 'blue' : color})` }}
    >
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${c.bg} blur-2xl`} />
      <motion.div
        className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full opacity-50"
        style={{ background: `var(--tint-${color === 'cyan' ? 'blue' : color})` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 }}
      />
      <div className="relative">
        <p className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{label}</p>
        <motion.p
          className="mt-2 text-3xl font-extrabold"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.15, type: 'spring', stiffness: 200, bounce: 0.5 }}
        >
          {value}
        </motion.p>
        {sub && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </motion.div>
  );
}
