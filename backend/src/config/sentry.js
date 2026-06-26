const Sentry = require('@sentry/node');

function initSentry() {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
    beforeSend(event) {
      // Ne pas envoyer les erreurs 4xx en production
      if (event.exception) {
        const status = event.extra?.status;
        if (status && status >= 400 && status < 500) return null;
      }
      return event;
    },
  });
}

module.exports = { Sentry, initSentry };
