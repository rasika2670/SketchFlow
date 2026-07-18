const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getRedis, isRedisAvailable } = require('../config/redis');
const { query } = require('../config/db');
const logger = require('../utils/logger');

const boardHandler = require('./boardHandler');
const presenceHandler = require('./presenceHandler');
const lockHandler = require('./lockHandler');
const chatHandler = require('./chatHandler');
const taskHandler = require('./taskHandler');

let io = null;

/**
 * Initialize Socket.IO server.
 *
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initializeSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Ping/pong for connection health
    pingTimeout: 60000,
    pingInterval: 25000,
    // Allow transports
    transports: ['websocket', 'polling'],
  });

  // =============================================
  // JWT Authentication Middleware
  // Every connection must provide a valid access token.
  // =============================================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT access token
      let decoded;
      try {
        decoded = jwt.verify(token, config.jwt.accessSecret);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new Error('Access token expired'));
        }
        return next(new Error('Invalid access token'));
      }

      // Confirm user still exists in DB
      const result = await query(
        'SELECT id, name, email, avatar_url FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      const user = result.rows[0];

      // Attach user data to socket for use in handlers
      socket.userId = user.id;
      socket.userName = user.name;
      socket.userEmail = user.email;
      socket.userAvatar = user.avatar_url;

      logger.info('Socket authenticated', { userId: user.id, socketId: socket.id });
      next();
    } catch (err) {
      logger.error('Socket auth error', { error: err.message });
      next(new Error('Authentication failed'));
    }
  });

  // =============================================
  // Per-Socket Rate Limiting Middleware
  // 15 events per second per user (via Redis counter).
  // Degrades gracefully if Redis is unavailable.
  // =============================================
  io.use((socket, next) => {
    socket.use(async ([event, ...args], nextEvent) => {
      // Skip internal Socket.IO events
      if (event.startsWith('disconnect') || event === 'connect') {
        return nextEvent();
      }

      if (!isRedisAvailable()) {
        return nextEvent();
      }

      const redis = getRedis();
      const key = `rate:socket:${socket.userId}`;

      try {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, 1); // 1-second window
        }

        if (count > 15) {
          logger.warn('Socket rate limit exceeded', {
            userId: socket.userId,
            event,
            count,
          });
          return socket.emit('error', { message: 'Rate limit exceeded. Slow down.' });
        }
      } catch (err) {
        // Redis error — let event through rather than block
        logger.warn('Socket rate limit Redis error', { error: err.message });
      }

      nextEvent();
    });

    next();
  });

  // =============================================
  // Connection Handler
  // =============================================
  io.on('connection', (socket) => {
    logger.info('Socket connected', { userId: socket.userId, socketId: socket.id });

    // Register event handlers
    boardHandler(io, socket);
    presenceHandler(io, socket);
    lockHandler(io, socket);
    chatHandler(io, socket);
    taskHandler(io, socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        userId: socket.userId,
        socketId: socket.id,
        reason,
      });
    });

    // Handle socket-level errors
    socket.on('error', (err) => {
      logger.error('Socket error', { userId: socket.userId, error: err.message });
    });
  });

  logger.info('✅ Socket.IO initialized');

  return io;
}

/**
 * Get the Socket.IO server instance.
 * @returns {import('socket.io').Server|null}
 */
function getIO() {
  return io;
}

module.exports = { initializeSocketIO, getIO };
