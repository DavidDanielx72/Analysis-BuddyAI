import { motion } from 'framer-motion';
import {
  ShieldCheck,
  PlusCircle,
  History,
  Download,
  Settings as SettingsIcon,
  Search,
  Sun,
  Moon,
  HelpCircle,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';

const NAV_COLORS: Record<DashboardView, string> = {
  new: 'from-emerald-500 to-green-500',
  history: 'from-amber-500 to-yellow-500',
  export: 'from-blue-500 to-cyan-500',
  settings: 'from-rose-500 to-pink-500',
};
import { useState } from 'react';

export type DashboardView = 'new' | 'history' | 'export' | 'settings';

interface SidebarProps {
  view: DashboardView;
  onView: (v: DashboardView) => void;
  onBackHome: () => void;
  open: boolean;
  onClose: () => void;
}

const NAV: { id: DashboardView; label: string; icon: typeof PlusCircle }[] = [
  { id: 'new', label: 'New Analysis', icon: PlusCircle },
  { id: 'history', label: 'History', icon: History },
  { id: 'export', label: 'Export Reports', icon: Download },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ view, onView, onBackHome, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <button onClick={onBackHome} className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Sentinel AI</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/5 lg:hidden"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onView(item.id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? `border border-white/10 bg-gradient-to-r ${NAV_COLORS[item.id]} text-white shadow-lg`
                    : 'hover:bg-white/5'
                }`}
                style={!active ? { color: 'var(--text-secondary)' } : undefined}
              >
                <item.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-4" style={{ borderColor: 'var(--glass-border)' }}>
          <button
            onClick={onBackHome}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to Home
          </button>
        </div>
      </aside>
    </>
  );
}

interface TopbarProps {
  search: string;
  onSearch: (v: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onHelp: () => void;
  onMenu: () => void;
}

export function Topbar({ search, onSearch, theme, onToggleTheme, onHelp, onMenu }: TopbarProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-xl md:px-6"
      style={{ borderColor: 'var(--glass-border)', background: 'var(--glass-bg)' }}
    >
      <button
        onClick={onMenu}
        className="rounded-lg p-2 hover:bg-white/5 lg:hidden"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search analyses..."
          className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1"
          style={{
            borderColor: 'var(--input-border)',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setHelpOpen((v) => !v)}
          className="rounded-lg p-2 transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <button
          onClick={onToggleTheme}
          className="rounded-lg p-2 transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Moon className="h-5 w-5" strokeWidth={1.5} />
          )}
        </button>
      </div>
      {helpOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-4 top-14 z-30 w-72 glass p-4 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          <h4 className="mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Help</h4>
          <ul className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <li>• Paste text or upload a file to start.</li>
            <li>• Enter a website or YouTube URL to analyze external content.</li>
            <li>• All analysis runs locally — no login needed.</li>
            <li>• Export results as PDF or CSV from the Export Reports tab.</li>
          </ul>
        </motion.div>
      )}
    </header>
  );
}
