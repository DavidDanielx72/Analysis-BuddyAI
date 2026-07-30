import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  History,
  Trash2,
  Copy,
  Edit3,
  Eye,
  Download,
  FileText,
  Inbox,
  X,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import type { AnalysisRecord, SentimentLabel } from '@/types';
import { getAllAnalyses, deleteAnalysis, clearAllAnalyses, updateAnalysis } from '@/services/storage';
import { exportPdf, exportCsv } from '@/services/exportService';

type SortKey = 'date' | 'title' | 'sentiment' | 'source';

export default function HistoryPage({
  onOpen,
  search,
}: {
  onOpen: (record: AnalysisRecord) => void;
  search: string;
}) {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [filterSentiment, setFilterSentiment] = useState<SentimentLabel | 'all'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const load = async () => {
    setLoading(true);
    const all = await getAllAnalyses();
    setRecords(all);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = records;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.sourceLabel.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.keywords.some((k) => k.word.includes(q)),
      );
    }
    if (filterSentiment !== 'all') {
      result = result.filter((r) => {
        const dominant =
          r.overall.positive > r.overall.negative
            ? 'positive'
            : r.overall.negative > r.overall.positive
              ? 'negative'
              : 'neutral';
        return dominant === filterSentiment;
      });
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.createdAt - b.createdAt;
      else if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'source') cmp = a.sourceLabel.localeCompare(b.sourceLabel);
      else if (sortKey === 'sentiment') cmp = a.overall.averageScore - b.overall.averageScore;
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [records, search, sortKey, sortAsc, filterSentiment]);

  const handleDelete = async (id: string) => {
    await deleteAnalysis(id);
    load();
  };

  const handleDuplicate = async (record: AnalysisRecord) => {
    const dup: AnalysisRecord = {
      ...record,
      id: `${Date.now()}`,
      title: `${record.title} (copy)`,
      createdAt: Date.now(),
    };
    await updateAnalysis(dup);
    load();
  };

  const handleRename = async (id: string) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;
    await updateAnalysis({ ...rec, title: editTitle.trim() || rec.title });
    setEditingId(null);
    load();
  };

  const handleClearAll = async () => {
    await clearAllAnalyses();
    setConfirmClear(false);
    load();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>History</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All your past analyses, stored locally in your browser.</p>
        </div>
        {records.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="btn-ghost text-sm text-red-300 hover:border-red-400/30"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {(['all', 'positive', 'neutral', 'negative'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSentiment(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                filterSentiment === s
                  ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-500'
                  : 'border hover:bg-black/5'
              }`}
              style={filterSentiment !== s ? { borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' } : undefined}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          {(['date', 'title', 'source', 'sentiment'] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => toggleSort(k)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                sortKey === k
                  ? 'border border-amber-400/30 bg-amber-400/10 text-amber-500'
                  : 'border hover:bg-black/5'
              }`}
              style={sortKey !== k ? { borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' } : undefined}
            >
              {k}
              {sortKey === k && <ArrowUpDown className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="mb-4 h-12 w-12" style={{ color: 'var(--text-muted)' }} strokeWidth={1} />
          <p style={{ color: 'var(--text-secondary)' }}>No analyses found.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {records.length === 0 ? 'Run your first analysis to see it here.' : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="glass group p-5 transition-shadow hover:shadow-glow"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {editingId === record.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="input-field py-1.5 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(record.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button onClick={() => handleRename(record.id)} className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-400/10">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="rounded-lg p-2 hover:bg-black/5" style={{ color: 'var(--text-muted)' }}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{record.title}</h3>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{new Date(record.createdAt).toLocaleString()}</span>
                      <span>·</span>
                      <span>{record.sourceLabel}</span>
                      <span>·</span>
                      <span>{record.overall.totalItems} entries</span>
                    </div>
                    <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{record.summary}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <SentimentBadge label="positive" pct={record.overall.positive} />
                      <SentimentBadge label="neutral" pct={record.overall.neutral} />
                      <SentimentBadge label="negative" pct={record.overall.negative} />
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <IconButton onClick={() => onOpen(record)} title="Open">
                      <Eye className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setEditingId(record.id);
                        setEditTitle(record.title);
                      }}
                      title="Rename"
                    >
                      <Edit3 className="h-4 w-4" />
                    </IconButton>
                    <IconButton onClick={() => handleDuplicate(record)} title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </IconButton>
                    <IconButton onClick={() => exportPdf(record)} title="Export PDF">
                      <FileText className="h-4 w-4" />
                    </IconButton>
                    <IconButton onClick={() => exportCsv(record)} title="Export CSV">
                      <Download className="h-4 w-4" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(record.id)} title="Delete" danger>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Clear confirm modal */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setConfirmClear(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Clear all history?</h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                This will permanently delete all {records.length} saved analyses. This cannot be undone.
              </p>
              <div className="mt-5 flex gap-2">
                <button onClick={handleClearAll} className="btn-primary" style={{ background: 'linear-gradient(to right, #ef4444, #dc2626)' }}>
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </button>
                <button onClick={() => setConfirmClear(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SentimentBadge({ label, pct }: { label: SentimentLabel; pct: number }) {
  const colors: Record<SentimentLabel, string> = {
    positive: 'bg-emerald-400/10 text-emerald-500',
    neutral: 'bg-slate-400/10 text-slate-500',
    negative: 'bg-rose-400/10 text-rose-500',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${colors[label]}`}>
      {label} {Math.round(pct * 100)}%
    </span>
  );
}

function IconButton({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded-lg border p-2 transition-all hover:bg-black/5 ${
        danger ? 'hover:border-rose-400/30 hover:text-rose-400' : 'hover:text-emerald-400'
      }`
      }
      style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}
    >
      {children}
    </button>
  );
}
