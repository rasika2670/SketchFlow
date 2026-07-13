const { query } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

/**
 * Get user by ID (excludes password_hash).
 * @param {string} id - User UUID
 * @returns {Promise<Object>}
 */
async function getById(id) {
  const result = await query(
    'SELECT id, email, name, avatar_url, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  return result.rows[0];
}

/**
 * Update user profile.
 * @param {string} id - User UUID
 * @param {{ name?: string, avatar_url?: string }} data
 * @returns {Promise<Object>} Updated user
 */
async function updateProfile(id, { name, avatar_url }) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }

  if (avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(avatar_url);
  }

  if (fields.length === 0) {
    throw ApiError.badRequest('No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, email, name, avatar_url, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('User not found');
  }

  return result.rows[0];
}

/**
 * Search users by email (partial match) for workspace invites.
 * Excludes the requesting user from results.
 * @param {string} email - Email search query
 * @param {string} excludeUserId - Current user ID to exclude
 * @returns {Promise<Object[]>}
 */
async function searchByEmail(email, excludeUserId) {
  const result = await query(
    `SELECT id, email, name, avatar_url
     FROM users
     WHERE email ILIKE $1 AND id != $2
     LIMIT 10`,
    [`%${email}%`, excludeUserId]
  );

  return result.rows;
}

module.exports = {
  getById,
  updateProfile,
  searchByEmail,
};
