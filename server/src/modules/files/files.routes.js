const express = require('express');
const filesController = require('./files.controller');
const validate = require('../../middleware/validate');
const { requireBoardRole } = require('../../middleware/rbac');
const { authenticate } = require('../../middleware/auth');
const catchAsync = require('../../utils/catchAsync');
const { registerUploadSchema } = require('./files.validation');

// Note: Mounted at /api/boards/:boardId/files
const router = express.Router({ mergeParams: true });

// Require authentication for all file routes
router.use(authenticate);

// Get upload signature
router.get(
  '/signature',
  requireBoardRole('admin', 'editor'),
  catchAsync(filesController.getUploadSignature)
);

// Register upload
router.post(
  '/',
  requireBoardRole('admin', 'editor'),
  validate(registerUploadSchema),
  catchAsync(filesController.registerUpload)
);

// Get board files
router.get(
  '/',
  requireBoardRole('admin', 'editor', 'viewer'),
  catchAsync(filesController.getByBoardId)
);

// Delete file
router.delete(
  '/:fileId',
  requireBoardRole('admin', 'editor'), // Note: Service layer handles specific ownership vs admin role
  catchAsync(filesController.deleteFile)
);

module.exports = router;
