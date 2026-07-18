const logger = require('../utils/logger');

/**
 * Chat handler — stub for Phase 5.
 *
 * In Phase 5, this handler will manage real-time chat events:
 *   chat:send         — Send a message → persist → broadcast chat:new_message
 *   chat:typing       — Typing indicator broadcast
 *
 * Chat messages are append-only (no conflicts, no version checking needed).
 * Messages are persisted to PostgreSQL chat_messages table.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function chatHandler(io, socket) {
  // Phase 5 placeholder — no events registered yet
  logger.debug('chatHandler registered (stub)', { userId: socket.userId });
}

module.exports = chatHandler;
