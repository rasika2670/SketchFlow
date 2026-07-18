const elementsService = require('../modules/elements/elements.service');
const { withBoardAuth } = require('./middleware/boardAuth');
const { logEvent, registerEventReplay } = require('./eventLog');
const logger = require('../utils/logger');

/**
 * Board handler — manages board rooms and element CRUD events.
 *
 * Events handled:
 *   board:join        — Join a board room
 *   board:leave       — Leave a board room
 *   element:created   — Create and broadcast a new element
 *   element:moved     — Move element(s) position update (optimistic)
 *   element:updated   — Update element properties (optimistic)
 *   element:deleted   — Soft delete an element
 *   events:replay     — Replay missed events on reconnect
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function boardHandler(io, socket) {

  // =============================================
  // board:join
  // =============================================
  socket.on('board:join', withBoardAuth(socket, async ({ boardId }) => {
    socket.join(`board:${boardId}`);

    logger.info('User joined board', { userId: socket.userId, boardId });

    // Broadcast to others in the room
    socket.to(`board:${boardId}`).emit('user:joined', {
      userId: socket.userId,
      userName: socket.userName,
      userAvatar: socket.userAvatar,
      boardId,
    });

    // Confirm to the joining user
    socket.emit('board:joined', { boardId });
  }));

  // =============================================
  // board:leave
  // =============================================
  socket.on('board:leave', ({ boardId }) => {
    if (!boardId) return;

    socket.leave(`board:${boardId}`);

    logger.info('User left board', { userId: socket.userId, boardId });

    socket.to(`board:${boardId}`).emit('user:left', {
      userId: socket.userId,
      boardId,
    });
  });

  // =============================================
  // element:created
  // =============================================
  socket.on('element:created', withBoardAuth(socket, async ({ boardId, element }) => {
    if (!element || !element.type) {
      return socket.emit('error', { message: 'element.type is required' });
    }

    const created = await elementsService.create(socket.userId, boardId, element);

    // Broadcast to everyone in the room (including sender)
    io.to(`board:${boardId}`).emit('element:created', {
      boardId,
      element: created,
      userId: socket.userId,
    });

    await logEvent(boardId, 'element:created', { elementId: created.id, type: created.type }, socket.userId);

    logger.info('element:created broadcast', { elementId: created.id, boardId });
  }));

  // =============================================
  // element:updated
  // =============================================
  socket.on('element:updated', withBoardAuth(socket, async ({ boardId, elementId, updates, version }) => {
    if (!elementId || version === undefined) {
      return socket.emit('error', { message: 'elementId and version are required' });
    }

    try {
      const updated = await elementsService.update(elementId, updates, version);

      io.to(`board:${boardId}`).emit('element:updated', {
        boardId,
        element: updated,
        userId: socket.userId,
      });

      await logEvent(boardId, 'element:updated', { elementId, ...updates }, socket.userId);
    } catch (err) {
      if (err.statusCode === 409) {
        // Version conflict — notify the sender only
        return socket.emit('element:conflict', {
          elementId,
          message: 'Element was modified by another user. Please reload.',
        });
      }
      throw err;
    }
  }));

  // =============================================
  // element:moved (position-only update — high frequency)
  // =============================================
  socket.on('element:moved', withBoardAuth(socket, async ({ boardId, elementId, x, y, version }) => {
    if (!elementId || version === undefined) {
      return socket.emit('error', { message: 'elementId and version are required' });
    }

    try {
      const updated = await elementsService.update(elementId, { x, y }, version);

      io.to(`board:${boardId}`).emit('element:moved', {
        boardId,
        elementId: updated.id,
        x: updated.x,
        y: updated.y,
        version: updated.version,
        userId: socket.userId,
      });

      await logEvent(boardId, 'element:moved', { elementId, x, y, version: updated.version }, socket.userId);
    } catch (err) {
      if (err.statusCode === 409) {
        return socket.emit('element:conflict', {
          elementId,
          message: 'Position conflict detected.',
        });
      }
      throw err;
    }
  }));

  // =============================================
  // element:deleted
  // =============================================
  socket.on('element:deleted', withBoardAuth(socket, async ({ boardId, elementId }) => {
    if (!elementId) {
      return socket.emit('error', { message: 'elementId is required' });
    }

    await elementsService.softDelete(elementId);

    io.to(`board:${boardId}`).emit('element:deleted', {
      boardId,
      elementId,
      userId: socket.userId,
    });

    await logEvent(boardId, 'element:deleted', { elementId }, socket.userId);

    logger.info('element:deleted broadcast', { elementId, boardId });
  }));

  // =============================================
  // events:replay — reconnect catchup
  // =============================================
  registerEventReplay(io, socket);
}

module.exports = boardHandler;
