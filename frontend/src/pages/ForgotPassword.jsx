import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/client';
import toast from 'react-hot-toast';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4">
            <ArrowLeft size={14} aria-hidden="true" />
            Retour à la connexion
          </Link>
          <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
            <Mail size={24} className="text-primary-800 dark:text-primary-400" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Mot de passe oublié</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" aria-hidden="true" />
            <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">Email envoyé !</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Si cet email est associé à un compte, vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <Link to="/login" className="btn-primary mt-6 inline-flex">Retour à la connexion</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulaire mot de passe oublié">
            <div>
              <label htmlFor="email" className="label">Adresse email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
