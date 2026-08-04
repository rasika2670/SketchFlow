import api from './axios';

// ─── Board-scoped activity routes (/api/boards/:boardId/activities) ────────

/**
 * Get activity logs for a board with cursor-based pagination.
 * @param {string} boardId
 * @param {{ cursor?: string, limit?: number }} params
 */
export const getByBoard = (boardId, params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.cursor) searchParams.set('cursor', params.cursor);
  if (params.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  return api.get(`/boards/${boardId}/activities${qs ? `?${qs}` : ''}`);
};
