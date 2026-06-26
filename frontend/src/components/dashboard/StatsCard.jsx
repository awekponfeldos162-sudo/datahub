import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function StatsCard({ title, value, icon: Icon, change, changeLabel, color = 'blue', delay = 0 }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isNeutral ? (
                <Minus size={14} className="text-slate-400" />
              ) : isPositive ? (
                <TrendingUp size={14} className="text-green-500" />
              ) : (
                <TrendingDown size={14} className="text-red-500" />
              )}
              <span className={clsx('text-xs font-medium',
                isNeutral ? 'text-slate-400' : isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {isPositive ? '+' : ''}{change}%
              </span>
              {changeLabel && <span className="text-xs text-slate-400">{changeLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', colorMap[color])}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
