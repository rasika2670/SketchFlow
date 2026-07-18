const { query } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Create a new board in a workspace.
 *
 * @param {string} userId - Creator's user ID
 * @param {string} workspaceId - Workspace to create the board in
 * @param {{ name: string }} data
 * @returns {Promise<Object>} Created board
 */
async function create(userId, workspaceId, { name }) {
  // Verify workspace exists
  const wsResult = await query(
    'SELECT id FROM workspaces WHERE id = $1',
    [workspaceId]
  );

  if (wsResult.rows.length === 0) {
    throw ApiError.notFound('Workspace not found');
  }

  const result = await query(
    `INSERT INTO boards (name, workspace_id, created_by)
     VALUES ($1, $2, $3)
     RETURNING id, name, workspace_id, created_by, created_at, updated_at`,
    [name, workspaceId, userId]
  );

  logger.info('Board created', {
    boardId: result.rows[0].id,
    workspaceId,
    userId,
  });

  return result.rows[0];
}

/**
 * List all boards in a workspace with element and task counts.
 *
 * @param {string} workspaceId
 * @returns {Promise<Object[]>}
 */
async function getByWorkspaceId(workspaceId) {
  const result = await query(
    `SELECT
       b.id, b.name, b.workspace_id, b.created_by, b.created_at, b.updated_at,
       (SELECT COUNT(*) FROM elements WHERE board_id = b.id AND deleted_at IS NULL) AS element_count,
       (SELECT COUNT(*) FROM tasks WHERE board_id = b.id AND deleted_at IS NULL) AS task_count
     FROM boards b
     WHERE b.workspace_id = $1
     ORDER BY b.updated_at DESC`,
    [workspaceId]
  );

  return result.rows;
}

/**
 * Get a board by ID with element and task counts.
 *
 * @param {string} boardId
 * @returns {Promise<Object>}
 */
async function getById(boardId) {
  const result = await query(
    `SELECT
       b.id, b.name, b.workspace_id, b.created_by, b.created_at, b.updated_at,
       (SELECT COUNT(*) FROM elements WHERE board_id = b.id AND deleted_at IS NULL) AS element_count,
       (SELECT COUNT(*) FROM tasks WHERE board_id = b.id AND deleted_at IS NULL) AS task_count
     FROM boards b
     WHERE b.id = $1`,
    [boardId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Board not found');
  }

  return result.rows[0];
}

/**
 * Update a board's name.
 *
 * @param {string} boardId
 * @param {{ name: string }} data
 * @returns {Promise<Object>} Updated board
 */
async function update(boardId, { name }) {
  const result = await query(
    `UPDATE boards SET name = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, name, workspace_id, created_by, created_at, updated_at`,
    [name, boardId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Board not found');
  }

  logger.info('Board updated', { boardId });

  return result.rows[0];
}

/**
 * Delete a board (CASCADE handles elements, tasks, messages, files).
 *
 * @param {string} boardId
 */
async function remove(boardId) {
  const result = await query(
    'DELETE FROM boards WHERE id = $1 RETURNING id',
    [boardId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Board not found');
  }

  logger.info('Board deleted', { boardId });
}

module.exports = {
  create,
  getByWorkspaceId,
  getById,
  update,
  remove,
};
