import api from './axios';

/**
 * Get current user's profile
 */
export const getProfile = () =>
  api.get('/users/profile');

/**
 * Update current user's profile
 */
export const updateProfile = (data) =>
  api.put('/users/profile', data);

/**
 * Search for a user by email (for invites)
 * Designed for future debounced autocomplete integration
 */
export const searchByEmail = (email) =>
  api.get('/users/search', { params: { email } });

/**
 * Get pending workspace invites for the current user
 */
export const getPendingInvites = () =>
  api.get('/users/invites');
