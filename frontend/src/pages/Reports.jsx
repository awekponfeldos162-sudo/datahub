import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/client';
import { useAuthStore } from '../store/useStore';
import { FileText, Download, Plus, Calendar, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const PLATFORMS = ['FACEBOOK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'SNAPCHAT', 'PINTEREST'];

export default function Reports() {
  const { user } = useAuthStore();
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    periodStart: '',
    periodEnd: '',
    platforms: [],
    format: 'PDF',
  });

  const { data: history, refetch } = useQuery({
    queryKey: ['reports-history'],
    queryFn: () => reportsApi.getHistory().then((r) => r.data),
  });

  const canGenerate = user?.plan !== 'FREE';

  const togglePlatform = (p) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.periodStart || !form.periodEnd) {
      return toast.error('Remplissez tous les champs requis');
    }
    if (new Date(form.periodStart) >= new Date(form.periodEnd)) {
      return toast.error('La date de début doit être antérieure à la date de fin');
    }
    if (form.platforms.length === 0) {
      return toast.error('Sélectionnez au moins une plateforme');
    }

    setGenerating(true);
    try {
      const blob = await reportsApi.generate({
        ...form,
        periodStart: new Date(form.periodStart).toISOString(),
        periodEnd: new Date(form.periodEnd).toISOString(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-datahub-${Date.now()}.${form.format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Rapport généré et téléchargé !');
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator form */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Plus size={16} aria-hidden="true" /> Nouveau rapport
            </h3>

            {!canGenerate ? (
              <div className="text-center py-8">
                <Lock size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Plan payant requis</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Les rapports sont disponibles à partir du plan Starter.</p>
                <a href="/pricing" className="btn-primary text-xs">Mettre à niveau</a>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="space-y-4" aria-label="Formulaire de génération de rapport">
                <div>
                  <label htmlFor="report-title" className="label">Titre du rapport</label>
                  <input
                    id="report-title"
                    type="text"
                    className="input"
                    placeholder="Rapport mensuel juin 2025"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="period-start" className="label">Date début</label>
                    <input
                      id="period-start"
                      type="date"
                      className="input"
                      value={form.periodStart}
                      onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="period-end" className="label">Date fin</label>
                    <input
                      id="period-end"
                      type="date"
                      className="input"
                      value={form.periodEnd}
                      onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <fieldset>
                  <legend className="label">Plateformes</legend>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={form.platforms.includes(p)}
                        onClick={() => togglePlatform(p)}
                        className={`badge cursor-pointer transition-all ${
                          form.platforms.includes(p)
                            ? 'bg-primary-800 text-white dark:bg-primary-600'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Sélectionnez une ou plusieurs plateformes</p>
                </fieldset>

                <fieldset>
                  <legend className="label">Format</legend>
                  <div className="flex gap-2 mt-1">
                    {['PDF', 'EXCEL'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={form.format === f}
                        onClick={() => setForm({ ...form, format: f })}
                        className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                          form.format === f
                            ? 'bg-primary-800 dark:bg-primary-600 text-white border-primary-800 dark:border-primary-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <button type="submit" disabled={generating} className="btn-primary w-full py-3">
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      Génération en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download size={14} aria-hidden="true" />
                      Générer et télécharger
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Historique des rapports</h3>
            </div>

            {(!history || history.length === 0) ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <FileText size={36} className="mx-auto mb-3 opacity-30" aria-hidden="true" />
                <p>Aucun rapport généré</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50" role="list" aria-label="Historique des rapports">
                {history.map((report) => (
                  <div key={report.id} role="listitem" className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      report.format === 'PDF' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'
                    }`} aria-hidden="true">
                      <FileText size={18} className={report.format === 'PDF' ? 'text-red-600' : 'text-green-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{report.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Calendar size={10} aria-hidden="true" />
                          {new Date(report.periodStart).toLocaleDateString('fr-FR')} — {new Date(report.periodEnd).toLocaleDateString('fr-FR')}
                        </span>
                        <span className={`badge ${report.format === 'PDF' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                          {report.format}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      <span className={`badge text-[10px] mt-1 ${
                        report.status === 'completed'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700'
                      }`}>
                        {report.status === 'completed' ? 'Terminé' : 'En cours'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
