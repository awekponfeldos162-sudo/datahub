import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { paymentApi } from '../api/client';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Check, Smartphone, CreditCard, Star } from 'lucide-react';

export default function Pricing() {
  const { user } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => paymentApi.getPlans().then((r) => r.data),
  });

  const { mutate: subscribe, isLoading } = useMutation({
    mutationFn: (plan) => paymentApi.initialize({ plan, paymentMethod }),
    onSuccess: (res) => {
      if (res.data?.paymentLink) {
        window.location.href = res.data.paymentLink;
      }
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Plans & Tarifs</h2>
        <p className="text-slate-500">Paiement adapté au marché africain</p>
      </div>

      {/* Payment method */}
      <div className="card p-4">
        <p className="text-sm font-medium text-slate-700 mb-3">Mode de paiement</p>
        <div className="flex gap-3">
          <button
            onClick={() => setPaymentMethod('mobile_money')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
              paymentMethod === 'mobile_money' ? 'border-primary-800 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-600'
            }`}
          >
            <Smartphone size={15} />
            Mobile Money (MTN, Wave, Moov)
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
              paymentMethod === 'card' ? 'border-primary-800 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-600'
            }`}
          >
            <CreditCard size={15} />
            Carte bancaire (Visa / Mastercard)
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(plans || []).map((plan) => (
          <div
            key={plan.id}
            className={`card p-6 transition-all ${
              plan.recommended ? 'ring-2 ring-primary-800' : ''
            } ${user?.plan === plan.id ? 'opacity-75' : ''}`}
          >
            {plan.recommended && (
              <div className="flex items-center gap-1 text-primary-800 text-xs font-medium mb-3">
                <Star size={12} fill="currentColor" />
                Recommandé
              </div>
            )}
            <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
            <div className="my-3">
              {plan.price === null ? (
                <p className="text-2xl font-black text-slate-900">Sur devis</p>
              ) : (
                <p className="text-2xl font-black text-slate-900">
                  {plan.price.toLocaleString()}
                  <span className="text-sm font-normal text-slate-500 ml-1">FCFA/mois</span>
                </p>
              )}
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {user?.plan === plan.id ? (
              <div className="text-center py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg">
                Plan actuel
              </div>
            ) : plan.price === null ? (
              <a
                href="mailto:contact@datahub.app"
                className="block text-center py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:border-primary-800 hover:text-primary-800 transition-colors"
              >
                Nous contacter
              </a>
            ) : plan.price === 0 ? (
              <div className="text-center py-2 text-sm text-slate-400 bg-slate-50 rounded-lg">
                Plan par défaut
              </div>
            ) : (
              <button
                onClick={() => subscribe(plan.id)}
                disabled={isLoading}
                className={`w-full py-2 text-sm font-medium rounded-lg transition-all ${
                  plan.recommended
                    ? 'bg-primary-800 text-white hover:bg-primary-900'
                    : 'border border-slate-200 text-slate-700 hover:border-primary-800 hover:text-primary-800'
                }`}
              >
                {isLoading ? 'Redirection...' : 'Souscrire'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card p-4 bg-blue-50 border-blue-100">
        <p className="text-sm text-blue-800 text-center">
          Paiements sécurisés via Flutterwave · MTN Mobile Money · Orange Money · Wave · Moov Money · Visa · Mastercard
        </p>
      </div>
    </div>
  );
}
