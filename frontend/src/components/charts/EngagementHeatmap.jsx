import { useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h`);

function getColor(value, max) {
  if (max === 0 || value === 0) return 'bg-slate-100';
  const pct = value / max;
  if (pct < 0.2) return 'bg-primary-100';
  if (pct < 0.4) return 'bg-primary-200';
  if (pct < 0.6) return 'bg-primary-400';
  if (pct < 0.8) return 'bg-primary-600';
  return 'bg-primary-800';
}

function getTextColor(value, max) {
  if (max === 0 || value === 0) return 'text-slate-300';
  const pct = value / max;
  return pct >= 0.6 ? 'text-white' : 'text-slate-700';
}

export default function EngagementHeatmap({ data = [], title = 'Heatmap d\'engagement', exportable = true }) {
  const ref = useRef(null);

  // data: [{ hour: 0-23, day: 0-6 (0=Mon), value: number }]
  const { grid, maxValue } = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
    let maxValue = 0;
    for (const item of data) {
      if (item.day >= 0 && item.day < 7 && item.hour >= 0 && item.hour < 24) {
        grid[item.day][item.hour] = item.value;
        if (item.value > maxValue) maxValue = item.value;
      }
    }
    return { grid, maxValue };
  }, [data]);

  const handleExport = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = 'heatmap-engagement.png';
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {exportable && (
          <button onClick={handleExport} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
            <Download size={12} /> PNG
          </button>
        )}
      </div>
      <div ref={ref} className="overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {HOURS.map((h, i) => (
              <div key={h} className="flex-1 text-center text-[9px] text-slate-400 font-mono">
                {i % 3 === 0 ? h : ''}
              </div>
            ))}
          </div>
          {/* Grid */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center mb-0.5 gap-0.5">
              <div className="w-10 text-xs text-slate-500 shrink-0">{day}</div>
              {grid[dayIdx].map((value, hour) => (
                <div
                  key={hour}
                  title={`${day} ${HOURS[hour]}: ${value.toLocaleString()} engagements`}
                  className={`flex-1 h-6 rounded-sm flex items-center justify-center cursor-default transition-transform hover:scale-110 ${getColor(value, maxValue)}`}
                >
                  {value > 0 && maxValue > 0 && value / maxValue > 0.7 && (
                    <span className={`text-[9px] font-bold ${getTextColor(value, maxValue)}`}>
                      {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[10px] text-slate-400">Faible</span>
            {['bg-slate-100', 'bg-primary-100', 'bg-primary-200', 'bg-primary-400', 'bg-primary-600', 'bg-primary-800'].map((c) => (
              <div key={c} className={`w-5 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] text-slate-400">Élevé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
