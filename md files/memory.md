# SketchFlow — Project Memory & Status

## 🟢 Current Status
**Phase 3 (Elements + Socket.IO Real-Time Layer) is 100% COMPLETE.**
We are currently at the boundary between Phase 3 and Phase 4. The next step is to begin Phase 4 (Tasks + Sticky Note Conversion).

## 📁 Files Created/Modified in Phase 3
- `server/src/modules/elements/elements.validation.js` (NEW — Joi schemas for all element operations)
- `server/src/modules/elements/elements.service.js` (NEW — CRUD + optimistic locking + jsonb batch update)
- `server/src/modules/elements/elements.controller.js` (NEW — 5 endpoint handlers)
- `server/src/modules/elements/elements.routes.js` (NEW — Board-scoped + element-specific routers)
- `server/src/middleware/rbac.js` (MODIFIED — Added requireElementBoardRole)
- `server/src/sockets/index.js` (NEW — Socket.IO server with JWT auth + rate limiting)
- `server/src/sockets/middleware/boardAuth.js` (NEW — Per-event board membership check)
- `server/src/sockets/boardHandler.js` (NEW — Room join/leave + element CRUD events)
- `server/src/sockets/presenceHandler.js` (NEW — Cursor tracking + 30s disconnect delay)
- `server/src/sockets/lockHandler.js` (NEW — SETNX element locks + heartbeat)
- `server/src/sockets/eventLog.js` (NEW — Event log + replay with DB fallback)
- `server/src/sockets/chatHandler.js` (NEW — Stub for Phase 5)
- `server/src/sockets/taskHandler.js` (NEW — Stub for Phase 4)
- `server/src/index.js` (MODIFIED — Socket.IO init + element routes + graceful shutdown)
- `SketchFlow.postman_collection.json` (UPDATED — Added all Phase 3 element endpoints)

## ✅ What Has Been Completed (Phase 1)
1. **Project Skeleton**: Express setup, routing structure, error handling, structured logging (Winston).
2. **Database Schema**: Full PostgreSQL schema applied (10 tables with proper relations, UUIDs, soft deletes).
3. **Authentication System**:
   - Registration & Login with Bcrypt hashing.
   - JWT Access tokens (header) + Refresh tokens (httpOnly secure cookie).
   - Redis integration for refresh token storage, rotation, and revocation (on logout).
   - Password reset flow utilizing SHA-256 hashed tokens stored in DB.
4. **Security & Validation**:
   - General API rate limiting (100 req/15min).
   - Auth-specific rate limiting (5 req/min).
   - Password reset rate limiting (3 req/15min).
   - Joi validation schemas for all auth endpoints.
5. **DevOps / Infrastructure**:
   - Graceful server shutdown.
   - Graceful fallback for Redis (if Redis is down, server still works but revocation is disabled).

## ✅ What Has Been Completed (Phase 2)
1. **RBAC Middleware**:
   - `requireRole()` — checks user's role in workspace (resolves workspaceId from params/body).
   - `requireBoardRole()` — checks role via board→workspace lookup for `/api/boards/:id` routes.
2. **Workspaces Module**:
   - Full CRUD (create, list, get, update, delete).
   - Member management (invite by email, remove, update role, list members).
   - Transactional workspace creation (workspace + admin member in one transaction).
   - Last-admin protection on remove/demote operations.
   - Invite notification emails via existing email service.
3. **Boards Module**:
   - Full CRUD (create, list by workspace, get, update, delete).
   - Element/task counts in queries.
   - Two routers: workspace-scoped (`/api/workspaces/:workspaceId/boards`) and board-specific (`/api/boards/:id`).

## ✅ What Has Been Completed (Phase 3)
1. **Elements REST Module**:
   - Full CRUD: create, list by board, update (with optimistic locking), soft delete.
   - Version-based conflict resolution: `UPDATE ... WHERE version = $expectedVersion` → 409 on mismatch.
   - Batch position update using `jsonb_to_recordset` single query with per-element version checks.
   - `requireElementBoardRole` RBAC: element → board → workspace lookup chain.
2. **Socket.IO Real-Time Layer**:
   - JWT authentication middleware on every connection.
   - Per-socket rate limiting (15 events/sec) via Redis with graceful fallback.
   - Board room management (join/leave with RBAC check).
3. **Board Handler** (`boardHandler.js`):
   - `board:join` / `board:leave` with per-event board auth middleware.
   - `element:created`, `element:updated`, `element:moved`, `element:deleted` — all with version checks.
   - `element:conflict` event emitted back to sender on version mismatch.
   - Event log integration on every element event.
4. **Presence Handler** (`presenceHandler.js`):
   - `presence:join`, `presence:leave`, `presence:heartbeat`.
   - `cursor:move` — Redis hash with 5s TTL, broadcast to room.
   - 30-second disconnect delay prevents flickering on network reconnects.
   - Cleanup timers cancelled if user reconnects within 30s.
5. **Lock Handler** (`lockHandler.js`):
   - `element:lock` — Redis SETNX with 30s TTL.
   - `element:unlock` — ownership verified before delete.
   - `element:lock:heartbeat` — TTL refresh every 10s (client sends).
   - Graceful degraded mode when Redis unavailable (lock skipped, edit allowed).
6. **Event Log** (`eventLog.js`):
   - `logEvent()` — RPUSH + 60s EXPIRE on every board event.
   - `events:replay` — filter by `since` timestamp from Redis list.
   - DB fallback: full `board:state:sync` if Redis list is empty/expired.

## 🚀 Next Up (Phase 4 — Tasks + Sticky Note Conversion)
- Create `tasks.validation.js`, `tasks.service.js`, `tasks.controller.js`, `tasks.routes.js`.
- Implement task CRUD with optimistic locking (same pattern as elements).
- Implement `convertFromSticky` transaction: create task + insert task_sources.
- Implement task filtering (status, assignee).
- Complete `taskHandler.js` stub to broadcast task events to board rooms.

## 📌 Important Context & Decisions
- **Database**: PostgreSQL (running locally or via Cloud/Neon). Connection via `DATABASE_URL`.
- **Redis**: Used for sessions, refresh tokens, presence, caching, locks. Fallback allows the app to run without Redis if needed.
- **Invite System**: Phase 2 implements **direct add** (user must exist). The invited user gets a notification email.
- **Task Status Flow**: Free transitions allowed (todo ↔ in_progress ↔ review ↔ done) without strict enforcement.
- **Password Reset**: We store the SHA-256 hash of the reset token in the database, not the plaintext token.
- **Refresh Tokens**: Delivered via `httpOnly` cookie. Access tokens are still returned in JSON body and should be kept in memory on the frontend.
- **RBAC Roles**: admin (full access), editor (create/edit boards & elements), viewer (read only). Admin-only for: workspace update/delete, member management.
- **Last Admin Protection**: Cannot remove or demote the last admin of a workspace.
- **Element Versioning**: Every UPDATE bumps version by 1. WHERE clause includes `version = expectedVersion`. 0 rows = 409 conflict.
- **Batch Updates**: Only x, y positions. Uses `jsonb_to_recordset` for single-query bulk update.
- **Socket.IO Board Auth**: Per-event check via `withBoardAuth()` wrapper. Handles mid-session workspace removal.
- **Presence Delay**: 30s cleanup delay prevents flickering. Timer cancelled if user reconnects.
- **Lock Expiry**: TTL-based (30s). Natural expiry recovery: next SETNX attempt succeeds + broadcasts new lock.


## 📁 Files Currently/Recently Worked On
- `server/src/middleware/rbac.js` (NEW — RBAC middleware with requireRole and requireBoardRole)
- `server/src/modules/workspaces/workspaces.validation.js` (NEW — Joi schemas for workspaces)
- `server/src/modules/workspaces/workspaces.service.js` (NEW — Full CRUD + member management)
- `server/src/modules/workspaces/workspaces.controller.js` (NEW — 9 endpoint handlers)
- `server/src/modules/workspaces/workspaces.routes.js` (NEW — Routes with auth + RBAC)
- `server/src/modules/boards/boards.validation.js` (NEW — Joi schemas for boards)
- `server/src/modules/boards/boards.service.js` (NEW — Full CRUD with element/task counts)
- `server/src/modules/boards/boards.controller.js` (NEW — 5 endpoint handlers)
- `server/src/modules/boards/boards.routes.js` (NEW — Workspace-scoped + board-specific routers)
- `server/src/index.js` (MODIFIED — Added workspace and board route mounts)
- `SketchFlow.postman_collection.json` (UPDATED — Added all Phase 2 endpoints)

## ✅ What Has Been Completed (Phase 1)
1. **Project Skeleton**: Express setup, routing structure, error handling, structured logging (Winston).
2. **Database Schema**: Full PostgreSQL schema applied (10 tables with proper relations, UUIDs, soft deletes).
3. **Authentication System**:
   - Registration & Login with Bcrypt hashing.
   - JWT Access tokens (header) + Refresh tokens (httpOnly secure cookie).
   - Redis integration for refresh token storage, rotation, and revocation (on logout).
   - Password reset flow utilizing SHA-256 hashed tokens stored in DB.
4. **Security & Validation**:
   - General API rate limiting (100 req/15min).
   - Auth-specific rate limiting (5 req/min).
   - Password reset rate limiting (3 req/15min).
   - Joi validation schemas for all auth endpoints.
5. **DevOps / Infrastructure**:
   - Graceful server shutdown.
   - Graceful fallback for Redis (if Redis is down, server still works but revocation is disabled).

## ✅ What Has Been Completed (Phase 2)
1. **RBAC Middleware**:
   - `requireRole()` — checks user's role in workspace (resolves workspaceId from params/body).
   - `requireBoardRole()` — checks role via board→workspace lookup for `/api/boards/:id` routes.
2. **Workspaces Module**:
   - Full CRUD (create, list, get, update, delete).
   - Member management (invite by email, remove, update role, list members).
   - Transactional workspace creation (workspace + admin member in one transaction).
   - Last-admin protection on remove/demote operations.
   - Invite notification emails via existing email service.
3. **Boards Module**:
   - Full CRUD (create, list by workspace, get, update, delete).
   - Element/task counts in queries.
   - Two routers: workspace-scoped (`/api/workspaces/:workspaceId/boards`) and board-specific (`/api/boards/:id`).

## 🚀 Next Up (Phase 3 - Elements + Socket.IO)
- Create `elements.validation.js`, `elements.service.js`, `elements.controller.js`, `elements.routes.js`.
- Set up Socket.IO server with JWT auth middleware.
- Create socket handlers: boardHandler, presenceHandler, lockHandler, eventLog.
- Implement version-based conflict resolution for element updates.

## 📌 Important Context & Decisions
- **Database**: PostgreSQL (running locally or via Cloud/Neon). Connection via `DATABASE_URL`.
- **Redis**: Used for sessions, refresh tokens, presence, caching. Runs on `redis://localhost:6379`. Fallback allows the app to run without Redis if needed.
- **Invite System**: Phase 2 implements **direct add** (user must exist). The invited user gets a notification email.
- **Task Status Flow**: Free transitions allowed (todo ↔ in_progress ↔ review ↔ done) without strict enforcement.
- **Password Reset**: We store the SHA-256 hash of the reset token in the database, not the plaintext token.
- **Refresh Tokens**: Delivered via `httpOnly` cookie. Access tokens are still returned in JSON body and should be kept in memory on the frontend.
- **RBAC Roles**: admin (full access), editor (create/edit boards & elements), viewer (read only). Admin-only for: workspace update/delete, member management.
- **Last Admin Protection**: Cannot remove or demote the last admin of a workspace.
