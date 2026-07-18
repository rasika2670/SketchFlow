const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * RBAC middleware factory.
 * Verifies the authenticated user has one of the allowed roles in the workspace.
 *
 * Resolves workspaceId from (in priority order):
 *   1. req.params.workspaceId  (workspace-scoped routes like /workspaces/:workspaceId/boards)
 *   2. req.params.id           (workspace routes like /workspaces/:id)
 *   3. req.body.workspace_id   (board creation)
 *
 * Attaches req.membership = { role, workspace_id } for downstream use.
 *
 * @param {...string} allowedRoles - Roles permitted to access the route (e.g., 'admin', 'editor', 'viewer')
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.put('/:id', authenticate, requireRole('admin'), controller.update);
 *   router.get('/:id', authenticate, requireRole('admin', 'editor', 'viewer'), controller.get);
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      // Resolve workspaceId from multiple possible sources
      const workspaceId =
        req.params.workspaceId ||
        req.params.id ||
        req.body?.workspace_id;

      if (!workspaceId) {
        throw ApiError.badRequest('Workspace ID is required');
      }

      // Verify workspace exists
      const workspaceResult = await query(
        'SELECT id FROM workspaces WHERE id = $1',
        [workspaceId]
      );

      if (workspaceResult.rows.length === 0) {
        throw ApiError.notFound('Workspace not found');
      }

      // Check user membership and role
      const memberResult = await query(
        'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [workspaceId, userId]
      );

      if (memberResult.rows.length === 0) {
        throw ApiError.forbidden('You are not a member of this workspace');
      }

      const { role } = memberResult.rows[0];

      if (!allowedRoles.includes(role)) {
        throw ApiError.forbidden(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        );
      }

      // Attach membership info for downstream use
      req.membership = { role, workspace_id: workspaceId };
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * RBAC middleware for board-specific routes.
 * Looks up the board's workspace_id, then checks the user's role in that workspace.
 *
 * Reads boardId from req.params.id.
 * Attaches req.membership = { role, workspace_id } and req.board = { id, workspace_id, ... }.
 *
 * @param {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.put('/:id', authenticate, requireBoardRole('admin', 'editor'), controller.update);
 */
const requireBoardRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const boardId = req.params.id;
      if (!boardId) {
        throw ApiError.badRequest('Board ID is required');
      }

      // Look up board to get workspace_id
      const boardResult = await query(
        'SELECT id, name, workspace_id, created_by, created_at, updated_at FROM boards WHERE id = $1',
        [boardId]
      );

      if (boardResult.rows.length === 0) {
        throw ApiError.notFound('Board not found');
      }

      const board = boardResult.rows[0];

      // Check user membership and role in the board's workspace
      const memberResult = await query(
        'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [board.workspace_id, userId]
      );

      if (memberResult.rows.length === 0) {
        throw ApiError.forbidden('You are not a member of this workspace');
      }

      const { role } = memberResult.rows[0];

      if (!allowedRoles.includes(role)) {
        throw ApiError.forbidden(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        );
      }

      // Attach board and membership info for downstream use
      req.board = board;
      req.membership = { role, workspace_id: board.workspace_id };
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * RBAC middleware for element-specific routes.
 * Looks up element → gets board_id → gets workspace_id → checks user's role.
 *
 * Reads elementId from req.params.id.
 * Attaches req.element, req.board, and req.membership for downstream use.
 *
 * @param {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.put('/:id', authenticate, requireElementBoardRole('admin', 'editor'), controller.update);
 */
const requireElementBoardRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const elementId = req.params.id;
      if (!elementId) {
        throw ApiError.badRequest('Element ID is required');
      }

      // Look up element to get board_id
      const elementResult = await query(
        'SELECT id, board_id, created_by FROM elements WHERE id = $1 AND deleted_at IS NULL',
        [elementId]
      );

      if (elementResult.rows.length === 0) {
        throw ApiError.notFound('Element not found');
      }

      const element = elementResult.rows[0];

      // Look up board to get workspace_id
      const boardResult = await query(
        'SELECT id, name, workspace_id, created_by FROM boards WHERE id = $1',
        [element.board_id]
      );

      if (boardResult.rows.length === 0) {
        throw ApiError.notFound('Board not found');
      }

      const board = boardResult.rows[0];

      // Check user membership and role in the board's workspace
      const memberResult = await query(
        'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [board.workspace_id, userId]
      );

      if (memberResult.rows.length === 0) {
        throw ApiError.forbidden('You are not a member of this workspace');
      }

      const { role } = memberResult.rows[0];

      if (!allowedRoles.includes(role)) {
        throw ApiError.forbidden(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        );
      }

      // Attach element, board, and membership info for downstream use
      req.element = element;
      req.board = board;
      req.membership = { role, workspace_id: board.workspace_id };
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requireRole,
  requireBoardRole,
  requireElementBoardRole,
};
