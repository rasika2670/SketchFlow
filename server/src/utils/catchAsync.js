/**
 * Wraps an async Express route handler to catch errors
 * and forward them to the error-handling middleware.
 *
 * Usage:
 *   router.get('/users', catchAsync(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
