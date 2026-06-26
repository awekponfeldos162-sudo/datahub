import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';
import {
  Users, BarChart2, Shield, AlertTriangle, CheckCircle2,
  XCircle, Search, Filter, RefreshCw, Crown, User,
  Trash2, Lock, Unlock, ChevronLeft, ChevronRight,
} from 'lucide-react';

const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserPlan: (id, plan) => api.patch(`/admin/users/${id}/plan`, { plan }),
  toggleUserStatus: (id, active) => api.patch(`/admin/users/${id}/status`, { active }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

const PLANS = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
const PLAN_COLORS = {
  FREE: 'bg-slate-100 text-slate-700',
  STARTER: 'bg-blue-50 text-blue-700',
  PRO: 'bg-primary-50 text-primary-700',
  ENTERPRISE: 'bg-amber-50 text-amber-700',
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [tab, setTab] = useState('users');

  if (user?.plan !== 'ENTERPRISE' && !user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <Shield size={48} className="text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-700">Accès restreint</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Le panneau d'administration est réservé aux administrateurs de la plateforme.
        </p>
      </div>
    );
  }

  return <AdminPanel qc={qc} page={page} setPage={setPage} search={search} setSearch={setSearch}
    planFilter={planFilter} setPlanFilter={setPlanFilter} tab={tab} setTab={setTab} />;
}

function AdminPanel({ qc, page, setPage, search, setSearch, planFilter, setPlanFilter, tab, setTab }) {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
    retry: false,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', page, search, planFilter],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search: search || undefined, plan: planFilter || undefined }).then((r) => r.data),
    retry: false,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: () => adminApi.getAuditLogs({ page, limit: 50 }).then((r) => r.data),
    enabled: tab === 'logs',
    retry: false,
  });

  const { mutate: updatePlan } = useMutation({
    mutationFn: ({ id, plan }) => adminApi.updateUserPlan(id, plan),
    onSuccess: () => { toast.success('Plan mis à jour'); qc.invalidateQueries(['admin-users']); },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, active }) => adminApi.toggleUserStatus(id, active),
    onSuccess: () => { toast.success('Statut mis à jour'); qc.invalidateQueries(['admin-users']); },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => { toast.success('Utilisateur supprimé'); qc.invalidateQueries(['admin-users', 'admin-stats']); },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (u) => {
    if (window.confirm(`Supprimer ${u.email} ? Cette action est irréversible.`)) deleteUser(u.id);
  };

  const statsCards = [
    { label: 'Utilisateurs totaux', value: stats?.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Actifs ce mois', value: stats?.activeThisMonth, icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Comptes connectés', value: stats?.connectedAccounts, icon: BarChart2, color: 'bg-primary-500' },
    { label: 'Rapports générés', value: stats?.totalReports, icon: Shield, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Crown size={20} className="text-amber-500" /> Administration DATAhub
        </h2>
        <p className="text-sm text-slate-500 mt-1">Gestion des utilisateurs, plans et journaux d'audit</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Plan distribution */}
      {stats?.planDistribution && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Distribution des plans</h3>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(stats.planDistribution).map(([plan, count]) => (
              <div key={plan} className={`px-3 py-2 rounded-lg text-sm font-medium ${PLAN_COLORS[plan] || 'bg-slate-100 text-slate-700'}`}>
                {plan} — <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-1">
        {['users', 'logs'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'users' ? 'Utilisateurs' : 'Journaux d\'audit'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="input pl-8 py-1.5 text-sm w-56"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="input py-1.5 text-sm" value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}>
              <option value="">Tous les plans</option>
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={() => qc.invalidateQueries(['admin-users'])} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
              <RefreshCw size={12} /> Actualiser
            </button>
          </div>

          {/* Users table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Utilisateur', 'Plan', 'Vérifié', 'Créé le', 'Dernière connexion', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersLoading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">Chargement...</td></tr>
                  ) : !usersData?.users?.length ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">Aucun utilisateur trouvé</td></tr>
                  ) : usersData.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
                            {u.fullName?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{u.fullName}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.plan}
                          onChange={(e) => updatePlan({ id: u.id, plan: e.target.value })}
                          className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer ${PLAN_COLORS[u.plan]}`}
                        >
                          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.emailVerified
                          ? <CheckCircle2 size={16} className="text-green-500" />
                          : <XCircle size={16} className="text-slate-300" />}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleStatus({ id: u.id, active: !u.isActive })}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                            title={u.isActive ? 'Désactiver' : 'Activer'}
                          >
                            {u.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {usersData?.total > 20 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">{usersData.total} utilisateurs</p>
                <div className="flex items-center gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-2 disabled:opacity-40">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-slate-600">Page {page}</span>
                  <button disabled={page * 20 >= usersData.total} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-2 disabled:opacity-40">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'logs' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Date', 'Action', 'Ressource', 'Utilisateur', 'IP'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsLoading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">Chargement...</td></tr>
                ) : !logsData?.logs?.length ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">Aucun journal</td></tr>
                ) : logsData.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{log.resource}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{log.user?.email || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
