const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config/env');
const { query } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const SALT_ROUNDS = 12;

/**
 * Generate access + refresh token pair.
 * @param {string} userId
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );

  const refreshToken = jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  return { accessToken, refreshToken };
}

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
async function register({ name, email, password }) {
  // Check if email already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw ApiError.conflict('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const result = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, avatar_url, created_at`,
    [name, email, passwordHash]
  );

  const user = result.rows[0];
  const tokens = generateTokens(user.id);

  logger.info('User registered', { userId: user.id, email: user.email });

  return { user, ...tokens };
}

/**
 * Authenticate a user with email and password.
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
async function login({ email, password }) {
  // Find user
  const result = await query(
    'SELECT id, email, name, avatar_url, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = user;
  const tokens = generateTokens(user.id);

  logger.info('User logged in', { userId: user.id });

  return { user: userWithoutPassword, ...tokens };
}

/**
 * Refresh access token using a valid refresh token.
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
async function refresh(refreshToken) {
  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token expired — please login again');
    }
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Check user still exists
  const result = await query('SELECT id FROM users WHERE id = $1', [decoded.userId]);
  if (result.rows.length === 0) {
    throw ApiError.unauthorized('User no longer exists');
  }

  // Issue new token pair
  return generateTokens(decoded.userId);
}

/**
 * Generate password reset token and send email.
 * @param {string} email
 * @param {Function} sendEmailFn - Email sending function
 */
async function forgotPassword(email, sendEmailFn) {
  // Find user (don't reveal if email exists or not)
  const result = await query('SELECT id, name FROM users WHERE email = $1', [email]);

  if (result.rows.length === 0) {
    // Don't reveal that email doesn't exist — return silently
    logger.warn('Password reset requested for non-existent email', { email });
    return;
  }

  const user = result.rows[0];

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store hashed token in DB
  await query(
    `UPDATE users
     SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
     WHERE id = $3`,
    [resetTokenHash, resetExpires, user.id]
  );

  // Send reset email
  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

  try {
    await sendEmailFn({
      to: email,
      subject: 'SketchFlow — Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="padding: 10px 20px; background: #4A90D9; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>— SketchFlow Team</p>
      `,
    });
  } catch (emailErr) {
    // Clear reset token if email fails
    await query(
      'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = $1',
      [user.id]
    );
    logger.error('Failed to send password reset email', { error: emailErr.message, userId: user.id });
    throw ApiError.internal('Failed to send reset email — please try again later');
  }

  logger.info('Password reset email sent', { userId: user.id });
}

/**
 * Reset password using a valid reset token.
 * @param {{ token: string, password: string }} data
 */
async function resetPassword({ token, password }) {
  // Hash the token to compare with stored hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid (non-expired) token
  const result = await query(
    `SELECT id FROM users
     WHERE password_reset_token = $1
       AND password_reset_expires > NOW()`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const user = result.rows[0];

  // Hash new password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Update password and clear reset token
  await query(
    `UPDATE users
     SET password_hash = $1,
         password_reset_token = NULL,
         password_reset_expires = NULL,
         updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, user.id]
  );

  logger.info('Password reset successful', { userId: user.id });
}

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  generateTokens,
};
