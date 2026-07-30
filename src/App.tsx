import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import MatrixBackground from '@/components/MatrixBackground';
import Landing from '@/components/Landing';
import { Sidebar, Topbar, type DashboardView } from '@/components/DashboardShell';
import AnalysisWorkspace from '@/components/AnalysisWorkspace';
import ResultsView from '@/components/ResultsView';
import HistoryPage from '@/components/HistoryPage';
import ExportPage from '@/components/ExportPage';
import SettingsPage from '@/components/SettingsPage';
import { getSettings, saveSettings } from '@/services/storage';
import type { AnalysisRecord, AppSettings } from '@/types';

type Route = 'landing' | 'dashboard';

export default function App() {
  const [route, setRoute] = useState<Route>('landing');
  const [view, setView] = useState<DashboardView>('new');
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setTheme(s.theme);
      applyTheme(s.theme);
    })();
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    if (t === 'light') {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
    }
  };

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    const s = await getSettings();
    await saveSettings({ ...s, theme: next });
  };

  const goDashboard = () => {
    setRoute('dashboard');
    setView('new');
    setShowResults(false);
    setCurrentRecord(null);
  };

  const goHome = () => {
    setRoute('landing');
    setShowResults(false);
    setCurrentRecord(null);
  };

  const handleAnalysisComplete = (record: AnalysisRecord) => {
    setCurrentRecord(record);
    setShowResults(true);
  };

  const handleOpenRecord = (record: AnalysisRecord) => {
    setCurrentRecord(record);
    setShowResults(true);
    setView('new');
  };

  if (route === 'landing') {
    return (
      <>
        <MatrixBackground />
        <Landing onAnalyze={goDashboard} />
      </>
    );
  }

  return (
    <>
      <MatrixBackground />
      <div className="min-h-screen">
        <Sidebar
          view={view}
          onView={(v) => {
            setView(v);
            setShowResults(false);
          }}
          onBackHome={goHome}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-64">
          <Topbar
            search={search}
            onSearch={setSearch}
            theme={theme}
            onToggleTheme={toggleTheme}
            onHelp={() => {}}
            onMenu={() => setSidebarOpen(true)}
          />
          <main className="px-4 py-6 md:px-8 md:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={showResults ? 'results' : view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {showResults && currentRecord ? (
                  <ResultsView
                    record={currentRecord}
                    onBack={() => setShowResults(false)}
                    onExport={() => setView('export')}
                  />
                ) : view === 'new' ? (
                  <AnalysisWorkspace onComplete={handleAnalysisComplete} />
                ) : view === 'history' ? (
                  <HistoryPage onOpen={handleOpenRecord} search={search} />
                ) : view === 'export' ? (
                  <ExportPage onOpen={handleOpenRecord} />
                ) : view === 'settings' ? (
                  <SettingsPage theme={theme} onToggleTheme={toggleTheme} />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}
