import { useQuery } from '@tanstack/react-query';
import { metricsApi, platformsApi } from '../api/client';
import { useUIStore } from '../store/useStore';
import StatsCard from '../components/dashboard/StatsCard';
import { useChartExport, ExportButton } from '../components/charts/ChartExportButton';
import {
  Eye, Heart, MessageCircle, Share2, Users, TrendingUp,
  RefreshCw, Plus, AlertCircle, Facebook, Youtube, Instagram, Music2, Ghost,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const PLATFORM_COLORS = {
  FACEBOOK: '#1877f2',
  YOUTUBE: '#ff0000',
  INSTAGRAM: '#e1306c',
  TIKTOK: '#010101',
  SNAPCHAT: '#fffc00',
};

const PLATFORM_ICONS = {
  FACEBOOK: Facebook, YOUTUBE: Youtube, INSTAGRAM: Instagram,
  TIKTOK: Music2, SNAPCHAT: Ghost,
};

export default function Dashboard() {
  const { activePeriod } = useUIStore();
  const { ref: trendRef, exportPng: exportTrend } = useChartExport('tendance-vues.png');
  const { ref: pieRef, exportPng: exportPie } = useChartExport('repartition-plateformes.png');

  const { data: overview, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-overview', activePeriod],
    queryFn: () => metricsApi.getOverview(activePeriod).then((r) => r.data),
  });

  const { data: platforms } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => platformsApi.getAll().then((r) => r.data),
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-slate-600">Erreur lors du chargement des données</p>
        <button onClick={() => refetch()} className="btn-primary">Réessayer</button>
      </div>
    );
  }

  if (!overview || overview.totalPlatforms === 0) {
    return <EmptyState />;
  }

  const pieData = (overview.platformBreakdown || []).map((p) => ({
    name: p.platform,
    value: parseInt(p.views) || 0,
    color: PLATFORM_COLORS[p.platform] || '#94a3b8',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Vues totales" value={overview.totalViews} icon={Eye} color="blue" delay={0} />
        <StatsCard title="Likes" value={overview.totalLikes} icon={Heart} color="red" delay={0.05} />
        <StatsCard title="Commentaires" value={overview.totalComments} icon={MessageCircle} color="purple" delay={0.1} />
        <StatsCard title="Partages" value={overview.totalShares} icon={Share2} color="green" delay={0.15} />
        <StatsCard title="Abonnés totaux" value={overview.totalFollowers} icon={Users} color="teal" delay={0.2} />
        <StatsCard title="Publications" value={overview.totalPosts} icon={TrendingUp} color="orange" delay={0.25} />
        <StatsCard title="Engagement moyen" value={`${overview.avgEngagementRate}%`} icon={TrendingUp} color="blue" delay={0.3} />
        <StatsCard title="Plateformes actives" value={overview.totalPlatforms} icon={Users} color="green" delay={0.35} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trend chart */}
        <motion.div
          className="card p-6 xl:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Évolution des vues</h3>
            <ExportButton onClick={exportTrend} />
          </div>
          <div ref={trendRef}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={overview.dailyTrend || []}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                formatter={(v) => [v.toLocaleString('fr-FR'), 'Vues']}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="views" stroke="#1e3a5f" strokeWidth={2} fill="url(#viewsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Platform distribution */}
        <motion.div
          className="card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Répartition par plateforme</h3>
            <ExportButton onClick={exportPie} />
          </div>
          <div ref={pieRef}>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString('fr-FR')} />
                <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Aucune donnée</div>
          )}
          </div>
        </motion.div>
      </div>

      {/* Platform breakdown */}
      <motion.div
        className="card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-base font-semibold text-slate-900 mb-4">Performance par plateforme</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-100">
                {['Plateforme', 'Abonnés', 'Vues', 'Likes', 'Commentaires', 'Partages', 'Engagement'].map((h) => (
                  <th key={h} className="pb-3 pr-4 font-medium text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(overview.platformBreakdown || []).map((p) => {
                const PIcon = PLATFORM_ICONS[p.platform];
                return (
                  <tr key={p.platform} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4">
                      <Link to={`/analytics/${p.platform.toLowerCase()}`} className="flex items-center gap-2 font-medium text-slate-900 hover:text-primary-800">
                        {PIcon && <PIcon size={15} style={{ color: PLATFORM_COLORS[p.platform] }} />}
                        {p.platform}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{(p.followers || 0).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-slate-700">{parseInt(p.views || 0).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-slate-700">{parseInt(p.likes || 0).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-slate-700">{parseInt(p.comments || 0).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-slate-700">{parseInt(p.shares || 0).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`badge ${parseFloat(p.engagement) >= 3 ? 'bg-green-50 text-green-700' : parseFloat(p.engagement) >= 1 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                        {p.engagement}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="h-80 bg-slate-200 rounded-xl xl:col-span-2" />
        <div className="h-80 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-64 bg-slate-200 rounded-xl" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-6 text-center">
      <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center">
        <TrendingUp size={36} className="text-primary-800" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Connectez vos réseaux sociaux</h2>
        <p className="text-slate-500 max-w-md">
          Commencez par connecter au moins une plateforme pour voir vos analyses centralisées.
        </p>
      </div>
      <Link to="/settings" className="btn-primary gap-2">
        <Plus size={16} />
        Connecter une plateforme
      </Link>
    </div>
  );
}
