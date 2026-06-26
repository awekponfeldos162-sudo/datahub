const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

async function generateReport(req, res, next) {
  try {
    const { title, periodStart, periodEnd, platforms, format } = req.body;
    const userId = req.user.id;

    const report = await prisma.report.create({
      data: {
        userId,
        title,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        platforms: platforms || [],
        format,
        status: 'generating',
      },
    });

    const data = await collectReportData(userId, new Date(periodStart), new Date(periodEnd), platforms);

    if (format === 'PDF') {
      await generatePDF(res, report, data);
    } else {
      await generateExcel(res, report, data);
    }

    await prisma.report.update({
      where: { id: report.id },
      data: { status: 'completed', generatedAt: new Date() },
    });
  } catch (error) {
    next(error);
  }
}

async function collectReportData(userId, periodStart, periodEnd, platforms) {
  const whereClause = {
    userId,
    isActive: true,
    ...(platforms?.length && { platform: { in: platforms } }),
  };

  const accounts = await prisma.platformAccount.findMany({
    where: whereClause,
    include: {
      posts: {
        where: { publishedAt: { gte: periodStart, lte: periodEnd } },
        include: {
          metrics: { where: { metricDate: { gte: periodStart, lte: periodEnd } } },
        },
        orderBy: { publishedAt: 'desc' },
      },
    },
  });

  return accounts.map((account) => {
    const totals = account.posts.reduce(
      (acc, post) => {
        const postMetrics = post.metrics.reduce(
          (a, m) => ({
            views: a.views + m.views,
            likes: a.likes + m.likes,
            comments: a.comments + m.comments,
            shares: a.shares + m.shares,
          }),
          { views: 0, likes: 0, comments: 0, shares: 0 }
        );
        return {
          views: acc.views + postMetrics.views,
          likes: acc.likes + postMetrics.likes,
          comments: acc.comments + postMetrics.comments,
          shares: acc.shares + postMetrics.shares,
        };
      },
      { views: 0, likes: 0, comments: 0, shares: 0 }
    );

    return {
      platform: account.platform,
      username: account.platformUsername,
      followers: account.followerCount,
      totalPosts: account.posts.length,
      ...totals,
      engagementRate: totals.views > 0
        ? (((totals.likes + totals.comments + totals.shares) / totals.views) * 100).toFixed(2)
        : 0,
      topPosts: account.posts
        .map((post) => ({
          title: post.title || 'Sans titre',
          type: post.type,
          publishedAt: post.publishedAt,
          url: post.url,
          views: post.metrics.reduce((sum, m) => sum + m.views, 0),
          likes: post.metrics.reduce((sum, m) => sum + m.likes, 0),
          comments: post.metrics.reduce((sum, m) => sum + m.comments, 0),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5),
    };
  });
}

async function generatePDF(res, report, data) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="rapport-datahub-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill('#1e3a5f');
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold')
    .text('DATAhub', 50, 25);
  doc.fontSize(10).font('Helvetica')
    .text('Rapport d\'Analyse Multi-Réseaux Sociaux', 50, 52);
  doc.fillColor('#000000');

  doc.moveDown(3);
  doc.fontSize(18).font('Helvetica-Bold').text(report.title, { align: 'center' });
  doc.fontSize(11).font('Helvetica').fillColor('#666666')
    .text(`Période: ${formatDate(report.periodStart)} — ${formatDate(report.periodEnd)}`, { align: 'center' });
  doc.moveDown(2);

  // Summary
  const totalStats = data.reduce(
    (acc, d) => ({
      views: acc.views + parseInt(d.views),
      likes: acc.likes + parseInt(d.likes),
      comments: acc.comments + parseInt(d.comments),
      shares: acc.shares + parseInt(d.shares),
      followers: acc.followers + d.followers,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, followers: 0 }
  );

  doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text('Résumé Global');
  doc.moveDown(0.5);

  drawStatBox(doc, 50, doc.y, 'Vues totales', totalStats.views.toLocaleString(), '#2196f3');
  drawStatBox(doc, 180, doc.y - 45, 'Likes', totalStats.likes.toLocaleString(), '#e91e63');
  drawStatBox(doc, 310, doc.y - 45, 'Commentaires', totalStats.comments.toLocaleString(), '#ff9800');
  drawStatBox(doc, 440, doc.y - 45, 'Partages', totalStats.shares.toLocaleString(), '#4caf50');

  doc.moveDown(4);

  // Per platform
  for (const platform of data) {
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f')
      .text(`${platform.platform} — @${platform.username || 'N/A'}`);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1e3a5f').stroke();
    doc.moveDown(0.5);

    const rows = [
      ['Abonnés', platform.followers.toLocaleString()],
      ['Publications', platform.totalPosts.toString()],
      ['Vues totales', parseInt(platform.views).toLocaleString()],
      ['Likes', parseInt(platform.likes).toLocaleString()],
      ['Commentaires', parseInt(platform.comments).toLocaleString()],
      ['Partages', parseInt(platform.shares).toLocaleString()],
      ['Taux d\'engagement', `${platform.engagementRate}%`],
    ];

    for (const [label, value] of rows) {
      doc.fontSize(11).font('Helvetica').fillColor('#333333').text(label, 50, doc.y);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e3a5f').text(value, 300, doc.y - 14);
      doc.moveDown(0.6);
    }

    if (platform.topPosts.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('Top 5 Publications');
      doc.moveDown(0.3);

      for (let i = 0; i < platform.topPosts.length; i++) {
        const post = platform.topPosts[i];
        doc.fontSize(10).font('Helvetica-Bold').text(`${i + 1}. ${post.title.slice(0, 60)}${post.title.length > 60 ? '...' : ''}`);
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
          .text(`${formatDate(post.publishedAt)} | Vues: ${post.views} | Likes: ${post.likes} | Commentaires: ${post.comments}`);
        doc.moveDown(0.4);
        doc.fillColor('#000000');
      }
    }
  }

  doc.end();
}

async function generateExcel(res, report, data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DATAhub';
  workbook.created = new Date();

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Résumé Global');
  summarySheet.columns = [
    { header: 'Plateforme', key: 'platform', width: 15 },
    { header: 'Compte', key: 'username', width: 20 },
    { header: 'Abonnés', key: 'followers', width: 12 },
    { header: 'Publications', key: 'totalPosts', width: 12 },
    { header: 'Vues', key: 'views', width: 12 },
    { header: 'Likes', key: 'likes', width: 12 },
    { header: 'Commentaires', key: 'comments', width: 14 },
    { header: 'Partages', key: 'shares', width: 12 },
    { header: 'Taux Engagement %', key: 'engagementRate', width: 18 },
  ];

  summarySheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
  });

  for (const d of data) {
    summarySheet.addRow({
      platform: d.platform,
      username: d.username || '',
      followers: d.followers,
      totalPosts: d.totalPosts,
      views: d.views,
      likes: d.likes,
      comments: d.comments,
      shares: d.shares,
      engagementRate: parseFloat(d.engagementRate),
    });
  }

  // Per platform sheets
  for (const platform of data) {
    const sheet = workbook.addWorksheet(platform.platform);
    sheet.columns = [
      { header: 'Titre', key: 'title', width: 40 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Date', key: 'publishedAt', width: 15 },
      { header: 'Vues', key: 'views', width: 12 },
      { header: 'Likes', key: 'likes', width: 12 },
      { header: 'Commentaires', key: 'comments', width: 14 },
      { header: 'URL', key: 'url', width: 30 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    for (const post of platform.topPosts) {
      sheet.addRow({
        title: post.title,
        type: post.type,
        publishedAt: formatDate(post.publishedAt),
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        url: post.url || '',
      });
    }
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="rapport-datahub-${Date.now()}.xlsx"`);
  await workbook.xlsx.write(res);
}

function drawStatBox(doc, x, y, label, value, color) {
  doc.rect(x, y, 110, 40).fill(color);
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica').text(label, x + 5, y + 5, { width: 100 });
  doc.fontSize(14).font('Helvetica-Bold').text(value, x + 5, y + 20, { width: 100 });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function getReportHistory(req, res, next) {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
}

module.exports = { generateReport, getReportHistory };
