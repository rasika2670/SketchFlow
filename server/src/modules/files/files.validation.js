const Joi = require('joi');

const registerUploadSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  public_id: Joi.string().trim().max(255).required(),
  url: Joi.string().uri().max(1000).optional().allow(null, ''),
  mime_type: Joi.string().max(100).optional().allow(null, ''),
  size: Joi.number().integer().min(0).optional().allow(null)
});

module.exports = {
  registerUploadSchema
};
