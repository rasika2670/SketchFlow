const express = require('express');
const activityController = require('./activity.controller');
const { requireBoardRole } = require('../../middleware/rbac');
const { authenticate } = require('../../middleware/auth');
const catchAsync = require('../../utils/catchAsync');

// Note: Mounted at /api/boards/:boardId/activities
const router = express.Router({ mergeParams: true });

// Require authentication for all activity routes
router.use(authenticate);

// Get activities (all board members can view activities)
router.get(
  '/',
  requireBoardRole('admin', 'editor', 'viewer'),
  catchAsync(activityController.getActivities)
);

module.exports = router;
