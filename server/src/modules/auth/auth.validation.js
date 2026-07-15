const Joi = require('joi');

/**
 * Password pattern: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number.
 */
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordMessage =
  'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';

const register = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
      .messages({ 'string.min': 'Name must be at least 2 characters' }),
    email: Joi.string().trim().lowercase().email().required()
      .messages({ 'string.email': 'Please provide a valid email address' }),
    password: Joi.string().pattern(passwordPattern).required()
      .messages({ 'string.pattern.base': passwordMessage }),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required()
      .messages({ 'string.email': 'Please provide a valid email address' }),
    password: Joi.string().required()
      .messages({ 'any.required': 'Password is required' }),
  }),
};

const forgotPassword = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required()
      .messages({ 'string.email': 'Please provide a valid email address' }),
  }),
};

const resetPassword = {
  body: Joi.object({
    token: Joi.string().required()
      .messages({ 'any.required': 'Reset token is required' }),
    password: Joi.string().pattern(passwordPattern).required()
      .messages({ 'string.pattern.base': passwordMessage }),
  }),
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
