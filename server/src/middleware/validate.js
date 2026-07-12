const ApiError = require('../utils/ApiError');

/**
 * Create validation middleware using a Joi schema.
 * Validates req.body, req.params, and req.query against provided schemas.
 *
 * @param {Object} schema - Object with optional keys: body, params, query (each a Joi schema)
 * @returns {Function} Express middleware
 *
 * Usage:
 *   const { body } = require('./schemas');
 *   router.post('/users', validate({ body: createUserSchema }), controller.create);
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const key of ['params', 'query', 'body']) {
      if (schema[key]) {
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false,      // Collect all errors, not just the first
          stripUnknown: true,     // Remove unknown fields
          convert: true,          // Type coercion (string → number, etc.)
        });

        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              field: detail.path.join('.'),
              message: detail.message.replace(/"/g, ''),
            }))
          );
        } else {
          // Replace with validated (and sanitized) values
          req[key] = value;
        }
      }
    }

    if (errors.length > 0) {
      const message = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      return next(ApiError.badRequest(message));
    }

    next();
  };
};

module.exports = validate;
