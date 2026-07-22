# SketchFlow — Project Memory & Status

## 🟢 Current Status
**Phase 6 (Cron Jobs, Hardening, DevOps) is 100% COMPLETE.**
🎉 **ALL BACKEND PHASES (1 to 6) ARE FULLY IMPLEMENTED, HARDENED, AND VERIFIED.**

## 📁 Files Created/Modified in Phase 6
- `server/src/jobs/cron.js` (NEW — Configurable cron manager for activity log retention, expired invite cleanups, and 15-min heap memory audits)
- `server/src/utils/als.js` (NEW — AsyncLocalStorage utility for request-scoped state)
- `server/src/middleware/correlationId.js` (NEW — Correlation ID middleware propagating `x-correlation-id`)
- `server/Dockerfile` (NEW — Multi-stage Dockerfile optimized with `npm ci --omit=dev`)
- `server/.dockerignore` (NEW — Build context filtering file)
- `server/docker-compose.yml` (NEW — Development Docker Compose with mapped ports)
- `server/docker-compose.prod.yml` (NEW — Production Docker Compose with isolated private network)
- `server/src/utils/logger.js` (MODIFIED — Integrated AsyncLocalStorage correlation ID in Winston logs format)
- `server/src/middleware/errorHandler.js` (MODIFIED — Logged correlation IDs on warnings/errors)
- `server/src/config/env.js` (MODIFIED — Added `ACTIVITY_LOG_RETENTION_DAYS` & `MEMORY_WARNING_THRESHOLD_PERCENT`)
- `server/.env` & `server/.env.example` (MODIFIED — Updated with Phase 6 environment variables)
- `server/src/index.js` (MODIFIED — Mounted correlation ID middleware, Morgan production token, and cron initialization)

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

## ✅ What Has Been Completed (Phase 4)
1. **Tasks REST Module** (`tasks.validation.js`, `tasks.service.js`, `tasks.controller.js`, `tasks.routes.js`):
   - Full CRUD: create, list by board, get by ID, update, soft delete.
   - Version-based optimistic locking (same pattern as elements): `WHERE version = $expected` → 409 on conflict.
   - Dynamic filtering: list tasks by status, assignee_id, priority via query params.
   - Assignee name/avatar included via LEFT JOIN on users table.
2. **Sticky Note → Task Conversion** (`convertFromSticky`):
   - Atomic transaction using `getClient()`: verify element → create task → insert task_sources → commit.
   - Validates element is type `'sticky'`, belongs to the board, and is not deleted.
   - **Duplicate conversion check**: queries task_sources before creating — returns 409 if sticky already converted.
   - **Snapshot preservation**: captures sticky note text at conversion time in `task_sources.snapshot_text`.
3. **Assignee Workspace Membership Validation**:
   - `validateAssigneeWorkspaceMembership()` ensures assigned user belongs to the workspace.
   - Applied on create, convertFromSticky, update (when assignee_id changes), and assignTask.
4. **Source Snapshot in Task Detail**:
   - `getById()` includes `source_element_id` and `original_sticky_text` via LEFT JOIN on task_sources.
5. **RBAC Extension**:
   - `requireTaskBoardRole()` — task → board → workspace lookup chain (same pattern as `requireElementBoardRole`).
   - Applied to all task-specific routes (GET/PUT/PATCH/DELETE `/api/tasks/:taskId`).
6. **Socket.IO Task Broadcasting** (from REST controllers):
   - `task:created` — emitted on create and convertFromSticky (includes `convertedFrom` element ID).
   - `task:updated` — emitted on general update.
   - `task:status_changed` — emitted on status update.
   - `task:assigned` — emitted on assign/unassign.
   - `task:deleted` — emitted on soft delete.
   - All via `getIO().to(\`board:${boardId}\`).emit(...)` pattern.
7. **Status Transitions**:
   - Free-form (any status → any status). No workflow enforcement.
   - Soft warning logged when stages are skipped (e.g., todo → done).

## ✅ What Has Been Completed (Phase 5)
1. **Chat Module** (`chat.validation.js`, `chat.service.js`, `chat.controller.js`, `chat.routes.js`):
   - Real-time chat messaging with edit and soft-delete capabilities.
   - Composite cursor-based pagination `(created_at, id)` to prevent pagination issues when multiple items share timestamps.
   - Socket.IO broadcasting for `chat:new_message`, `chat:updated`, and `chat:deleted` to sync client UIs.
2. **Files Module** (`files.validation.js`, `files.service.js`, `files.controller.js`, `files.routes.js`):
   - Secure Cloudinary upload signature generation (`api_sign_request`).
   - File metadata registration on SQL (`files` table).
   - Deletion cleanup in Cloudinary + SQL, with Socket.IO `file:deleted` event synchronization.
3. **Activity Logging Module** (`activity.service.js`, `activity.controller.js`, `activity.routes.js`):
   - General-purpose auditing backend tracking board and workspace events.
   - Schema upgraded to make `board_id` nullable and include `workspace_id` to allow workspace-level audits.
   - Broad integration logging elements (`element_created`, `element_deleted`), files (`file_uploaded`, `file_deleted`), members (`member_joined`, `member_removed`), and tasks (`task_created`, `task_status_changed`, `task_assigned`).

## ✅ What Has Been Completed (Phase 6)
1. **Cron Manager** (`jobs/cron.js`):
   - Daily activity log retention purges based on `ACTIVITY_LOG_RETENTION_DAYS` (default: 90 days).
   - Hourly try-catch purges of expired invite tokens.
   - 15-minute V8 heap memory usage audits with configurable percentage threshold warnings (`MEMORY_WARNING_THRESHOLD_PERCENT`, default: 80%).
2. **Correlation ID & Tracing** (`als.js`, `correlationId.js`, `logger.js`, `errorHandler.js`):
   - `AsyncLocalStorage` request-context propagation for correlation IDs across async calls.
   - Automatic injection of `correlationId` into Winston logs and Morgan request logs.
3. **Containerization & Hardening** (`Dockerfile`, `.dockerignore`, `docker-compose.yml`, `docker-compose.prod.yml`):
   - Multi-stage Docker build utilizing `npm ci --omit=dev`.
   - Dedicated local dev Docker Compose (public ports) vs production Docker Compose (isolated private DB/Redis network).

## 🚀 Next Up (Frontend Integration & Deployment)
- Connect React/Vite frontend application to the API endpoints and Socket.IO real-time layer.
- Execute full system integration testing.

## 📌 Important Context & Decisions
- **Database**: PostgreSQL (running locally or via Cloud/Neon). Connection via `DATABASE_URL`.
- **Redis**: Used for sessions, refresh tokens, presence, caching, locks. Fallback allows the app to run without Redis if needed.
- **Invite System**: Phase 2 implements **direct add** (user must exist). The invited user gets a notification email.
- **Task Status Flow**: Free transitions allowed (todo ↔ in_progress ↔ review ↔ done) without strict enforcement. Soft warning logged on skips.
- **Password Reset**: We store the SHA-256 hash of the reset token in the database, not the plaintext token.
- **Refresh Tokens**: Delivered via `httpOnly` cookie. Access tokens are still returned in JSON body and should be kept in memory on the frontend.
- **RBAC Roles**: admin (full access), editor (create/edit boards & elements), viewer (read only). Admin-only for: workspace update/delete, member management.
- **Last Admin Protection**: Cannot remove or demote the last admin of a workspace.
- **Element Versioning**: Every UPDATE bumps version by 1. WHERE clause includes `version = expectedVersion`. 0 rows = 409 conflict.
- **Task Versioning**: Same pattern as elements — version required on update, status change, and assign.
- **Batch Updates**: Only x, y positions. Uses `jsonb_to_recordset` for single-query bulk update.
- **Socket.IO Board Auth**: Per-event check via `withBoardAuth()` wrapper. Handles mid-session workspace removal.
- **Task Broadcasting**: REST controllers emit via `getIO()`, not socket handlers. This is because tasks are always mutated via REST.
- **Duplicate Conversion Prevention**: task_sources table checked before converting a sticky note. Returns 409 if already converted.
- **Assignee Validation**: Assignee must be a workspace member (validated via boards → workspace_members join).
- **Presence Delay**: 30s cleanup delay prevents flickering. Timer cancelled if user reconnects.
- **Lock Expiry**: TTL-based (30s). Natural expiry recovery: next SETNX attempt succeeds + broadcasts new lock.
- **Composite Cursor Pagination**: Keyset pagination on `(created_at, id)` implemented for robust, skip-free message and activity paging.
- **Chat Soft Deletion**: Updating a message changes database values; deleting a message applies `deleted_at = NOW()` instead of physical row pruning.
- **Cloudinary Orchestration**: Direct-to-Cloudinary frontend uploads signed using `cloudinary.utils.api_sign_request` on the backend, tracking metadata in SQL.
- **Dynamic Activity Auditing**: `activity_logs` table altered to dynamically handle board-level (with `board_id`) and workspace-level (with `workspace_id`) events (such as member changes).
- **AsyncLocalStorage Correlation Tracing**: Incoming requests generate a UUID `x-correlation-id` which is transparently attached to every log statement via Winston custom formats without manual parameter passing.
- **Configurable Heap Auditing**: Memory monitor tracks `v8.getHeapStatistics().used_heap_size` against `heap_size_limit` and logs warnings when heap usage crosses the configured threshold.
- **Isolated Production Networking**: `docker-compose.prod.yml` keeps database and cache container ports unexposed to external networks.

## 📁 Files Currently/Recently Worked On
- `server/src/jobs/cron.js` (NEW — Cron jobs manager)
- `server/src/utils/als.js` & `src/middleware/correlationId.js` (NEW — Correlation ID infrastructure)
- `server/Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml`, `.dockerignore` (NEW — Docker deployment files)
- `server/src/utils/logger.js` & `src/middleware/errorHandler.js` (MODIFIED — Tracing updates)
- `server/src/config/env.js`, `.env`, `.env.example` (MODIFIED — Config updates)
- `server/src/index.js` (MODIFIED — Integrated Phase 6 middleware & cron runner)
