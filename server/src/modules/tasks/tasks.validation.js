const Joi = require('joi');

/**
 * Reusable UUID schema helper.
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' }).required();

/**
 * POST /api/boards/:boardId/tasks
 * Create a new task on a board.
 */
const create = {
  params: Joi.object({
    boardId: uuidSchema.messages({ 'string.guid': 'Invalid board ID' }),
  }),
  body: Joi.object({
    title: Joi.string().min(1).max(150).required()
      .messages({ 'any.required': 'title is required' }),
    description: Joi.string().max(5000).allow(null, '').default(null),
    status: Joi.string()
      .valid('todo', 'in_progress', 'review', 'done')
      .default('todo')
      .messages({
        'any.only': 'status must be one of: todo, in_progress, review, done',
      }),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .default('medium')
      .messages({
        'any.only': 'priority must be one of: low, medium, high',
      }),
    assignee_id: Joi.string().uuid({ version: 'uuidv4' }).allow(null).default(null)
      .messages({ 'string.guid': 'Invalid assignee ID' }),
    due_date: Joi.date().iso().allow(null).default(null),
  }),
};

/**
 * POST /api/boards/:boardId/tasks/convert
 * Convert a sticky note element to a task.
 */
const convertFromSticky = {
  params: Joi.object({
    boardId: uuidSchema.messages({ 'string.guid': 'Invalid board ID' }),
  }),
  body: Joi.object({
    element_id: uuidSchema.messages({ 'string.guid': 'Invalid element ID' }),
    title: Joi.string().min(1).max(150).required()
      .messages({ 'any.required': 'title is required' }),
    description: Joi.string().max(5000).allow(null, '').default(null),
    status: Joi.string()
      .valid('todo', 'in_progress', 'review', 'done')
      .default('todo'),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .default('medium'),
    assignee_id: Joi.string().uuid({ version: 'uuidv4' }).allow(null).default(null)
      .messages({ 'string.guid': 'Invalid assignee ID' }),
    due_date: Joi.date().iso().allow(null).default(null),
  }),
};

/**
 * PUT /api/tasks/:taskId
 * Update an existing task. version is REQUIRED for optimistic locking.
 */
const update = {
  params: Joi.object({
    taskId: uuidSchema.messages({ 'string.guid': 'Invalid task ID' }),
  }),
  body: Joi.object({
    version: Joi.number().integer().min(1).required()
      .messages({ 'any.required': 'version is required for conflict detection' }),
    title: Joi.string().min(1).max(150),
    description: Joi.string().max(5000).allow(null, ''),
    status: Joi.string().valid('todo', 'in_progress', 'review', 'done'),
    priority: Joi.string().valid('low', 'medium', 'high'),
    assignee_id: Joi.string().uuid({ version: 'uuidv4' }).allow(null)
      .messages({ 'string.guid': 'Invalid assignee ID' }),
    due_date: Joi.date().iso().allow(null),
  }).min(2), // Must have at least version + one other field
};

/**
 * PATCH /api/tasks/:taskId/status
 * Update task status only.
 */
const updateStatus = {
  params: Joi.object({
    taskId: uuidSchema.messages({ 'string.guid': 'Invalid task ID' }),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid('todo', 'in_progress', 'review', 'done')
      .required()
      .messages({
        'any.required': 'status is required',
        'any.only': 'status must be one of: todo, in_progress, review, done',
      }),
    version: Joi.number().integer().min(1).required()
      .messages({ 'any.required': 'version is required for conflict detection' }),
  }),
};

/**
 * PATCH /api/tasks/:taskId/assign
 * Assign or unassign a task. Send null to unassign.
 */
const assignTask = {
  params: Joi.object({
    taskId: uuidSchema.messages({ 'string.guid': 'Invalid task ID' }),
  }),
  body: Joi.object({
    assignee_id: Joi.string().uuid({ version: 'uuidv4' }).allow(null).required()
      .messages({ 'string.guid': 'Invalid assignee ID' }),
    version: Joi.number().integer().min(1).required()
      .messages({ 'any.required': 'version is required for conflict detection' }),
  }),
};

/**
 * GET /api/tasks/:taskId  or  DELETE /api/tasks/:taskId
 */
const taskIdParam = {
  params: Joi.object({
    taskId: uuidSchema.messages({ 'string.guid': 'Invalid task ID' }),
  }),
};

/**
 * GET /api/boards/:boardId/tasks
 */
const boardIdParam = {
  params: Joi.object({
    boardId: uuidSchema.messages({ 'string.guid': 'Invalid board ID' }),
  }),
};

/**
 * GET /api/boards/:boardId/tasks?status=...&assignee_id=...&priority=...
 * Optional query filters for task listing.
 */
const listFilters = {
  query: Joi.object({
    status: Joi.string().valid('todo', 'in_progress', 'review', 'done'),
    assignee_id: Joi.string().uuid({ version: 'uuidv4' })
      .messages({ 'string.guid': 'Invalid assignee ID filter' }),
    priority: Joi.string().valid('low', 'medium', 'high'),
  }),
};

module.exports = {
  create,
  convertFromSticky,
  update,
  updateStatus,
  assignTask,
  taskIdParam,
  boardIdParam,
  listFilters,
};
