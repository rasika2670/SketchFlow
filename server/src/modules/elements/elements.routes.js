const { Router } = require('express');
const elementsController = require('./elements.controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireBoardRole, requireElementBoardRole } = require('../../middleware/rbac');
const elementsValidation = require('./elements.validation');

// =============================================
// Board-scoped element routes
// Mounted at: /api/boards/:boardId/elements
// =============================================
const boardScopedRouter = Router({ mergeParams: true });

boardScopedRouter.use(authenticate);

// Create element — editors and admins only
boardScopedRouter.post(
  '/',
  requireBoardRole('admin', 'editor'),
  validate(elementsValidation.create),
  elementsController.create
);

// List elements — all workspace members
boardScopedRouter.get(
  '/',
  requireBoardRole('admin', 'editor', 'viewer'),
  validate(elementsValidation.boardIdParam),
  elementsController.getByBoard
);

// =============================================
// Element-specific routes
// Mounted at: /api/elements
// =============================================
const elementRouter = Router();

elementRouter.use(authenticate);

// Batch update must come BEFORE /:id to avoid route collision
elementRouter.put(
  '/batch',
  validate(elementsValidation.batchUpdate),
  elementsController.batchUpdate
);

// Update element — editors and admins only
elementRouter.put(
  '/:id',
  validate(elementsValidation.update),
  requireElementBoardRole('admin', 'editor'),
  elementsController.update
);

// Soft delete element — editors and admins only
elementRouter.delete(
  '/:id',
  validate(elementsValidation.idParam),
  requireElementBoardRole('admin', 'editor'),
  elementsController.remove
);

module.exports = {
  boardScopedRouter,
  elementRouter,
};
