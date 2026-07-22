const dotenv = require('dotenv');
const path = require('path');

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Required environment variables — server will not start without these.
 */
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

/**
 * Optional environment variables with defaults.
 */
const DEFAULTS = {
  PORT: '5000',
  NODE_ENV: 'development',
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '30d',
  CORS_ORIGIN: 'http://localhost:5173',
  CLIENT_URL: 'http://localhost:5173',
  REDIS_URL: '',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
  SMTP_HOST: '',
  SMTP_PORT: '587',
  SMTP_USER: '',
  SMTP_PASS: '',
  EMAIL_FROM: 'SketchFlow <noreply@sketchflow.com>',
  ACTIVITY_LOG_RETENTION_DAYS: '90',
  MEMORY_WARNING_THRESHOLD_PERCENT: '80',
};

/**
 * Validate that all required env vars exist and build config object.
 */
function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map((v) => `   - ${v}`).join('\n')}\n\nCopy .env.example to .env and fill in values.`
    );
  }
}

validateEnv();

const config = {
  port: parseInt(process.env.PORT || DEFAULTS.PORT, 10),
  nodeEnv: process.env.NODE_ENV || DEFAULTS.NODE_ENV,
  isProduction: (process.env.NODE_ENV || DEFAULTS.NODE_ENV) === 'production',

  db: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL || DEFAULTS.REDIS_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || DEFAULTS.JWT_ACCESS_EXPIRY,
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || DEFAULTS.JWT_REFRESH_EXPIRY,
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || DEFAULTS.CORS_ORIGIN).split(',').map((s) => s.trim()),
  },

  clientUrl: process.env.CLIENT_URL || DEFAULTS.CLIENT_URL,

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || DEFAULTS.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY || DEFAULTS.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET || DEFAULTS.CLOUDINARY_API_SECRET,
  },

  email: {
    host: process.env.SMTP_HOST || DEFAULTS.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || DEFAULTS.SMTP_PORT, 10),
    user: process.env.SMTP_USER || DEFAULTS.SMTP_USER,
    pass: process.env.SMTP_PASS || DEFAULTS.SMTP_PASS,
    from: process.env.EMAIL_FROM || DEFAULTS.EMAIL_FROM,
  },

  jobs: {
    activityLogRetentionDays: parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS || DEFAULTS.ACTIVITY_LOG_RETENTION_DAYS, 10),
    memoryWarningThresholdPercent: parseInt(process.env.MEMORY_WARNING_THRESHOLD_PERCENT || DEFAULTS.MEMORY_WARNING_THRESHOLD_PERCENT, 10),
  },
};

module.exports = config;
