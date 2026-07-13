const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter.
 * 100 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests — please try again later',
  },
});

/**
 * Auth-specific rate limiter.
 * 5 attempts per minute per IP. Successful requests are not counted.
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many login attempts — please try again later',
  },
});

/**
 * Password reset rate limiter.
 * 3 attempts per 15 minutes per IP.
 */
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many password reset attempts — please try again later',
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
};
