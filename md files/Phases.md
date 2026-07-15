# SketchFlow Backend — Implementation Plan

## Overview

Build the complete backend for SketchFlow: a real-time visual collaboration platform with an Express.js API server, Socket.IO real-time layer, PostgreSQL database, Redis cache, Cloudinary file storage, and scheduled cron jobs — all as a modular monolith.

---

## Architecture Summary (from your diagrams)

```
Client Layer (React + React-Konva)
        │
   API Gateway (Nginx reverse proxy — rate limiting, SSL, health checks)
        │
   ┌────┴────┐
   │         │
Express.js  Socket.IO
(REST API)  (Real-Time)
   │         │
   └────┬────┘
        │
   Redis Cluster (sessions, locks, presence, event log, board cache, rate limiting)
        │
   PostgreSQL (users, workspaces, boards, elements, tasks, chat, files, activity_logs)
        │
   Cloudinary CDN (file uploads, image optimization)
```

---

## ERD Summary (10 Tables)

| Table | Key Columns | Relationships |
|---|---|---|
| **users** | id (UUID PK), email, name, password_hash, avatar_url, reset_token_hash, reset_token_expires_at | Creates workspaces, elements, tasks |
| **workspaces** | id (UUID PK), name, description, created_by (FK→users) | Has many boards, members |
| **workspace_members** | workspace_id + user_id (composite PK), role (admin/editor/viewer), invited_by (FK→users) | Join table |
| **boards** | id (UUID PK), name, workspace_id (FK), created_by (FK) | Has many elements, tasks, messages, files |
| **elements** | id (UUID PK), board_id (FK), type (rectangle/circle/sticky/line/text/image), x, y, width, height, color, text, version, deleted_at (soft delete) | Belongs to board, created_by user |
| **tasks** | id (UUID PK), title, description, status (todo/in_progress/review/done), priority (low/medium/high), assignee_id (FK→users NULL), due_date, board_id (FK), version, deleted_at | Belongs to board |
| **task_sources** | task_id + element_id (composite PK), snapshot_text | Links tasks to source sticky notes |
| **chat_messages** | id (UUID PK), board_id (FK), user_id (FK), message, parent_id (FK→self, nullable) | Threaded replies |
| **files** | id (UUID PK), board_id (FK), name, public_id (Cloudinary), mime_type, size, uploaded_by (FK) | Belongs to board |
| **activity_logs** | id (UUID PK), board_id (FK), user_id (FK), action, metadata (JSONB) | Audit trail |

---

## Redis Key Structure

```
presence:board:{boardId}          → Hash { userId: name }    [TTL: 60s]
cursor:board:{boardId}:{userId}   → Hash { x, y }            [TTL: 5s]
lock:element:{elementId}          → String userId             [TTL: 30s]
board:events:{boardId}            → List [event1, event2...]  [TTL: 60s]
board:state:{boardId}             → JSON { elements: [...] }  [TTL: 5s]
rate:board:{boardId}:{userId}     → Counter                   [TTL: 1s, max: 15]
session:{sessionId}               → JSON { userId }
refresh:{userId}                  → String refreshToken       [TTL: 30d]
```

---

## Project Structure

```
d:\Desktop\Projects\SketchFlow\
└── server/
    ├── package.json
    ├── .env.example
    ├── .gitignore
    ├── src/
    │   ├── index.js                    # Entry point — bootstraps Express + Socket.IO
    │   ├── config/
    │   │   ├── db.js                   # PostgreSQL pool (pg)
    │   │   ├── redis.js                # Redis client (ioredis) + graceful fallback
    │   │   ├── cloudinary.js           # Cloudinary config
    │   │   ├── cors.js                 # Explicit CORS configuration
    │   │   └── env.js                  # Environment validation
    │   ├── db/
    │   │   └── migrations/
    │   │       └── 001_initial_schema.sql  # Full DDL
    │   ├── middleware/
    │   │   ├── auth.js                 # JWT verification (access + refresh tokens)
    │   │   ├── rbac.js                 # Role-based access control
    │   │   ├── rateLimiter.js          # General + auth-specific rate limiting
    │   │   ├── validate.js             # Request validation (Joi)
    │   │   └── errorHandler.js         # Centralized error handling
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── auth.routes.js
    │   │   │   ├── auth.controller.js
    │   │   │   ├── auth.service.js
    │   │   │   └── auth.validation.js
    │   │   ├── users/
    │   │   │   ├── users.routes.js
    │   │   │   ├── users.controller.js
    │   │   │   └── users.service.js
    │   │   ├── workspaces/
    │   │   │   ├── workspaces.routes.js
    │   │   │   ├── workspaces.controller.js
    │   │   │   ├── workspaces.service.js
    │   │   │   └── workspaces.validation.js
    │   │   ├── boards/
    │   │   │   ├── boards.routes.js
    │   │   │   ├── boards.controller.js
    │   │   │   ├── boards.service.js
    │   │   │   └── boards.validation.js
    │   │   ├── elements/
    │   │   │   ├── elements.routes.js
    │   │   │   ├── elements.controller.js
    │   │   │   ├── elements.service.js
    │   │   │   └── elements.validation.js
    │   │   ├── tasks/
    │   │   │   ├── tasks.routes.js
    │   │   │   ├── tasks.controller.js
    │   │   │   ├── tasks.service.js
    │   │   │   └── tasks.validation.js
    │   │   ├── chat/
    │   │   │   ├── chat.routes.js
    │   │   │   ├── chat.controller.js
    │   │   │   ├── chat.service.js
    │   │   │   └── chat.validation.js
    │   │   ├── files/
    │   │   │   ├── files.routes.js
    │   │   │   ├── files.controller.js
    │   │   │   ├── files.service.js
    │   │   │   └── files.validation.js
    │   │   └── activity/
    │   │       ├── activity.routes.js
    │   │       ├── activity.controller.js
    │   │       └── activity.service.js
    │   ├── sockets/
    │   │   ├── index.js                # Socket.IO server setup + auth middleware
    │   │   ├── boardHandler.js         # Board room join/leave, element CRUD events
    │   │   ├── presenceHandler.js      # Cursor tracking, user presence
    │   │   ├── lockHandler.js          # Element locking (SETNX + TTL + heartbeat)
    │   │   ├── chatHandler.js          # Real-time chat events
    │   │   ├── taskHandler.js          # Task event broadcasting
    │   │   └── eventLog.js             # Redis event log for replay
    │   ├── services/
    │   │   └── email.service.js        # Nodemailer service
    │   ├── jobs/
    │   │   └── cron.js                 # node-cron: stale locks, old logs, expired invites
    │   └── utils/
    │       ├── ApiError.js             # Custom error class
    │       ├── catchAsync.js           # Async error wrapper
    │       └── logger.js               # Winston/Pino logger
    └── tests/                          # (future — not in scope for Phase 1)
```

---

## Proposed Changes — Phased Build

### Phase 1: Foundation & Authentication (Week 1)

This is what we'll build first. It establishes the entire project skeleton and the auth system.

---

#### [NEW] [package.json](file:///d:/Desktop/Projects/SketchFlow/server/package.json)
- Initialize with `npm init`
- Dependencies: `express`, `pg`, `ioredis`, `socket.io`, `jsonwebtoken`, `bcryptjs`, `joi`, `cors`, `helmet`, `morgan`, `dotenv`, `uuid`, `cloudinary`, `nodemailer`, `node-cron`, `express-rate-limit`, `cookie-parser`
- Dev dependencies: `nodemon`
- Scripts: `dev`, `start`, `migrate`

#### [NEW] [.env.example](file:///d:/Desktop/Projects/SketchFlow/server/.env.example)
- Template for all required env vars:
  - `DATABASE_URL`, `REDIS_URL`
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY=15m`, `JWT_REFRESH_EXPIRY=30d`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
  - `CORS_ORIGIN=http://localhost:5173` (comma-separated for multiple origins)
  - `CLIENT_URL=http://localhost:5173` (for password reset links)
  - `PORT=5000`, `NODE_ENV=development`
- Validated at startup via `config/env.js`

#### [NEW] [.gitignore](file:///d:/Desktop/Projects/SketchFlow/server/.gitignore)
- Standard Node.js gitignore (node_modules, .env, logs, etc.)

---

#### [NEW] [src/config/env.js](file:///d:/Desktop/Projects/SketchFlow/server/src/config/env.js)
- Validate all required environment variables exist on startup
- Throw descriptive error if any are missing
- Export typed config object

#### [NEW] [src/config/db.js](file:///d:/Desktop/Projects/SketchFlow/server/src/config/db.js)
- Create PostgreSQL connection pool using `pg.Pool`
- Configure pool size, idle timeout, connection timeout
- Export `query()` helper and the raw pool

#### [NEW] [src/config/redis.js](file:///d:/Desktop/Projects/SketchFlow/server/src/config/redis.js)
- Create ioredis client with reconnection strategy
- Handle error/reconnection events with logging
- **Graceful fallback**: if Redis is unavailable, log warning and continue without caching
- Wrap Redis operations in try/catch so auth and REST APIs still function without Redis
- Export Redis client instance + `isRedisAvailable()` helper

#### [NEW] [src/config/cors.js](file:///d:/Desktop/Projects/SketchFlow/server/src/config/cors.js)
- Parse `CORS_ORIGIN` from env (comma-separated list of allowed origins)
- Configure `credentials: true` for cookie-based refresh tokens
- Allow methods: `GET, POST, PUT, PATCH, DELETE`
- Allow headers: `Content-Type, Authorization`
- Export CORS options object for both Express and Socket.IO

#### [NEW] [src/config/cloudinary.js](file:///d:/Desktop/Projects/SketchFlow/server/src/config/cloudinary.js)
- Configure Cloudinary SDK with env vars
- Export configured instance

---

#### [NEW] [src/db/migrations/001_initial_schema.sql](file:///d:/Desktop/Projects/SketchFlow/server/src/db/migrations/001_initial_schema.sql)
- Enable `uuid-ossp` extension
- Create all 10 tables with proper constraints, indexes, and foreign keys
- **Users table** includes `reset_token_hash VARCHAR(255)` and `reset_token_expires_at TIMESTAMP` for password reset flow (stored as hash, not plaintext)
- Add indexes on: `workspace_members(user_id)`, `boards(workspace_id)`, `elements(board_id, deleted_at)`, `tasks(board_id, assignee_id)`, `chat_messages(board_id)`, `files(board_id)`, `activity_logs(board_id, created_at)`
- Add CHECK constraints for enums (role, element type, task status, priority, action)

---

#### [NEW] [src/utils/ApiError.js](file:///d:/Desktop/Projects/SketchFlow/server/src/utils/ApiError.js)
- Custom error class extending `Error` with `statusCode`, `isOperational` flag

#### [NEW] [src/utils/catchAsync.js](file:///d:/Desktop/Projects/SketchFlow/server/src/utils/catchAsync.js)
- HOF wrapper for async route handlers — catches and forwards errors

#### [NEW] [src/utils/logger.js](file:///d:/Desktop/Projects/SketchFlow/server/src/utils/logger.js)
- Winston logger with console + file transports
- Structured JSON logging in production, pretty-print in dev

---

#### [NEW] [src/middleware/auth.js](file:///d:/Desktop/Projects/SketchFlow/server/src/middleware/auth.js)
- Extract JWT from `Authorization: Bearer <token>` header
- Verify **access token**, attach `req.user = { id, email, name }` to request
- Return 401 on invalid/expired tokens with distinct error codes (`TOKEN_EXPIRED` vs `TOKEN_INVALID`)
- Separate `verifyRefreshToken` helper for the refresh endpoint

#### [NEW] [src/middleware/errorHandler.js](file:///d:/Desktop/Projects/SketchFlow/server/src/middleware/errorHandler.js)
- Global error handler: differentiate operational vs. programming errors
- Log errors, return structured JSON error response
- Handle Joi validation errors, JWT errors, PG errors

#### [NEW] [src/middleware/validate.js](file:///d:/Desktop/Projects/SketchFlow/server/src/middleware/validate.js)
- Accept a Joi schema, validate `req.body`, `req.params`, `req.query`
- Return 400 with descriptive errors on validation failure

#### [NEW] [src/middleware/rateLimiter.js](file:///d:/Desktop/Projects/SketchFlow/server/src/middleware/rateLimiter.js)
- **General API limiter**: 100 requests/15 min per IP
- **Auth-specific limiter**: 5 attempts/min per IP, `skipSuccessfulRequests: true`
- **Password reset limiter**: 3 attempts/15 min per IP
- All use `express-rate-limit`, configurable via env vars

---

#### [NEW] [src/modules/auth/auth.validation.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/auth/auth.validation.js)
- Joi schemas for `register` (name, email, password), `login` (email, password), `forgotPassword` (email), `resetPassword` (token, newPassword)
- Password strength validation: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number

#### [NEW] [src/modules/auth/auth.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/auth/auth.service.js)
- `register(name, email, password)` → hash password (bcryptjs), insert user, return token pair
- `login(email, password)` → verify credentials, return token pair, **store refresh token in Redis** (`refresh:{userId}`, TTL 30d)
- `generateTokens(userId)` → returns `{ accessToken (15min), refreshToken (30d) }`
- `refreshToken(refreshToken)` → verify JWT, **validate against Redis** (`refresh:{userId}`), issue new access token + rotate refresh token
- `forgotPassword(email)` → generate reset token (crypto.randomBytes), **store SHA-256 hash** in `users.reset_token_hash` with 1hr expiry in `users.reset_token_expires_at`, send email with plaintext token
- `resetPassword(token, newPassword)` → hash submitted token, compare against stored `reset_token_hash`, verify expiry, update password, **clear reset token fields**
- `logout(userId)` → **delete refresh token from Redis** (`redis.del('refresh:${userId}')`), clear refresh token cookie

**Refresh token cookie** (set on login, refresh, cleared on logout):
```javascript
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth'  // Only sent to auth endpoints
});
```

**Refresh token Redis validation** (on every refresh):
```javascript
// On login/register:
await redis.setex(`refresh:${userId}`, 30 * 24 * 60 * 60, refreshToken);

// On refresh:
const stored = await redis.get(`refresh:${userId}`);
if (stored !== refreshToken) throw new ApiError(401, 'Invalid refresh token');

// On logout:
await redis.del(`refresh:${userId}`);
```

#### [NEW] [src/modules/auth/auth.controller.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/auth/auth.controller.js)
- `POST /api/auth/register` → register user, set refresh token httpOnly cookie (rate limited: auth limiter)
- `POST /api/auth/login` → authenticate user, set refresh token httpOnly cookie (rate limited: auth limiter)
- `POST /api/auth/refresh` → read refresh token **from httpOnly cookie** (not header), validate against Redis, issue new access token + rotate refresh token cookie
- `POST /api/auth/logout` → **delete refresh token from Redis** + clear httpOnly cookie
- `POST /api/auth/forgot-password` → send reset email (rate limited: password reset limiter)
- `POST /api/auth/reset-password` → reset password with token
- `GET /api/auth/me` → return current user profile (requires auth)

#### [NEW] [src/modules/auth/auth.routes.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/auth/auth.routes.js)
- Wire up auth routes with validation + rate limiting middleware
- Apply `authLimiter` to login/register, `passwordResetLimiter` to forgot/reset

---

#### [NEW] [src/modules/users/users.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/users/users.service.js)
- `getById(id)` → fetch user (excluding password_hash)
- `updateProfile(id, { name, avatar_url })` → update user
- `searchByEmail(email)` → find user for invites

#### [NEW] [src/modules/users/users.controller.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/users/users.controller.js)
- `GET /api/users/profile` → get own profile
- `PUT /api/users/profile` → update profile
- `GET /api/users/search?email=` → search users

#### [NEW] [src/modules/users/users.routes.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/users/users.routes.js)
- Wire up user routes (all require auth)

---

#### [NEW] [src/index.js](file:///d:/Desktop/Projects/SketchFlow/server/src/index.js)
- Create Express app with middleware stack (CORS from `config/cors.js`, helmet, morgan, cookie-parser, json)
- Apply general rate limiter globally, auth-specific limiters on auth routes
- Mount API routes under `/api`
- Create HTTP server, attach Socket.IO (basic setup — full config in Phase 3)
- Validate env vars, test DB connection, attempt Redis connection (continue if unavailable)
- Health check endpoint: `GET /api/health` → returns DB + Redis status
- Start server with graceful shutdown (SIGTERM handling)
- Global error handlers for uncaught exceptions/rejections

---

### Phase 2: Workspaces & Boards CRUD

#### [NEW] [src/modules/workspaces/workspaces.validation.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/workspaces/workspaces.validation.js)
- Schemas: create (name, description), update, invite member (email, role)

#### [NEW] [src/modules/workspaces/workspaces.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/workspaces/workspaces.service.js)
- `create(userId, { name, description })` → insert workspace + add owner to workspace_members with role='admin'
- `getByUserId(userId)` → list workspaces user belongs to (JOIN workspace_members)
- `getById(workspaceId, userId)` → get workspace details with member count, board count
- `update(workspaceId, { name, description })` → update workspace
- `delete(workspaceId)` → soft delete or cascade
- `inviteMember(workspaceId, email, role, invitedBy)` → add member, send invite email
- `removeMember(workspaceId, userId)` → remove from workspace_members
- `updateMemberRole(workspaceId, userId, role)` → change role
- `getMembers(workspaceId)` → list members with user details

#### [NEW] [src/modules/workspaces/workspaces.controller.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/workspaces/workspaces.controller.js)
- Full CRUD + member management endpoints

#### [NEW] [src/modules/workspaces/workspaces.routes.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/workspaces/workspaces.routes.js)
- Routes with auth + RBAC middleware

#### [NEW] [src/middleware/rbac.js](file:///d:/Desktop/Projects/SketchFlow/server/src/middleware/rbac.js)
- `requireRole(...roles)` → check user's role in workspace
- Query workspace_members to verify role
- Attach `req.membership = { role }` for downstream use

---

#### [NEW] [src/modules/boards/boards.validation.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/boards/boards.validation.js)
- Schemas: create (name, workspace_id), update (name)

#### [NEW] [src/modules/boards/boards.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/boards/boards.service.js)
- `create(userId, { name, workspaceId })` → insert board
- `getByWorkspaceId(workspaceId)` → list boards with element/task counts
- `getById(boardId)` → board details with all elements
- `update(boardId, { name })` → update board
- `delete(boardId)` → cascade delete elements, tasks, messages

#### [NEW] [src/modules/boards/boards.controller.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/boards/boards.controller.js)
#### [NEW] [src/modules/boards/boards.routes.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/boards/boards.routes.js)

---

#### [NEW] [src/services/email.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/services/email.service.js)
- Configure Nodemailer transporter
- `sendInviteEmail(toEmail, workspaceName, inviterName)` → send invitation email
- Synchronous send (per architecture — no queue)

---

### Phase 3: Elements (Whiteboard) + Socket.IO Real-Time Layer

#### [NEW] [src/modules/elements/elements.validation.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/elements/elements.validation.js)
- Schemas for element create/update with type-specific validation

#### [NEW] [src/modules/elements/elements.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/elements/elements.service.js)
- `create(userId, boardId, elementData)` → insert with version=1
- `getByBoardId(boardId)` → get all non-deleted elements
- `update(elementId, elementData, expectedVersion)` → version-based conflict resolution: `UPDATE ... SET version = version + 1 WHERE id = $1 AND version = $2`
- `softDelete(elementId)` → set deleted_at timestamp
- `batchUpdate(elements)` → bulk position updates (for drag operations)

#### [NEW] [src/modules/elements/elements.controller.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/elements/elements.controller.js)
#### [NEW] [src/modules/elements/elements.routes.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/elements/elements.routes.js)

---

#### [NEW] [src/sockets/index.js](file:///d:/Desktop/Projects/SketchFlow/server/src/sockets/index.js)
- Create Socket.IO server with CORS config
- JWT authentication middleware for socket connections
- Socket connection handler → register all event handlers
- Room management → `socket.join('board:{boardId}')`
- Rate limiting per socket (15 events/sec per user per board via Redis)

#### [NEW] [src/sockets/boardHandler.js](file:///d:/Desktop/Projects/SketchFlow/server/src/sockets/boardHandler.js)
- Events: `board:join`, `board:leave`
- `element:created` → validate, persist, broadcast to room
- `element:moved` → optimistic update flow: validate version → update DB → broadcast
- `element:updated` → same optimistic flow for property changes
- `element:deleted` → soft delete → broadcast
- Cache board state in Redis with 5s TTL

#### [NEW] [src/sockets/presenceHandler.js](file:///d:/Desktop/Projects/SketchFlow/server/src/sockets/presenceHandler.js)
- `cursor:move` → store in Redis with 5s TTL, broadcast to room (throttled)
- `presence:join` → add to Redis hash `presence:board:{boardId}` with 60s TTL
- `presence:leave` → remove from hash
- Heartbeat: refresh presence TTL every 30s
- On disconnect: cleanup presence + cursors

#### [NEW] [src/sockets/lockHandler.js](file:///d:/Desktop/Projects/SketchFlow/server/src/sockets/lockHandler.js)
- `element:lock` → Redis `SETNX lock:element:{id}` with 30s TTL
- `element:unlock` → delete lock if owned by requesting user
- `element:lock:heartbeat` → refresh TTL if lock still owned (every 10s from client)
- Broadcast lock/unlock events to room for UI indicators

#### [NEW] [src/sockets/eventLog.js](file:///d:/Desktop/Projects/SketchFlow/server/src/sockets/eventLog.js)
- After every board event → `RPUSH board:events:{boardId}` with 60s TTL
- `events:replay` → on reconnection, client sends last event timestamp → replay from Redis list
- **Fallback for >60s disconnections**: if Redis list is empty/expired, fetch full board state from DB and emit `board:state:sync`

```javascript
// Event replay with DB fallback
socket.on('events:replay', async ({ boardId, since }) => {
  // 1. Try Redis list first (60s TTL)
  const events = await redis.lrange(`board:events:${boardId}`, 0, -1);
  const parsed = events.map(e => JSON.parse(e));
  const filtered = parsed.filter(e => e.timestamp > since);

  if (filtered.length > 0) {
    socket.emit('events:replayed', filtered);
  } else {
    // 2. Fallback: fetch full board state from DB
    const elements = await elementService.getByBoardId(boardId);
    socket.emit('board:state:sync', elements);
  }
});
```

---

### Phase 4: Tasks + Sticky Note Conversion

#### [NEW] [src/modules/tasks/tasks.validation.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/tasks/tasks.validation.js)
- Schemas: create, update, convert from sticky note

#### [NEW] [src/modules/tasks/tasks.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/tasks/tasks.service.js)
- `create(userId, boardId, taskData)` → insert task with version=1
- `convertFromSticky(userId, elementId, taskData)` → transaction: create task + insert task_sources + snapshot sticky text
- `getByBoardId(boardId, filters?)` → list tasks with optional status/assignee filters
- `getById(taskId)` → task details with source element info
- `update(taskId, updates, expectedVersion)` → optimistic locking update
- `updateStatus(taskId, status, version)` → status transition + activity log
- `assignTask(taskId, assigneeId, version)` → assign + activity log
- `softDelete(taskId)` → set deleted_at

#### [NEW] [src/modules/tasks/tasks.controller.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/tasks/tasks.controller.js)
- `POST /api/boards/:boardId/tasks` → create task
- `POST /api/boards/:boardId/tasks/convert` → convert sticky to task
- `GET /api/boards/:boardId/tasks` → list tasks (with filters)
- `GET /api/tasks/:taskId` → get task details
- `PUT /api/tasks/:taskId` → update task
- `PATCH /api/tasks/:taskId/status` → update status
- `PATCH /api/tasks/:taskId/assign` → assign task
- `DELETE /api/tasks/:taskId` → soft delete

#### [NEW] [src/modules/tasks/tasks.routes.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/tasks/tasks.routes.js)

#### [NEW] [src/sockets/taskHandler.js](file:///d:/Desktop/Projects/SketchFlow/server/src/sockets/taskHandler.js)
- After REST operations → emit `task:created`, `task:updated`, `task:status_changed`, `task:assigned`, `task:deleted` to board room

---

### Phase 5: Chat + Files + Activity Logging

#### [NEW] [src/modules/chat/chat.validation.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/chat/chat.validation.js)
- Schemas: send message, get messages (pagination)

#### [NEW] [src/modules/chat/chat.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/chat/chat.service.js)
- `sendMessage(userId, boardId, { message, parentId? })` → insert + return with user info
- `getMessages(boardId, { cursor, limit })` → cursor-based pagination (newest first)
- `getThreadReplies(parentId)` → get replies to a message

#### [NEW] [src/modules/chat/chat.controller.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/chat/chat.controller.js)
#### [NEW] [src/modules/chat/chat.routes.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/chat/chat.routes.js)

#### [NEW] [src/sockets/chatHandler.js](file:///d:/Desktop/Projects/SketchFlow/server/src/sockets/chatHandler.js)
- `chat:send` → persist via service → broadcast `chat:new_message` to board room
- Append-only, no conflicts

---

#### [NEW] [src/modules/files/files.validation.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/files/files.validation.js)
- Schema: register uploaded file (name, public_id, mime_type, size)

#### [NEW] [src/modules/files/files.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/files/files.service.js)
- `registerUpload(userId, boardId, fileData)` → store Cloudinary metadata in PostgreSQL
- `getByBoardId(boardId)` → list files
- `deleteFile(fileId)` → delete from Cloudinary + PostgreSQL
- `getUploadSignature(boardId)` → generate Cloudinary signed upload params

#### [NEW] [src/modules/files/files.controller.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/files/files.controller.js)
#### [NEW] [src/modules/files/files.routes.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/files/files.routes.js)

---

#### [NEW] [src/modules/activity/activity.service.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/activity/activity.service.js)
- `log(boardId, userId, action, metadata)` → insert activity log
- `getByBoardId(boardId, { cursor, limit })` → paginated activity feed
- Actions: `task_created`, `member_joined`, `file_uploaded`, `element_created`, `task_status_changed`

#### [NEW] [src/modules/activity/activity.controller.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/activity/activity.controller.js)
#### [NEW] [src/modules/activity/activity.routes.js](file:///d:/Desktop/Projects/SketchFlow/server/src/modules/activity/activity.routes.js)

---

### Phase 6: Cron Jobs + Production Hardening + DevOps

#### [NEW] [src/jobs/cron.js](file:///d:/Desktop/Projects/SketchFlow/server/src/jobs/cron.js)
- ~~**Hourly**: Cleanup stale element locks from Redis~~ → **Removed**: TTL auto-expires locks; Redis SCAN is slow on large datasets and unnecessary here
- **Daily**: Delete activity logs older than 90 days
- **Hourly**: Delete expired invite tokens from DB (workspace_members with pending invites)

#### [NEW] Docker Setup
- `docker-compose.yml` — PostgreSQL + Redis for local development
- `Dockerfile` — Multi-stage build for production deployment
- `.dockerignore` — Exclude node_modules, .env, etc.

#### [NEW] API Documentation
- Postman collection export with all endpoints grouped by module
- Environment variables template for Postman
- Example request/response bodies for developer onboarding

---

#### Production Hardening (applied across all files)
- Graceful shutdown: close DB pool, Redis, active sockets on SIGTERM
- Connection pool tuning for PostgreSQL
- Memory monitoring (log heap usage periodically)
- Comprehensive error logging with correlation IDs
- Input sanitization on all endpoints

---

## User Review Required

> [!IMPORTANT]
> **Database hosting**: The plan uses PostgreSQL (Neon/Supabase) and Redis (Render/Railway) per your architecture. Do you have these services set up, or should we use local Docker containers for development?

> [!IMPORTANT]
> **Execution approach**: I plan to build this incrementally — starting with Phase 1 (project setup + auth + users), then proceeding through each phase. This means the backend will be functional and testable after each phase. Does this approach work for you?

## Resolved Design Decisions

> [!NOTE]
> **Invite system** — ✅ Resolved: Support **both** patterns:
> - **Direct add** (`POST /api/workspaces/:id/members`) — adds user immediately if they exist in the system
> - **Invite link** (`POST /api/workspaces/:id/invite`) — generates token, sends email, user clicks link to join (with configurable expiry)

> [!NOTE]
> **Task status flow** — ✅ Resolved: **No enforced transitions**. Any status can be set freely (todo ↔ in_progress ↔ review ↔ done). The kanban board UI naturally encourages flow. A soft validation warning will be logged if stages are skipped (e.g., todo → done directly).

> [!NOTE]
> **Refresh token storage** — ✅ Resolved: Refresh tokens stored in **Redis** (`refresh:{userId}`, TTL 30d) for revocation support. Delivered via **httpOnly secure cookie** (not localStorage). Access token remains in Authorization header.

> [!NOTE]
> **Password reset token storage** — ✅ Resolved: Stored as **SHA-256 hash** in `users.reset_token_hash` + `users.reset_token_expires_at` columns (already in migration schema). Plaintext token sent to user via email.

> [!NOTE]
> **Cron lock cleanup** — ✅ Resolved: **Removed** Redis SCAN for lock cleanup. TTL auto-expires locks. Cron focuses on DB cleanup (expired invites, old activity logs).

---

## Verification Plan

### Automated Tests
```bash
# After each phase, test with:
npm run dev                          # Server starts without errors
curl http://localhost:5000/api/health # Health check (DB + Redis status)

# Phase 1 verification:
# POST /api/auth/register — creates user, returns { accessToken, refreshToken }
# POST /api/auth/login — authenticates, returns token pair
# POST /api/auth/refresh — returns new access token
# POST /api/auth/logout — clears refresh token
# POST /api/auth/forgot-password — sends reset email
# POST /api/auth/reset-password — resets password with token
# GET /api/auth/me — returns user profile with valid access token
# Rate limiting — 6th login attempt within 1 min returns 429
# Redis down — server still starts, auth still works (warning logged)
```

### Manual Verification
- Test all REST endpoints via Postman/Thunder Client
- Test Socket.IO events using a simple test client script
- Verify PostgreSQL migrations create correct schema
- Verify Redis key operations (locks, presence, event log)
- Test error handling (invalid inputs, auth failures, version conflicts)
