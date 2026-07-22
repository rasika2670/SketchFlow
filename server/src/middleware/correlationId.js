const { v4: uuidv4 } = require('uuid');
const asyncLocalStorage = require('../utils/als');

/**
 * Middleware that generates/extracts a correlation ID and stores it in AsyncLocalStorage
 * so it is automatically included in all log statements.
 */
const correlationIdMiddleware = (req, res, next) => {
  const headerName = 'x-correlation-id';
  const id = req.headers[headerName] || uuidv4();

  req.id = id;
  res.setHeader(headerName, id);

  // Run downstream handlers inside the context store
  asyncLocalStorage.run(id, () => {
    next();
  });
};

module.exports = correlationIdMiddleware;
