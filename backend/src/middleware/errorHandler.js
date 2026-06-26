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
      errors: err.details?.map((d) => d.message) || [err.message],
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
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
    message: statusCode === 500 ? 'Erreur interne du serveur' : err.message,
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} introuvable` });
}

module.exports = { errorHandler, notFoundHandler };
