import { useQuery } from '@tanstack/react-query';
import { metricsApi } from '../api/client';
import { useUIStore } from '../store/useStore';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const PLATFORM_COLORS = {
  FACEBOOK: '#1877f2', YOUTUBE: '#ff0000', INSTAGRAM: '#e1306c',
  TIKTOK: '#010101', SNAPCHAT: '#efb400',
};

export default function Compare() {
  const { activePeriod } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['compare', activePeriod],
    queryFn: () => metricsApi.getComparison({ period: activePeriod }).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-500">Connectez plusieurs plateformes pour voir la comparaison</p>
      </div>
    );
  }

  const barData = [
    { metric: 'Vues', ...Object.fromEntries(data.map((d) => [d.platform, d.views])) },
    { metric: 'Likes', ...Object.fromEntries(data.map((d) => [d.platform, d.likes])) },
    { metric: 'Commentaires', ...Object.fromEntries(data.map((d) => [d.platform, d.comments])) },
    { metric: 'Partages', ...Object.fromEntries(data.map((d) => [d.platform, d.shares])) },
  ];

  const radarData = [
    { subject: 'Vues', ...Object.fromEntries(data.map((d) => [d.platform, Math.min(d.views / 1000, 100)])) },
    { subject: 'Engagement', ...Object.fromEntries(data.map((d) => [d.platform, parseFloat(d.engagementRate)])) },
    { subject: 'Abonnés', ...Object.fromEntries(data.map((d) => [d.platform, Math.min(d.followers / 100, 100)])) },
    { subject: 'Publications', ...Object.fromEntries(data.map((d) => [d.platform, Math.min(d.posts * 5, 100)])) },
    { subject: 'Partages', ...Object.fromEntries(data.map((d) => [d.platform, Math.min(d.shares / 10, 100)])) },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {data.map((platform) => (
          <div key={platform.platform} className="card p-4 border-t-4" style={{ borderTopColor: PLATFORM_COLORS[platform.platform] }}>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{platform.platform}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">@{platform.username || 'N/A'}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Abonnés</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{(platform.followers || 0).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Vues</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{parseInt(platform.views || 0).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Engagement</span>
                <span className="font-medium text-green-600">{platform.engagementRate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Métriques comparées</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => v.toLocaleString('fr-FR')} />
              <Legend />
              {data.map((d) => (
                <Bar key={d.platform} dataKey={d.platform} fill={PLATFORM_COLORS[d.platform]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Score global par plateforme</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              {data.map((d) => (
                <Radar
                  key={d.platform}
                  name={d.platform}
                  dataKey={d.platform}
                  stroke={PLATFORM_COLORS[d.platform]}
                  fill={PLATFORM_COLORS[d.platform]}
                  fillOpacity={0.2}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Classement des plateformes</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-100 dark:border-slate-700">
              {['#', 'Plateforme', 'Abonnés', 'Publications', 'Vues', 'Engagement %', 'Partages'].map((h) => (
                <th key={h} className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {[...data].sort((a, b) => b.views - a.views).map((p, i) => (
              <tr key={p.platform} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400 font-medium">#{i + 1}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[p.platform] }} aria-hidden="true" />
                    <span className="font-medium text-slate-900 dark:text-slate-100">{p.platform}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{(p.followers || 0).toLocaleString('fr-FR')}</td>
                <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{p.posts || 0}</td>
                <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{parseInt(p.views || 0).toLocaleString('fr-FR')}</td>
                <td className="px-6 py-3">
                  <span className={`badge ${parseFloat(p.engagementRate) >= 3 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {p.engagementRate}%
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{parseInt(p.shares || 0).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
