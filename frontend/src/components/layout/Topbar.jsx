import { Bell, Search, Sun, Moon, RefreshCw } from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store/useStore';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': 'Tableau de bord',
  '/compare': 'Comparaison multi-plateformes',
  '/heatmap': 'Heatmap d\'engagement',
  '/reports': 'Rapports & Exports',
  '/insights': 'Recommandations IA',
  '/settings': 'Paramètres',
  '/pricing': 'Plans & Tarifs',
  '/admin': 'Administration',
};

export default function Topbar() {
  const { darkMode, toggleDarkMode, activePeriod, setActivePeriod } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'DATAhub';

  const PERIODS = [
    { label: '7j', value: '7d' },
    { label: '30j', value: '30d' },
    { label: '90j', value: '90d' },
    { label: '365j', value: '365d' },
  ];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Period filter */}
        <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-0.5">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setActivePeriod(value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activePeriod === value
                  ? 'bg-white dark:bg-slate-700 text-primary-800 dark:text-primary-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Mode clair' : 'Mode sombre'}
          aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="w-8 h-8 bg-primary-800 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer">
          {user?.fullName?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
