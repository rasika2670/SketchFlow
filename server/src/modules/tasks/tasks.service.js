const { query, getClient } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const activityService = require('../activity/activity.service');

/**
 * Create a new task on a board.
 *
 * @param {string} userId - Creator's user ID
 * @param {string} boardId - Board to add task to
 * @param {Object} taskData - { title, description, status, priority, assignee_id, due_date }
 * @returns {Promise<Object>} Created task
 */
async function create(userId, boardId, taskData) {
  const {
    title,
    description = null,
    status = 'todo',
    priority = 'medium',
    assignee_id = null,
    due_date = null,
  } = taskData;

  // If assignee_id is provided, validate workspace membership
  if (assignee_id) {
    await validateAssigneeWorkspaceMembership(boardId, assignee_id);
  }

  const result = await query(
    `INSERT INTO tasks (title, description, status, priority, assignee_id, due_date, board_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, title, description, status, priority, assignee_id, due_date,
               board_id, created_by, version, created_at, updated_at`,
    [title, description, status, priority, assignee_id, due_date, boardId, userId]
  );

  logger.info('Task created', {
    taskId: result.rows[0].id,
    boardId,
    title,
    userId,
  });

  await activityService.log(boardId, userId, 'task_created', { taskId: result.rows[0].id, title });

  return result.rows[0];
}

/**
 * Convert a sticky note element to a task (atomic transaction).
 *
 * 1. Verify element exists, belongs to the board, is type 'sticky', not deleted
 * 2. Check for duplicate conversion (task_sources already has this element)
 * 3. INSERT task with version=1
 * 4. INSERT task_sources with snapshot of sticky text
 *
 * @param {string} userId - Creator's user ID
 * @param {string} boardId - Board ID
 * @param {string} elementId - Sticky note element ID
 * @param {Object} taskData - { title, description, status, priority, assignee_id, due_date }
 * @returns {Promise<Object>} Created task with source info
 */
async function convertFromSticky(userId, boardId, elementId, taskData) {
  const {
    title,
    description = null,
    status = 'todo',
    priority = 'medium',
    assignee_id = null,
    due_date = null,
  } = taskData;

  // If assignee_id is provided, validate workspace membership
  if (assignee_id) {
    await validateAssigneeWorkspaceMembership(boardId, assignee_id);
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Verify element exists, belongs to this board, is a sticky, and is not deleted
    const elementResult = await client.query(
      `SELECT id, board_id, type, text
       FROM elements
       WHERE id = $1 AND deleted_at IS NULL`,
      [elementId]
    );

    if (elementResult.rows.length === 0) {
      throw ApiError.notFound('Element not found or already deleted');
    }

    const element = elementResult.rows[0];

    if (element.board_id !== boardId) {
      throw ApiError.badRequest('Element does not belong to this board');
    }

    if (element.type !== 'sticky') {
      throw ApiError.badRequest('Only sticky note elements can be converted to tasks');
    }

    // 2. Check for duplicate conversion
    const duplicateCheck = await client.query(
      'SELECT task_id FROM task_sources WHERE element_id = $1',
      [elementId]
    );

    if (duplicateCheck.rows.length > 0) {
      throw ApiError.conflict(
        'This sticky note has already been converted to a task'
      );
    }

    // 3. Create the task
    const taskResult = await client.query(
      `INSERT INTO tasks (title, description, status, priority, assignee_id, due_date, board_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, description, status, priority, assignee_id, due_date,
                 board_id, created_by, version, created_at, updated_at`,
      [title, description, status, priority, assignee_id, due_date, boardId, userId]
    );

    const task = taskResult.rows[0];

    // 4. Link task to source sticky note with text snapshot
    await client.query(
      `INSERT INTO task_sources (task_id, element_id, snapshot_text)
       VALUES ($1, $2, $3)`,
      [task.id, elementId, element.text]
    );

    await client.query('COMMIT');

    // Attach source info to the returned task
    task.source_element_id = elementId;
    task.original_sticky_text = element.text;

    logger.info('Sticky note converted to task', {
      taskId: task.id,
      elementId,
      boardId,
      userId,
    });

    return task;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get all non-deleted tasks for a board with optional filters.
 *
 * @param {string} boardId
 * @param {Object} [filters] - { status, assignee_id, priority }
 * @returns {Promise<Object[]>}
 */
async function getByBoardId(boardId, filters = {}) {
  const conditions = ['t.board_id = $1', 't.deleted_at IS NULL'];
  const values = [boardId];
  let paramIndex = 2;

  if (filters.status) {
    conditions.push(`t.status = $${paramIndex++}`);
    values.push(filters.status);
  }

  if (filters.assignee_id) {
    conditions.push(`t.assignee_id = $${paramIndex++}`);
    values.push(filters.assignee_id);
  }

  if (filters.priority) {
    conditions.push(`t.priority = $${paramIndex++}`);
    values.push(filters.priority);
  }

  const result = await query(
    `SELECT t.id, t.title, t.description, t.status, t.priority,
            t.assignee_id, t.due_date, t.board_id, t.created_by,
            t.version, t.created_at, t.updated_at,
            u.name AS assignee_name, u.avatar_url AS assignee_avatar
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.created_at DESC`,
    values
  );

  return result.rows;
}

/**
 * Get a single task by ID with source element info.
 *
 * @param {string} taskId
 * @returns {Promise<Object>}
 */
async function getById(taskId) {
  const result = await query(
    `SELECT t.id, t.title, t.description, t.status, t.priority,
            t.assignee_id, t.due_date, t.board_id, t.created_by,
            t.version, t.created_at, t.updated_at,
            u.name AS assignee_name, u.avatar_url AS assignee_avatar,
            ts.element_id AS source_element_id,
            ts.snapshot_text AS original_sticky_text
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     LEFT JOIN task_sources ts ON ts.task_id = t.id
     WHERE t.id = $1 AND t.deleted_at IS NULL`,
    [taskId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Task not found');
  }

  return result.rows[0];
}

/**
 * Update a task with optimistic locking.
 * Only updates the provided fields; version MUST match.
 *
 * @param {string} taskId
 * @param {Object} updates - Fields to update
 * @param {number} expectedVersion - Client's known version
 * @param {string} [boardId] - Board ID for assignee validation (optional, fetched if not provided)
 * @returns {Promise<Object>} Updated task
 * @throws {ApiError} 409 if version mismatch
 */
async function update(taskId, updates, expectedVersion, boardId) {
  const allowedFields = ['title', 'description', 'status', 'priority', 'assignee_id', 'due_date'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  // If assignee_id is being updated and is not null, validate workspace membership
  if (updates.assignee_id !== undefined && updates.assignee_id !== null) {
    // Fetch boardId if not provided
    const taskBoardId = boardId || (await getTaskBoardId(taskId));
    await validateAssigneeWorkspaceMembership(taskBoardId, updates.assignee_id);
  }

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
  setClauses.push('version = version + 1');
  setClauses.push('updated_at = NOW()');

  // Append WHERE clause params
  values.push(taskId);          // $N
  values.push(expectedVersion); // $N+1

  const sql = `
    UPDATE tasks
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex} AND version = $${paramIndex + 1} AND deleted_at IS NULL
    RETURNING id, title, description, status, priority, assignee_id, due_date,
              board_id, created_by, version, created_at, updated_at
  `;

  const result = await query(sql, values);

  if (result.rows.length === 0) {
    // Determine if not found or version conflict
    const exists = await query(
      'SELECT id FROM tasks WHERE id = $1 AND deleted_at IS NULL',
      [taskId]
    );
    if (exists.rows.length === 0) {
      throw ApiError.notFound('Task not found or already deleted');
    }
    throw ApiError.conflict(
      'Task was modified by another user. Please reload and try again.'
    );
  }

  logger.info('Task updated', { taskId, newVersion: result.rows[0].version });

  return result.rows[0];
}

/**
 * Update task status only (simplified update).
 * Logs a warning if stages are skipped.
 *
 * @param {string} taskId
 * @param {string} status - New status
 * @param {number} expectedVersion
 * @param {string} userId - User making the change
 * @returns {Promise<Object>} Updated task
 */
async function updateStatus(taskId, status, expectedVersion, userId) {
  // Fetch current status for skip warning
  const current = await query(
    'SELECT status FROM tasks WHERE id = $1 AND deleted_at IS NULL',
    [taskId]
  );

  if (current.rows.length === 0) {
    throw ApiError.notFound('Task not found');
  }

  const currentStatus = current.rows[0].status;

  // Log soft warning if stages are skipped
  const statusOrder = ['todo', 'in_progress', 'review', 'done'];
  const fromIndex = statusOrder.indexOf(currentStatus);
  const toIndex = statusOrder.indexOf(status);

  if (Math.abs(toIndex - fromIndex) > 1) {
    logger.warn('Task status stage skipped', {
      taskId,
      from: currentStatus,
      to: status,
    });
  }

  const result = await query(
    `UPDATE tasks
     SET status = $1, version = version + 1, updated_at = NOW()
     WHERE id = $2 AND version = $3 AND deleted_at IS NULL
     RETURNING id, title, description, status, priority, assignee_id, due_date,
               board_id, created_by, version, created_at, updated_at`,
    [status, taskId, expectedVersion]
  );

  if (result.rows.length === 0) {
    throw ApiError.conflict(
      'Task was modified by another user. Please reload and try again.'
    );
  }

  logger.info('Task status changed', {
    taskId,
    from: currentStatus,
    to: status,
    newVersion: result.rows[0].version,
  });

  await activityService.log(result.rows[0].board_id, userId, 'task_status_changed', { taskId, title: result.rows[0].title, from: currentStatus, to: status });

  return result.rows[0];
}

/**
 * Assign or unassign a task.
 *
 * @param {string} taskId
 * @param {string|null} assigneeId - User ID or null to unassign
 * @param {number} expectedVersion
 * @param {string} userId - User making the change
 * @returns {Promise<Object>} Updated task
 */
async function assignTask(taskId, assigneeId, expectedVersion, userId) {
  // If assigning (not unassigning), validate user exists and is a workspace member
  if (assigneeId !== null) {
    const taskBoardId = await getTaskBoardId(taskId);
    await validateAssigneeWorkspaceMembership(taskBoardId, assigneeId);
  }

  const result = await query(
    `UPDATE tasks
     SET assignee_id = $1, version = version + 1, updated_at = NOW()
     WHERE id = $2 AND version = $3 AND deleted_at IS NULL
     RETURNING id, title, description, status, priority, assignee_id, due_date,
               board_id, created_by, version, created_at, updated_at`,
    [assigneeId, taskId, expectedVersion]
  );

  if (result.rows.length === 0) {
    // Determine if not found or version conflict
    const exists = await query(
      'SELECT id FROM tasks WHERE id = $1 AND deleted_at IS NULL',
      [taskId]
    );
    if (exists.rows.length === 0) {
      throw ApiError.notFound('Task not found or already deleted');
    }
    throw ApiError.conflict(
      'Task was modified by another user. Please reload and try again.'
    );
  }

  logger.info('Task assigned', {
    taskId,
    assigneeId,
    newVersion: result.rows[0].version,
  });

  await activityService.log(result.rows[0].board_id, userId, 'task_assigned', { taskId, title: result.rows[0].title, assigneeId });

  return result.rows[0];
}

/**
 * Soft delete a task by setting deleted_at.
 *
 * @param {string} taskId
 * @returns {Promise<Object>} Deleted task record
 */
async function softDelete(taskId) {
  const result = await query(
    `UPDATE tasks
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, board_id, deleted_at`,
    [taskId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Task not found or already deleted');
  }

  logger.info('Task soft-deleted', { taskId });

  return result.rows[0];
}

// =============================================
// Helper functions
// =============================================

/**
 * Get the board_id for a task.
 * @param {string} taskId
 * @returns {Promise<string>}
 */
async function getTaskBoardId(taskId) {
  const result = await query(
    'SELECT board_id FROM tasks WHERE id = $1 AND deleted_at IS NULL',
    [taskId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Task not found');
  }

  return result.rows[0].board_id;
}

/**
 * Validate that a user is a member of the workspace that owns the board.
 * This ensures you can only assign tasks to workspace members.
 *
 * @param {string} boardId
 * @param {string} userId - The user to validate
 * @throws {ApiError} 400 if user is not a workspace member
 */
async function validateAssigneeWorkspaceMembership(boardId, userId) {
  const result = await query(
    `SELECT 1
     FROM workspace_members wm
     JOIN boards b ON b.workspace_id = wm.workspace_id
     WHERE b.id = $1 AND wm.user_id = $2`,
    [boardId, userId]
  );

  if (result.rows.length === 0) {
    throw ApiError.badRequest(
      'Assignee must be a member of the workspace this board belongs to'
    );
  }
}

module.exports = {
  create,
  convertFromSticky,
  getByBoardId,
  getById,
  update,
  updateStatus,
  assignTask,
  softDelete,
};
