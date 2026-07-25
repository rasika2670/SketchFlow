import api from './axios';

/**
 * Create a new board in a workspace
 */
export const create = ({ name, workspaceId }) =>
  api.post(`/workspaces/${workspaceId}/boards`, { name });

/**
 * List all boards in a workspace
 */
export const listByWorkspace = (workspaceId) =>
  api.get(`/workspaces/${workspaceId}/boards`);

/**
 * Get a single board by ID
 */
export const getById = (id) =>
  api.get(`/boards/${id}`);

/**
 * Update a board's name
 */
export const update = (id, data) =>
  api.put(`/boards/${id}`, data);

/**
 * Delete a board
 */
export const remove = (id) =>
  api.delete(`/boards/${id}`);
