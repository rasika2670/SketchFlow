const catchAsync = require('../../utils/catchAsync');
const usersService = require('./users.service');
const ApiError = require('../../utils/ApiError');

/**
 * GET /api/users/profile
 * Get the authenticated user's profile.
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await usersService.getById(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * PUT /api/users/profile
 * Update the authenticated user's profile.
 */
const updateProfile = catchAsync(async (req, res) => {
  const { name, avatar_url } = req.body;

  const user = await usersService.updateProfile(req.user.id, { name, avatar_url });

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * GET /api/users/search?email=...
 * Search users by email for workspace invitations.
 */
const searchUsers = catchAsync(async (req, res) => {
  const { email } = req.query;

  if (!email || email.length < 3) {
    throw ApiError.badRequest('Search query must be at least 3 characters');
  }

  const users = await usersService.searchByEmail(email, req.user.id);

  res.status(200).json({
    status: 'success',
    data: { users },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  searchUsers,
};
