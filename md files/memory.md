# SketchFlow — Project Memory & Status

## 🟢 Current Status
**Phase 2 (Workspaces & Boards CRUD) is 100% COMPLETE.**
We are currently at the boundary between Phase 2 and Phase 3. The next step is to begin Phase 3 (Elements + Socket.IO Real-Time Layer).

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
