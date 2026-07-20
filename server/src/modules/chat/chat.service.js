const { query, getClient } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

/**
 * Send a new chat message
 */
const sendMessage = async (userId, boardId, { message, parentId }) => {
  // If parentId is provided, verify it exists and belongs to the same board
  if (parentId) {
    const parentResult = await query(
      'SELECT id FROM chat_messages WHERE id = $1 AND board_id = $2 AND deleted_at IS NULL',
      [parentId, boardId]
    );

    if (parentResult.rows.length === 0) {
      throw ApiError.badRequest('Parent message not found or does not belong to this board');
    }
  }

  const result = await query(
    `
    WITH inserted_message AS (
      INSERT INTO chat_messages (board_id, user_id, message, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    )
    SELECT m.*, u.name as user_name, u.avatar_url as user_avatar
    FROM inserted_message m
    JOIN users u ON m.user_id = u.id
    `,
    [boardId, userId, message, parentId || null]
  );

  return result.rows[0];
};

/**
 * Update an existing chat message
 */
const updateMessage = async (userId, messageId, { message }) => {
  const result = await query(
    `
    UPDATE chat_messages
    SET message = $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
    RETURNING id
    `,
    [message, messageId, userId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Message not found or you do not have permission to edit it');
  }

  // Fetch updated message with user details
  const updatedResult = await query(
    `
    SELECT m.*, u.name as user_name, u.avatar_url as user_avatar
    FROM chat_messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = $1
    `,
    [messageId]
  );

  return updatedResult.rows[0];
};

/**
 * Soft delete a chat message
 */
const deleteMessage = async (userId, messageId) => {
  const result = await query(
    `
    UPDATE chat_messages
    SET deleted_at = NOW()
    WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    RETURNING id
    `,
    [messageId, userId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Message not found or you do not have permission to delete it');
  }

  return true;
};

/**
 * Get paginated top-level chat messages for a board using composite cursor (created_at|id)
 */
const getMessages = async (boardId, { cursor_created_at, cursor_id, limit = 50 }) => {
  let queryStr = `
    SELECT m.*, u.name as user_name, u.avatar_url as user_avatar,
           (SELECT COUNT(*) FROM chat_messages r WHERE r.parent_id = m.id AND r.deleted_at IS NULL) as reply_count
    FROM chat_messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.board_id = $1 AND m.parent_id IS NULL AND m.deleted_at IS NULL
  `;
  const params = [boardId];
  let paramCount = 1;

  if (cursor_created_at && cursor_id) {
    queryStr += ` AND (m.created_at, m.id) < ($${paramCount + 1}, $${paramCount + 2})`;
    params.push(cursor_created_at, cursor_id);
    paramCount += 2;
  }

  queryStr += ` ORDER BY m.created_at DESC, m.id DESC LIMIT $${paramCount + 1}`;
  params.push(limit);

  const result = await query(queryStr, params);
  
  return result.rows;
};

/**
 * Get thread replies for a specific message
 */
const getThreadReplies = async (parentId) => {
  const result = await query(
    `
    SELECT m.*, u.name as user_name, u.avatar_url as user_avatar
    FROM chat_messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.parent_id = $1 AND m.deleted_at IS NULL
    ORDER BY m.created_at ASC
    `,
    [parentId]
  );

  return result.rows;
};

module.exports = {
  sendMessage,
  updateMessage,
  deleteMessage,
  getMessages,
  getThreadReplies
};
