const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.path} - ${err.message}`, {
    stack: err.stack,
    userId: req.user?.id,
  });

  if (err.name === 'ValidationError' || err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Authentification requise' });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Cette ressource existe déjà' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Ressource introuvable' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    // Ne jamais exposer les détails d'erreur interne en production
    message: statusCode === 500 || process.env.NODE_ENV === 'production'
      ? 'Une erreur est survenue'
      : err.message,
  });
}

function notFoundHandler(req, res) {
  // Ne pas révéler le chemin exact — évite l'énumération de routes
  res.status(404).json({ success: false, message: 'Ressource introuvable' });
}

module.exports = { errorHandler, notFoundHandler };
