import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  Upload,
  Globe,
  Youtube,
  FileText,
  FileType,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide-react';
import type { AnalysisRecord, AnalysisSource } from '@/types';
import { runAnalysis } from '@/services/insights';
import {
  parsePdf,
  parseDocx,
  parseTxt,
  parseCsv,
} from '@/services/fileParsers';
import { fetchWebsiteContent, fetchYouTubeComments } from '@/services/fetchers';
import { saveAnalysis } from '@/services/storage';

type Tab = 'text' | 'file' | 'website' | 'youtube';

const TAB_COLORS: Record<string, string> = {
  emerald: 'text-emerald-500',
  blue: 'text-blue-500',
  amber: 'text-amber-500',
  rose: 'text-rose-500',
};

const TABS: { id: Tab; label: string; icon: typeof Type; color: string }[] = [
  { id: 'text', label: 'Paste Text', icon: Type, color: 'emerald' },
  { id: 'file', label: 'Upload File', icon: Upload, color: 'blue' },
  { id: 'website', label: 'Website URL', icon: Globe, color: 'amber' },
  { id: 'youtube', label: 'YouTube URL', icon: Youtube, color: 'rose' },
];

const FILE_ACCEPT = '.pdf,.docx,.txt,.csv';

export default function AnalysisWorkspace({
  onComplete,
}: {
  onComplete: (record: AnalysisRecord) => void;
}) {
  const [tab, setTab] = useState<Tab>('text');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setText('');
    setUrl('');
    setError(null);
    setProgress(0);
    setFileName(null);
    setPendingFile(null);
  };

  const handleFile = (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt', 'csv'].includes(ext ?? '')) {
      setError('Unsupported file format. Please upload a PDF, DOCX, TXT, or CSV file.');
      return;
    }
    setPendingFile(file);
    setFileName(file.name);
  };

  const runWithProgress = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    setProgress(10);
    setProgressLabel('Extracting content...');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressLabel('');
    }
  };

  const finalize = async (
    rawItems: { text: string; source?: string; likes?: number; timestamp?: string }[],
    source: AnalysisSource,
    sourceLabel: string,
    defaultTitle: string,
  ) => {
    setProgress(60);
    setProgressLabel('Analyzing sentiment...');
    await new Promise((r) => setTimeout(r, 100));
    const record = runAnalysis(rawItems, source, sourceLabel, title.trim() || defaultTitle);
    setProgress(90);
    setProgressLabel('Generating insights...');
    await new Promise((r) => setTimeout(r, 100));
    await saveAnalysis(record);
    setProgress(100);
    onComplete(record);
  };

  const handleAnalyze = async () => {
    if (loading) return;
    setError(null);

    if (tab === 'text') {
      if (!text.trim()) {
        setError('Please paste some text to analyze.');
        return;
      }
      await runWithProgress(async () => {
        const chunks = text
          .split(/\n{2,}|\n(?=[A-Z])/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2);
        const items = (chunks.length ? chunks : [text]).map((c, i) => ({
          text: c,
          source: `passage ${i + 1}`,
        }));
        await finalize(items, 'text', 'Pasted text', 'Text Analysis');
      });
    } else if (tab === 'file') {
      if (!pendingFile) {
        setError('Please upload a file to analyze.');
        return;
      }
      await runWithProgress(async () => {
        const ext = pendingFile.name.split('.').pop()?.toLowerCase();
        let items: { text: string; source?: string }[] = [];
        let sourceLabel = '';
        let defaultTitle = '';
        if (ext === 'pdf') {
          const pages = await parsePdf(pendingFile);
          items = pages.map((p, i) => ({ text: p, source: `page ${i + 1}` }));
          sourceLabel = 'PDF document';
          defaultTitle = pendingFile.name.replace(/\.pdf$/i, '');
        } else if (ext === 'docx') {
          const paras = await parseDocx(pendingFile);
          items = paras.map((p, i) => ({ text: p, source: `paragraph ${i + 1}` }));
          sourceLabel = 'DOCX document';
          defaultTitle = pendingFile.name.replace(/\.docx$/i, '');
        } else if (ext === 'txt') {
          const lines = await parseTxt(pendingFile);
          items = lines.map((p, i) => ({ text: p, source: `line ${i + 1}` }));
          sourceLabel = 'TXT file';
          defaultTitle = pendingFile.name.replace(/\.txt$/i, '');
        } else if (ext === 'csv') {
          const result = await parseCsv(pendingFile);
          items = result.items.map((t, i) => ({ text: t, source: `row ${i + 1}` }));
          sourceLabel = `CSV (${result.textColumn})`;
          defaultTitle = pendingFile.name.replace(/\.csv$/i, '');
        } else {
          throw new Error('Unsupported file format.');
        }
        await finalize(items, (ext as AnalysisSource) ?? 'text', sourceLabel, defaultTitle);
      });
    } else if (tab === 'website') {
      if (!url.trim()) {
        setError('Please enter a website URL.');
        return;
      }
      await runWithProgress(async () => {
        const { items, title: pageTitle } = await fetchWebsiteContent(url.trim());
        await finalize(items, 'website', 'Website', pageTitle);
      });
    } else if (tab === 'youtube') {
      if (!url.trim()) {
        setError('Please enter a YouTube video URL.');
        return;
      }
      await runWithProgress(async () => {
        const { items, title: vidTitle } = await fetchYouTubeComments(url.trim());
        await finalize(items, 'youtube', 'YouTube', vidTitle);
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 md:p-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>New Analysis</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Choose a source, provide your content, and let AI uncover the sentiment.
          </p>
        </div>

        {/* Title input */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Analysis title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Product reviews — July 2026"
            className="input-field"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setError(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                tab === t.id
                  ? `border ${TAB_COLORS[t.color]}`
                  : 'border hover:bg-black/5'
              }`}
              style={
                tab === t.id
                  ? { borderColor: `var(--tint-${t.color}-border)`, background: `var(--tint-${t.color})` }
                  : { borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }
              }
            >
              <t.icon className="h-4 w-4" strokeWidth={1.5} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'text' && (
              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  placeholder="Paste reviews, customer feedback, emails, survey responses, social media comments, or any text here..."
                  className="input-field resize-y font-mono text-sm leading-relaxed"
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {text.trim() ? `${text.trim().split(/\s+/).length} words` : 'Tip: separate distinct entries with a blank line for per-entry analysis.'}
                </p>
              </div>
            )}

            {tab === 'file' && (
              <div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                    dragOver
                      ? 'border-emerald-400/50 bg-emerald-400/5'
                      : 'border hover:border-emerald-400/30'
                  }`}
                  style={!dragOver ? { borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' } : undefined}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={FILE_ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  {fileName ? (
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-emerald-400" strokeWidth={1.5} />
                      <div className="text-left">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{fileName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Click to replace</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileName(null);
                          setPendingFile(null);
                        }}
                        className="ml-2 rounded-lg p-1 hover:bg-black/5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-3 h-10 w-10 text-emerald-400/60" strokeWidth={1.5} />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Drag & drop or click to upload
                      </p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>PDF, DOCX, TXT, CSV</p>
                    </>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="chip"><FileText className="h-3 w-3" /> PDF</span>
                  <span className="chip"><FileType className="h-3 w-3" /> DOCX</span>
                  <span className="chip"><FileText className="h-3 w-3" /> TXT</span>
                  <span className="chip"><FileSpreadsheet className="h-3 w-3" /> CSV</span>
                </div>
              </div>
            )}

            {tab === 'website' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Website URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="input-field pl-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Article and review text will be extracted automatically. Navigation menus and page chrome are ignored.
                </p>
              </div>
            )}

            {tab === 'youtube' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  YouTube Video URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Youtube className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="input-field pl-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Comments and available text are retrieved and analyzed for audience sentiment.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5"
            >
              <div className="flex items-center gap-2 text-sm text-emerald-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progressLabel || 'Working...'}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--skeleton-bg)' }}>
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-400"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="btn-primary px-6 py-3 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Analyze
              </>
            )}
          </button>
          <button onClick={reset} className="btn-ghost" disabled={loading}>
            Clear
          </button>
        </div>
      </motion.div>
    </div>
  );
}
