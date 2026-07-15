const catchAsync = require('../../utils/catchAsync');
const authService = require('./auth.service');
const { sendEmail } = require('../../services/email.service');
const config = require('../../config/env');

/**
 * Cookie options for httpOnly refresh token.
 * - httpOnly: prevents JavaScript access (XSS protection)
 * - secure: HTTPS only in production
 * - sameSite: strict CSRF protection
 * - path: only sent to auth endpoints
 */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

/**
 * Set refresh token as httpOnly cookie on the response.
 * @param {Object} res - Express response
 * @param {string} refreshToken
 */
function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
}

/**
 * Clear refresh token cookie.
 * @param {Object} res - Express response
 */
function clearRefreshTokenCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/api/auth',
  });
}

/**
 * POST /api/auth/register
 * Register a new user account.
 * Sets refresh token as httpOnly cookie; returns access token in body.
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await authService.register({ name, email, password });

  // Set refresh token as httpOnly cookie
  setRefreshTokenCookie(res, result.refreshToken);

  res.status(201).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

/**
 * POST /api/auth/login
 * Authenticate user and return access token.
 * Sets refresh token as httpOnly cookie.
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  // Set refresh token as httpOnly cookie
  setRefreshTokenCookie(res, result.refreshToken);

  res.status(200).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from httpOnly cookie.
 * Rotates the refresh token (issues new cookie).
 */
const refreshToken = catchAsync(async (req, res) => {
  // Read refresh token from httpOnly cookie (not request body)
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'No refresh token provided',
    });
  }

  const tokens = await authService.refresh(token);

  // Rotate: set new refresh token cookie
  setRefreshTokenCookie(res, tokens.refreshToken);

  res.status(200).json({
    status: 'success',
    data: {
      accessToken: tokens.accessToken,
    },
  });
});

/**
 * POST /api/auth/logout
 * Revoke refresh token from Redis and clear httpOnly cookie.
 * Requires authentication to identify the user.
 */
const logout = catchAsync(async (req, res) => {
  // Revoke refresh token in Redis (if user is authenticated)
  if (req.user?.id) {
    await authService.logout(req.user.id);
  }

  // Clear the httpOnly cookie
  clearRefreshTokenCookie(res);

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
