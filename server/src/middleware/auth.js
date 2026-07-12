const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const { query } = require('../config/db');

/**
 * Middleware: Verify JWT access token from Authorization header.
 * Attaches req.user = { id, email, name } on success.
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token required');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify access token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Access token expired');
      }
      throw ApiError.unauthorized('Invalid access token');
    }

    // 3. Check user still exists in DB
    const result = await query(
      'SELECT id, email, name, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.unauthorized('User no longer exists');
    }

    // 4. Attach user to request
    req.user = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Verify a refresh token string.
 * @param {string} token - Refresh token
 * @returns {{ userId: string }} Decoded payload
 * @throws {ApiError} If token is invalid or expired
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token expired — please login again');
    }
    throw ApiError.unauthorized('Invalid refresh token');
  }
}

module.exports = {
  authenticate,
  verifyRefreshToken,
};
