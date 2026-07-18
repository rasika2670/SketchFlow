const Joi = require('joi');

/**
 * UUID validation helper — reused across param validations.
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' }).required();

const create = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150).required()
      .messages({
        'string.min': 'Workspace name must be at least 2 characters',
        'string.max': 'Workspace name must not exceed 150 characters',
      }),
    description: Joi.string().trim().max(1000).allow('', null)
      .messages({
        'string.max': 'Description must not exceed 1000 characters',
      }),
  }),
};

const update = {
  params: Joi.object({
    id: uuidSchema.messages({ 'string.guid': 'Invalid workspace ID' }),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(150)
      .messages({
        'string.min': 'Workspace name must be at least 2 characters',
        'string.max': 'Workspace name must not exceed 150 characters',
      }),
    description: Joi.string().trim().max(1000).allow('', null)
      .messages({
        'string.max': 'Description must not exceed 1000 characters',
      }),
  }).min(1).messages({
    'object.min': 'At least one field is required to update',
  }),
};

const inviteMember = {
  params: Joi.object({
    id: uuidSchema.messages({ 'string.guid': 'Invalid workspace ID' }),
  }),
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required()
      .messages({ 'string.email': 'Please provide a valid email address' }),
    role: Joi.string().valid('editor', 'viewer').default('viewer')
      .messages({ 'any.only': 'Role must be either editor or viewer' }),
  }),
};

const updateMemberRole = {
  params: Joi.object({
    id: uuidSchema.messages({ 'string.guid': 'Invalid workspace ID' }),
    userId: uuidSchema.messages({ 'string.guid': 'Invalid user ID' }),
  }),
  body: Joi.object({
    role: Joi.string().valid('admin', 'editor', 'viewer').required()
      .messages({ 'any.only': 'Role must be admin, editor, or viewer' }),
  }),
};

const memberParams = {
  params: Joi.object({
    id: uuidSchema.messages({ 'string.guid': 'Invalid workspace ID' }),
    userId: uuidSchema.messages({ 'string.guid': 'Invalid user ID' }),
  }),
};

const idParam = {
  params: Joi.object({
    id: uuidSchema.messages({ 'string.guid': 'Invalid workspace ID' }),
  }),
};

module.exports = {
  create,
  update,
  inviteMember,
  updateMemberRole,
  memberParams,
  idParam,
};
