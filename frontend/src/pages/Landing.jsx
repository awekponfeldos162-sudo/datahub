import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2, Shield, Globe, Zap, ArrowRight, Check,
  Facebook, Youtube, Instagram, Music2, Ghost,
} from 'lucide-react';

const FEATURES = [
  { icon: BarChart2, title: 'Dashboard Unifié', desc: 'Toutes vos métriques sur un seul écran interactif avec graphiques en temps réel.' },
  { icon: Zap, title: 'Recommandations IA', desc: 'Obtenez les meilleurs horaires de publication et types de contenu basés sur vos données.' },
  { icon: Globe, title: 'Rapports PDF/Excel', desc: 'Exportez vos analyses en un clic pour vos présentations et prises de décision.' },
  { icon: Shield, title: 'Sécurité maximale', desc: 'Tokens OAuth chiffrés AES-256, JWT RS256, conformité RGPD complète.' },
];

const PLANS = [
  { name: 'Free', price: '0', features: ['1 plateforme', '30j historique', '2 rapports/mois'] },
  { name: 'Starter', price: '5 000', features: ['3 plateformes', '90j historique', '10 rapports/mois', 'Recommandations'] },
  { name: 'Pro', price: '15 000', features: ['5 plateformes', '12 mois historique', 'Rapports illimités', 'IA avancée'], highlighted: true },
  { name: 'Enterprise', price: 'Devis', features: ['Illimité', 'API privée', 'Support dédié', 'SLA garanti'] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">DH</span>
            </div>
            <span className="font-bold text-lg text-slate-900">DATAhub</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900">Fonctionnalités</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Tarifs</a>
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">Connexion</Link>
            <Link to="/signup" className="btn-primary text-sm">Commencer gratuitement</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-primary-950 to-primary-800 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-medium">Version 1.0 — Juin 2025</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              Centralisez vos<br />
              <span className="text-blue-300">réseaux sociaux</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
              DATAhub connecte Facebook, YouTube, Instagram, TikTok et Snapchat dans un seul tableau de bord analytique. Conçu pour le marché africain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary py-3 px-8 text-base gap-2 bg-white text-primary-800 hover:bg-white/90">
                Démarrer gratuitement <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="py-3 px-8 text-base rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors">
                Se connecter
              </Link>
            </div>
          </motion.div>

          {/* Platform icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex justify-center gap-6 mt-16"
          >
            {[
              { Icon: Facebook, color: '#1877f2', label: 'Facebook' },
              { Icon: Youtube, color: '#ff0000', label: 'YouTube' },
              { Icon: Instagram, color: '#e1306c', label: 'Instagram' },
              { Icon: Music2, color: '#ffffff', label: 'TikTok' },
              { Icon: Ghost, color: '#fffc00', label: 'Snapchat' },
            ].map(({ Icon, color, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icon size={22} style={{ color }} />
                </div>
                <span className="text-[10px] text-white/60">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '5', label: 'Plateformes intégrées' },
            { value: '~3h', label: 'Économisées/semaine' },
            { value: 'AES-256', label: 'Chiffrement tokens' },
            { value: '100%', label: 'Francophone & local' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-black text-primary-800">{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">Tout ce dont vous avez besoin</h2>
          <p className="text-center text-slate-500 mb-12">Une solution complète pour analyser votre présence digitale</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary-800" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">Tarifs adaptés au marché africain</h2>
          <p className="text-center text-slate-500 mb-12">Paiement via Mobile Money (MTN, Wave, Moov), Visa, ou Mastercard</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {PLANS.map(({ name, price, features, highlighted }) => (
              <div key={name} className={`card p-6 ${highlighted ? 'ring-2 ring-primary-800 bg-primary-800 text-white' : ''}`}>
                {highlighted && (
                  <div className="badge bg-white/20 text-white mb-3 text-[10px]">Recommandé</div>
                )}
                <h3 className={`font-bold text-lg mb-1 ${highlighted ? 'text-white' : 'text-slate-900'}`}>{name}</h3>
                <div className="mb-4">
                  <span className={`text-2xl font-black ${highlighted ? 'text-white' : 'text-slate-900'}`}>{price}</span>
                  {price !== 'Devis' && <span className={`text-sm ml-1 ${highlighted ? 'text-white/70' : 'text-slate-500'}`}>FCFA/mois</span>}
                </div>
                <ul className="space-y-2 mb-6">
                  {features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${highlighted ? 'text-white/80' : 'text-slate-600'}`}>
                      <Check size={13} className={highlighted ? 'text-white' : 'text-green-500'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`block text-center py-2 rounded-lg text-sm font-medium transition-all ${
                    highlighted
                      ? 'bg-white text-primary-800 hover:bg-white/90'
                      : 'border border-slate-200 text-slate-700 hover:border-primary-800 hover:text-primary-800'
                  }`}
                >
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-primary-950 text-white/60 text-sm text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
            <span className="text-primary-800 font-black text-xs">DH</span>
          </div>
          <span className="font-bold text-white">DATAhub</span>
        </div>
        <p>© 2025 DATAhub — Plateforme d'Analyse Multi-Réseaux Sociaux</p>
        <p className="mt-1">Version 1.0 — Confidentiel — contact@datahub.app</p>
      </footer>
    </div>
  );
}
