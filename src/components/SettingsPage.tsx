import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Sun, Moon, Save, Check, Trash2, Gauge, MessageSquare } from 'lucide-react';
import type { AppSettings, ResponseTone } from '@/types';
import { getSettings, saveSettings, clearAllAnalyses } from '@/services/storage';

const TONES: { id: ResponseTone; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'formal', label: 'Formal' },
  { id: 'apology', label: 'Apology' },
  { id: 'support', label: 'Customer Support' },
  { id: 'thankyou', label: 'Thank You' },
  { id: 'marketing', label: 'Marketing' },
];

export default function SettingsPage({
  theme,
  onToggleTheme,
}: {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) {
    return <div className="skeleton h-40 rounded-2xl" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Customize your Sentinel AI experience.</p>
      </div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
        <div className="mb-4 flex items-center gap-2 text-emerald-500">
          {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => theme !== 'dark' && onToggleTheme()}
            className={`flex-1 rounded-xl border p-4 text-center transition-all ${
              theme === 'dark'
                ? 'border-emerald-400/30 bg-emerald-400/10'
                : 'border hover:bg-black/5'
            }`}
            style={theme !== 'dark' ? { borderColor: 'var(--glass-border)' } : undefined}
          >
            <Moon className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Dark</p>
          </button>
          <button
            onClick={() => theme !== 'light' && onToggleTheme()}
            className={`flex-1 rounded-xl border p-4 text-center transition-all ${
              theme === 'light'
                ? 'border-amber-400/30 bg-amber-400/10'
                : 'border hover:bg-black/5'
            }`}
            style={theme !== 'light' ? { borderColor: 'var(--glass-border)' } : undefined}
          >
            <Sun className="mx-auto mb-2 h-6 w-6 text-amber-500" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Light</p>
          </button>
        </div>
      </motion.div>

      {/* Analysis settings */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass p-6">
        <div className="mb-4 flex items-center gap-2 text-emerald-500">
          <Gauge className="h-5 w-5" />
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Analysis</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Confidence Threshold: {(settings.confidenceThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min={0.3}
              max={0.9}
              step={0.05}
              value={settings.confidenceThreshold}
              onChange={(e) =>
                setSettings({ ...settings, confidenceThreshold: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-400"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Minimum confidence for sentiment classification to be considered reliable.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Max Items Per Analysis: {settings.maxItemsPerAnalysis}
            </label>
            <input
              type="range"
              min={500}
              max={10000}
              step={500}
              value={settings.maxItemsPerAnalysis}
              onChange={(e) =>
                setSettings({ ...settings, maxItemsPerAnalysis: parseInt(e.target.value) })
              }
              className="w-full accent-emerald-400"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Upper limit on the number of text entries analyzed in one run.</p>
          </div>
        </div>
      </motion.div>

      {/* Default response tone */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6">
        <div className="mb-4 flex items-center gap-2 text-emerald-500">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Default Response Tone</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSettings({ ...settings, defaultResponseTone: t.id })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                settings.defaultResponseTone === t.id
                  ? 'border border-amber-400/30 bg-amber-400/10 text-amber-500'
                  : 'border hover:bg-black/5'
              }`}
              style={settings.defaultResponseTone !== t.id ? { borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Data management */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass p-6">
        <div className="mb-4 flex items-center gap-2 text-red-400">
          <Trash2 className="h-5 w-5" />
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Data Management</h2>
        </div>
        <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          All your analysis history is stored locally in your browser. Clearing your browser data will remove it permanently.
        </p>
        <button
          onClick={async () => {
            if (confirm('Delete all analysis history? This cannot be undone.')) {
              await clearAllAnalyses();
            }
          }}
          className="btn-ghost text-sm hover:border-red-400/30"
          style={{ color: '#f87171' }}
        >
          <Trash2 className="h-4 w-4" />
          Clear All History
        </button>
      </motion.div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
