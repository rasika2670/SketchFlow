const catchAsync = require('../../utils/catchAsync');
const workspacesService = require('./workspaces.service');

/**
 * POST /api/workspaces
 * Create a new workspace. The authenticated user becomes the admin.
 */
const create = catchAsync(async (req, res) => {
  const { name, description } = req.body;

  const workspace = await workspacesService.create(req.user.id, { name, description });

  res.status(201).json({
    status: 'success',
    data: { workspace },
  });
});

/**
 * GET /api/workspaces
 * List all workspaces the authenticated user belongs to.
 */
const getAll = catchAsync(async (req, res) => {
  const workspaces = await workspacesService.getByUserId(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { workspaces },
  });
});

/**
 * GET /api/workspaces/:id
 * Get workspace details (requires membership).
 */
const getOne = catchAsync(async (req, res) => {
  const workspace = await workspacesService.getById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: { workspace },
  });
});

/**
 * PUT /api/workspaces/:id
 * Update workspace name/description (admin only).
 */
const update = catchAsync(async (req, res) => {
  const { name, description } = req.body;

  const workspace = await workspacesService.update(req.params.id, { name, description });

  res.status(200).json({
    status: 'success',
    data: { workspace },
  });
});

/**
 * DELETE /api/workspaces/:id
 * Delete a workspace and all its data (admin only).
 */
const remove = catchAsync(async (req, res) => {
  await workspacesService.remove(req.params.id);

  res.status(204).send();
});

/**
 * POST /api/workspaces/:id/members
 * Add a member to the workspace by email (admin only).
 */
const inviteMember = catchAsync(async (req, res) => {
  const { email, role } = req.body;

  const member = await workspacesService.inviteMember(
    req.params.id,
    email,
    role,
    req.user.id
  );

  res.status(201).json({
    status: 'success',
    data: { member },
  });
});

/**
 * GET /api/workspaces/:id/members
 * List all members of a workspace (requires membership).
 */
const getMembers = catchAsync(async (req, res) => {
  const members = await workspacesService.getMembers(req.params.id);

  res.status(200).json({
    status: 'success',
    data: { members },
  });
});

/**
 * PUT /api/workspaces/:id/members/:userId
 * Update a member's role (admin only).
 */
const updateMemberRole = catchAsync(async (req, res) => {
  const { role } = req.body;

  const member = await workspacesService.updateMemberRole(
    req.params.id,
    req.params.userId,
    role
  );

  res.status(200).json({
    status: 'success',
    data: { member },
  });
});

/**
 * DELETE /api/workspaces/:id/members/:userId
 * Remove a member from the workspace (admin only).
 */
const removeMember = catchAsync(async (req, res) => {
  await workspacesService.removeMember(req.params.id, req.params.userId, req.user.id);

  res.status(204).send();
});

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
  inviteMember,
  getMembers,
  updateMemberRole,
  removeMember,
};
