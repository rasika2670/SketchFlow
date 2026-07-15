# Development Rules & Guidelines for SketchFlow

---

## 1. Core Principles

| Principle | Description |
| --- | --- |
| **Simplicity First** | Build the simplest thing that works. Don't over-engineer. |
| **Incremental Delivery** | Each phase must be functional and testable independently. |
| **Type Safety** | Use Joi for runtime validation; TypeScript optional but encouraged. |
| **Consistency** | Follow the same patterns across all modules. |
| **Testability** | Write code that can be tested (dependency injection, pure functions). |

---

## 2. Technology Rules

### 2.1. Allowed Libraries (No Substitutions)

| Category | Required Library | Why |
| --- | --- | --- |
| **Runtime** | Node.js v18+ | LTS version |
| **Framework** | Express.js | Industry standard |
| **Real-Time** | [Socket.IO](http://socket.io/) | Proven, reliable |
| **Database** | pg (node-postgres) | Best PostgreSQL driver |
| **Cache** | ioredis | Best Redis client |
| **Auth** | jsonwebtoken + bcryptjs | Industry standard |
| **Validation** | Joi | Most complete schema validation |
| **Logging** | Winston | Production-grade logging |
| **Email** | Nodemailer | Simple, reliable |
| **Scheduling** | node-cron | Lightweight, easy |
| **Files** | Cloudinary SDK | Official SDK |
| **Testing** | Jest + Supertest | Industry standard |

### 2.2. Banned Libraries

| Library | Why Banned | Alternative |
| --- | --- | --- |
| **Mongoose** | We use PostgreSQL, not MongoDB | Use `pg` |
| **Sequelize** | Too heavy, adds complexity | Use `pg` directly |
| **TypeORM** | Too heavy, adds complexity | Use `pg` directly |
| **Passport.js** | Too complex for JWT auth | Use `jsonwebtoken` directly |
| **Socket.io-client** (old) | Use latest version | `socket.io-client@4.x` |
| **Axios** (backend) | Use native `fetch` or `node-fetch` | Native fetch |
| **Lodash** | Too heavy; use vanilla JS | Native array methods |
| **Moment.js** | Too heavy; use date-fns or native | `date-fns` or `Intl.DateTimeFormat` |

### 2.3. Frontend Rules

| Category | Required | Alternative |
| --- | --- | --- |
| **UI Library** | React 18+ | - |
| **Canvas** | React-Konva | - |
| **State Management** | Zustand (or Context API) | Redux (too heavy) |
| **Routing** | React Router DOM v6 | - |
| **Forms** | React Hook Form | - |
| **HTTP Client** | Axios | - |
| **Notifications** | react-hot-toast | - |

---

## 3. Error Handling Rules

### 3.1. Custom Error Classes

```jsx
// All errors must extend ApiError
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types
const ERRORS = {
  BAD_REQUEST: (msg) => new ApiError(400, msg),
  UNAUTHORIZED: (msg) => new ApiError(401, msg),
  FORBIDDEN: (msg) => new ApiError(403, msg),
  NOT_FOUND: (msg) => new ApiError(404, msg),
  CONFLICT: (msg) => new ApiError(409, msg),
  TOO_MANY_REQUESTS: (msg) => new ApiError(429, msg),
  INTERNAL: (msg) => new ApiError(500, msg),
};
```

### 3.2. Async Error Wrapper

```jsx
// ALL route handlers MUST use catchAsync
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
router.post(
  '/',
  validate(createSchema),
  catchAsync(controller.create)
);
```

### 3.3. Global Error Handler

```jsx
// MUST handle all error types
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(err);

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
  }

  // Operational errors (our ApiError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'OPERATIONAL_ERROR',
        message: err.message
      }
    });
  }

  // Programming errors (unknown)
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong'
    }
  });
};
```

### 3.4. Error Logging Rules

- ✅ Always log errors with `logger.error(err)`
- ✅ Include `traceId` in all logs
- ✅ Log stack trace in development only
- ❌ Never log sensitive data (passwords, tokens)
- ❌ Never expose internal errors to client

---

## 4. Database Rules

### 4.1. Query Rules

```jsx
// ✅ ALWAYS use parameterized queries
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ NEVER use string interpolation
const result = await db.query(
  `SELECT * FROM users WHERE email = '${email}'` // SQL INJECTION!
);

// ✅ ALWAYS use RETURNING clause
const result = await db.query(
  'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id, email, name',
  [email, name]
);
```

### 4.2. Transaction Rules

```jsx
// ✅ Use transactions for multi-step operations
const client = await pool.connect();
try {
  await client.query('BEGIN');

  // Multiple queries
  await client.query('INSERT INTO tasks ...');
  await client.query('INSERT INTO task_sources ...');

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 4.3. Connection Rules

```jsx
// ✅ Always release connections
const client = await pool.connect();
try {
  // Do work
} finally {
  client.release(); // CRITICAL!
}

// ✅ Use pool.query() for single queries (auto-releases)
const result = await pool.query('SELECT * FROM users');
```

---

## 5. API Rules

### 5.1. Response Format

```jsx
// ✅ Success responses
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-07-13T00:00:00Z"
  }
}

// ✅ Paginated responses
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}

// ✅ Error responses
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [...]
  }
}
```

### 5.2. Status Codes

| Code | Use Case |
| --- | --- |
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (created) |
| 204 | Successful DELETE |
| 400 | Validation error (Joi) |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (RBAC) |
| 404 | Resource not found |
| 409 | Version conflict |
| 422 | Business logic violation |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### 5.3. Route Structure

```jsx
// ✅ Always version your API
const router = express.Router();
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/workspaces', workspaceRoutes);
```

### 5.4. Validation Rules

```jsx
// ✅ Always validate inputs
const schema = Joi.object({
  email: Joi.string().email().required().max(255),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(8).max(100).required()
});

// ❌ Never trust user input directly
const { email, name } = req.body; // DANGEROUS! Validate first.
```

---

## 6. [Socket.IO](http://socket.io/) Rules

### 6.1. Event Naming

```jsx
// ✅ Use colon separators for namespacing
// Format: category:action
const EVENTS = {
  BOARD: {
    JOIN: 'board:join',
    LEAVE: 'board:leave',
  },
  ELEMENT: {
    CREATED: 'element:created',
    MOVED: 'element:moved',
    UPDATED: 'element:updated',
    DELETED: 'element:deleted',
  },
};
```

### 6.2. Authentication

```jsx
// ✅ Always authenticate socket connections
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// ❌ Never allow unauthenticated connections
```

### 6.3. Room Management

```jsx
// ✅ Always join rooms for board events
socket.on('board:join', ({ boardId }) => {
  socket.join(`board:${boardId}`);
  // Broadcast to others
  socket.to(`board:${boardId}`).emit('user:joined', { userId });
});

// ✅ Always leave rooms on disconnect
socket.on('disconnect', () => {
  // Cleanup presence
  // Leave all rooms
});

// ✅ Always broadcast to room (not global)
io.to(`board:${boardId}`).emit('element:created', data);
// ❌ io.emit('element:created', data); // Don't broadcast globally
```

### 6.4. Rate Limiting

```jsx
// ✅ Always rate limit socket events
const rateLimit = 15; // events per second
const rateWindow = 1000; // 1 second

socket.use(([event, ...args], next) => {
  const key = `rate:socket:${socket.userId}:${event}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 1);
  if (count > rateLimit) {
    return next(new Error('Rate limit exceeded'));
  }
  next();
});
```

### 6.5. Event Log

```jsx
// ✅ Always log events for replay
await redis.rpush(
  `board:events:${boardId}`,
  JSON.stringify({ event, data, timestamp: Date.now() })
);
await redis.expire(`board:events:${boardId}`, 60);
```

---

## 7. Redis Rules

### 7.1. Key Naming

```jsx
// ✅ Use consistent key naming
// Format: category:entity:identifier
const KEYS = {
  LOCK: (id) => `lock:element:${id}`,
  PRESENCE: (boardId) => `presence:board:${boardId}`,
  CURSOR: (boardId, userId) => `cursor:board:${boardId}:${userId}`,
  EVENT_LOG: (boardId) => `board:events:${boardId}`,
  BOARD_STATE: (boardId) => `board:state:${boardId}`,
};

// ❌ Use inconsistent naming
const key1 = 'lock_123';
const key2 = 'board:presence:456';
```

### 7.2. TTL Management

```jsx
// ✅ Always set TTL for ephemeral data
await redis.setex(`lock:element:${id}`, 30, userId);

// ✅ Always use SETNX for locks
const locked = await redis.setnx(`lock:element:${id}`, userId);
if (locked) await redis.expire(`lock:element:${id}`, 30);

// ❌ Never store ephemeral data without TTL
await redis.set(`lock:element:${id}`, userId); // Memory leak!
```

---

## 8. Security Rules

### 8.1. Authentication

```jsx
// ✅ Always hash passwords
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// ✅ Always compare with bcrypt
const isValid = await bcrypt.compare(password, user.password_hash);

// ❌ Never store plain text passwords
// ❌ Never use simple equality check
```

### 8.2. JWT

```jsx
// ✅ Always sign with strong secret
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// ✅ Always verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// ❌ Never use weak secrets
const token = jwt.sign({ userId }, 'secret'); // DANGEROUS!
```

### 8.3. CORS

```jsx
// ✅ Always restrict CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ❌ Never allow all origins in production
const corsOptions = { origin: '*' }; // DANGEROUS!
```

### 8.4. Rate Limiting

```jsx
// ✅ Always rate limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

// ✅ Always rate limit public endpoints
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// ❌ Never expose endpoints without rate limiting
```

---

## 9. Testing Rules

### 9.1. Unit Tests

```jsx
// ✅ Always test services
describe('AuthService', () => {
  it('should register a new user', async () => {
    const user = await authService.register('test@test.com', 'Test', 'password');
    expect(user).toHaveProperty('id');
  });
});
```

### 9.2. Integration Tests

```jsx
// ✅ Always test API endpoints
describe('POST /auth/register', () => {
  it('should return 201 on success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@test.com', name: 'Test', password: 'password' });
    expect(res.status).toBe(201);
  });
});
```

---

## 10. Code Quality Rules

### 10.1. Naming Conventions

| Type | Convention | Example |
| --- | --- | --- |
| **Files** | kebab-case | `auth.service.js` |
| **Variables** | camelCase | `userData` |
| **Constants** | UPPER_SNAKE | `MAX_RETRIES` |
| **Classes** | PascalCase | `ApiError` |
| **Functions** | camelCase | `getUserById()` |
| **Routes** | kebab-case | `/workspace-members` |

### 10.2. File Structure

```jsx
// ✅ Each module follows the same structure
modules/auth/
├── auth.routes.js       // Route definitions
├── auth.controller.js   // Request handlers
├── auth.service.js      // Business logic
├── auth.validation.js   // Joi schemas
└── index.js            // Exports

// ✅ Each file has a single responsibility
// auth.service.js → ONLY business logic
// auth.controller.js → ONLY request/response handling
// auth.validation.js → ONLY validation schemas
```

### 10.3. Comments

```jsx
// ✅ Use comments for complex logic
// Calculate the version for optimistic locking
const result = await db.query(
  'UPDATE elements SET x = $1, y = $2, version = version + 1 WHERE id = $3 AND version = $4',
  [x, y, id, expectedVersion]
);

// ❌ Don't comment obvious code
// Increment version
version += 1; // This is obvious!
```

---

## 11. Performance Rules

### 11.1. Database

```jsx
// ✅ Add indexes for frequently queried columns
CREATE INDEX idx_elements_board_id ON elements(board_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

// ✅ Use SELECT with specific columns
const result = await db.query(
  'SELECT id, email, name FROM users WHERE email = $1',
  [email]
);

// ❌ Never use SELECT *
const result = await db.query('SELECT * FROM users');
```

### 11.2. Caching

```jsx
// ✅ Cache frequently accessed data
const cached = await redis.get(`board:state:${boardId}`);
if (cached) return JSON.parse(cached);

const state = await getBoardStateFromDB(boardId);
await redis.setex(`board:state:${boardId}`, 5, JSON.stringify(state));

// ❌ Never cache data that changes frequently
// ❌ Never cache without TTL
```

### 11.3. Optimization

```jsx
// ✅ Use bulk operations
await db.query(
  'UPDATE elements SET x = data.x, y = data.y FROM jsonb_to_recordset($1) AS data(id UUID, x DECIMAL, y DECIMAL) WHERE elements.id = data.id',
  [JSON.stringify(elements)]
);

// ❌ Don't loop for individual updates
for (const element of elements) {
  await db.query('UPDATE elements SET x = $1 WHERE id = $2', [element.x, element.id]);
}
```

---

## 12. Boundaries & Constraints

### 12.1. For AI Assistance

| Allowed | Not Allowed |
| --- | --- |
| Suggesting code improvements | Rewriting entire modules without reason |
| Adding new features per plan | Adding unrequested features |
| Fixing bugs | Changing architecture without discussion |
| Writing documentation | Deleting existing functionality |
| Creating new modules | Removing existing modules |

### 12.2. Code Generation Rules

- Generate complete files with proper exports
- Include Joi validation schemas for all inputs
- Include error handling for all operations
- Use the established patterns from the architecture
- Maintain consistency with existing code

### 12.3. Critical Things to Always Include

```jsx
// ✅ Always include:
1. Input validation (Joi)
2. Error handling (catchAsync + ApiError)
3. Logging (logger.info/error)
4. Database transactions where needed
5. Version checking for optimistic locking
6. RBAC checks
7. Rate limiting
8. CORS configuration
9. Environment variable validation
10. Graceful shutdown
```

### 12.4. Critical Things to Never Include

```jsx
// ❌ Never include:
1. Hardcoded secrets or credentials
2. Direct SQL queries without parameters
3. Unauthenticated routes (except auth)
4. Unvalidated user input
5. Global error suppression (try-catch without logging)
6. Infinite loops or recursion without termination
7. Blocking operations in event loop (use async)
8. Large file uploads through server (use Cloudinary direct)
9. Synchronous email sending for bulk operations
10. Exposing internal stack traces in production
```

---

## 13. Summary Checklist

| Category | Requirement | Status |
| --- | --- | --- |
| **Core Principles** | Simplicity, Incremental, Consistency | ✅ |
| **Libraries** | Use allowed list only | ✅ |
| **Error Handling** | ApiError + catchAsync + global handler | ✅ |
| **Database** | Parameterized queries, transactions | ✅ |
| **API** | Versioned, validated, consistent responses | ✅ |
| [**Socket.IO**](http://socket.io/) | Authenticated, rooms, rate limited | ✅ |
| **Redis** | Proper keys, TTL, SETNX for locks | ✅ |
| **Security** | Auth, RBAC, CORS, rate limiting | ✅ |
| **Testing** | Unit + integration tests | ✅ |
| **Code Quality** | Consistent naming, single responsibility | ✅ |
| **Performance** | Indexes, caching, bulk operations | ✅ |
| **Boundaries** | Respect architecture and decisions | ✅ |

---

**These rules must be followed at all times. 🚀**