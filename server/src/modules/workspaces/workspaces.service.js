const { query, getClient } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const { sendEmail } = require('../../services/email.service');

/**
 * Create a new workspace.
 * Transaction: inserts workspace + adds creator as admin member.
 *
 * @param {string} userId - Creator's user ID
 * @param {{ name: string, description?: string }} data
 * @returns {Promise<Object>} Created workspace
 */
async function create(userId, { name, description }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Insert workspace
    const workspaceResult = await client.query(
      `INSERT INTO workspaces (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_by, created_at, updated_at`,
      [name, description || null, userId]
    );

    const workspace = workspaceResult.rows[0];

    // Add creator as admin member
    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
       VALUES ($1, $2, 'admin', $3)`,
      [workspace.id, userId, userId]
    );

    await client.query('COMMIT');

    logger.info('Workspace created', { workspaceId: workspace.id, userId });

    return workspace;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List all workspaces a user belongs to, with member and board counts.
 *
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function getByUserId(userId) {
  const result = await query(
    `SELECT
       w.id, w.name, w.description, w.created_by, w.created_at, w.updated_at,
       wm.role AS user_role,
       (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) AS member_count,
       (SELECT COUNT(*) FROM boards WHERE workspace_id = w.id) AS board_count
     FROM workspaces w
     INNER JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = $1
     ORDER BY w.updated_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Get workspace by ID with member and board counts.
 *
 * @param {string} workspaceId
 * @returns {Promise<Object>}
 */
async function getById(workspaceId) {
  const result = await query(
    `SELECT
       w.id, w.name, w.description, w.created_by, w.created_at, w.updated_at,
       (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) AS member_count,
       (SELECT COUNT(*) FROM boards WHERE workspace_id = w.id) AS board_count
     FROM workspaces w
     WHERE w.id = $1`,
    [workspaceId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Workspace not found');
  }

  return result.rows[0];
}

/**
 * Update workspace details.
 *
 * @param {string} workspaceId
 * @param {{ name?: string, description?: string }} data
 * @returns {Promise<Object>} Updated workspace
 */
async function update(workspaceId, { name, description }) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }

  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description);
  }

  if (fields.length === 0) {
    throw ApiError.badRequest('No fields to update');
  }

  fields.push('updated_at = NOW()');
  values.push(workspaceId);

  const result = await query(
    `UPDATE workspaces SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, name, description, created_by, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Workspace not found');
  }

  logger.info('Workspace updated', { workspaceId });

  return result.rows[0];
}

/**
 * Delete a workspace (CASCADE handles all related data).
 *
 * @param {string} workspaceId
 */
async function remove(workspaceId) {
  const result = await query(
    'DELETE FROM workspaces WHERE id = $1 RETURNING id',
    [workspaceId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Workspace not found');
  }

  logger.info('Workspace deleted', { workspaceId });
}

/**
 * Invite a member to a workspace by email.
 * The user must already exist in the system (direct add flow).
 *
 * @param {string} workspaceId
 * @param {string} email - Email of user to invite
 * @param {string} role - Role to assign ('editor' or 'viewer')
 * @param {string} invitedBy - ID of the user sending the invite
 * @returns {Promise<Object>} The new membership record with user details
 */
async function inviteMember(workspaceId, email, role, invitedBy) {
  // Find the user by email
  const userResult = await query(
    'SELECT id, email, name, avatar_url FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    throw ApiError.notFound('No user found with that email address');
  }

  const user = userResult.rows[0];

  // Check if already a member
  const existingMember = await query(
    'SELECT user_id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
    [workspaceId, user.id]
  );

  if (existingMember.rows.length > 0) {
    throw ApiError.conflict('User is already a member of this workspace');
  }

  // Add as member
  await query(
    `INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
     VALUES ($1, $2, $3, $4)`,
    [workspaceId, user.id, role, invitedBy]
  );

  // Get workspace name and inviter name for the email
  const workspaceResult = await query(
    'SELECT name FROM workspaces WHERE id = $1',
    [workspaceId]
  );
  const inviterResult = await query(
    'SELECT name FROM users WHERE id = $1',
    [invitedBy]
  );

  const workspaceName = workspaceResult.rows[0]?.name || 'a workspace';
  const inviterName = inviterResult.rows[0]?.name || 'Someone';

  // Send invite notification email (non-blocking — don't fail on email errors)
  try {
    await sendEmail({
      to: email,
      subject: `SketchFlow — You've been added to ${workspaceName}`,
      html: `
        <h2>You're in! 🎉</h2>
        <p>Hi ${user.name},</p>
        <p><strong>${inviterName}</strong> has added you to the workspace <strong>${workspaceName}</strong> as a <strong>${role}</strong>.</p>
        <p>Head over to SketchFlow to start collaborating!</p>
        <br>
        <p>— SketchFlow Team</p>
      `,
    });
  } catch (emailErr) {
    // Non-fatal — member was added successfully even if email fails
    logger.error('Failed to send workspace invite email', {
      error: emailErr.message,
      workspaceId,
      email,
    });
  }

  logger.info('Member invited to workspace', { workspaceId, userId: user.id, role });

  return {
    workspace_id: workspaceId,
    user_id: user.id,
    role,
    user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url },
  };
}

/**
 * Remove a member from a workspace.
 * Prevents removing the last admin.
 *
 * @param {string} workspaceId
 * @param {string} userId - ID of the member to remove
 */
async function removeMember(workspaceId, userId) {
  // Check if the user is a member
  const memberResult = await query(
    'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
    [workspaceId, userId]
  );

  if (memberResult.rows.length === 0) {
    throw ApiError.notFound('Member not found in this workspace');
  }

  const { role } = memberResult.rows[0];

  // Prevent removing the last admin
  if (role === 'admin') {
    const adminCount = await query(
      `SELECT COUNT(*) AS count FROM workspace_members
       WHERE workspace_id = $1 AND role = 'admin'`,
      [workspaceId]
    );

    if (parseInt(adminCount.rows[0].count, 10) <= 1) {
      throw ApiError.badRequest(
        'Cannot remove the last admin — promote another member to admin first'
      );
    }
  }

  await query(
    'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
    [workspaceId, userId]
  );

  logger.info('Member removed from workspace', { workspaceId, userId });
}

/**
 * Update a member's role in a workspace.
 * Prevents demoting the last admin.
 *
 * @param {string} workspaceId
 * @param {string} userId - ID of the member to update
 * @param {string} newRole - New role to assign
 * @returns {Promise<Object>} Updated membership with user details
 */
async function updateMemberRole(workspaceId, userId, newRole) {
  // Check current role
  const memberResult = await query(
    'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
    [workspaceId, userId]
  );

  if (memberResult.rows.length === 0) {
    throw ApiError.notFound('Member not found in this workspace');
  }

  const currentRole = memberResult.rows[0].role;

  // Prevent demoting the last admin
  if (currentRole === 'admin' && newRole !== 'admin') {
    const adminCount = await query(
      `SELECT COUNT(*) AS count FROM workspace_members
       WHERE workspace_id = $1 AND role = 'admin'`,
      [workspaceId]
    );

    if (parseInt(adminCount.rows[0].count, 10) <= 1) {
      throw ApiError.badRequest(
        'Cannot demote the last admin — promote another member to admin first'
      );
    }
  }

  await query(
    'UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3',
    [newRole, workspaceId, userId]
  );

  // Return updated member with user details
  const result = await query(
    `SELECT wm.workspace_id, wm.user_id, wm.role, wm.joined_at,
            u.email, u.name, u.avatar_url
     FROM workspace_members wm
     INNER JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1 AND wm.user_id = $2`,
    [workspaceId, userId]
  );

  logger.info('Member role updated', { workspaceId, userId, from: currentRole, to: newRole });

  return result.rows[0];
}

/**
 * Get all members of a workspace with user details.
 *
 * @param {string} workspaceId
 * @returns {Promise<Object[]>}
 */
async function getMembers(workspaceId) {
  const result = await query(
    `SELECT
       wm.workspace_id, wm.user_id, wm.role, wm.joined_at,
       u.email, u.name, u.avatar_url
     FROM workspace_members wm
     INNER JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1
     ORDER BY wm.joined_at ASC`,
    [workspaceId]
  );

  return result.rows;
}

module.exports = {
  create,
  getByUserId,
  getById,
  update,
  remove,
  inviteMember,
  removeMember,
  updateMemberRole,
  getMembers,
};
