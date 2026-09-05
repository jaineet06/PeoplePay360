import './configs/env.js';

import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import env from './configs/env.js';
import { disconnectDb } from './configs/db.js';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import logger from './utils/logger.js';
import { verifyEmailConfig } from './utils/email.js';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
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
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(env.PORT, () => {
  logger.info(`PeoplePay360 API listening on port ${env.PORT}`, { env: env.NODE_ENV });
  // Non-blocking SMTP check — logs success or failure loudly; does not crash on
  // transient network error but WILL surface bad credentials / missing verified sender.
  verifyEmailConfig();
});

export default app;
