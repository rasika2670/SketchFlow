const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config/env');
const { query } = require('../../config/db');
const { getRedis, isRedisAvailable } = require('../../config/redis');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Store refresh token in Redis for revocation support.
 * Falls back gracefully if Redis is unavailable.
 * @param {string} userId
 * @param {string} refreshToken
 */
async function storeRefreshToken(userId, refreshToken) {
  if (!isRedisAvailable()) {
    logger.warn('Redis unavailable — refresh token not stored (revocation disabled)');
    return;
  }

  try {
    const redis = getRedis();
    await redis.setex(`refresh:${userId}`, REFRESH_TOKEN_TTL, refreshToken);
  } catch (err) {
    logger.error('Failed to store refresh token in Redis', { error: err.message, userId });
    // Non-fatal — auth still works, just can't revoke
  }
}

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

  // Store refresh token in Redis for revocation support
  await storeRefreshToken(user.id, tokens.refreshToken);

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

  // Store refresh token in Redis for revocation support
  await storeRefreshToken(user.id, tokens.refreshToken);

  logger.info('User logged in', { userId: user.id });

  return { user: userWithoutPassword, ...tokens };
}

/**
 * Refresh access token using a valid refresh token.
 * Validates against Redis to support token revocation.
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
async function refresh(refreshToken) {
  // 1. Verify JWT signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token expired — please login again');
    }
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // 2. Validate against Redis (if available) — ensures token hasn't been revoked
  if (isRedisAvailable()) {
    try {
      const redis = getRedis();
      const storedToken = await redis.get(`refresh:${decoded.userId}`);
      if (storedToken !== refreshToken) {
        logger.warn('Refresh token mismatch — possible token reuse', { userId: decoded.userId });
        // Delete the stored token to force re-login (token rotation security)
        await redis.del(`refresh:${decoded.userId}`);
        throw ApiError.unauthorized('Invalid refresh token — please login again');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error('Redis error during refresh validation', { error: err.message });
      // If Redis fails mid-check, allow refresh to proceed (graceful degradation)
    }
  }

  // 3. Check user still exists in DB
  const result = await query('SELECT id FROM users WHERE id = $1', [decoded.userId]);
  if (result.rows.length === 0) {
    throw ApiError.unauthorized('User no longer exists');
  }

  // 4. Issue new token pair (rotate refresh token)
  const tokens = generateTokens(decoded.userId);

  // 5. Store new refresh token in Redis (replaces old one)
  await storeRefreshToken(decoded.userId, tokens.refreshToken);

  return tokens;
}

/**
 * Logout a user by revoking their refresh token.
 * @param {string} userId
 */
async function logout(userId) {
  if (isRedisAvailable()) {
    try {
      const redis = getRedis();
      await redis.del(`refresh:${userId}`);
      logger.info('Refresh token revoked', { userId });
    } catch (err) {
      logger.error('Failed to revoke refresh token', { error: err.message, userId });
    }
  }
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
     SET reset_token_hash = $1, reset_token_expires_at = $2, updated_at = NOW()
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
      'UPDATE users SET reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = $1',
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
     WHERE reset_token_hash = $1
       AND reset_token_expires_at > NOW()`,
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
         reset_token_hash = NULL,
         reset_token_expires_at = NULL,
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
  logout,
  forgotPassword,
  resetPassword,
  generateTokens,
};
