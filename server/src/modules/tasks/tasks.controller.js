const catchAsync = require('../../utils/catchAsync');
const tasksService = require('./tasks.service');
const { getIO } = require('../../sockets');
const logger = require('../../utils/logger');

/**
 * POST /api/boards/:boardId/tasks
 * Create a new task on a board. Requires editor or admin role.
 */
const create = catchAsync(async (req, res) => {
  const task = await tasksService.create(
    req.user.id,
    req.params.boardId,
    req.body
  );

  // Broadcast to board room via Socket.IO
  const io = getIO();
  if (io) {
    io.to(`board:${task.board_id}`).emit('task:created', {
      boardId: task.board_id,
      task,
      userId: req.user.id,
    });
  }

  res.status(201).json({
    status: 'success',
    data: { task },
  });
});

/**
 * POST /api/boards/:boardId/tasks/convert
 * Convert a sticky note to a task. Requires editor or admin role.
 */
const convertFromSticky = catchAsync(async (req, res) => {
  const { element_id, ...taskData } = req.body;

  const task = await tasksService.convertFromSticky(
    req.user.id,
    req.params.boardId,
    element_id,
    taskData
  );

  // Broadcast to board room via Socket.IO
  const io = getIO();
  if (io) {
    io.to(`board:${task.board_id}`).emit('task:created', {
      boardId: task.board_id,
      task,
      userId: req.user.id,
      convertedFrom: element_id,
    });
  }

  res.status(201).json({
    status: 'success',
    data: { task },
  });
});

/**
 * GET /api/boards/:boardId/tasks
 * List all non-deleted tasks on a board with optional filters.
 */
const getByBoard = catchAsync(async (req, res) => {
  const tasks = await tasksService.getByBoardId(req.params.boardId, req.query);

  res.status(200).json({
    status: 'success',
    data: { tasks },
  });
});

/**
 * GET /api/tasks/:taskId
 * Get a single task with source element info.
 */
const getById = catchAsync(async (req, res) => {
  const task = await tasksService.getById(req.params.taskId);

  res.status(200).json({
    status: 'success',
    data: { task },
  });
});

/**
 * PUT /api/tasks/:taskId
 * Update a task with optimistic locking. Requires version in body.
 * Returns 409 CONFLICT if version does not match.
 */
const update = catchAsync(async (req, res) => {
  const { version, ...updates } = req.body;

  const task = await tasksService.update(req.params.taskId, updates, version);

  // Broadcast to board room via Socket.IO
  const io = getIO();
  if (io) {
    io.to(`board:${task.board_id}`).emit('task:updated', {
      boardId: task.board_id,
      task,
      userId: req.user.id,
    });
  }

  res.status(200).json({
    status: 'success',
    data: { task },
  });
});

/**
 * PATCH /api/tasks/:taskId/status
 * Update task status only. Requires version for optimistic locking.
 */
const updateStatus = catchAsync(async (req, res) => {
  const { status, version } = req.body;

  const task = await tasksService.updateStatus(req.params.taskId, status, version);

  // Broadcast to board room via Socket.IO
  const io = getIO();
  if (io) {
    io.to(`board:${task.board_id}`).emit('task:status_changed', {
      boardId: task.board_id,
      task,
      userId: req.user.id,
    });
  }

  res.status(200).json({
    status: 'success',
    data: { task },
  });
});

/**
 * PATCH /api/tasks/:taskId/assign
 * Assign or unassign a task. Requires version for optimistic locking.
 */
const assignTask = catchAsync(async (req, res) => {
  const { assignee_id, version } = req.body;

  const task = await tasksService.assignTask(req.params.taskId, assignee_id, version);

  // Broadcast to board room via Socket.IO
  const io = getIO();
  if (io) {
    io.to(`board:${task.board_id}`).emit('task:assigned', {
      boardId: task.board_id,
      task,
      userId: req.user.id,
    });
  }

  res.status(200).json({
    status: 'success',
    data: { task },
  });
});

/**
 * DELETE /api/tasks/:taskId
 * Soft delete a task (sets deleted_at). Requires editor or admin role.
 */
const remove = catchAsync(async (req, res) => {
  const deleted = await tasksService.softDelete(req.params.taskId);

  // Broadcast to board room via Socket.IO
  const io = getIO();
  if (io) {
    io.to(`board:${deleted.board_id}`).emit('task:deleted', {
      boardId: deleted.board_id,
      taskId: deleted.id,
      userId: req.user.id,
    });
  }

  res.status(204).send();
});

module.exports = {
  create,
  convertFromSticky,
  getByBoard,
  getById,
  update,
  updateStatus,
  assignTask,
  remove,
};
