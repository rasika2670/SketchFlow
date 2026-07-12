const config = require('./env');

/**
 * CORS configuration for both Express and Socket.IO.
 * Parses CORS_ORIGIN env var (comma-separated origins).
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (config.cors.origin.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // Cache preflight for 24 hours
};

module.exports = corsOptions;
