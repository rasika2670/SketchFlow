import api from './axios';

/**
 * Create a new workspace
 */
export const create = ({ name, description }) =>
  api.post('/workspaces', { name, description });

/**
 * List all workspaces the current user belongs to
 */
export const list = () =>
  api.get('/workspaces');

/**
 * Get a single workspace by ID (includes member count, board count)
 */
export const getById = (id) =>
  api.get(`/workspaces/${id}`);

/**
 * Update workspace name/description
 */
export const update = (id, data) =>
  api.put(`/workspaces/${id}`, data);

/**
 * Delete a workspace
 */
export const remove = (id) =>
  api.delete(`/workspaces/${id}`);

/**
 * Invite a member by email with a role
 */
export const inviteMember = (workspaceId, { email, role }) =>
  api.post(`/workspaces/${workspaceId}/members`, { email, role });

/**
 * Remove a member from the workspace
 */
export const removeMember = (workspaceId, userId) =>
  api.delete(`/workspaces/${workspaceId}/members/${userId}`);

/**
 * Update a member's role
 */
export const updateMemberRole = (workspaceId, userId, role) =>
  api.put(`/workspaces/${workspaceId}/members/${userId}`, { role });

/**
 * List all members of a workspace
 */
export const listMembers = (workspaceId) =>
  api.get(`/workspaces/${workspaceId}/members`);

/**
 * Accept a workspace invite
 */
export const acceptInvite = (inviteId) =>
  api.post(`/workspaces/invites/${inviteId}/accept`);

/**
 * Decline a workspace invite
 */
export const declineInvite = (inviteId) =>
  api.post(`/workspaces/invites/${inviteId}/decline`);
