# SketchFlow — Project Memory & Status

## 🟢 Current Status
**Phase 4 (Tasks + Sticky Note Conversion) is 100% COMPLETE.**
We are currently at the boundary between Phase 4 and Phase 5. The next step is to begin Phase 5 (Chat + Files + Activity Logging).

## 📁 Files Created/Modified in Phase 4
- `server/src/modules/tasks/tasks.validation.js` (NEW — Joi schemas for all task operations)
- `server/src/modules/tasks/tasks.service.js` (NEW — CRUD + convertFromSticky transaction + optimistic locking + filtering)
- `server/src/modules/tasks/tasks.controller.js` (NEW — 8 endpoint handlers with Socket.IO broadcasting)
- `server/src/modules/tasks/tasks.routes.js` (NEW — Board-scoped + task-specific routers)
- `server/src/middleware/rbac.js` (MODIFIED — Added requireTaskBoardRole)
- `server/src/sockets/taskHandler.js` (MODIFIED — Replaced stub with documented no-op; broadcasting from controllers)
- `server/src/index.js` (MODIFIED — Added task route mounts)

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

## 🚀 Next Up (Phase 5 — Chat + Files + Activity Logging)
- Create `chat.validation.js`, `chat.service.js`, `chat.controller.js`, `chat.routes.js`.
- Implement cursor-based pagination for chat messages.
- Implement threaded replies (parent_id).
- Complete `chatHandler.js` stub for real-time chat events.
- Create `files.validation.js`, `files.service.js`, `files.controller.js`, `files.routes.js`.
- Implement Cloudinary upload signature and file metadata registration.
- Create `activity.service.js`, `activity.controller.js`, `activity.routes.js`.
- Implement activity logging across task and file operations.

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

## 📁 Files Currently/Recently Worked On
- `server/src/modules/tasks/tasks.validation.js` (NEW — Joi schemas for all task operations)
- `server/src/modules/tasks/tasks.service.js` (NEW — CRUD + convertFromSticky + optimistic locking)
- `server/src/modules/tasks/tasks.controller.js` (NEW — 8 endpoint handlers + Socket.IO broadcasting)
- `server/src/modules/tasks/tasks.routes.js` (NEW — Board-scoped + task-specific routers)
- `server/src/middleware/rbac.js` (MODIFIED — Added requireTaskBoardRole)
- `server/src/sockets/taskHandler.js` (MODIFIED — Replaced stub)
- `server/src/index.js` (MODIFIED — Added task route mounts)
