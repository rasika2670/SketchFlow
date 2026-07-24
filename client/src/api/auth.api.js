import api from './axios';

/**
 * Register a new user
 */
export const register = (name, email, password) =>
  api.post('/auth/register', { name, email, password }, { withCredentials: true });

/**
 * Login with email and password
 */
export const login = (email, password) =>
  api.post('/auth/login', { email, password }, { withCredentials: true });

/**
 * Refresh access token using httpOnly cookie
 */
export const refresh = () =>
  api.post('/auth/refresh', {}, { withCredentials: true });

/**
 * Logout — clears refresh token cookie
 */
export const logout = () =>
  api.post('/auth/logout', {}, { withCredentials: true });

/**
 * Request password reset email
 */
export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

/**
 * Reset password with token
 */
export const resetPassword = (token, newPassword) =>
  api.post('/auth/reset-password', { token, newPassword });

/**
 * Get current authenticated user
 */
export const getMe = () =>
  api.get('/auth/me');
