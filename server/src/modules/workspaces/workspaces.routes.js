const { Router } = require('express');
const workspacesController = require('./workspaces.controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const workspacesValidation = require('./workspaces.validation');

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

// ---- Workspace CRUD ----

router.post(
  '/',
  validate(workspacesValidation.create),
  workspacesController.create
);

router.get(
  '/',
  workspacesController.getAll
);

router.get(
  '/:id',
  validate(workspacesValidation.idParam),
  requireRole('admin', 'editor', 'viewer'),
  workspacesController.getOne
);

router.put(
  '/:id',
  validate(workspacesValidation.update),
  requireRole('admin'),
  workspacesController.update
);

router.delete(
  '/:id',
  validate(workspacesValidation.idParam),
  requireRole('admin'),
  workspacesController.remove
);

// ---- Member Management ----

router.post(
  '/:id/members',
  validate(workspacesValidation.inviteMember),
  requireRole('admin'),
  workspacesController.inviteMember
);

router.get(
  '/:id/members',
  validate(workspacesValidation.idParam),
  requireRole('admin', 'editor', 'viewer'),
  workspacesController.getMembers
);

router.put(
  '/:id/members/:userId',
  validate(workspacesValidation.updateMemberRole),
  requireRole('admin'),
  workspacesController.updateMemberRole
);

router.delete(
  '/:id/members/:userId',
  validate(workspacesValidation.memberParams),
  requireRole('admin'),
  workspacesController.removeMember
);

module.exports = router;
