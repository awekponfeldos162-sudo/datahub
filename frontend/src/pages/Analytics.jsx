import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { metricsApi, platformsApi } from '../api/client';
import { useUIStore } from '../store/useStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { RefreshCw, ExternalLink, Eye, Heart, MessageCircle, Share2, Users, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import clsx from 'clsx';

const PLATFORM_COLORS = {
  facebook: '#1877f2', youtube: '#ff0000', instagram: '#e1306c',
  tiktok: '#010101', snapchat: '#fffc00', pinterest: '#e60023',
};

export default function Analytics() {
  const { platform } = useParams();
  const { activePeriod } = useUIStore();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('views');
  const [syncing, setSyncing] = useState(false);

  const color = PLATFORM_COLORS[platform] || '#1e3a5f';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['platform-metrics', platform, activePeriod, page],
    queryFn: () => metricsApi.getPlatform(platform, { period: activePeriod, page, limit: 20, sort: sortBy }).then((r) => r.data),
  });

  async function handleSync() {
    setSyncing(true);
    try {
      await platformsApi.sync(platform.toUpperCase());
      toast.success('Synchronisation réussie !');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSyncing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-500 mb-4">Aucune donnée pour {platform.toUpperCase()}</p>
        <p className="text-sm text-slate-400">Connectez ce réseau social dans les paramètres.</p>
      </div>
    );
  }

  const { account, posts, pagination } = data;

  const chartData = (posts || []).slice(0, 12).map((p) => ({
    name: new Date(p.publishedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    Vues: p.totals?.views || 0,
    Likes: p.totals?.likes || 0,
    Commentaires: p.totals?.comments || 0,
  })).reverse();

  const totals = (posts || []).reduce((acc, p) => ({
    views: acc.views + (p.totals?.views || 0),
    likes: acc.likes + (p.totals?.likes || 0),
    comments: acc.comments + (p.totals?.comments || 0),
    shares: acc.shares + (p.totals?.shares || 0),
  }), { views: 0, likes: 0, comments: 0, shares: 0 });

  const growthRate = account?.followerGrowthRate;
  const hasGrowth = growthRate !== null && growthRate !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
              {account?.avatar ? (
                <img src={account.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <span className="text-xl font-bold" style={{ color }}>{platform[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">{platform.toUpperCase()}</h2>
              <p className="text-slate-500 text-sm">@{account?.username || 'Non connecté'}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {(account?.followers || 0).toLocaleString('fr-FR')} abonnés
                </span>
                {hasGrowth && (
                  <span className={clsx(
                    'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                    growthRate >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  )}>
                    {growthRate >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {growthRate >= 0 ? '+' : ''}{growthRate}% vs période préc.
                  </span>
                )}
                {account?.lastSync && (
                  <span className="text-xs text-slate-400">
                    Sync: {new Date(account.lastSync).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleSync} disabled={syncing} className="btn-secondary gap-2">
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Abonnés', value: account?.followers || 0, icon: Users, special: true },
          { label: 'Vues', value: totals.views, icon: Eye },
          { label: 'Likes', value: totals.likes, icon: Heart },
          { label: 'Commentaires', value: totals.comments, icon: MessageCircle },
          { label: 'Partages', value: totals.shares, icon: Share2 },
        ].map(({ label, value, icon: Icon, special }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} style={{ color }} />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value.toLocaleString('fr-FR')}</p>
            {special && hasGrowth && (
              <p className={clsx('text-xs mt-0.5 font-medium', growthRate >= 0 ? 'text-green-600' : 'text-red-600')}>
                {growthRate >= 0 ? '+' : ''}{growthRate}% croissance
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Performance des publications</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey="Vues" fill={color} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Likes" fill={color + '80'} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Posts table */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Publications ({pagination?.total || 0})
          </h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input w-auto py-1 text-xs"
          >
            <option value="views">Trier par vues</option>
            <option value="likes">Trier par likes</option>
            <option value="comments">Trier par commentaires</option>
          </select>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {(posts || []).length === 0 && (
            <p className="text-center text-slate-400 py-12 text-sm">Aucune publication sur cette période</p>
          )}
          {(posts || []).map((post) => (
            <div key={post.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {post.thumbnailUrl && (
                <img src={post.thumbnailUrl} alt="" className="w-14 h-10 object-cover rounded-md shrink-0 bg-slate-100" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{post.title || 'Sans titre'}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">{post.type}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(post.publishedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 shrink-0">
                <span className="flex items-center gap-1"><Eye size={12} /> {(post.totals?.views || 0).toLocaleString('fr-FR')}</span>
                <span className="flex items-center gap-1"><Heart size={12} /> {(post.totals?.likes || 0).toLocaleString('fr-FR')}</span>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color }}>
                  {post.engagementRate}%
                </span>
              </div>
              {post.url && (
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
        {pagination && pagination.total > pagination.limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-500">
              Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-3 text-xs">
                Précédent
              </button>
              <button disabled={page * pagination.limit >= pagination.total} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-3 text-xs">
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
