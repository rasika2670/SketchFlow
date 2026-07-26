import api from './axios';

/**
 * Create a new element on a board
 */
export const create = (boardId, elementData) =>
  api.post(`/boards/${boardId}/elements`, elementData);

/**
 * List all elements for a board
 */
export const listByBoard = (boardId) =>
  api.get(`/boards/${boardId}/elements`);

/**
 * Update an element (with optimistic locking via version)
 */
export const update = (elementId, data, version) =>
  api.put(`/elements/${elementId}`, { ...data, version });

/**
 * Batch update element positions (x, y)
 */
export const batchUpdate = (elements) =>
  api.put('/elements/batch', { elements });

/**
 * Soft delete an element
 */
export const remove = (elementId) =>
  api.delete(`/elements/${elementId}`);
