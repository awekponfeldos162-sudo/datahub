import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-primary-800 dark:text-primary-600 mb-4" aria-hidden="true">404</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Page introuvable</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()} className="btn-secondary gap-2">
            <ArrowLeft size={16} aria-hidden="true" />
            Retour
          </button>
          <Link to="/dashboard" className="btn-primary gap-2">
            <Home size={16} aria-hidden="true" />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
