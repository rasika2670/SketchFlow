const catchAsync = require('../../utils/catchAsync');
const elementsService = require('./elements.service');

/**
 * POST /api/boards/:boardId/elements
 * Create a new element on a board. Requires editor or admin role.
 */
const create = catchAsync(async (req, res) => {
  const element = await elementsService.create(
    req.user.id,
    req.params.boardId,
    req.body
  );

  res.status(201).json({
    status: 'success',
    data: { element },
  });
});

/**
 * GET /api/boards/:boardId/elements
 * List all non-deleted elements on a board.
 */
const getByBoard = catchAsync(async (req, res) => {
  const elements = await elementsService.getByBoardId(req.params.boardId);

  res.status(200).json({
    status: 'success',
    data: { elements },
  });
});

/**
 * PUT /api/elements/:id
 * Update an element with optimistic locking. Requires version in body.
 * Returns 409 CONFLICT if version does not match.
 */
const update = catchAsync(async (req, res) => {
  const { version, ...updates } = req.body;

  const element = await elementsService.update(req.params.id, updates, version);

  res.status(200).json({
    status: 'success',
    data: { element },
  });
});

/**
 * PUT /api/elements/batch
 * Batch update element positions (x, y) for drag operations.
 * Returns updated elements and any conflicts.
 */
const batchUpdate = catchAsync(async (req, res) => {
  const { elements } = req.body;

  const result = await elementsService.batchUpdate(elements);

  res.status(200).json({
    status: 'success',
    data: {
      updated: result.updated,
      conflicts: result.conflicts,
    },
  });
});

/**
 * DELETE /api/elements/:id
 * Soft delete an element (sets deleted_at). Requires editor or admin role.
 */
const remove = catchAsync(async (req, res) => {
  await elementsService.softDelete(req.params.id, req.user.id);

  res.status(204).send();
});

module.exports = {
  create,
  getByBoard,
  update,
  batchUpdate,
  remove,
};
