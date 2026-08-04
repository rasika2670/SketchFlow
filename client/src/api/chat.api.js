import api from './axios';

// ─── Board-scoped chat routes (/api/boards/:boardId/chat) ──────────────────

/**
 * Send a new message to a board chat.
 * @param {string} boardId
 * @param {{ message: string, parent_id?: string }} payload
 */
export const sendMessage = (boardId, payload) =>
  api.post(`/boards/${boardId}/chat`, payload);

/**
 * Get messages for a board with cursor-based pagination.
 * Returns newest first. Pass `cursor_created_at` and `cursor_id` to load older messages.
 * @param {string} boardId
 * @param {{ cursor_created_at?: string, cursor_id?: string, limit?: number }} params
 */
export const getMessages = (boardId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.cursor_created_at) searchParams.set('cursor_created_at', params.cursor_created_at);
  if (params.cursor_id) searchParams.set('cursor_id', params.cursor_id);
  if (params.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  return api.get(`/boards/${boardId}/chat${qs ? `?${qs}` : ''}`);
};

/**
 * Update a message.
 * @param {string} boardId
 * @param {string} messageId
 * @param {{ message: string }} payload
 */
export const updateMessage = (boardId, messageId, payload) =>
  api.put(`/boards/${boardId}/chat/${messageId}`, payload);

/**
 * Soft-delete a message.
 * @param {string} boardId
 * @param {string} messageId
 */
export const deleteMessage = (boardId, messageId) =>
  api.delete(`/boards/${boardId}/chat/${messageId}`);

/**
 * Get threaded replies for a parent message.
 * @param {string} boardId
 * @param {string} parentId
 */
export const getThreadReplies = (boardId, parentId) =>
  api.get(`/boards/${boardId}/chat/${parentId}/replies`);
