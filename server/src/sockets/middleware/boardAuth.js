const { query } = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Per-event board membership check middleware.
 * Verifies the user is still a member of the board's workspace.
 * This handles the case where a user is removed from a workspace
 * while they still have an open socket connection.
 *
 * @param {import('socket.io').Socket} socket
 * @param {string} boardId
 * @returns {Promise<boolean>} true if authorized
 */
async function checkBoardMembership(socket, boardId) {
  try {
    const result = await query(
      `SELECT 1
       FROM workspace_members wm
       JOIN boards b ON b.workspace_id = wm.workspace_id
       WHERE b.id = $1 AND wm.user_id = $2`,
      [boardId, socket.userId]
    );

    return result.rowCount > 0;
  } catch (err) {
    logger.error('Board auth check failed', { error: err.message, boardId, userId: socket.userId });
    return false;
  }
}

/**
 * Wraps a socket event handler with board membership verification.
 * If the user is not authorized, emits an error and does not call the handler.
 *
 * @param {import('socket.io').Socket} socket
 * @param {Function} handler - async (data) => void
 * @returns {Function} Wrapped event handler
 *
 * Usage:
 *   socket.on('element:created', withBoardAuth(socket, async (data) => { ... }));
 */
function withBoardAuth(socket, handler) {
  return async (data) => {
    const boardId = data?.boardId;

    if (!boardId) {
      return socket.emit('error', { message: 'boardId is required' });
    }

    const authorized = await checkBoardMembership(socket, boardId);
    if (!authorized) {
      logger.warn('Unauthorized socket event', {
        userId: socket.userId,
        boardId,
      });
      return socket.emit('error', { message: 'Not authorized for this board' });
    }

    try {
      await handler(data);
    } catch (err) {
      logger.error('Socket handler error', { error: err.message, userId: socket.userId });
      socket.emit('error', { message: err.message || 'Internal error' });
    }
  };
}

module.exports = { checkBoardMembership, withBoardAuth };
