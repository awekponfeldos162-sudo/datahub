import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authApi } from '../api/client';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const pwStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    return s;
  };

  const strength = pwStrength(password);
  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Token manquant');
    if (password !== confirm) return toast.error('Les mots de passe ne correspondent pas');
    if (password.length < 8) return toast.error('Minimum 8 caractères');

    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, password });
      setDone(true);
      toast.success('Mot de passe réinitialisé');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lien expiré ou invalide');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Lien invalide.</p>
          <Link to="/login" className="btn-primary mt-4 inline-flex">Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-primary-800 dark:text-primary-400" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Nouveau mot de passe</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Choisissez un mot de passe sécurisé</p>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" aria-hidden="true" />
            <p className="text-slate-700 dark:text-slate-300 font-medium">Mot de passe mis à jour !</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Redirection…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulaire de réinitialisation">
            <div>
              <label htmlFor="new-password" className="label">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Masquer' : 'Afficher le mot de passe'}
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1" role="meter" aria-label="Force" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={4}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor[strength] : 'bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{strengthLabel[strength]}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="label">Confirmer</label>
              <input
                id="confirm-password"
                type="password"
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
              {confirm && password !== confirm && (
                <p className="text-xs text-red-600 mt-1" role="alert">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button type="submit" disabled={submitting || (confirm.length > 0 && password !== confirm)} className="btn-primary w-full py-3">
              {submitting ? 'Réinitialisation…' : 'Réinitialiser'}
            </button>

            <Link to="/login" className="block text-center text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">
              Retour à la connexion
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
