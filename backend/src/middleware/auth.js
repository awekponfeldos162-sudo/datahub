const passport = require('passport');
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      // Message générique — ne pas exposer les détails internes de Passport
      // ("No auth token", "jwt expired", "invalid signature", etc.)
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }
    req.user = user;
    next();
  })(req, res, next);
}

function requirePlan(...plans) {
  return (req, res, next) => {
    if (!plans.includes(req.user?.plan)) {
      return res.status(403).json({
        success: false,
        message: `Cette fonctionnalité requiert un plan ${plans.join(' ou ')}`,
        upgrade: true,
      });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  // Seul le champ isAdmin (défini manuellement en DB) donne accès admin
  // Ne pas se fier au plan tarifaire pour les accès administrateur
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: 'Accès refusé' });
  }
  next();
}

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { sub: userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = { authenticate, requirePlan, requireAdmin, generateTokens, verifyRefreshToken };
