import { motion } from 'framer-motion';
import {
  Globe,
  Youtube,
  FileText,
  FileType,
  Sparkles,
  Lightbulb,
  BarChart3,
  MessageSquareReply,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Eye,
  Brain,
  TrendingUp,
} from 'lucide-react';
import { Section, SectionTitle } from '@/components/ui/Section';

const FEATURES = [
  {
    icon: Globe,
    title: 'Website Analysis',
    desc: 'Paste any URL and extract article or review text for instant sentiment breakdown.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Youtube,
    title: 'YouTube Comment Analysis',
    desc: 'Pull real comments from any YouTube video and analyze audience sentiment instantly.',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: FileText,
    title: 'PDF Analysis',
    desc: 'Upload PDF reports or documents and analyze every page for sentiment and themes.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: FileType,
    title: 'Document Analysis',
    desc: 'DOCX and TXT files are parsed and broken into analyzable passages automatically.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Sparkles,
    title: 'AI Business Insights',
    desc: 'Get natural-language insights covering strengths, risks, and opportunities.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Lightbulb,
    title: 'Smart Recommendations',
    desc: 'Receive practical, prioritized actions you can take to improve your outcomes.',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    icon: BarChart3,
    title: 'Interactive Charts',
    desc: 'Beautiful animated pie, bar, line, and emotion visualizations.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: MessageSquareReply,
    title: 'AI Response Generator',
    desc: 'Click any comment and generate a tailored response in multiple tones.',
    color: 'from-fuchsia-500 to-pink-500',
  },
];

const STEPS = [
  {
    icon: Eye,
    title: 'Provide your text',
    desc: 'Paste text, upload a file, enter a website or YouTube URL — Sentinel AI handles the rest.',
    color: 'text-cyan-300',
  },
  {
    icon: Brain,
    title: 'AI analyzes every entry',
    desc: 'Each piece of text is classified for sentiment, emotion, keywords, and themes.',
    color: 'text-violet-300',
  },
  {
    icon: TrendingUp,
    title: 'Explore insights & charts',
    desc: 'Interactive visualizations and natural-language insights reveal what your audience thinks.',
    color: 'text-rose-300',
  },
  {
    icon: Zap,
    title: 'Act on recommendations',
    desc: 'Use AI-generated recommendations and response drafts to respond and improve.',
    color: 'text-amber-500',
  },
];

const FILE_TYPES = [
  { ext: 'PDF', desc: 'Portable Document Format', icon: FileText, color: 'text-rose-400' },
  { ext: 'DOCX', desc: 'Word Documents', icon: FileType, color: 'text-violet-400' },
  { ext: 'TXT', desc: 'Plain Text', icon: FileText, color: 'text-cyan-400' },
  { ext: 'CSV', desc: 'Spreadsheet data', icon: BarChart3, color: 'text-amber-400' },
  { ext: 'URL', desc: 'Any website link', icon: Globe, color: 'text-blue-400' },
  { ext: 'YOUTUBE', desc: 'Video links', icon: Youtube, color: 'text-pink-400' },
];

const BENEFITS = [
  { icon: Zap, title: 'Instant results', desc: 'Analysis runs in seconds, not hours.', color: 'text-amber-500' },
  { icon: ShieldCheck, title: 'No login required', desc: 'Open the app and start analyzing immediately.', color: 'text-cyan-300' },
  { icon: Lock, title: 'Private by design', desc: 'Your history stays in your browser — no accounts, no servers.', color: 'text-emerald-500' },
  { icon: Brain, title: 'AI that explains', desc: 'Understand why sentiment was classified the way it was.', color: 'text-violet-300' },
  { icon: TrendingUp, title: 'Actionable insights', desc: 'Turn raw feedback into prioritized next steps.', color: 'text-rose-300' },
  { icon: Eye, title: 'Beautiful visualizations', desc: 'Charts that make data easy to understand and share.', color: 'text-blue-300' },
];

const FAQS = [
  {
    q: 'Do I need to create an account?',
    a: 'No. Sentinel AI has no login or registration. Open the site and start analyzing immediately. Your history is stored locally in your browser.',
  },
  {
    q: 'Do I need an API key?',
    a: 'No API keys are required. The sentiment engine runs entirely in your browser, and YouTube/website content is fetched through a server-side proxy.',
  },
  {
    q: 'What file types are supported?',
    a: 'You can paste text directly, or upload PDF, DOCX, TXT, and CSV files. You can also enter a website URL or a YouTube video URL.',
  },
  {
    q: 'Is my data sent anywhere?',
    a: 'Text analysis happens locally. Website and YouTube content is fetched server-side to bypass browser restrictions, but your analysis history never leaves your device unless you export it.',
  },
  {
    q: 'Can I export my results?',
    a: 'Yes. Every analysis can be exported as a professionally formatted PDF or a CSV file with all items, insights, and recommendations.',
  },
  {
    q: 'How accurate is the sentiment analysis?',
    a: 'Sentinel AI uses a lexicon-based engine with negation and intensifier handling. It is well suited for understanding aggregate trends across many entries, which is where the insights and recommendations shine.',
  },
];

export default function Landing({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero */}
      <Section className="pt-28 md:pt-36">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/30"
          >
            <ShieldCheck className="h-10 w-10 text-white" strokeWidth={1.5} />
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-emerald-400/40"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-[1.1]"
            style={{ color: 'var(--text-primary)' }}
          >
            AI-Powered{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">
              Sentiment Analysis
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg md:text-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            Transform customer feedback, reviews, documents, and online content into
            meaningful insights using AI.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <button onClick={onAnalyze} className="btn-primary group px-7 py-3.5 text-base">
              Analyze Now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <a href="#how-it-works" className="btn-ghost px-7 py-3.5 text-base">
              Learn More
            </a>
          </motion.div>
        </div>

        {/* Floating preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="glass overflow-hidden p-1">
            <div className="rounded-xl bg-ink-900/60 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400/60" />
                <div className="h-3 w-3 rounded-full bg-amber-400/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/60" />
                <span className="ml-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>sentinel-ai / dashboard</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Positive</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-500">68%</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '68%' }}
                      transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                      className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-400"
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Neutral</p>
                  <p className="mt-1 text-2xl font-bold text-amber-500">22%</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '22%' }}
                      transition={{ duration: 1, delay: 0.7, ease: 'easeOut' }}
                      className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400"
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Negative</p>
                  <p className="mt-1 text-2xl font-bold text-rose-300">10%</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '10%' }}
                      transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                      className="h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-red-400"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { e: 'happy', v: 42, c: 'text-amber-500' },
                  { e: 'excited', v: 28, c: 'text-pink-300' },
                  { e: 'appreciative', v: 19, c: 'text-emerald-500' },
                  { e: 'frustrated', v: 11, c: 'text-orange-300' },
                ].map((e) => (
                  <div key={e.e} className="rounded-lg border p-3" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{e.e}</p>
                    <p className={`mt-1 text-lg font-semibold ${e.c}`}>{e.v}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -inset-4 -z-10 bg-radial-glow opacity-60 blur-2xl" />
        </motion.div>
      </Section>

      {/* Features */}
      <Section id="features">
        <SectionTitle
          eyebrow="Capabilities"
          title="Everything you need to understand your audience"
          subtitle="Sentinel AI brings together sentiment analysis, emotion detection, and AI-generated insights in one polished workspace."
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass group p-6 transition-shadow hover:shadow-glow"
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-lg`}>
                <f.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works">
        <SectionTitle
          eyebrow="How it works"
          title="From raw text to actionable insight in four steps"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="glass h-full p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-black/5 to-black/10 text-sm font-bold text-emerald-500">
                    {i + 1}
                  </div>
                  <s.icon className={`h-5 w-5 ${s.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Supported file types */}
      <Section id="file-types">
        <SectionTitle
          eyebrow="Sources"
          title="Analyze text from anywhere"
          subtitle="Sentinel AI accepts multiple input formats so you can bring your data however you have it."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {FILE_TYPES.map((f, i) => (
            <motion.div
              key={f.ext}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="glass flex flex-col items-center p-5 text-center transition-colors hover:border-emerald-400/30"
            >
              <f.icon className={`mb-3 h-7 w-7 ${f.color}`} strokeWidth={1.5} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{f.ext}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Benefits */}
      <Section id="benefits">
        <SectionTitle eyebrow="Why Sentinel AI" title="Built for clarity, speed, and action" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              className="glass flex items-start gap-4 p-6"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 ${b.color}`}>
                <b.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{b.title}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <SectionTitle eyebrow="FAQ" title="Frequently asked questions" />
        <div className="mx-auto max-w-3xl space-y-3">
          {FAQS.map((faq, i) => (
            <motion.details
              key={faq.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="glass group cursor-pointer p-5"
            >
              <summary className="flex list-none items-center justify-between text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                {faq.q}
                <span className="ml-4 text-emerald-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
            </motion.details>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass relative overflow-hidden p-10 text-center md:p-16"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/10 via-amber-500/10 to-rose-500/10" />
          <h2 className="text-3xl font-bold md:text-4xl" style={{ color: 'var(--text-primary)' }}>
            Ready to understand your audience?
          </h2>
          <p className="mx-auto mt-4 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
            No signup. No API keys. Just paste your text and get instant AI-powered insights.
          </p>
          <button onClick={onAnalyze} className="btn-primary group mt-8 px-8 py-4 text-base">
            Start Analyzing
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row md:px-10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-500">
              <ShieldCheck className="h-4 w-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sentinel AI</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            AI-Powered Sentiment Analysis Platform — No login required.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Built with React, TypeScript, and a local sentiment engine.
          </p>
        </div>
      </footer>
    </div>
  );
}
