import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { paymentApi } from '../api/client';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Check, Smartphone, CreditCard, Star, Zap, Globe } from 'lucide-react';
import clsx from 'clsx';

const ANNUAL_DISCOUNT = 0.20;

export default function Pricing() {
  const { user } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [gateway, setGateway] = useState('flutterwave');

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => paymentApi.getPlans().then((r) => r.data),
  });

  const { mutate: subscribe, isLoading } = useMutation({
    mutationFn: (plan) => {
      const payload = { plan, billingCycle, paymentMethod };
      if (gateway === 'cinetpay') return paymentApi.initializeCinetPay(payload);
      return paymentApi.initialize(payload);
    },
    onSuccess: (res) => {
      if (res.data?.paymentLink) {
        window.location.href = res.data.paymentLink;
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message),
  });

  function getAnnualPrice(monthlyPrice) {
    if (!monthlyPrice) return null;
    return Math.round(monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT));
  }

  function getDisplayPrice(plan) {
    if (plan.price === null) return null;
    if (plan.price === 0) return 0;
    return billingCycle === 'annual' ? getAnnualPrice(plan.price) : plan.price;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Plans & Tarifs</h2>
        <p className="text-slate-500 dark:text-slate-400">Paiement adapté au marché africain</p>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={clsx(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all',
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            )}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={clsx(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all',
              billingCycle === 'annual'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            )}
          >
            Annuel
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {billingCycle === 'annual' && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-400">
          <Zap size={14} />
          <span>Économisez 20% avec la facturation annuelle — soit 2 mois offerts !</span>
        </div>
      )}

      {/* Payment method & gateway */}
      <div className="card p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3" id="payment-method-label">
            Mode de paiement
          </p>
          <div className="flex flex-wrap gap-3" role="group" aria-labelledby="payment-method-label">
            <button
              onClick={() => setPaymentMethod('mobilemoney')}
              aria-pressed={paymentMethod === 'mobilemoney'}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all',
                paymentMethod === 'mobilemoney'
                  ? 'border-primary-800 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
              )}
            >
              <Smartphone size={15} aria-hidden="true" />
              Mobile Money (MTN, Wave, Orange, Moov)
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              aria-pressed={paymentMethod === 'card'}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all',
                paymentMethod === 'card'
                  ? 'border-primary-800 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
              )}
            >
              <CreditCard size={15} aria-hidden="true" />
              Carte bancaire (Visa / Mastercard)
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3" id="gateway-label">
            Passerelle de paiement
          </p>
          <div className="flex flex-wrap gap-3" role="group" aria-labelledby="gateway-label">
            <button
              onClick={() => setGateway('flutterwave')}
              aria-pressed={gateway === 'flutterwave'}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all',
                gateway === 'flutterwave'
                  ? 'border-primary-800 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
              )}
            >
              <Globe size={15} aria-hidden="true" />
              Flutterwave (Nigeria, Ghana, Kenya…)
            </button>
            <button
              onClick={() => setGateway('cinetpay')}
              aria-pressed={gateway === 'cinetpay'}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all',
                gateway === 'cinetpay'
                  ? 'border-primary-800 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
              )}
            >
              <Globe size={15} aria-hidden="true" />
              CinetPay (Côte d'Ivoire, Sénégal, Cameroun…)
            </button>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(plans || []).map((plan) => {
          const displayPrice = getDisplayPrice(plan);
          const isCurrent = user?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className={clsx(
                'card p-6 transition-all relative',
                plan.recommended ? 'ring-2 ring-primary-800' : '',
                isCurrent ? 'opacity-75' : ''
              )}
            >
              {plan.recommended && (
                <div className="flex items-center gap-1 text-primary-800 dark:text-primary-400 text-xs font-medium mb-3">
                  <Star size={12} fill="currentColor" />
                  Recommandé
                </div>
              )}
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{plan.name}</h3>
              <div className="my-3">
                {displayPrice === null ? (
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">Sur devis</p>
                ) : displayPrice === 0 ? (
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    Gratuit
                  </p>
                ) : (
                  <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {displayPrice.toLocaleString('fr-FR')}
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">
                        FCFA/{billingCycle === 'annual' ? 'an' : 'mois'}
                      </span>
                    </p>
                    {billingCycle === 'annual' && plan.price > 0 && (
                      <p className="text-xs text-slate-400 line-through mt-0.5">
                        {(plan.price * 12).toLocaleString('fr-FR')} FCFA/an
                      </p>
                    )}
                  </div>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-center py-2 text-sm font-medium text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 rounded-lg">
                  Plan actuel
                </div>
              ) : displayPrice === null ? (
                <a
                  href="mailto:contact@datahub.app"
                  className="block text-center py-2 text-sm font-medium border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:border-primary-800 hover:text-primary-800 transition-colors"
                >
                  Nous contacter
                </a>
              ) : displayPrice === 0 ? (
                <div className="text-center py-2 text-sm text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  Plan par défaut
                </div>
              ) : (
                <button
                  onClick={() => subscribe(plan.id)}
                  disabled={isLoading}
                  className={clsx(
                    'w-full py-2 text-sm font-medium rounded-lg transition-all',
                    plan.recommended
                      ? 'bg-primary-800 text-white hover:bg-primary-900'
                      : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary-800 hover:text-primary-800 dark:hover:text-primary-400 dark:hover:border-primary-400'
                  )}
                >
                  {isLoading ? 'Redirection...' : `Souscrire${billingCycle === 'annual' ? ' (annuel)' : ''}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900">
        <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
          Paiements sécurisés via Flutterwave · MTN Mobile Money · Orange Money · Wave · Moov Money · Visa · Mastercard
        </p>
      </div>
    </div>
  );
}
