const { getRedis, isRedisAvailable } = require('../config/redis');
const elementsService = require('../modules/elements/elements.service');
const logger = require('../utils/logger');

const EVENT_LOG_TTL = 60; // seconds

/**
 * Append an event to the board's Redis event log.
 * Events are stored as JSON strings in a Redis list with 60s TTL.
 * Used for replaying missed events on reconnection.
 *
 * @param {string} boardId
 * @param {string} eventName - e.g. 'element:created'
 * @param {Object} data - Event payload
 * @param {string} userId - Who triggered the event
 */
async function logEvent(boardId, eventName, data, userId) {
  if (!isRedisAvailable()) return;

  const redis = getRedis();
  const key = `board:events:${boardId}`;

  const event = {
    event: eventName,
    data,
    userId,
    timestamp: Date.now(),
  };

  try {
    await redis.rpush(key, JSON.stringify(event));
    await redis.expire(key, EVENT_LOG_TTL);
  } catch (err) {
    logger.warn('Event log write failed', { error: err.message, boardId, eventName });
  }
}

/**
 * Register the events:replay socket event handler.
 * Client sends { boardId, since } on reconnect.
 *
 * Flow:
 *   1. Try Redis list — replay events newer than `since` timestamp
 *   2. Fallback: if Redis is empty/expired, fetch full board state from DB
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerEventReplay(io, socket) {
  socket.on('events:replay', async ({ boardId, since }) => {
    logger.info('events:replay requested', { userId: socket.userId, boardId, since });

    if (!boardId) {
      return socket.emit('error', { message: 'boardId is required for replay' });
    }

    // 1. Try Redis event log first
    if (isRedisAvailable()) {
      const redis = getRedis();
      const key = `board:events:${boardId}`;

      try {
        const rawEvents = await redis.lrange(key, 0, -1);
        const parsed = rawEvents.map((e) => JSON.parse(e));
        const filtered = since
          ? parsed.filter((e) => e.timestamp > since)
          : parsed;

        if (filtered.length > 0) {
          logger.info('events:replay: serving from Redis', {
            boardId,
            count: filtered.length,
          });
          return socket.emit('events:replayed', { boardId, events: filtered });
        }
      } catch (err) {
        logger.warn('events:replay: Redis read failed, falling back to DB', {
          error: err.message,
          boardId,
        });
      }
    }

    // 2. Fallback: full board state from DB
    try {
      logger.info('events:replay: serving full state from DB', { boardId });
      const elements = await elementsService.getByBoardId(boardId);
      socket.emit('board:state:sync', { boardId, elements });
    } catch (err) {
      logger.error('events:replay: DB fallback failed', { error: err.message, boardId });
      socket.emit('error', { message: 'Failed to replay events' });
    }
  });
}

module.exports = { logEvent, registerEventReplay };
