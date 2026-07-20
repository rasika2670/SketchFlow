const Joi = require('joi');

const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(5000).required(),
  parent_id: Joi.string().uuid().optional().allow(null)
});

const updateMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(5000).required()
});

const getMessagesSchema = Joi.object({
  cursor_created_at: Joi.date().iso().optional(),
  cursor_id: Joi.string().uuid().optional(),
  limit: Joi.number().integer().min(1).max(100).default(50)
});

module.exports = {
  sendMessageSchema,
  updateMessageSchema,
  getMessagesSchema
};
