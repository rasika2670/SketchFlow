const { Router } = require('express');
const tasksController = require('./tasks.controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireBoardRole, requireTaskBoardRole } = require('../../middleware/rbac');
const tasksValidation = require('./tasks.validation');

// =============================================
// Board-scoped task routes
// Mounted at: /api/boards/:boardId/tasks
// =============================================
const boardScopedRouter = Router({ mergeParams: true });

boardScopedRouter.use(authenticate);

// Convert sticky → task — must come BEFORE generic POST / to avoid route collision
boardScopedRouter.post(
  '/convert',
  requireBoardRole('admin', 'editor'),
  validate(tasksValidation.convertFromSticky),
  tasksController.convertFromSticky
);

// Create task — editors and admins only
boardScopedRouter.post(
  '/',
  requireBoardRole('admin', 'editor'),
  validate(tasksValidation.create),
  tasksController.create
);

// List tasks with optional filters — all workspace members
boardScopedRouter.get(
  '/',
  requireBoardRole('admin', 'editor', 'viewer'),
  validate({ ...tasksValidation.boardIdParam, ...tasksValidation.listFilters }),
  tasksController.getByBoard
);

// =============================================
// Task-specific routes
// Mounted at: /api/tasks
// =============================================
const taskRouter = Router();

taskRouter.use(authenticate);

// Get task details — all workspace members
taskRouter.get(
  '/:taskId',
  validate(tasksValidation.taskIdParam),
  requireTaskBoardRole('admin', 'editor', 'viewer'),
  tasksController.getById
);

// Update task — editors and admins only
taskRouter.put(
  '/:taskId',
  validate(tasksValidation.update),
  requireTaskBoardRole('admin', 'editor'),
  tasksController.update
);

// Update status — editors and admins only
taskRouter.patch(
  '/:taskId/status',
  validate(tasksValidation.updateStatus),
  requireTaskBoardRole('admin', 'editor'),
  tasksController.updateStatus
);

// Assign task — editors and admins only
taskRouter.patch(
  '/:taskId/assign',
  validate(tasksValidation.assignTask),
  requireTaskBoardRole('admin', 'editor'),
  tasksController.assignTask
);

// Soft delete task — editors and admins only
taskRouter.delete(
  '/:taskId',
  validate(tasksValidation.taskIdParam),
  requireTaskBoardRole('admin', 'editor'),
  tasksController.remove
);

module.exports = {
  boardScopedRouter,
  taskRouter,
};
