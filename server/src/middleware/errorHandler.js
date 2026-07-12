const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Global error handling middleware.
 * Must be registered LAST in the Express middleware chain.
 * Signature: (err, req, res, next) — Express recognizes 4-param functions as error handlers.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let status = err.status || 'error';

  // ---- Handle specific error types ----

  // Joi validation errors
  if (err.isJoi) {
    statusCode = 400;
    status = 'fail';
    message = err.details.map((d) => d.message).join(', ');
  }

  // JWT errors (not already wrapped in ApiError)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Token expired';
  }

  // PostgreSQL unique constraint violation (duplicate email, etc.)
  if (err.code === '23505') {
    statusCode = 409;
    status = 'fail';
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    message = `Duplicate value for ${field}`;
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    status = 'fail';
    message = 'Referenced resource does not exist';
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    statusCode = 400;
    status = 'fail';
    message = 'Invalid value provided';
  }

  // ---- Log the error ----
  if (statusCode >= 500) {
    logger.error(`${statusCode} — ${message}`, {
      error: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn(`${statusCode} — ${message}`, {
      path: req.originalUrl,
      method: req.method,
    });
  }

  // ---- Send response ----
  const response = {
    status,
    message,
  };

  // Include stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
