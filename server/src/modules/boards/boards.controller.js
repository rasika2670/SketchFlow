const catchAsync = require('../../utils/catchAsync');
const boardsService = require('./boards.service');

/**
 * POST /api/workspaces/:workspaceId/boards
 * Create a new board in a workspace (admin/editor).
 */
const create = catchAsync(async (req, res) => {
  const { name } = req.body;

  const board = await boardsService.create(
    req.user.id,
    req.params.workspaceId,
    { name }
  );

  res.status(201).json({
    status: 'success',
    data: { board },
  });
});

/**
 * GET /api/workspaces/:workspaceId/boards
 * List all boards in a workspace (requires membership).
 */
const getByWorkspace = catchAsync(async (req, res) => {
  const boards = await boardsService.getByWorkspaceId(req.params.workspaceId);

  res.status(200).json({
    status: 'success',
    data: { boards },
  });
});

/**
 * GET /api/boards/:id
 * Get board details (requires membership via board's workspace).
 */
const getOne = catchAsync(async (req, res) => {
  // req.board is already loaded by requireBoardRole middleware
  const board = await boardsService.getById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: { board },
  });
});

/**
 * PUT /api/boards/:id
 * Update board name (admin/editor).
 */
const update = catchAsync(async (req, res) => {
  const { name } = req.body;

  const board = await boardsService.update(req.params.id, { name });

  res.status(200).json({
    status: 'success',
    data: { board },
  });
});

/**
 * DELETE /api/boards/:id
 * Delete a board (admin only).
 */
const remove = catchAsync(async (req, res) => {
  await boardsService.remove(req.params.id);

  res.status(204).send();
});

module.exports = {
  create,
  getByWorkspace,
  getOne,
  update,
  remove,
};
