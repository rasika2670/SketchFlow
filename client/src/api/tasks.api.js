import api from './axios';

// ─── Board-scoped task routes (/api/boards/:boardId/tasks) ─────────────────

/**
 * Create a new task on a board.
 */
export const create = (boardId, taskData) =>
  api.post(`/boards/${boardId}/tasks`, taskData);

/**
 * Convert a sticky note element to a task.
 * @param {string} boardId
 * @param {{ element_id: string, title: string, description?: string, status?: string, priority?: string, assignee_id?: string, due_date?: string }} payload
 */
export const convertFromSticky = (boardId, payload) =>
  api.post(`/boards/${boardId}/tasks/convert`, payload);

/**
 * List all tasks for a board (optional filters: status, assignee_id, priority).
 */
export const listByBoard = (boardId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.assignee_id) params.set('assignee_id', filters.assignee_id);
  if (filters.priority) params.set('priority', filters.priority);
  const qs = params.toString();
  return api.get(`/boards/${boardId}/tasks${qs ? `?${qs}` : ''}`);
};

// ─── Task-specific routes (/api/tasks/:taskId) ────────────────────────────

/**
 * Get a single task by ID (includes source element info).
 */
export const getById = (taskId) =>
  api.get(`/tasks/${taskId}`);

/**
 * Update a task (requires version for optimistic locking).
 */
export const update = (taskId, updates, version) =>
  api.put(`/tasks/${taskId}`, { ...updates, version });

/**
 * Update task status only (requires version for optimistic locking).
 */
export const updateStatus = (taskId, status, version) =>
  api.patch(`/tasks/${taskId}/status`, { status, version });

/**
 * Assign or unassign a task (requires version for optimistic locking).
 */
export const assignTask = (taskId, assigneeId, version) =>
  api.patch(`/tasks/${taskId}/assign`, { assignee_id: assigneeId, version });

/**
 * Soft-delete a task.
 */
export const remove = (taskId) =>
  api.delete(`/tasks/${taskId}`);
