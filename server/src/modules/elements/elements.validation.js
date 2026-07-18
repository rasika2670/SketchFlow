const Joi = require('joi');

/**
 * Reusable UUID schema helper.
 */
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' }).required();

/**
 * POST /api/boards/:boardId/elements
 * Create a new element on a board.
 */
const create = {
  params: Joi.object({
    boardId: uuidSchema.messages({ 'string.guid': 'Invalid board ID' }),
  }),
  body: Joi.object({
    type: Joi.string()
      .valid('rectangle', 'circle', 'sticky', 'line', 'text', 'image')
      .required()
      .messages({
        'any.only': 'type must be one of: rectangle, circle, sticky, line, text, image',
      }),
    x:      Joi.number().default(0),
    y:      Joi.number().default(0),
    width:  Joi.number().min(0).allow(null).default(null),
    height: Joi.number().min(0).allow(null).default(null),
    color:  Joi.string().max(20).allow(null, '').default(null),
    text:   Joi.string().max(10000).allow(null, '').default(null),
  }),
};

/**
 * PUT /api/elements/:id
 * Update an existing element. version is REQUIRED for optimistic locking.
 */
const update = {
  params: Joi.object({
    id: uuidSchema.messages({ 'string.guid': 'Invalid element ID' }),
  }),
  body: Joi.object({
    version: Joi.number().integer().min(1).required()
      .messages({ 'any.required': 'version is required for conflict detection' }),
    x:      Joi.number(),
    y:      Joi.number(),
    width:  Joi.number().min(0).allow(null),
    height: Joi.number().min(0).allow(null),
    color:  Joi.string().max(20).allow(null, ''),
    text:   Joi.string().max(10000).allow(null, ''),
  }).min(2), // Must have at least version + one other field
};

/**
 * PUT /api/elements/batch
 * Batch update element positions (for drag operations).
 * Only x, y are supported in batch (keep it simple per design decision).
 */
const batchUpdate = {
  body: Joi.object({
    elements: Joi.array()
      .items(
        Joi.object({
          id:      uuidSchema,
          x:       Joi.number().required(),
          y:       Joi.number().required(),
          version: Joi.number().integer().min(1).required(),
        })
      )
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'At least one element is required',
        'array.max': 'Cannot batch update more than 50 elements at once',
      }),
  }),
};

/**
 * GET/DELETE /api/elements/:id
 */
const idParam = {
  params: Joi.object({
    id: uuidSchema.messages({ 'string.guid': 'Invalid element ID' }),
  }),
};

/**
 * GET /api/boards/:boardId/elements
 */
const boardIdParam = {
  params: Joi.object({
    boardId: uuidSchema.messages({ 'string.guid': 'Invalid board ID' }),
  }),
};

module.exports = {
  create,
  update,
  batchUpdate,
  idParam,
  boardIdParam,
};
