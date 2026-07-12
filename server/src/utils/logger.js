const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * Custom format for development console output.
 */
const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

/**
 * Create Winston logger instance.
 * - Development: Pretty-printed console output
 * - Production: Structured JSON logs + file output
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  defaultMeta: { service: 'sketchflow-api' },
  transports: [],
});

// Development: colorized console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), devFormat),
    })
  );
} else {
  // Production: JSON to console + file
  logger.add(
    new winston.transports.Console({
      format: combine(json()),
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

module.exports = logger;
