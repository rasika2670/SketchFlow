const chatService = require('./chat.service');
const { getIO } = require('../../sockets');

/**
 * Send a new chat message
 * POST /api/boards/:boardId/chat
 */
const sendMessage = async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.id;
  const { message, parent_id } = req.body;

  const newMessage = await chatService.sendMessage(userId, boardId, {
    message,
    parentId: parent_id
  });

  // Broadcast to board room
  getIO().to(`board:${boardId}`).emit('chat:new_message', newMessage);

  res.status(201).json({
    success: true,
    data: newMessage,
    meta: { timestamp: new Date().toISOString() }
  });
};

/**
 * Update a chat message
 * PUT /api/boards/:boardId/chat/:messageId
 */
const updateMessage = async (req, res) => {
  const { boardId, messageId } = req.params;
  const userId = req.user.id;
  const { message } = req.body;

  const updatedMessage = await chatService.updateMessage(userId, messageId, { message });

  // Broadcast update
  getIO().to(`board:${boardId}`).emit('chat:updated', updatedMessage);

  res.status(200).json({
    success: true,
    data: updatedMessage,
    meta: { timestamp: new Date().toISOString() }
  });
};

/**
 * Soft delete a chat message
 * DELETE /api/boards/:boardId/chat/:messageId
 */
const deleteMessage = async (req, res) => {
  const { boardId, messageId } = req.params;
  const userId = req.user.id;

  await chatService.deleteMessage(userId, messageId);

  // Broadcast deletion
  getIO().to(`board:${boardId}`).emit('chat:deleted', { id: messageId });

  res.status(204).send();
};

/**
 * Get paginated top-level chat messages
 * GET /api/boards/:boardId/chat
 */
const getMessages = async (req, res) => {
  const { boardId } = req.params;
  const { cursor_created_at, cursor_id, limit } = req.query;

  const messages = await chatService.getMessages(boardId, {
    cursor_created_at,
    cursor_id,
    limit: limit ? parseInt(limit, 10) : 50
  });

  res.status(200).json({
    success: true,
    data: messages,
    meta: { timestamp: new Date().toISOString() }
  });
};

/**
 * Get thread replies
 * GET /api/boards/:boardId/chat/:parentId/replies
 */
const getThreadReplies = async (req, res) => {
  const { parentId } = req.params;

  const replies = await chatService.getThreadReplies(parentId);

  res.status(200).json({
    success: true,
    data: replies,
    meta: { timestamp: new Date().toISOString() }
  });
};

module.exports = {
  sendMessage,
  updateMessage,
  deleteMessage,
  getMessages,
  getThreadReplies
};
