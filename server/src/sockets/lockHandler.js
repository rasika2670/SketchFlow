const { getRedis, isRedisAvailable } = require('../config/redis');
const { withBoardAuth } = require('./middleware/boardAuth');
const logger = require('../utils/logger');

const LOCK_TTL_SECONDS = 30;

/**
 * Lock key helper
 */
const lockKey = (elementId) => `lock:element:${elementId}`;

/**
 * Lock handler — manages element-level locking to prevent simultaneous edits.
 *
 * Events handled:
 *   element:lock           — Acquire lock on an element (SETNX)
 *   element:unlock         — Release lock if owned by requesting user
 *   element:lock:heartbeat — Refresh lock TTL every 10s (client responsibility)
 *
 * Lock lifecycle:
 *   1. Client emits element:lock { boardId, elementId }
 *   2. Server attempts Redis SETNX. If fails → element:lock:denied
 *   3. If succeeds → broadcast element:locked to room
 *   4. Client sends element:lock:heartbeat every 10s to refresh TTL
 *   5. Client emits element:unlock when done editing
 *   6. If TTL expires (30s), next lock attempt succeeds automatically
 *      and broadcasts element:locked (natural expiry recovery)
 *
 * Note: When Redis is unavailable, lock operations are skipped silently.
 * This is the degraded mode — editing still works, just without locks.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function lockHandler(io, socket) {
  const userId = socket.userId;
  const userName = socket.userName;

  // =============================================
  // element:lock — acquire lock
  // =============================================
  socket.on('element:lock', withBoardAuth(socket, async ({ boardId, elementId }) => {
    if (!elementId) {
      return socket.emit('error', { message: 'elementId is required' });
    }

    if (!isRedisAvailable()) {
      // Degraded mode: no locking, but don't block the user
      logger.warn('element:lock: Redis unavailable, skipping lock', { elementId });
      return socket.emit('element:lock:acquired', { elementId, boardId });
    }

    const redis = getRedis();
    const key = lockKey(elementId);

    try {
      // SETNX — atomic acquire
      const acquired = await redis.setnx(key, userId);

      if (acquired === 1) {
        // Lock acquired — set TTL
        await redis.expire(key, LOCK_TTL_SECONDS);

        // Broadcast to entire room that this element is locked
        io.to(`board:${boardId}`).emit('element:locked', {
          elementId,
          boardId,
          lockedBy: { userId, userName },
          expiresIn: LOCK_TTL_SECONDS,
        });

        logger.info('element:lock acquired', { elementId, userId, boardId });
      } else {
        // Lock already held by another user
        const currentHolder = await redis.get(key);
        const ttl = await redis.ttl(key);

        socket.emit('element:lock:denied', {
          elementId,
          boardId,
          lockedBy: currentHolder,
          ttl,
        });

        logger.info('element:lock denied', { elementId, userId, currentHolder });
      }
    } catch (err) {
      logger.error('element:lock Redis error', { error: err.message, elementId });
      // Fail open — let user proceed without lock
      socket.emit('element:lock:acquired', { elementId, boardId });
    }
  }));

  // =============================================
  // element:unlock — release lock
  // =============================================
  socket.on('element:unlock', withBoardAuth(socket, async ({ boardId, elementId }) => {
    if (!elementId) {
      return socket.emit('error', { message: 'elementId is required' });
    }

    if (!isRedisAvailable()) return;

    const redis = getRedis();
    const key = lockKey(elementId);

    try {
      const currentHolder = await redis.get(key);

      if (currentHolder !== userId) {
        // Not the lock owner — silently ignore (could be expired + re-acquired)
        logger.warn('element:unlock: not lock owner', { elementId, userId, currentHolder });
        return;
      }

      await redis.del(key);

      // Broadcast unlock to room
      io.to(`board:${boardId}`).emit('element:unlocked', {
        elementId,
        boardId,
        unlockedBy: userId,
      });

      logger.info('element:unlock', { elementId, userId, boardId });
    } catch (err) {
      logger.error('element:unlock Redis error', { error: err.message, elementId });
    }
  }));

  // =============================================
  // element:lock:heartbeat — refresh TTL (client sends every 10s)
  // =============================================
  socket.on('element:lock:heartbeat', async ({ elementId }) => {
    if (!elementId || !isRedisAvailable()) return;

    const redis = getRedis();
    const key = lockKey(elementId);

    try {
      const currentHolder = await redis.get(key);

      if (currentHolder === userId) {
        await redis.expire(key, LOCK_TTL_SECONDS);
        logger.debug('element:lock:heartbeat refreshed', { elementId, userId });
      }
      // If not the holder (expired + re-acquired by someone else), do nothing
    } catch (err) {
      logger.warn('element:lock:heartbeat Redis error', { error: err.message, elementId });
    }
  });

  // =============================================
  // On disconnect — release all locks held by this socket
  // =============================================
  socket.on('disconnect', async () => {
    if (!isRedisAvailable()) return;

    const redis = getRedis();

    // We don't track which locks this socket holds by default.
    // Locks auto-expire via TTL (30s). This is the intended behavior.
    // If needed in the future, maintain a Set<elementId> per socket
    // and release them explicitly here.
    logger.debug('Socket disconnected — locks will auto-expire via TTL', { userId });
  });
}

module.exports = lockHandler;
