import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/useStore';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const txStatus = params.get('status');
    const txRef = params.get('tx_ref') || params.get('transaction_id');
    const cancelled = txStatus === 'cancelled' || txStatus === 'REFUSED';

    if (cancelled) {
      setStatus('cancelled');
      return;
    }

    // Ne pas faire confiance au status URL — vérifier le plan réel côté serveur
    // Le webhook Flutterwave/CinetPay a déjà mis à jour la DB
    authApi.getProfile()
      .then((res) => {
        const plan = res.data?.plan;
        if (plan && plan !== 'FREE') {
          // Le plan a bien été mis à jour par le webhook
          updateUser({ plan });
          setStatus('success');
          setTimeout(() => navigate('/settings', { replace: true }), 4000);
        } else if (txRef) {
          // Webhook peut prendre quelques secondes — afficher pending
          setStatus('pending');
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        // Si non connecté ou erreur réseau, fallback sur l'URL status
        if (txStatus === 'successful' || txStatus === 'ACCEPTED' || txRef) {
          setStatus('pending');
        } else {
          setStatus('error');
        }
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="card p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="text-primary-800 mx-auto mb-4 animate-spin" aria-hidden="true" />
            <p className="text-slate-600 dark:text-slate-400" aria-live="polite">Vérification du paiement…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Paiement réussi !</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Votre abonnement est activé. Redirection…</p>
            <Link to="/dashboard" className="btn-primary">Aller au tableau de bord</Link>
          </>
        )}
        {status === 'pending' && (
          <>
            <Loader2 size={48} className="text-primary-800 mx-auto mb-4 animate-spin" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Paiement en cours de validation</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Votre paiement est en cours de confirmation. L'abonnement sera activé dans quelques instants.
            </p>
            <Link to="/settings" className="btn-primary">Vérifier dans les paramètres</Link>
          </>
        )}
        {status === 'cancelled' && (
          <>
            <XCircle size={48} className="text-yellow-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Paiement annulé</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Vous avez annulé le paiement. Aucun montant n'a été débité.</p>
            <Link to="/pricing" className="btn-primary">Retour aux plans</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Erreur de paiement</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Une erreur s'est produite. Contactez le support si vous avez été débité.</p>
            <Link to="/pricing" className="btn-primary">Réessayer</Link>
          </>
        )}
      </div>
    </div>
  );
}
