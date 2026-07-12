const { v2: cloudinary } = require('cloudinary');
const config = require('./env');
const logger = require('../utils/logger');

/**
 * Configure Cloudinary SDK.
 * Only initializes if credentials are provided.
 */
function configureCloudinary() {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey) {
    logger.warn('⚠️  Cloudinary not configured — file uploads will be unavailable');
    return;
  }

  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });

  logger.info('✅ Cloudinary configured');
}

module.exports = {
  cloudinary,
  configureCloudinary,
};
