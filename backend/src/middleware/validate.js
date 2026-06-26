const { z } = require('zod');

// Wrap Zod schema into Express middleware
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors,
      });
    }
    req[source] = result.data;
    next();
  };
}

// ─── Schemas ──────────────────────────────────────────────────
const schemas = {
  register: z.object({
    email: z.string().email('Email invalide').toLowerCase(),
    password: z.string().min(8, 'Mot de passe minimum 8 caractères').max(128),
    fullName: z.string().min(2, 'Nom complet requis').max(100).trim(),
  }),

  login: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),

  forgotPassword: z.object({
    email: z.string().email('Email invalide').toLowerCase(),
  }),

  resetPassword: z.object({
    token: z.string().min(1),
    password: z.string().min(8, 'Mot de passe minimum 8 caractères').max(128),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string().min(8, 'Nouveau mot de passe minimum 8 caractères').max(128),
  }),

  updateProfile: z.object({
    fullName: z.string().min(2).max(100).trim().optional(),
    avatar: z.string().url().optional().nullable(),
  }),

  generateReport: z.object({
    title: z.string().min(1).max(200),
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
    platforms: z.array(z.enum(['FACEBOOK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'SNAPCHAT'])).min(1),
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
