const Joi = require('joi');

/**
 * UUID validation helper.
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' }).required();

const create = {
  params: Joi.object({
    workspaceId: uuidSchema.messages({ 'string.guid': 'Invalid workspace ID' }),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150).required()
      .messages({
        'string.min': 'Board name must be at least 2 characters',
        'string.max': 'Board name must not exceed 150 characters',
      }),
  }),
};

const update = {
  params: Joi.object({
    id: uuidSchema.messages({ 'string.guid': 'Invalid board ID' }),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150).required()
      .messages({
        'string.min': 'Board name must be at least 2 characters',
        'string.max': 'Board name must not exceed 150 characters',
      }),
  }),
};

const idParam = {
  params: Joi.object({
    id: uuidSchema.messages({ 'string.guid': 'Invalid board ID' }),
  }),
};

const workspaceIdParam = {
  params: Joi.object({
    workspaceId: uuidSchema.messages({ 'string.guid': 'Invalid workspace ID' }),
  }),
};

module.exports = {
  create,
  update,
  idParam,
  workspaceIdParam,
};
