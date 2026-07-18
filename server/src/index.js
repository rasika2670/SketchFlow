const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Config (loads .env and validates)
const config = require('./config/env');
const corsOptions = require('./config/cors');
const { testConnection, pool } = require('./config/db');
const { connectRedis, disconnectRedis, isRedisAvailable } = require('./config/redis');
const { configureCloudinary } = require('./config/cloudinary');
const { initializeEmailService } = require('./services/email.service');
const logger = require('./utils/logger');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const ApiError = require('./utils/ApiError');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const workspacesRoutes = require('./modules/workspaces/workspaces.routes');
const { workspaceScopedRouter: boardWorkspaceRoutes, boardRouter: boardRoutes } = require('./modules/boards/boards.routes');

// =============================================
// Initialize Express App
// =============================================
const app = express();

// ---- Security & Parsing Middleware ----
app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Request Logging ----
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// ---- Rate Limiting ----
app.use('/api', generalLimiter);

// =============================================
// API Routes
// =============================================
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: isRedisAvailable() ? 'connected' : 'disconnected',
    },
  };

  try {
    await pool.query('SELECT 1');
    health.services.database = 'connected';
  } catch {
    health.services.database = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/workspaces/:workspaceId/boards', boardWorkspaceRoutes);
app.use('/api/boards', boardRoutes);

// =============================================
// 404 Handler — Must be after all routes
// =============================================
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

// =============================================
// Global Error Handler — Must be last
// =============================================
app.use(errorHandler);

// =============================================
// Create HTTP Server
// =============================================
const server = http.createServer(app);

// =============================================
// Start Server
// =============================================
async function startServer() {
  try {
    // 1. Test database connection (required)
    await testConnection();

    // 2. Connect to Redis (optional — continues if unavailable)
    await connectRedis();

    // 3. Configure external services
    configureCloudinary();
    initializeEmailService();

    // 4. Start listening
    server.listen(config.port, () => {
      logger.info(`🚀 SketchFlow API running on port ${config.port}`, {
        env: config.nodeEnv,
        redis: isRedisAvailable() ? 'connected' : 'unavailable',
      });
    });
  } catch (err) {
    logger.error('❌ Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

// =============================================
// Graceful Shutdown
// =============================================
function gracefulShutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database pool
      await pool.end();
      logger.info('PostgreSQL pool closed');

      // Disconnect Redis
      await disconnectRedis();

      logger.info('All connections closed — exiting');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION', { error: err.message, stack: err.stack });
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION', { error: err.message, stack: err.stack });
  process.exit(1);
});

// =============================================
// Start!
// =============================================
startServer();

module.exports = { app, server };
