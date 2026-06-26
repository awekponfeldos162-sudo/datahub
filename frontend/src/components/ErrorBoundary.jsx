import { Component } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (typeof window !== 'undefined' && window.__SENTRY__) {
      window.__SENTRY__.captureException(error, { extra: info });
    }
    console.error('React ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4" role="alert">
          <div className="card p-10 max-w-md w-full text-center">
            <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Une erreur inattendue s'est produite
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Rafraîchissez la page pour réessayer. Si le problème persiste, contactez le support.
            </p>
            {this.state.error?.message && (
              <pre className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg mb-6 overflow-auto text-left max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-primary gap-2"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
