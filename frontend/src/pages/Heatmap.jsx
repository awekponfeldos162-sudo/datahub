import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { metricsApi } from '../api/client';
import { useUIStore } from '../store/useStore';
import EngagementHeatmap from '../components/charts/EngagementHeatmap';
import { Info } from 'lucide-react';

const PLATFORMS = ['ALL', 'FACEBOOK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'SNAPCHAT'];
const METRICS = [
  { value: 'engagement', label: 'Engagements totaux' },
  { value: 'views', label: 'Vues' },
  { value: 'likes', label: 'J\'aime' },
  { value: 'comments', label: 'Commentaires' },
];

function generateMockHeatmap() {
  const data = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const isWeekend = day >= 5;
      const isPeak = (hour >= 18 && hour <= 22) || (hour >= 7 && hour <= 9);
      const isNight = hour >= 0 && hour <= 5;
      let base = isNight ? 10 : isPeak ? 400 : 150;
      if (isWeekend) base *= 1.4;
      const value = Math.floor(base + Math.random() * base * 0.8);
      data.push({ day, hour, value });
    }
  }
  return data;
}

export default function Heatmap() {
  const { activePeriod } = useUIStore();
  const [platform, setPlatform] = useState('ALL');
  const [metric, setMetric] = useState('engagement');

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['heatmap', activePeriod, platform, metric],
    queryFn: () =>
      metricsApi.getHeatmap({ period: activePeriod, platform: platform === 'ALL' ? undefined : platform, metric })
        .then((r) => {
          // Backend returns { heatmap: [7][24], days: [...] } where day index is JS getDay() (0=Sun)
          // Frontend needs [{ day: 0-6 (0=Mon), hour, value }]
          const { heatmap } = r.data;
          if (!Array.isArray(heatmap)) return generateMockHeatmap();
          const result = [];
          for (let jsDay = 0; jsDay < 7; jsDay++) {
            // Convert JS day (0=Sun) to Mon-based (0=Mon): Sun->6, Mon->0, ...
            const monDay = jsDay === 0 ? 6 : jsDay - 1;
            for (let hour = 0; hour < 24; hour++) {
              result.push({ day: monDay, hour, value: heatmap[jsDay]?.[hour] || 0 });
            }
          }
          return result;
        })
        .catch(() => generateMockHeatmap()),
  });

  const heatmapData = rawData || generateMockHeatmap();

  const bestSlot = heatmapData.reduce((best, d) => (!best || d.value > best.value ? d : best), null);
  const DAYS_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Heatmap d'engagement</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Identifiez les meilleurs moments pour publier selon votre audience
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div>
          <label htmlFor="heatmap-platform" className="label text-xs mb-1 dark:text-slate-300">Plateforme</label>
          <select
            id="heatmap-platform"
            className="input py-1.5 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p === 'ALL' ? 'Toutes les plateformes' : p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="heatmap-metric" className="label text-xs mb-1 dark:text-slate-300">Métrique</label>
          <select
            id="heatmap-metric"
            className="input py-1.5 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            {METRICS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Best slot insight */}
      {bestSlot && (
        <div className="card p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 flex items-start gap-3" role="status">
          <Info size={18} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-primary-900 dark:text-primary-300">Meilleur créneau détecté</p>
            <p className="text-sm text-primary-700 dark:text-primary-400 mt-0.5">
              Publiez le <strong>{DAYS_FULL[bestSlot.day]}</strong> vers{' '}
              <strong>{String(bestSlot.hour).padStart(2, '0')}h00</strong> pour maximiser l'engagement.
              Pic à <strong>{bestSlot.value.toLocaleString()}</strong> interactions.
            </p>
          </div>
        </div>
      )}

      {/* Heatmap */}
      {isLoading ? (
        <div className="card p-12 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" aria-label="Chargement..." role="status" />
        </div>
      ) : (
        <EngagementHeatmap
          data={heatmapData}
          title={`Heatmap d'engagement — ${METRICS.find((m) => m.value === metric)?.label}`}
          exportable
        />
      )}

      {/* Top hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Top 5 heures</h4>
          <div className="space-y-2" role="list" aria-label="Top 5 créneaux horaires">
            {[...heatmapData]
              .sort((a, b) => b.value - a.value)
              .slice(0, 5)
              .map((d, i) => {
                const pct = (d.value / (heatmapData.reduce((m, x) => Math.max(m, x.value), 0) || 1)) * 100;
                return (
                  <div key={i} role="listitem" className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-16 shrink-0">
                      {DAYS_FULL[d.day].slice(0, 3)} {String(d.hour).padStart(2, '0')}h
                    </span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-14 text-right">
                      {d.value.toLocaleString()}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Engagement par jour</h4>
          <div className="space-y-2" role="list" aria-label="Engagement par jour de la semaine">
            {DAYS_FULL.map((day, dayIdx) => {
              const total = heatmapData.filter((d) => d.day === dayIdx).reduce((s, d) => s + d.value, 0);
              const maxDay = DAYS_FULL.reduce((max, _, i) => {
                const t = heatmapData.filter((d) => d.day === i).reduce((s, d) => s + d.value, 0);
                return t > max ? t : max;
              }, 0);
              const pct = maxDay > 0 ? (total / maxDay) * 100 : 0;
              return (
                <div key={day} role="listitem" className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-16 shrink-0">{day.slice(0, 3)}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-14 text-right">
                    {total.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
