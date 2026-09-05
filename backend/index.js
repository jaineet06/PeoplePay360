'use strict';

require('./configs/env');

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./configs/env');
const { disconnectDb } = require('./configs/db');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: env.corsOrigins,
  credentials: true,
}));
app.use(compression());
app.use(morgan(env.isDev ? 'dev' : 'combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

app.use('/api/v1', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use(errorHandler);

function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    try {
      await disconnectDb();
      logger.info('Shutdown complete.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { message: err.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(env.PORT, () => {
  logger.info(`PeoplePay360 API listening on port ${env.PORT}`, { env: env.NODE_ENV });
});

module.exports = app;
