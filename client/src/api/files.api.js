import api from './axios';

// ─── Board-scoped file routes (/api/boards/:boardId/files) ─────────────────

/**
 * Get a signed upload signature for Cloudinary direct uploads.
 * @param {string} boardId
 */
export const getUploadSignature = (boardId) =>
  api.get(`/boards/${boardId}/files/signature`);

/**
 * Register an uploaded file's metadata on the server.
 * @param {string} boardId
 * @param {{ filename: string, url: string, public_id: string, mime_type: string, size: number }} fileData
 */
export const registerUpload = (boardId, fileData) =>
  api.post(`/boards/${boardId}/files`, fileData);

/**
 * List all files for a board.
 * @param {string} boardId
 */
export const listByBoard = (boardId) =>
  api.get(`/boards/${boardId}/files`);

/**
 * Delete a file (removes from Cloudinary + SQL).
 * @param {string} boardId
 * @param {string} fileId
 */
export const deleteFile = (boardId, fileId) =>
  api.delete(`/boards/${boardId}/files/${fileId}`);
