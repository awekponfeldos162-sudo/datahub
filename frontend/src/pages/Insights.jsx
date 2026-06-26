import { useQuery } from '@tanstack/react-query';
import { insightsApi } from '../api/client';
import { Clock, Star, TrendingUp, AlertTriangle, CheckCircle2, Zap, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ICON_MAP = { clock: Clock, star: Star, alert: AlertTriangle, 'trending-up': TrendingUp };

const PRIORITY_STYLE = {
  high: 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30',
  medium: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
  low: 'border-l-4 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50',
};

export default function Insights() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['insights'],
    queryFn: () => insightsApi.get().then((r) => r.data),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-label="Chargement des recommandations" aria-busy="true">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center">
        <Zap size={36} className="text-yellow-400 mx-auto mb-3" aria-hidden="true" />
        <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">Fonctionnalité premium</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Les recommandations IA sont disponibles à partir du plan Starter.</p>
      </div>
    );
  }

  if (!data) return null;

  const { recommendations, alerts, bestPostingTimes, bestContentTypes, platformRanking } = data;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts?.length > 0 && (
        <section aria-labelledby="alerts-heading">
          <h2 id="alerts-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" aria-hidden="true" /> Alertes
          </h2>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                role="alert"
                className={`p-4 rounded-xl ${alert.severity === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className={`${alert.severity === 'warning' ? 'text-yellow-600' : 'text-red-600'} mt-0.5`} aria-hidden="true" />
                  <div>
                    <span className="badge bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 mb-1">{alert.platform}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section aria-labelledby="recommendations-heading">
        <h2 id="recommendations-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-500" aria-hidden="true" /> Recommandations
        </h2>
        <div className="space-y-3">
          {(recommendations || []).map((rec, i) => {
            const Icon = ICON_MAP[rec.icon] || TrendingUp;
            return (
              <div key={i} className={`p-4 rounded-xl ${PRIORITY_STYLE[rec.priority]}`}>
                <div className="flex items-start gap-3">
                  <Icon size={16} className="text-primary-800 dark:text-primary-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{rec.title}</p>
                      <span className={`badge text-[10px] ${rec.priority === 'high'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'}`}>
                        {rec.priority === 'high' ? 'Priorité haute' : 'Priorité moyenne'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{rec.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {(!recommendations || recommendations.length === 0) && (
            <div className="card p-8 text-center text-slate-400 dark:text-slate-500">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" aria-hidden="true" />
              <p>Excellent ! Aucune recommandation critique pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Best posting times + content types */}
      {bestPostingTimes && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Clock size={16} aria-hidden="true" /> Meilleurs horaires de publication
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bestPostingTimes.hourlyChart || []} aria-label="Graphique des meilleurs horaires">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(h) => `${h}h`} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip labelFormatter={(h) => `${h}h00`} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="value" fill="#1e3a5f" radius={[2, 2, 0, 0]} name="Engagement moy." />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {(bestPostingTimes.bestHours || []).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">#{i + 1} — {h.label}</span>
                  <span className="font-medium text-primary-800 dark:text-primary-400">{h.avgEngagement} interactions moy.</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Star size={16} aria-hidden="true" /> Types de contenu performants
            </h3>
            <div className="space-y-3">
              {(bestContentTypes || []).slice(0, 5).map((ct, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 text-xs flex items-center justify-center font-bold shrink-0" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{ct.type}</span>
                      <span className="text-slate-500 dark:text-slate-400">{ct.avgEngagement} eng. moy.</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round((ct.avgEngagement / (bestContentTypes[0]?.avgEngagement || 1)) * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className="h-full bg-primary-800 dark:bg-primary-600 rounded-full"
                        style={{ width: `${Math.min((ct.avgEngagement / (bestContentTypes[0]?.avgEngagement || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Platform ranking */}
      {platformRanking?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <BarChart2 size={16} aria-hidden="true" /> Classement de performance
          </h3>
          <div className="space-y-3" role="list" aria-label="Classement des plateformes">
            {platformRanking.map((p, i) => (
              <div key={p.platform} role="listitem" className="flex items-center gap-4">
                <span className="text-lg font-bold text-slate-300 dark:text-slate-600 w-6" aria-label={`Rang ${i + 1}`}>#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.platform}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{parseFloat(p.engagementRate).toFixed(2)}% engagement</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round((p.score / (platformRanking[0]?.score || 1)) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Score de ${p.platform}`}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((p.score / (platformRanking[0]?.score || 1)) * 100, 100)}%`,
                        background: i === 0 ? '#1e3a5f' : i === 1 ? '#3b82f6' : '#93c5fd',
                      }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{(p.followers || 0).toLocaleString('fr-FR')}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">abonnés</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
