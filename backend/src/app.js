const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const passport = require('passport');

require('./config/passport');

const { globalRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const authRoutes = require('./routes/auth');
const platformRoutes = require('./routes/platforms');
const metricsRoutes = require('./routes/metrics');
const reportsRoutes = require('./routes/reports');
const insightsRoutes = require('./routes/insights');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

app.use(globalRateLimiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DATAhub API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
