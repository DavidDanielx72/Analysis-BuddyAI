import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, Inbox, Eye } from 'lucide-react';
import type { AnalysisRecord } from '@/types';
import { getAllAnalyses } from '@/services/storage';
import { exportPdf, exportCsv } from '@/services/exportService';

export default function ExportPage({
  onOpen,
}: {
  onOpen: (record: AnalysisRecord) => void;
}) {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await getAllAnalyses();
      setRecords(all);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Export Reports</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Download any analysis as a professionally formatted PDF or CSV file.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass p-5">
          <div className="mb-2 flex items-center gap-2 text-emerald-500">
            <FileText className="h-5 w-5" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>PDF Report</h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Includes summary, charts, statistics, insights, recommendations, and all entries — professionally formatted.
          </p>
        </div>
        <div className="glass p-5">
          <div className="mb-2 flex items-center gap-2 text-amber-500">
            <FileSpreadsheet className="h-5 w-5" />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>CSV Export</h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Raw data export with every item, keyword, topic, insight, and recommendation for further analysis.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="mb-4 h-12 w-12" style={{ color: 'var(--text-muted)' }} strokeWidth={1} />
          <p style={{ color: 'var(--text-secondary)' }}>No analyses to export yet.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Run an analysis first, then come back here to download it.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass flex items-center justify-between p-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{record.title}</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(record.createdAt).toLocaleDateString()} · {record.sourceLabel} · {record.overall.totalItems} entries
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => onOpen(record)} className="btn-ghost px-3 py-2 text-xs">
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button onClick={() => exportPdf(record)} className="btn-ghost px-3 py-2 text-xs">
                  <FileText className="h-4 w-4" />
                  PDF
                </button>
                <button onClick={() => exportCsv(record)} className="btn-primary px-3 py-2 text-xs">
                  <Download className="h-4 w-4" />
                  CSV
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
