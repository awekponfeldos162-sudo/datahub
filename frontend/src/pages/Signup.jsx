import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, Check } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const passwordStrength = (() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'][passwordStrength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'][passwordStrength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      return toast.error('Mot de passe minimum 8 caractères');
    }
    setLoading(true);
    try {
      const res = await authApi.register(form);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Compte créé ! Vérifiez votre email.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">DH</span>
            </div>
            <span className="text-xl font-bold text-slate-900">DATAhub</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Créer un compte</h2>
          <p className="text-slate-500 mt-1 text-sm">Commencez gratuitement</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Nom complet</label>
              <input
                type="text"
                className="input"
                placeholder="Jean Dupont"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                className="input"
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Minimum 8 caractères"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColor : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{strengthLabel}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {['1 plateforme gratuite', '30 jours d\'historique', 'Tableau de bord interactif'].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check size={14} className="text-green-500 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={16} />
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-primary-800 font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
