const { Router } = require('express');
const authController = require('./auth.controller');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../../middleware/rateLimiter');
const authValidation = require('./auth.validation');

const router = Router();

// ---- Public routes (with rate limiting) ----

router.post(
  '/register',
  authLimiter,
  validate(authValidation.register),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(authValidation.login),
  authController.login
);

router.post(
  '/refresh',
  authController.refreshToken
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(authValidation.resetPassword),
  authController.resetPassword
);

// ---- Protected routes ----

router.get(
  '/me',
  authenticate,
  authController.getMe
);

module.exports = router;
