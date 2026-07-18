const { getRedis, isRedisAvailable } = require('../config/redis');
const logger = require('../utils/logger');

// How long before we permanently remove a disconnected user's presence (ms)
const PRESENCE_CLEANUP_DELAY_MS = 30_000; // 30 seconds
const PRESENCE_TTL_SECONDS = 60;
const CURSOR_TTL_SECONDS = 5;

// Track cleanup timers per userId+boardId so reconnects can cancel them
const cleanupTimers = new Map();

/**
 * Redis key helpers
 */
const Keys = {
  presence: (boardId) => `presence:board:${boardId}`,
  cursor: (boardId, userId) => `cursor:board:${boardId}:${userId}`,
};

/**
 * Presence handler — tracks cursor positions and user presence in board rooms.
 *
 * Events handled:
 *   presence:join       — User declares they're active on a board
 *   presence:leave      — User explicitly leaves a board
 *   presence:heartbeat  — Refresh TTL to stay present (every 30s)
 *   cursor:move         — Broadcast cursor position to room
 *
 * On disconnect: marks user as 'away' immediately, removes after 30s delay
 * (prevents flickering on quick network reconnects).
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function presenceHandler(io, socket) {
  const userId = socket.userId;
  const userName = socket.userName;
  const userAvatar = socket.userAvatar;

  // Track which boards this socket is currently present in
  const activeBoardIds = new Set();

  // =============================================
  // presence:join
  // =============================================
  socket.on('presence:join', async ({ boardId }) => {
    if (!boardId) return;

    activeBoardIds.add(boardId);

    // Cancel any pending cleanup for this user+board
    const timerKey = `${userId}:${boardId}`;
    if (cleanupTimers.has(timerKey)) {
      clearTimeout(cleanupTimers.get(timerKey));
      cleanupTimers.delete(timerKey);
    }

    if (isRedisAvailable()) {
      const redis = getRedis();
      try {
        const presenceKey = Keys.presence(boardId);
        // Store user info as JSON value in hash
        await redis.hset(presenceKey, userId, JSON.stringify({ userId, userName, userAvatar }));
        await redis.expire(presenceKey, PRESENCE_TTL_SECONDS);
      } catch (err) {
        logger.warn('presence:join Redis error', { error: err.message, userId, boardId });
      }
    }

    // Broadcast to others that this user joined
    socket.to(`board:${boardId}`).emit('presence:user_joined', {
      userId,
      userName,
      userAvatar,
      boardId,
    });

    logger.info('User presence joined', { userId, boardId });
  });

  // =============================================
  // presence:leave
  // =============================================
  socket.on('presence:leave', async ({ boardId }) => {
    if (!boardId) return;
    await removePresence(io, boardId, userId);
    activeBoardIds.delete(boardId);
  });

  // =============================================
  // presence:heartbeat — refresh TTL every 30s
  // =============================================
  socket.on('presence:heartbeat', async ({ boardId }) => {
    if (!boardId || !isRedisAvailable()) return;

    const redis = getRedis();
    try {
      await redis.expire(Keys.presence(boardId), PRESENCE_TTL_SECONDS);
    } catch (err) {
      logger.warn('presence:heartbeat Redis error', { error: err.message });
    }
  });

  // =============================================
  // cursor:move — broadcast cursor position
  // =============================================
  socket.on('cursor:move', async ({ boardId, x, y }) => {
    if (!boardId || x === undefined || y === undefined) return;

    if (isRedisAvailable()) {
      const redis = getRedis();
      try {
        const cursorKey = Keys.cursor(boardId, userId);
        // Store cursor as a hash with x and y fields
        await redis.hset(cursorKey, 'x', x, 'y', y);
        await redis.expire(cursorKey, CURSOR_TTL_SECONDS);
      } catch (err) {
        logger.warn('cursor:move Redis error', { error: err.message });
      }
    }

    // Broadcast cursor to everyone else in the room
    socket.to(`board:${boardId}`).emit('cursor:moved', {
      userId,
      userName,
      boardId,
      x,
      y,
    });
  });

  // =============================================
  // disconnect — delayed presence cleanup (30s)
  // Prevents flickering on quick network reconnects
  // =============================================
  socket.on('disconnect', async () => {
    for (const boardId of activeBoardIds) {
      const timerKey = `${userId}:${boardId}`;

      // Immediately mark as 'away' in Redis (update presence value)
      if (isRedisAvailable()) {
        const redis = getRedis();
        try {
          const presenceKey = Keys.presence(boardId);
          await redis.hset(
            presenceKey,
            userId,
            JSON.stringify({ userId, userName, userAvatar, status: 'away' })
          );
          await redis.expire(presenceKey, PRESENCE_CLEANUP_DELAY_MS / 1000 + 5);
        } catch (err) {
          logger.warn('disconnect: presence away mark failed', { error: err.message });
        }
      }

      // Broadcast 'away' status immediately
      io.to(`board:${boardId}`).emit('presence:user_away', { userId, boardId });

      // Schedule final removal after 30s delay
      const timer = setTimeout(async () => {
        cleanupTimers.delete(timerKey);
        await removePresence(io, boardId, userId);
      }, PRESENCE_CLEANUP_DELAY_MS);

      cleanupTimers.set(timerKey, timer);
    }
  });
}

/**
 * Remove a user's presence from a board — cleanup Redis + broadcast departure.
 *
 * @param {import('socket.io').Server} io
 * @param {string} boardId
 * @param {string} userId
 */
async function removePresence(io, boardId, userId) {
  if (isRedisAvailable()) {
    const redis = getRedis();
    try {
      await redis.hdel(Keys.presence(boardId), userId);
      await redis.del(Keys.cursor(boardId, userId));
    } catch (err) {
      logger.warn('removePresence Redis error', { error: err.message, userId, boardId });
    }
  }

  io.to(`board:${boardId}`).emit('user:left', { userId, boardId });

  logger.info('User presence removed', { userId, boardId });
}

module.exports = presenceHandler;
