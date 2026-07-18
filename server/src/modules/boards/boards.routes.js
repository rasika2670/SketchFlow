const { Router } = require('express');
const boardsController = require('./boards.controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireRole, requireBoardRole } = require('../../middleware/rbac');
const boardsValidation = require('./boards.validation');

// =============================================
// Workspace-scoped board routes
// Mounted at: /api/workspaces/:workspaceId/boards
// =============================================
const workspaceScopedRouter = Router({ mergeParams: true });

workspaceScopedRouter.use(authenticate);

workspaceScopedRouter.post(
  '/',
  validate(boardsValidation.create),
  requireRole('admin', 'editor'),
  boardsController.create
);

workspaceScopedRouter.get(
  '/',
  validate(boardsValidation.workspaceIdParam),
  requireRole('admin', 'editor', 'viewer'),
  boardsController.getByWorkspace
);

// =============================================
// Board-specific routes
// Mounted at: /api/boards
// =============================================
const boardRouter = Router();

boardRouter.use(authenticate);

boardRouter.get(
  '/:id',
  validate(boardsValidation.idParam),
  requireBoardRole('admin', 'editor', 'viewer'),
  boardsController.getOne
);

boardRouter.put(
  '/:id',
  validate(boardsValidation.update),
  requireBoardRole('admin', 'editor'),
  boardsController.update
);

boardRouter.delete(
  '/:id',
  validate(boardsValidation.idParam),
  requireBoardRole('admin'),
  boardsController.remove
);

module.exports = {
  workspaceScopedRouter,
  boardRouter,
};
