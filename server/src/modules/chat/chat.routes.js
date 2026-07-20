const express = require('express');
const chatController = require('./chat.controller');
const validate = require('../../middleware/validate');
const { requireBoardRole } = require('../../middleware/rbac');
const { authenticate } = require('../../middleware/auth');
const catchAsync = require('../../utils/catchAsync');
const { sendMessageSchema, updateMessageSchema, getMessagesSchema } = require('./chat.validation');

// Note: Mounted at /api/boards/:boardId/chat
const router = express.Router({ mergeParams: true });

// Require user to be authenticated for all chat routes
router.use(authenticate);

// Send message (admins, editors, viewers can send? Or just admin/editor?)
// Given a collaboration whiteboard, viewers can often chat. We'll allow viewers as well, 
// unless specified otherwise. Let's allow 'admin', 'editor', 'viewer'.
router.post(
  '/',
  requireBoardRole('admin', 'editor', 'viewer'),
  validate(sendMessageSchema),
  catchAsync(chatController.sendMessage)
);

// Get messages
router.get(
  '/',
  requireBoardRole('admin', 'editor', 'viewer'),
  validate(getMessagesSchema, 'query'),
  catchAsync(chatController.getMessages)
);

// Update message
router.put(
  '/:messageId',
  requireBoardRole('admin', 'editor', 'viewer'),
  validate(updateMessageSchema),
  catchAsync(chatController.updateMessage)
);

// Delete message
router.delete(
  '/:messageId',
  requireBoardRole('admin', 'editor', 'viewer'),
  catchAsync(chatController.deleteMessage)
);

// Get thread replies
router.get(
  '/:parentId/replies',
  requireBoardRole('admin', 'editor', 'viewer'),
  catchAsync(chatController.getThreadReplies)
);

module.exports = router;
