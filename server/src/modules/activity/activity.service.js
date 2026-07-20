const { query } = require('../../config/db');

/**
 * Log an activity
 */
const log = async (boardId, userId, action, metadata = {}, workspaceId = null) => {
  const result = await query(
    `
    INSERT INTO activity_logs (board_id, user_id, action, metadata, workspace_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, board_id, workspace_id, user_id, action, metadata, created_at
    `,
    [boardId || null, userId, action, JSON.stringify(metadata), workspaceId || null]
  );

  return result.rows[0];
};

/**
 * Get paginated activity feed for a board
 */
const getByBoardId = async (boardId, { cursor_created_at, cursor_id, limit = 50 }) => {
  let queryStr = `
    SELECT a.*, u.name as user_name, u.avatar_url as user_avatar
    FROM activity_logs a
    JOIN users u ON a.user_id = u.id
    WHERE a.board_id = $1
  `;
  const params = [boardId];
  let paramCount = 1;

  if (cursor_created_at && cursor_id) {
    queryStr += ` AND (a.created_at, a.id) < ($${paramCount + 1}, $${paramCount + 2})`;
    params.push(cursor_created_at, cursor_id);
    paramCount += 2;
  }

  queryStr += ` ORDER BY a.created_at DESC, a.id DESC LIMIT $${paramCount + 1}`;
  params.push(limit);

  const result = await query(queryStr, params);

  return result.rows;
};

module.exports = {
  log,
  getByBoardId
};
