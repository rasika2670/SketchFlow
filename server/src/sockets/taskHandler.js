const logger = require('../utils/logger');

/**
 * Task handler — registered on each socket connection.
 *
 * Task events are broadcast from REST controllers via getIO(), NOT from
 * socket event handlers. This is because tasks are always created/mutated
 * via REST API endpoints, which then emit to the board room.
 *
 * Events emitted by REST controllers:
 *   task:created        — New task created (or converted from sticky)
 *   task:updated        — Task properties updated
 *   task:status_changed — Status transition (e.g. todo → in_progress)
 *   task:assigned       — Task assigned/unassigned
 *   task:deleted        — Task soft deleted
 *
 * This handler is kept as a registration point for any future
 * client-initiated task events (e.g., task:subscribe, task:typing).
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function taskHandler(io, socket) {
  logger.debug('taskHandler registered', { userId: socket.userId });
}

module.exports = taskHandler;
