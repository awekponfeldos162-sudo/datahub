import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../api/client';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="card p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="text-primary-800 mx-auto mb-4 animate-spin" aria-hidden="true" />
            <p className="text-slate-600 dark:text-slate-400" aria-live="polite">Vérification de votre adresse email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Email vérifié !</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Votre adresse email a été vérifiée. Vous pouvez maintenant vous connecter.
            </p>
            <Link to="/login" className="btn-primary">Se connecter</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Lien invalide</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Ce lien de vérification est expiré ou invalide.
            </p>
            <Link to="/login" className="btn-primary">Retour à la connexion</Link>
          </>
        )}
      </div>
    </div>
  );
}
