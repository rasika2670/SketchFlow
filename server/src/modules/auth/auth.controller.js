const catchAsync = require('../../utils/catchAsync');
const authService = require('./auth.service');
const { sendEmail } = require('../../services/email.service');

/**
 * POST /api/auth/register
 * Register a new user account.
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await authService.register({ name, email, password });

  res.status(201).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens.
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  res.status(200).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token.
 */
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;

  const tokens = await authService.refresh(token);

  res.status(200).json({
    status: 'success',
    data: tokens,
  });
});

/**
 * POST /api/auth/logout
 * Stateless logout — exists for frontend cleanup.
 */
const logout = catchAsync(async (req, res) => {
  // With stateless JWTs, we can't invalidate tokens server-side.
  // This endpoint exists so the frontend has a clean logout flow.
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email.
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  await authService.forgotPassword(email, sendEmail);

  // Always return success (don't reveal if email exists)
  res.status(200).json({
    status: 'success',
    message: 'If an account with that email exists, a reset link has been sent',
  });
});

/**
 * POST /api/auth/reset-password
 * Reset password with token from email.
 */
const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  await authService.resetPassword({ token, password });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful — you can now login with your new password',
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile.
 */
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};
