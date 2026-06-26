require('dotenv').config();
const app = require('./app');
const { logger } = require('./utils/logger');
const { connectRedis } = require('./config/redis');
const { startScheduledJobs } = require('./services/schedulerService');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    try {
      await connectRedis();
      logger.info('Redis connecté avec succès');
    } catch (redisErr) {
      logger.warn(`Redis non disponible (cache désactivé): ${redisErr.message}`);
    }

    startScheduledJobs();
    logger.info('Jobs planifiés démarrés');

    app.listen(PORT, () => {
      logger.info(`DATAhub API démarré sur le port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (error) {
    logger.error('Erreur au démarrage:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error('Promesse rejetée non gérée:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Exception non capturée:', error);
  process.exit(1);
});

bootstrap();
