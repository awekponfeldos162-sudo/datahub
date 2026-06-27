import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { authApi } from '../api/client';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, logout } = useAuthStore();

  useEffect(() => {
    // Les tokens arrivent dans le hash fragment (non loggé côté serveur)
    const hash = window.location.hash.slice(1);
    const hashParams = new URLSearchParams(hash);

    const accessToken = hashParams.get('at');
    const refreshToken = hashParams.get('rt');
    // Compatibilité ancienne méthode (query params) en cas de fallback
    const legacyAt = params.get('accessToken');
    const legacyRt = params.get('refreshToken');
    const error = params.get('error');

    if (error) {
      toast.error('Échec de la connexion via Google. Réessayez.');
      navigate('/login', { replace: true });
      return;
    }

    const at = accessToken || legacyAt;
    const rt = refreshToken || legacyRt;

    if (at && rt) {
      // Nettoyer l'URL immédiatement (supprimer le hash avec les tokens)
      window.history.replaceState(null, '', window.location.pathname);

      useAuthStore.setState({ accessToken: at, refreshToken: rt });

      authApi.getProfile()
        .then((res) => {
          login(res.data, at, rt);
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          logout();
          toast.error('Erreur lors de la récupération du profil. Reconnectez-vous.');
          navigate('/login', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div
          className="w-12 h-12 border-4 border-primary-800/20 border-t-primary-800 rounded-full animate-spin mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="text-slate-600 dark:text-slate-400" aria-live="polite">Connexion en cours…</p>
      </div>
    </div>
  );
}
