const logger = require('../utils/logger');

/**
 * Task handler — stub for Phase 4.
 *
 * In Phase 4, this handler will broadcast task events to board rooms:
 *   task:created        — New task created
 *   task:updated        — Task properties updated
 *   task:status_changed — Status transition (todo → in_progress → review → done)
 *   task:assigned       — Task assigned to a user
 *   task:deleted        — Task soft deleted
 *
 * Tasks use REST endpoints for creation/mutation; this handler
 * only broadcasts the results to connected board members.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function taskHandler(io, socket) {
  // Phase 4 placeholder — no events registered yet
  logger.debug('taskHandler registered (stub)', { userId: socket.userId });
}

module.exports = taskHandler;
