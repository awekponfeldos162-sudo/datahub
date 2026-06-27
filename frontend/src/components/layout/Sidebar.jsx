import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, GitCompare, FileText, Lightbulb,
  Settings, ChevronLeft, ChevronRight, Facebook, Youtube, Instagram,
  Music2, Ghost, CreditCard, LogOut, Flame,
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store/useStore';
import PinterestIcon from '../icons/PinterestIcon';
import clsx from 'clsx';

const PLATFORM_ICONS = {
  FACEBOOK: { icon: Facebook, color: '#1877f2', label: 'Facebook' },
  YOUTUBE: { icon: Youtube, color: '#ff0000', label: 'YouTube' },
  INSTAGRAM: { icon: Instagram, color: '#e1306c', label: 'Instagram' },
  TIKTOK: { icon: Music2, color: '#000000', label: 'TikTok' },
  SNAPCHAT: { icon: Ghost, color: '#fffc00', label: 'Snapchat' },
  PINTEREST: { icon: PinterestIcon, color: '#e60023', label: 'Pinterest' },
};

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/compare', icon: GitCompare, label: 'Comparaison' },
  { to: '/heatmap', icon: Flame, label: 'Heatmap' },
  { to: '/reports', icon: FileText, label: 'Rapports' },
  { to: '/insights', icon: Lightbulb, label: 'Recommandations IA' },
  { to: '/pricing', icon: CreditCard, label: 'Plans & Tarifs' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

const PLATFORMS = ['FACEBOOK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'SNAPCHAT', 'PINTEREST'];

export default function Sidebar({ connectedPlatforms = [] }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { logout, user } = useAuthStore();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 72 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-primary-800 text-white border-r border-primary-900 shrink-0 z-30"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-primary-700">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0">
          <span className="text-primary-800 font-black text-sm">DH</span>
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="font-bold text-lg leading-tight">DATAhub</p>
              <p className="text-[10px] text-primary-300 leading-tight">Analyse Réseaux Sociaux</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin" aria-label="Navigation principale">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            aria-label={label}
            aria-current={isActive(to) ? 'page' : undefined}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
              isActive(to)
                ? 'bg-white/20 text-white'
                : 'text-primary-200 hover:bg-white/10 hover:text-white'
            )}
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }}>
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}

        {/* Platforms section */}
        {sidebarOpen && (
          <div className="pt-4">
            <p className="px-3 text-[10px] uppercase tracking-wider text-primary-400 font-semibold mb-2">
              Plateformes
            </p>
          </div>
        )}
        {PLATFORMS.map((platform) => {
          const connected = connectedPlatforms.some((p) => p.platform === platform && p.isActive);
          const { icon: PIcon, color, label } = PLATFORM_ICONS[platform];
          return (
            <Link
              key={platform}
              to={`/analytics/${platform.toLowerCase()}`}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive(`/analytics/${platform.toLowerCase()}`)
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-primary-300 hover:bg-white/10 hover:text-white'
              )}
              title={!sidebarOpen ? label : undefined}
            >
              <div className="relative shrink-0">
                <PIcon size={16} style={{ color }} />
                {connected && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-primary-800" />
                )}
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center shrink-0 text-sm font-bold">
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-primary-400 truncate">{user?.plan}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <button onClick={logout} aria-label="Déconnexion" className="text-primary-400 hover:text-white transition-colors" title="Déconnexion">
              <LogOut size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Réduire la barre latérale' : 'Développer la barre latérale'}
        aria-expanded={sidebarOpen}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
      >
        {sidebarOpen ? <ChevronLeft size={12} className="text-slate-600" aria-hidden="true" /> : <ChevronRight size={12} className="text-slate-600" aria-hidden="true" />}
      </button>
    </motion.aside>
  );
}
