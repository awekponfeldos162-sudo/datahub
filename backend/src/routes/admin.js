const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
router.use(authenticate, requireAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalPlatforms, totalPosts, planBreakdown] = await Promise.all([
      prisma.user.count(),
      prisma.platformAccount.count({ where: { isActive: true } }),
      prisma.post.count(),
      prisma.user.groupBy({ by: ['plan'], _count: { id: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPlatforms,
        totalPosts,
        planBreakdown: planBreakdown.map((p) => ({ plan: p.plan, count: p._count.id })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { fullName: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, fullName: true, plan: true,
          emailVerified: true, createdAt: true, lastLoginAt: true,
          _count: { select: { platformAccounts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: { users, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/plan', async (req, res, next) => {
  try {
    const { plan } = req.body;
    const validPlans = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: 'Plan invalide' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { plan },
      select: { id: true, email: true, plan: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { active } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { emailVerified: Boolean(active) },
      select: { id: true, email: true, emailVerified: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Impossible de supprimer votre propre compte' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } } },
      }),
      prisma.auditLog.count(),
    ]);
    res.json({ success: true, data: { logs, total } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
