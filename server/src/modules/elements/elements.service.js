const { query, getClient } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Create a new element on a board.
 *
 * @param {string} userId - Creator's user ID
 * @param {string} boardId - Board to add element to
 * @param {Object} elementData - { type, x, y, width, height, color, text }
 * @returns {Promise<Object>} Created element
 */
async function create(userId, boardId, elementData) {
  const { type, x = 0, y = 0, width = null, height = null, color = null, text = null } = elementData;

  const result = await query(
    `INSERT INTO elements (board_id, type, x, y, width, height, color, text, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, board_id, type, x, y, width, height, color, text, version, created_by, created_at, updated_at`,
    [boardId, type, x, y, width, height, color, text, userId]
  );

  logger.info('Element created', {
    elementId: result.rows[0].id,
    boardId,
    type,
    userId,
  });

  return result.rows[0];
}

/**
 * Get all non-deleted elements for a board.
 *
 * @param {string} boardId
 * @returns {Promise<Object[]>}
 */
async function getByBoardId(boardId) {
  const result = await query(
    `SELECT id, board_id, type, x, y, width, height, color, text, version,
            created_by, created_at, updated_at
     FROM elements
     WHERE board_id = $1 AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [boardId]
  );

  return result.rows;
}

/**
 * Get a single element by ID (including soft-deleted for lock/unlock checks).
 *
 * @param {string} elementId
 * @returns {Promise<Object>}
 */
async function getById(elementId) {
  const result = await query(
    `SELECT id, board_id, type, x, y, width, height, color, text, version,
            created_by, created_at, updated_at, deleted_at
     FROM elements
     WHERE id = $1`,
    [elementId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Element not found');
  }

  return result.rows[0];
}

/**
 * Update an element with optimistic locking.
 * Only updates the provided fields; version MUST match for the update to succeed.
 *
 * @param {string} elementId
 * @param {Object} updates - Fields to update + expectedVersion
 * @param {number} expectedVersion - Client's known version (optimistic locking)
 * @returns {Promise<Object>} Updated element
 * @throws {ApiError} 409 if version mismatch (concurrent edit conflict)
 */
async function update(elementId, updates, expectedVersion) {
  // Build a dynamic SET clause from provided fields (excluding version)
  const allowedFields = ['x', 'y', 'width', 'height', 'color', 'text'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex++}`);
      values.push(updates[field]);
    }
  }

  if (setClauses.length === 0) {
    throw ApiError.badRequest('No valid fields to update');
  }

  // Always bump version + updated_at
  setClauses.push(`version = version + 1`);
  setClauses.push(`updated_at = NOW()`);

  // Append WHERE clause params
  values.push(elementId);       // $N
  values.push(expectedVersion); // $N+1

  const sql = `
    UPDATE elements
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex} AND version = $${paramIndex + 1} AND deleted_at IS NULL
    RETURNING id, board_id, type, x, y, width, height, color, text, version,
              created_by, created_at, updated_at
  `;

  const result = await query(sql, values);

  if (result.rows.length === 0) {
    // Could be: wrong version (conflict) or element not found / deleted
    const exists = await query(
      'SELECT id FROM elements WHERE id = $1 AND deleted_at IS NULL',
      [elementId]
    );
    if (exists.rows.length === 0) {
      throw ApiError.notFound('Element not found or already deleted');
    }
    // Element exists but version didn't match → conflict
    throw ApiError.conflict(
      'Element was modified by another user. Please reload and try again.'
    );
  }

  logger.info('Element updated', { elementId, newVersion: result.rows[0].version });

  return result.rows[0];
}

/**
 * Batch update element positions (x, y) — for drag operations.
 * All updates are applied atomically in a single query with optimistic locking per element.
 *
 * @param {Array<{id: string, x: number, y: number, version: number}>} elements
 * @returns {Promise<{updated: Object[], conflicts: string[]}>}
 */
async function batchUpdate(elements) {
  if (elements.length === 0) {
    return { updated: [], conflicts: [] };
  }

  // Use jsonb_to_recordset for efficient bulk update in a single query
  const result = await query(
    `UPDATE elements
     SET
       x          = data.x::DECIMAL,
       y          = data.y::DECIMAL,
       version    = elements.version + 1,
       updated_at = NOW()
     FROM jsonb_to_recordset($1::jsonb) AS data(id UUID, x NUMERIC, y NUMERIC, version INTEGER)
     WHERE elements.id = data.id
       AND elements.version = data.version
       AND elements.deleted_at IS NULL
     RETURNING elements.id, elements.board_id, elements.x, elements.y, elements.version`,
    [JSON.stringify(elements)]
  );

  const updatedIds = new Set(result.rows.map((r) => r.id));
  const conflicts = elements
    .filter((e) => !updatedIds.has(e.id))
    .map((e) => e.id);

  if (conflicts.length > 0) {
    logger.warn('Batch update: version conflicts detected', { conflicts });
  }

  return { updated: result.rows, conflicts };
}

/**
 * Soft delete an element by setting deleted_at.
 *
 * @param {string} elementId
 * @returns {Promise<Object>} Deleted element record
 */
async function softDelete(elementId) {
  const result = await query(
    `UPDATE elements
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, board_id, deleted_at`,
    [elementId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Element not found or already deleted');
  }

  logger.info('Element soft-deleted', { elementId });

  return result.rows[0];
}

module.exports = {
  create,
  getByBoardId,
  getById,
  update,
  batchUpdate,
  softDelete,
};
