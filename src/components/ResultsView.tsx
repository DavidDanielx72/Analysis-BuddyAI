import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  FileText,
  Sparkles,
  Lightbulb,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Quote,
  TrendingUp,
  MessageSquareReply,
  ThumbsUp,
  X,
  Clapperboard,
  Wrench,
  Sparkle,
  PartyPopper,
  AlertTriangle,
} from 'lucide-react';
import type { AnalysisItem, AnalysisRecord, ResponseTone } from '@/types';
import {
  SentimentPieChart,
  SentimentBarChart,
  SentimentLineChart,
  StatCard,
} from '@/components/charts/Charts';
import { toneLabel } from '@/services/assistant';
import { exportPdf, exportCsv } from '@/services/exportService';

const TONES: ResponseTone[] = [
  'professional',
  'friendly',
  'formal',
  'apology',
  'support',
  'thankyou',
  'marketing',
];

export default function ResultsView({
  record,
  onBack,
  onExport,
}: {
  record: AnalysisRecord;
  onBack: () => void;
  onExport: () => void;
}) {
  const [showItems, setShowItems] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [selectedComment, setSelectedComment] = useState<AnalysisItem | null>(null);

  const creatorRecs = generateCreatorRecommendations(record);
  const creatorType = detectCreatorType(record);
  const creatorNextLabel =
    creatorType === 'youtube' || creatorType === 'tiktok'
      ? 'What to make next'
      : creatorType === 'airbnb'
        ? 'What to do next'
        : creatorType === 'restaurant'
          ? 'What to change next'
          : creatorType === 'ecommerce'
            ? 'What to prioritize next'
            : 'What to do next';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-xl border p-2 transition-all hover:scale-110 hover:bg-emerald-400/10 active:scale-95"
            style={{
              borderColor: 'var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-secondary)',
            }}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {record.title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {record.sourceLabel} · {new Date(record.createdAt).toLocaleString()} ·{' '}
              {record.overall.totalItems} entries
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportPdf(record)} className="btn-ghost text-sm">
            <FileText className="h-4 w-4" />
            PDF
          </button>
          <button onClick={() => exportCsv(record)} className="btn-ghost text-sm">
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button onClick={onExport} className="btn-primary text-sm">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </motion.div>

      {/* Summary — vibrant animated gradient banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        whileHover={{ scale: 1.005 }}
        className="animate-gradient-shift relative overflow-hidden rounded-3xl border border-emerald-400/25 p-6"
        style={{ background: 'linear-gradient(135deg, var(--tint-emerald), var(--tint-blue), var(--tint-violet))' }}
      >
        <motion.div
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/20">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Summary</h2>
          </div>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {record.summary}
          </p>
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Positive" value={`${Math.round(record.overall.positive * 100)}%`} color="emerald" delay={0.1} />
        <StatCard label="Neutral" value={`${Math.round(record.overall.neutral * 100)}%`} color="amber" delay={0.15} />
        <StatCard label="Negative" value={`${Math.round(record.overall.negative * 100)}%`} color="rose" delay={0.2} />
        <StatCard label="Dominant Emotion" value={record.overall.dominantEmotion} color="blue" delay={0.25} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Sentiment Distribution" icon={<Sparkles className="h-4 w-4" />} accent="emerald">
          <SentimentPieChart record={record} />
        </ChartCard>
        <ChartCard title="Sentiment Counts" icon={<TrendingUp className="h-4 w-4" />} accent="amber">
          <SentimentBarChart record={record} />
        </ChartCard>
        {record.trendData && record.trendData.length >= 2 && (
          <ChartCard title="Sentiment Trends" icon={<TrendingUp className="h-4 w-4" />} accent="blue">
            <SentimentLineChart record={record} />
          </ChartCard>
        )}
      </div>

      {/* Top entries */}
      {(record.topPositive || record.topNegative || record.mostLiked) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {record.topPositive && (
            <HighlightCard label="Most Positive" color="emerald" item={record.topPositive} />
          )}
          {record.topNegative && (
            <HighlightCard label="Most Negative" color="rose" item={record.topNegative} />
          )}
          {record.mostLiked && (
            <HighlightCard label="Most Liked" color="amber" item={record.mostLiked} />
          )}
        </div>
      )}

      {/* Insights — vibrant emerald gradient */}
      <VibrantSectionCard
        title="AI Insights"
        icon={<Sparkles className="h-5 w-5" />}
        accent="emerald"
        delay={0.1}
      >
        <ul className="space-y-3">
          {record.insights.map((ins, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.04, type: 'spring', stiffness: 120 }}
              whileHover={{ x: 4 }}
              className="flex items-start gap-3 text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
              {ins}
            </motion.li>
          ))}
        </ul>
      </VibrantSectionCard>

      {/* Creator Recommendations — bold violet + amber split */}
      {creatorRecs.videos.length > 0 || creatorRecs.improvements.length > 0 ? (
        <VibrantSectionCard
          title="Creator Recommendations"
          icon={<Clapperboard className="h-5 w-5" />}
          accent="violet"
          delay={0.12}
        >
          <div className="space-y-6">
            {creatorRecs.videos.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/20">
                    <PartyPopper className="h-4 w-4 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-violet-400">
                    {creatorNextLabel}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {creatorRecs.videos.map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.06, type: 'spring', stiffness: 100 }}
                      whileHover={{ scale: 1.03, y: -3 }}
                      className="rounded-2xl border p-4 transition-all"
                      style={{
                        borderColor: 'var(--tint-violet-border)',
                        background: 'var(--tint-violet)',
                      }}
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/25 text-xs font-bold text-violet-400 shadow-md shadow-violet-400/20">
                          {i + 1}
                        </span>
                        <Clapperboard className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {v}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {creatorRecs.improvements.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                    What to improve
                  </h3>
                </div>
                <div className="space-y-2">
                  {creatorRecs.improvements.map((imp, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-start gap-3 rounded-xl border p-3"
                      style={{
                        borderColor: 'var(--tint-amber-border)',
                        background: 'var(--tint-amber)',
                      }}
                    >
                      <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {imp}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </VibrantSectionCard>
      ) : null}

      {/* Recommendations — bold amber */}
      <VibrantSectionCard
        title="AI Recommendations"
        icon={<Lightbulb className="h-5 w-5" />}
        accent="amber"
        delay={0.15}
      >
        <div className="space-y-3">
          {record.recommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04, type: 'spring', stiffness: 100 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="flex items-start gap-3 rounded-xl border p-3"
              style={{
                borderColor: 'var(--tint-amber-border)',
                background: 'var(--tint-amber)',
              }}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/25 text-xs font-bold text-amber-400 shadow-md shadow-amber-400/20">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {rec}
              </p>
            </motion.div>
          ))}
        </div>
      </VibrantSectionCard>

      {/* All items - click to respond */}
      <VibrantSectionCard
        title={`All Entries (${record.items.length})`}
        icon={<MessageSquareReply className="h-5 w-5" />}
        accent="blue"
        delay={0.35}
        collapsible
        open={showItems}
        onToggle={() => setShowItems((v) => !v)}
      >
        <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          Click on any entry to generate an AI-crafted response.
        </p>
        <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
          {record.items.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              onClick={() => setSelectedComment(item)}
              whileHover={{ scale: 1.02, x: 6 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all"
              style={{
                borderColor: 'var(--glass-border)',
                background: 'var(--glass-bg)',
              }}
            >
              <span
                className={`mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  item.result.label === 'positive'
                    ? 'bg-emerald-400/20 text-emerald-500'
                    : item.result.label === 'negative'
                      ? 'bg-rose-400/20 text-rose-500'
                      : 'bg-amber-400/20 text-amber-500'
                }`}
              >
                {item.result.label} ({item.result.dominantEmotion})
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {item.text.slice(0, 200)}{item.text.length > 200 ? '...' : ''}
                </p>
                <div className="mt-1 flex items-center gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{(item.result.confidence * 100).toFixed(0)}% confidence</span>
                  <span>·</span>
                  <span className="capitalize">{item.result.dominantEmotion}</span>
                  {item.likes !== undefined && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp className="h-2.5 w-2.5" /> {item.likes}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </VibrantSectionCard>

      {/* Explain the results — now below All Entries */}
      <VibrantSectionCard
        title="Explain the Results"
        icon={<HelpCircle className="h-5 w-5" />}
        accent="violet"
        delay={0.2}
        collapsible
        open={showExplain}
        onToggle={() => setShowExplain((v) => !v)}
      >
        <div className="space-y-3">
          {record.explanation.map((exp, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {exp}
            </p>
          ))}
        </div>
      </VibrantSectionCard>

      {/* Response modal */}
      <ResponseModal
        comment={selectedComment}
        record={record}
        onClose={() => setSelectedComment(null)}
      />
    </div>
  );
}

function ResponseModal({
  comment,
  record,
  onClose,
}: {
  comment: AnalysisItem | null;
  record: AnalysisRecord;
  onClose: () => void;
}) {
  const [activeTone, setActiveTone] = useState<ResponseTone>('professional');
  const [responseText, setResponseText] = useState('');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  const generate = (tone: ResponseTone) => {
    setActiveTone(tone);
    if (comment) {
      setResponseText(generateResponseForComment(tone, comment, record));
      setEditing(false);
      setCopied(false);
    }
  };

  const commentId = comment?.id;
  const [lastCommentId, setLastCommentId] = useState<string | null>(null);
  if (commentId && commentId !== lastCommentId) {
    setLastCommentId(commentId);
    setResponseText(generateResponseForComment('professional', comment!, record));
    setActiveTone('professional');
    setCopied(false);
    setEditing(false);
  }

  const copy = () => {
    navigator.clipboard.writeText(responseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {comment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="glass w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20">
                  <MessageSquareReply className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Respond to this comment
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 transition-all hover:scale-110 hover:bg-rose-400/10"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comment preview */}
            <div
              className="mb-4 rounded-2xl border p-4"
              style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    comment.result.label === 'positive'
                      ? 'bg-emerald-400/20 text-emerald-500'
                      : comment.result.label === 'negative'
                        ? 'bg-rose-400/20 text-rose-500'
                        : 'bg-amber-400/20 text-amber-500'
                  }`}
                >
                  {comment.result.label} ({comment.result.dominantEmotion})
                </span>
                {comment.likes !== undefined && (
                  <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <ThumbsUp className="h-2.5 w-2.5" /> {comment.likes}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {comment.text}
              </p>
            </div>

            {/* Tone selector */}
            <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Response tone
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <motion.button
                  key={tone}
                  onClick={() => generate(tone)}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    activeTone === tone
                      ? 'border border-emerald-400/40 bg-emerald-400/15 text-emerald-500 shadow-md shadow-emerald-400/20'
                      : 'border'
                  }`}
                  style={
                    activeTone !== tone
                      ? { borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }
                      : undefined
                  }
                >
                  {toneLabel(tone)}
                </motion.button>
              ))}
            </div>

            {/* Response */}
            {editing ? (
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={6}
                className="input-field resize-y text-sm leading-relaxed"
                autoFocus
              />
            ) : (
              <div
                className="rounded-2xl border p-4 text-sm leading-relaxed"
                style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-secondary)' }}
              >
                {responseText}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <motion.button
                onClick={copy}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05, y: -1 }}
                className="btn-ghost text-sm"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
              <motion.button
                onClick={() => setEditing((v) => !v)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05, y: -1 }}
                className="btn-ghost text-sm"
              >
                {editing ? 'Done' : 'Edit'}
              </motion.button>
              <motion.button
                onClick={() => generate(activeTone)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05, y: -1 }}
                className="btn-ghost text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function generateResponseForComment(
  tone: ResponseTone,
  comment: AnalysisItem,
  record: AnalysisRecord,
): string {
  const sentiment = comment.result.label;
  const emotion = comment.result.dominantEmotion;
  const keywords = comment.result.keywords.slice(0, 3);
  const kwStr = keywords.length ? keywords.join(', ') : 'your feedback';
  const snippet = comment.text.length > 120 ? comment.text.slice(0, 120) + '...' : comment.text;
  const topTopic = record.topics[0]?.topic ?? kwStr;

  const isNegative = sentiment === 'negative';
  const isPositive = sentiment === 'positive';
  const isNeutral = sentiment === 'neutral';

  switch (tone) {
    case 'professional':
      if (isPositive) {
        return `Thank you for your feedback. We're glad to hear your experience with ${kwStr} met your expectations — it's encouraging to see this reflected in your comment: "${snippet}". We'll continue to maintain this standard and look for ways to improve further. Please don't hesitate to reach out if there's anything more you'd like to share.`;
      }
      if (isNegative) {
        return `Thank you for bringing this to our attention. We've noted your concerns about ${kwStr}, and your comment — "${snippet}" — has been shared with the relevant team. We take this feedback seriously and are reviewing what went wrong. A member of our team will follow up with you directly to ensure this is resolved properly.`;
      }
      return `Thank you for sharing your thoughts on ${kwStr}. We appreciate you taking the time to provide this feedback: "${snippet}". We've logged your comments for internal review and will use them to guide future improvements. If you have any further details to add, we'd welcome hearing from you.`;
    case 'friendly':
      if (isPositive) {
        return `Hey, thank you so much for this! Reading "${snippet}" really made our day. We're so glad ${kwStr} is working well for you — that's exactly what we aim for. We'd love to keep delivering experiences like this, so please don't be a stranger. Drop us a line anytime!`;
      }
      if (isNegative) {
        return `Hey, thanks for being honest with us — we really appreciate it. We can see from your comment — "${snippet}" — that we fell short with ${kwStr}, and that's not okay. We're already looking into what happened and how we can fix it. We'd love to make this right for you, so if you're open to it, reach out and we'll get on it straight away.`;
      }
      return `Hey, thanks for taking the time to share this! We've read your comment — "${snippet}" — and we think ${kwStr} is worth looking into more closely. We're always trying to get better, and your input helps us do exactly that. Let us know if there's anything specific you'd like to see improve!`;
    case 'formal':
      if (isPositive) {
        return `We acknowledge with appreciation your favorable feedback regarding ${kwStr}. Your remarks, specifically "${snippet}", have been noted and shared with the respective department. We remain committed to sustaining the quality of service you have experienced and to continuous enhancement thereof. Should you wish to provide additional commentary, we would be most grateful.`;
      }
      if (isNegative) {
        return `We acknowledge receipt of your feedback concerning ${kwStr}. Your comments, specifically "${snippet}", have been formally reviewed and logged for action. We sincerely regret that your experience did not meet expectations. The matter has been escalated to the appropriate department, and a formal response will be issued upon completion of our review. Thank you for bringing this to our attention.`;
      }
      return `We acknowledge receipt of your feedback regarding ${kwStr}. Your comments, specifically "${snippet}", have been formally documented and will be incorporated into our ongoing review process. We value all input as part of our commitment to continuous improvement. Should further clarification be required, a representative will be in contact.`;
    case 'apology':
      if (isNegative) {
        return `I am truly sorry. There is no excuse for what you experienced, and I completely understand why you feel the way you do. Reading your words — "${snippet}" — it is painfully clear that we failed you with ${kwStr}, and that is on us. ${emotion === 'angry' || emotion === 'frustrated' ? 'You have every right to be frustrated — we would be too.' : 'You deserved better, and we did not deliver.'} We are not going to make excuses. Instead, here is what we are doing right now: investigating exactly what went wrong, fixing it at the source, and following up with you personally to make sure it is resolved. We know trust is earned, and we have work to do. I am sorry, and I thank you for holding us accountable.`;
      }
      if (isPositive) {
        return `Thank you — truly. Your kind words about ${kwStr} mean more to us than you know. Your comment — "${snippet}" — is a reminder of why we do what we do. If we ever fall short of the standard you have come to expect, please tell us immediately. You deserve nothing less.`;
      }
      return `Thank you for taking the time to share your thoughts on ${kwStr}. Your comment — "${snippet}" — is exactly the kind of honest feedback that helps us grow. If there is anything we could have done better, we are sorry we did not catch it sooner — and we are committed to doing better going forward.`;
    case 'support':
      if (isNegative) {
        return `Hi there, thank you for reaching out. I've read your comment — "${snippet}" — and I can see ${kwStr} is causing you trouble. I want to get this sorted for you. Here's what I'm doing right now: 1) Logging your case with our team and flagging it as priority, 2) Looking into what's happening with ${kwStr} specifically, and 3) Following up with you within 24 hours with an update. Could you share any extra details so I can resolve this faster?`;
      }
      if (isPositive) {
        return `Hi there, thank you for reaching out with such positive feedback! Your comment — "${snippet}" — is wonderful to read. I'm glad ${kwStr} is working well for you. If you ever need help with anything or have suggestions for how we could do even better, I'm here — just reach out anytime.`;
      }
      return `Hi there, thanks for reaching out. I've read your comment — "${snippet}" — and I want to make sure we're addressing ${kwStr} properly. Here's what I can do: 1) Share your feedback with the right team, 2) Look into whether others have raised similar points, and 3) Keep you posted on any changes. Is there anything specific you'd like me to focus on?`;
    case 'thankyou':
      if (isPositive) {
        return `Thank you so much for this! Your comment — "${snippet}" — genuinely brightened our day. Knowing ${kwStr} is making a difference for you is exactly why we do what we do. Supporters like you shape everything we build, and we'd love to keep hearing from you. Thank you for being part of our journey!`;
      }
      return `Thank you for taking the time to share your thoughts on ${kwStr}. Your comment — "${snippet}" — is exactly the kind of honest feedback that helps us grow. We're grateful you spoke up, and we're committed to acting on what you've told us. We'd value any further input you have — please don't hesitate to share more.`;
    case 'marketing':
      if (isPositive) {
        return `We love hearing this! Your comment — "${snippet}" — is exactly the kind of story that drives us to keep pushing forward. ${kwStr.charAt(0).toUpperCase() + kwStr.slice(1)} is just getting started, and supporters like you are at the heart of where we're heading. Stay tuned — there's a lot more coming, and we'd love for you to be part of it.`;
      }
      if (isNegative) {
        return `We hear you, and we're acting on it. Your comment — "${snippet}" — has been shared directly with the team responsible for ${kwStr}. We're turning this feedback into real changes, and we want you to see the difference. We'd love to bring you along on the journey — stay tuned for updates, and thank you for caring enough to tell us.`;
      }
      return `We hear you — and we're paying attention. Your comment — "${snippet}" — is the kind of input that shapes what we build next around ${kwStr}. We're always evolving, and feedback like yours is what makes that possible. Stay tuned for what's ahead — we think you'll like where we're going.`;
    default:
      return comment.text;
  }
}

// ---- Creator type detection ----

type CreatorType = 'website' | 'youtube' | 'airbnb' | 'ecommerce' | 'tiktok' | 'podcast' | 'restaurant' | 'app' | 'general';

export function detectCreatorType(record: AnalysisRecord): CreatorType {
  const allText = record.items.map((i) => i.text.toLowerCase()).join(' ');
  const sourceLabel = record.sourceLabel.toLowerCase();
  const title = record.title.toLowerCase();

  if (record.source === 'youtube') return 'youtube';
  if (record.source === 'website') {
    if (allText.includes('airbnb') || sourceLabel.includes('airbnb') || title.includes('airbnb')) return 'airbnb';
    if (allText.includes('tiktok') || title.includes('tiktok')) return 'tiktok';
    if (allText.includes('podcast') || title.includes('podcast')) return 'podcast';
    if (allText.includes('menu') || allText.includes('food') || allText.includes('restaurant') || allText.includes('meal') || allText.includes('dining')) return 'restaurant';
    if (allText.includes('app') || allText.includes('download') || allText.includes('feature') || allText.includes('bug') || allText.includes('crash')) return 'app';
    if (allText.includes('buy') || allText.includes('product') || allText.includes('shipping') || allText.includes('order') || allText.includes('delivery') || allText.includes('price') || allText.includes('purchase')) return 'ecommerce';
    return 'website';
  }
  if (allText.includes('airbnb') || sourceLabel.includes('airbnb') || title.includes('airbnb')) return 'airbnb';
  if (allText.includes('tiktok') || title.includes('tiktok')) return 'tiktok';
  if (allText.includes('podcast') || title.includes('podcast') || title.includes('episode')) return 'podcast';
  if (allText.includes('menu') || allText.includes('food') || allText.includes('restaurant') || allText.includes('meal') || allText.includes('dining')) return 'restaurant';
  if (allText.includes('app') || allText.includes('download') || allText.includes('bug') || allText.includes('crash') || allText.includes('feature')) return 'app';
  if (allText.includes('buy') || allText.includes('product') || allText.includes('shipping') || allText.includes('order') || allText.includes('delivery') || allText.includes('price') || allText.includes('purchase')) return 'ecommerce';
  return 'general';
}

const CREATOR_LABELS: Record<CreatorType, { noun: string; contentNoun: string; audienceNoun: string; actionNoun: string }> = {
  website: { noun: 'website owner', contentNoun: 'pages and content', audienceNoun: 'visitors', actionNoun: 'publish an update post or blog entry' },
  youtube: { noun: 'YouTube creator', contentNoun: 'videos', audienceNoun: 'viewers', actionNoun: 'post a response video' },
  airbnb: { noun: 'Airbnb host', contentNoun: 'listing and guest experience', audienceNoun: 'guests', actionNoun: 'update your listing description and house rules' },
  ecommerce: { noun: 'store owner', contentNoun: 'products and store experience', audienceNoun: 'customers', actionNoun: 'send a customer update email' },
  tiktok: { noun: 'TikTok creator', contentNoun: 'content', audienceNoun: 'followers', actionNoun: 'post a follow-up video' },
  podcast: { noun: 'podcast host', contentNoun: 'episodes', audienceNoun: 'listeners', actionNoun: 'address feedback in your next episode' },
  restaurant: { noun: 'restaurant owner', contentNoun: 'menu and dining experience', audienceNoun: 'diners', actionNoun: 'post an update on your website or social media' },
  app: { noun: 'app developer', contentNoun: 'app features and experience', audienceNoun: 'users', actionNoun: 'push an update with release notes' },
  general: { noun: 'content creator', contentNoun: 'content', audienceNoun: 'audience', actionNoun: 'share an update with your audience' },
};

// ---- Creator recommendations ----

function generateCreatorRecommendations(record: AnalysisRecord): {
  videos: string[];
  improvements: string[];
} {
  const nextSteps: string[] = [];
  const improvements: string[] = [];

  const creatorType = detectCreatorType(record);
  const labels = CREATOR_LABELS[creatorType];
  const posKeywords = record.keywords.filter((k) => k.sentiment === 'positive').slice(0, 5);
  const negKeywords = record.keywords.filter((k) => k.sentiment === 'negative').slice(0, 5);
  const posTopics = record.topics.filter((t) => t.sentiment === 'positive').slice(0, 3);
  const negTopics = record.topics.filter((t) => t.sentiment === 'negative').slice(0, 3);
  const posItems = record.items.filter((i) => i.result.label === 'positive');
  const negItems = record.items.filter((i) => i.result.label === 'negative');
  const isNegativeDominant = record.overall.negative > record.overall.positive;
  const isPositiveDominant = record.overall.positive > record.overall.negative;
  const hasThinData = record.overall.totalItems <= 3;
  const negKwStr = negKeywords.slice(0, 3).map((k) => k.word).join(', ');
  const posKwStr = posKeywords.slice(0, 3).map((k) => k.word).join(', ');
  const emotion = record.overall.dominantEmotion;

  // ---- "What to make next" — tailored to creator type ----
  if (isPositiveDominant) {
    if (posTopics.length > 0) {
      const topic = posTopics[0];
      nextSteps.push(
        `As a ${labels.noun}, your ${labels.audienceNoun} love "${topic.topic}" (${topic.count} mentions, positive sentiment). Create more ${labels.contentNoun} around this theme — it is your strongest performer.`,
      );
    }
    if (posKeywords.length >= 2) {
      nextSteps.push(
        `Focus your next ${labels.contentNoun.replace(/^./, (c) => c.toLowerCase())} on ${posKeywords.slice(0, 2).map((k) => k.word).join(' and ')} — these are what your ${labels.audienceNoun} are most enthusiastic about.`,
      );
    }
    if (posItems.length > 0 && posItems.length >= record.overall.totalItems * 0.5) {
      nextSteps.push(
        `Your ${labels.audienceNoun} are clearly happy. ${labels.actionNoun.charAt(0).toUpperCase() + labels.actionNoun.slice(1)} that leans into what is working and thanks them for the positive feedback.`,
      );
    }
    if (creatorType === 'youtube' && record.overall.positive > 0.4) {
      nextSteps.push(
        `Turn your most positive comments into a community spotlight video — showcase what viewers love about your channel and invite others to join the conversation.`,
      );
    }
    if (creatorType === 'airbnb') {
      nextSteps.push(
        `Guests are happy with their stay. Ask satisfied guests to leave a public review — positive reviews are your strongest marketing tool on Airbnb and directly boost your ranking.`,
      );
    }
    if (creatorType === 'ecommerce') {
      nextSteps.push(
        `Customers love your products. Launch a review incentive program — offer a small discount on their next order in exchange for a review. This compounds your social proof and drives repeat purchases.`,
      );
    }
    if (posKeywords.some((k) => ['tutorial', 'guide', 'explain', 'learn', 'tip', 'tips', 'help', 'easy'].includes(k.word))) {
      nextSteps.push(
        `Your ${labels.audienceNoun} respond well to helpful, educational content. Create a more in-depth guide or resource expanding on the topics that generated positive buzz.`,
      );
    }
    if (emotion === 'excited' || emotion === 'happy') {
      nextSteps.push(
        `The emotional tone is positive and enthusiastic — ${labels.actionNoun} that doubles down on what got your ${labels.audienceNoun} excited.`,
      );
    }
  }

  if (isNegativeDominant) {
    if (negTopics.length > 0) {
      const negTopic = negTopics[0];
      nextSteps.push(
        `Address "${negTopic.topic}" directly — ${labels.actionNoun} acknowledging the feedback, explaining what happened, and showing how you are fixing it. Transparency builds trust with your ${labels.audienceNoun}.`,
      );
    }
    if (negKeywords.length > 0) {
      if (creatorType === 'website' || creatorType === 'app') {
        nextSteps.push(
          `Your ${labels.audienceNoun} are frustrated about ${negKwStr}. Audit your ${labels.contentNoun} for these specific issues — test the user flow yourself, reproduce the problems, and ship fixes. Then ${labels.actionNoun} explaining what was broken and what you changed.`,
        );
      } else if (creatorType === 'airbnb') {
        nextSteps.push(
          `Guests are unhappy about ${negKwStr}. Review your listing photos, description, and house rules to make sure expectations match reality. Then ${labels.actionNoun} clarifying anything that may have been misleading.`,
        );
      } else if (creatorType === 'restaurant') {
        nextSteps.push(
          `Diners are unhappy about ${negKwStr}. Review your menu descriptions, service flow, and pricing. ${labels.actionNoun.charAt(0).toUpperCase() + labels.actionNoun.slice(1)} on your website or social media acknowledging the feedback and outlining what you are changing.`,
        );
      } else if (creatorType === 'ecommerce') {
        nextSteps.push(
          `Customers are unhappy about ${negKwStr}. Investigate whether this is a product quality issue, a shipping problem, or a listing inaccuracy. Fix the root cause, then ${labels.actionNoun} to affected customers.`,
        );
      } else {
        nextSteps.push(
          `Your ${labels.audienceNoun} are unhappy about ${negKwStr}. ${labels.actionNoun.charAt(0).toUpperCase() + labels.actionNoun.slice(1)} that directly tackles these concerns — show you are listening and outline the specific steps you are taking.`,
        );
      }
    }
    if (emotion === 'frustrated' || emotion === 'angry') {
      nextSteps.push(
        `Your ${labels.audienceNoun} are frustrated. Do not get defensive — ${labels.actionNoun} that calmly acknowledges the frustration, validates their feelings, and commits to a concrete fix with a timeline.`,
      );
    }
    if (emotion === 'disappointed' || emotion === 'sad') {
      nextSteps.push(
        `Your ${labels.audienceNoun} feel let down. Identify what expectation was not met, then over-deliver on your next ${labels.contentNoun.replace(/^./, (c) => c.toLowerCase())} to win back their confidence.`,
      );
    }
    if (emotion === 'confused') {
      nextSteps.push(
        `Your ${labels.audienceNoun} are confused. ${labels.actionNoun.charAt(0).toUpperCase() + labels.actionNoun.slice(1)} that breaks down the confusing topic simply, answers common questions, and sets clearer expectations going forward.`,
      );
    }
    if (hasThinData) {
      nextSteps.push(
        `You have limited feedback so far. ${labels.actionNoun.charAt(0).toUpperCase() + labels.actionNoun.slice(1)} inviting your ${labels.audienceNoun} to share more detailed feedback — the more responses you collect, the clearer your direction will be.`,
      );
    }
  }

  // ---- "What to improve" — tailored to creator type ----
  if (isNegativeDominant) {
    if (negKeywords.length > 0) {
      if (creatorType === 'website' || creatorType === 'app') {
        improvements.push(
          `The feedback centers on ${negKwStr}. Reproduce these issues yourself — open your ${creatorType === 'app' ? 'app' : 'site'} on a fresh device, walk through the user flow, and note every friction point. Fix the root cause, not just the surface complaint.`,
        );
      } else if (creatorType === 'airbnb') {
        improvements.push(
          `Guests mention ${negKwStr}. Re-read your listing description and look at your photos — do they accurately represent the space? Update anything that could set wrong expectations, and add detail to areas guests found lacking.`,
        );
      } else if (creatorType === 'restaurant') {
        improvements.push(
          `Diners mention ${negKwStr}. Sit down with your team and review the specific complaints — is it a kitchen issue, a service issue, or a pricing expectation? Make targeted changes and retrain staff if needed.`,
        );
      } else if (creatorType === 'ecommerce') {
        improvements.push(
          `Customers mention ${negKwStr}. Trace the complaint through your fulfillment pipeline — is it product quality, shipping speed, packaging, or listing accuracy? Fix the specific stage that is breaking down.`,
        );
      } else {
        improvements.push(
          `The feedback centers on ${negKwStr}. Investigate the root cause — is it a specific feature, a content choice, or a broken expectation? Fix the source, not just the symptom.`,
        );
      }
    }
    if (negTopics.length > 0) {
      improvements.push(
        `The "${negTopics[0].topic}" theme is dragging down sentiment. Dig into whether it is a quality issue, a communication issue, or a mismatch with what your ${labels.audienceNoun} expected — then adjust accordingly.`,
      );
    }
    if (record.overall.negative > 0.5) {
      improvements.push(
        `With ${Math.round(record.overall.negative * 100)}% negative sentiment, the priority is damage control. ${labels.actionNoun.charAt(0).toUpperCase() + labels.actionNoun.slice(1)} acknowledging the feedback and committing to specific, visible changes within a clear timeframe.`,
      );
    }
    if (emotion === 'frustrated' || emotion === 'angry') {
      improvements.push(
        `The dominant emotion is ${emotion} — your ${labels.audienceNoun} are upset. Do not argue or make excuses. Listen, validate their frustration, and show concrete action. A sincere response could reset the relationship.`,
      );
    }
    if (emotion === 'disappointed' || emotion === 'sad') {
      improvements.push(
        `The dominant emotion is ${emotion} — your ${labels.audienceNoun} expected more. Identify what promise or expectation was not met, then over-deliver on your next release to win back their confidence.`,
      );
    }
    if (negItems.some((i) => i.result.dominantEmotion === 'confused')) {
      if (creatorType === 'website' || creatorType === 'app') {
        improvements.push(
          `Several ${labels.audienceNoun} seem confused — improve your onboarding flow, add tooltips or a help section, and make sure navigation is intuitive. Test with someone who has never used your ${creatorType === 'app' ? 'app' : 'site'} before.`,
        );
      } else {
        improvements.push(
          `Several ${labels.audienceNoun} seem confused — add clearer explanations, better structure, and set expectations up front before diving into the main content.`,
        );
      }
    }
  }

  if (isPositiveDominant) {
    if (posKeywords.length > 0 && negKeywords.length > 0) {
      improvements.push(
        `Double down on what works (${posKeywords.slice(0, 2).map((k) => k.word).join(', ')}) while actively fixing what does not (${negKeywords.slice(0, 2).map((k) => k.word).join(', ')}) — this balanced approach will lift overall sentiment.`,
      );
    }
  }

  // ---- Engagement strategies for thin or unclear data ----
  if (hasThinData || (nextSteps.length === 0 && improvements.length === 0)) {
    if (creatorType === 'website' || creatorType === 'app') {
      improvements.push(
        `Add a short feedback survey or poll directly on your ${creatorType === 'app' ? 'app' : 'site'} — ask 2-3 specific questions about what ${labels.audienceNoun} want improved. Keep it under 30 seconds to maximize completion rate.`,
      );
      improvements.push(
        `Set up a simple contact form or feedback widget if you do not have one — make it easy for ${labels.audienceNoun} to reach you directly instead of venting publicly. Offer a small incentive (discount, early access) for detailed feedback.`,
      );
      improvements.push(
        `Use analytics tools to see where ${labels.audienceNoun} drop off or spend the most time — combine behavioral data with this sentiment data to identify both what frustrates people and what they actually use.`,
      );
      improvements.push(
        `Run A/B tests on key pages — change one element at a time (headline, layout, call-to-action) and measure which version gets better engagement. Let data, not guesswork, guide your improvements.`,
      );
    } else if (creatorType === 'airbnb') {
      improvements.push(
        `Send a brief post-stay message to guests asking one open-ended question: "What is one thing that would have made your stay better?" This gives you specific, actionable feedback without overwhelming guests.`,
      );
      improvements.push(
        `Review similar listings in your area — look at what top-rated hosts mention in their descriptions and photos. Identify gaps between their listings and yours, then close them.`,
      );
      improvements.push(
        `Create a guest guidebook (digital or printed) covering check-in, Wi-Fi, local recommendations, and house rules. This reduces confusion, repeat questions, and negative reviews about things that were simply not communicated.`,
      );
    } else if (creatorType === 'youtube' || creatorType === 'tiktok') {
      improvements.push(
        `Run a poll on your community tab asking ${labels.audienceNoun} what they want to see next — give 3-4 specific options. Polls are low-effort and give you clear, actionable direction.`,
      );
      improvements.push(
        `Pin a comment on your latest video asking an open-ended question like "What is one thing you wish I did differently?" — this turns passive ${labels.audienceNoun} into active feedback providers.`,
      );
      improvements.push(
        `Create a short "feedback Friday" or community post asking ${labels.audienceNoun} to rate your recent content 1-5 and explain why. You will get richer, more specific responses than generic comments provide.`,
      );
      improvements.push(
        `Try a "reaction to your comments" video format — read and respond to feedback on camera. This shows you are listening, encourages more people to comment, and turns criticism into content.`,
      );
    } else if (creatorType === 'restaurant') {
      improvements.push(
        `Add a QR code feedback card to tables — let diners rate their experience before they leave. You catch issues while the guest is still on-site and can fix them in the moment.`,
      );
      improvements.push(
        `Post a poll on your social media asking diners what new dish or special they would like to see. This engages your audience and gives you menu direction backed by real demand.`,
      );
      improvements.push(
        `Train staff to ask one question at the end of the meal: "Was everything to your liking today?" This catches problems before they become negative online reviews.`,
      );
    } else if (creatorType === 'podcast') {
      improvements.push(
        `Ask ${labels.audienceNoun} to leave a voice message or send an email with one thing they would change about the show. Read the best responses on air — this creates a feedback loop and makes listeners feel heard.`,
      );
      improvements.push(
        `Run a poll on your social media asking what topic or guest ${labels.audienceNoun} want next. This gives you direction while boosting engagement on your social channels.`,
      );
    } else if (creatorType === 'ecommerce') {
      improvements.push(
        `Send a post-purchase email asking customers one question: "What could we do better?" Keep it to a single question with a one-click rating plus optional comment. Response rates are highest when the ask is small.`,
      );
      improvements.push(
        `Add a product Q&A section to your store — let customers ask questions publicly and answer them. This reduces pre-purchase confusion and creates content that helps future buyers.`,
      );
      improvements.push(
        `Run a social media poll asking what product or feature customers want next. This generates buzz and gives you product development direction backed by real demand.`,
      );
    } else {
      improvements.push(
        `Run a poll or survey asking your ${labels.audienceNoun} what they want to see next — give 3-4 specific options. Polls are low-effort and give you clear, actionable direction.`,
      );
      improvements.push(
        `Ask your ${labels.audienceNoun} an open-ended question: "What is one thing you wish I did differently?" This turns passive ${labels.audienceNoun} into active feedback providers and surfaces issues you might not see.`,
      );
      improvements.push(
        `Create a regular feedback channel — a weekly post, email, or message asking ${labels.audienceNoun} to rate your recent work and explain why. Consistency builds a feedback habit.`,
      );
    }
  }

  if (improvements.length === 0 && isPositiveDominant) {
    improvements.push(
      `Sentiment is healthy across the board — keep doing what you are doing, and experiment with new ${labels.contentNoun.replace(/^./, (c) => c.toLowerCase())} to keep your ${labels.audienceNoun} engaged.`,
    );
  }

  return { videos: nextSteps.slice(0, 5), improvements: improvements.slice(0, 5) };
}

type AccentColor = 'emerald' | 'amber' | 'rose' | 'blue' | 'violet';

const ACCENT_GRADIENTS: Record<AccentColor, string> = {
  emerald: 'linear-gradient(135deg, var(--tint-emerald), var(--tint-blue))',
  amber: 'linear-gradient(135deg, var(--tint-amber), var(--tint-rose))',
  rose: 'linear-gradient(135deg, var(--tint-rose), var(--tint-violet))',
  blue: 'linear-gradient(135deg, var(--tint-blue), var(--tint-violet))',
  violet: 'linear-gradient(135deg, var(--tint-violet), var(--tint-rose))',
};

const ACCENT_TEXT: Record<AccentColor, string> = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  blue: 'text-blue-400',
  violet: 'text-violet-400',
};

const ACCENT_BG: Record<AccentColor, string> = {
  emerald: 'bg-emerald-400/20',
  amber: 'bg-amber-400/20',
  rose: 'bg-rose-400/20',
  blue: 'bg-blue-400/20',
  violet: 'bg-violet-400/20',
};

function VibrantSectionCard({
  title,
  icon,
  children,
  accent = 'emerald',
  delay = 0,
  collapsible = false,
  open = false,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: AccentColor;
  delay?: number;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  const gradient = ACCENT_GRADIENTS[accent];
  const textColor = ACCENT_TEXT[accent];
  const bgTint = ACCENT_BG[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-3xl border p-6"
      style={{
        background: gradient,
        borderColor: `var(--tint-${accent}-border)`,
      }}
    >
      {/* Decorative glow */}
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${bgTint} blur-3xl`} />

      <button
        onClick={collapsible ? onToggle : undefined}
        className={`relative mb-4 flex w-full items-center justify-between ${collapsible ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bgTint}`}>
            <span className={textColor}>{icon}</span>
          </div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
        </div>
        {collapsible && (
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          </motion.span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {(!collapsible || open) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChartCard({
  title,
  icon,
  children,
  accent = 'emerald',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: AccentColor;
}) {
  const textColor = ACCENT_TEXT[accent];
  const bgTint = ACCENT_BG[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass p-5"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bgTint}`}>
          <span className={textColor}>{icon}</span>
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

function HighlightCard({
  label,
  color,
  item,
}: {
  label: string;
  color: 'emerald' | 'rose' | 'amber';
  item: AnalysisRecord['topPositive'];
}) {
  const [expanded, setExpanded] = useState(false);
  const gradients: Record<string, string> = {
    emerald: 'linear-gradient(135deg, var(--tint-emerald), var(--tint-blue))',
    rose: 'linear-gradient(135deg, var(--tint-rose), var(--tint-violet))',
    amber: 'linear-gradient(135deg, var(--tint-amber), var(--tint-rose))',
  };
  const textColors: Record<string, string> = {
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
  };
  const bgTints: Record<string, string> = {
    emerald: 'bg-emerald-400/20',
    rose: 'bg-rose-400/20',
    amber: 'bg-amber-400/20',
  };
  const isLong = (item?.text.length ?? 0) > 180;
  const displayText = expanded ? item?.text : item?.text.slice(0, 180);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.02, y: -3 }}
      className="relative overflow-hidden rounded-3xl border p-5"
      style={{
        background: gradients[color],
        borderColor: `var(--tint-${color}-border)`,
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bgTints[color]}`}>
          <Quote className={`h-3.5 w-3.5 ${textColors[color]}`} />
        </div>
        <p className={`text-xs font-bold uppercase tracking-wider ${textColors[color]}`}>{label}</p>
      </div>
      <AnimatePresence initial={false}>
        <motion.p
          key={expanded ? 'expanded' : 'collapsed'}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden text-sm leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {displayText}
          {!expanded && isLong ? '...' : ''}
        </motion.p>
      </AnimatePresence>
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className={`mt-2 flex items-center gap-1 text-xs font-semibold transition-colors ${textColors[color]} hover:opacity-80`}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Read full comment
            </>
          )}
        </button>
      )}
      <p className="mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        sentiment: {item?.result.label} · {item && (item.result.confidence * 100).toFixed(0)}% confidence
      </p>
    </motion.div>
  );
}
