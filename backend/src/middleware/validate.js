const { z } = require('zod');

// Messages d'erreur génériques par type — ne révèle pas les règles exactes
const GENERIC_MESSAGES = {
  email: 'Adresse email invalide',
  password: 'Mot de passe invalide',
  currentPassword: 'Mot de passe actuel invalide',
  newPassword: 'Nouveau mot de passe invalide',
  fullName: 'Nom invalide',
  token: 'Token invalide',
  plan: 'Plan invalide',
  platforms: 'Plateformes invalides',
  format: 'Format invalide',
  title: 'Titre invalide',
  periodStart: 'Date de début invalide',
  periodEnd: 'Date de fin invalide',
  billingCycle: 'Cycle de facturation invalide',
  paymentMethod: 'Méthode de paiement invalide',
};

/**
 * Middleware de validation Zod.
 * @param {boolean} exposeFields - false = message générique sans détails (routes publiques)
 */
function validate(schema, source = 'body', exposeFields = false) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      if (exposeFields) {
        // Routes privées (utilisateur connecté) : retourner les détails de champ
        const errors = result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return res.status(400).json({ success: false, message: 'Données invalides', errors });
      }

      // Routes publiques : message générique — ne pas révéler les règles métier
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
      });
    }
    req[source] = result.data;
    next();
  };
}

// ─── Schemas ──────────────────────────────────────────────────
const schemas = {
  register: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(8).max(128),
    fullName: z.string().min(2).max(100).trim(),
  }),

  login: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),

  forgotPassword: z.object({
    email: z.string().email().toLowerCase(),
  }),

  resetPassword: z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }),

  updateProfile: z.object({
    fullName: z.string().min(2).max(100).trim().optional(),
    avatar: z.string().url().optional().nullable(),
  }),

  generateReport: z.object({
    title: z.string().min(1).max(200),
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
    platforms: z.array(z.enum(['FACEBOOK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'SNAPCHAT', 'PINTEREST'])).min(1),
    format: z.enum(['PDF', 'EXCEL']),
  }),

  initPayment: z.object({
    plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
    billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
    paymentMethod: z.enum(['card', 'mobilemoney']).default('card'),
    phone: z.string().optional(),
    network: z.enum(['MTN', 'WAVE', 'MOOV', 'ORANGE']).optional(),
  }),
};

module.exports = { validate, schemas };
