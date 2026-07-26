# SketchFlow — Project Memory & Status

## 🟢 Current Status
**Backend Phase 6 is 100% COMPLETE.** (All Backend Phases 1-6 fully implemented, hardened, and verified).
**Frontend Phase 1 is 100% COMPLETE.** (Setup, Tailwind config with design tokens, routing, Axios interceptors, Auth API & Zustand stores, auth pages, and shared components implemented, verified and building).
**Frontend Phase 2 is 100% COMPLETE.** (Dashboard page, Workspace page, Board cards, API layers, Zustand stores, create/invite/settings modals, member management, breadcrumb nav, and route wiring — all building cleanly).
**Frontend Phase 3 is 100% COMPLETE.** (Infinite canvas with React-Konva, elements API, canvas/presence Zustand stores, board socket with real-time element CRUD, cursor presence, element locking, 7 element types, toolbar, board header with presence avatars, right sidebar shell, connection status, context menu, canvas controls — all building cleanly).

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

## ✅ Frontend Phase 1: Project Setup + Auth + Routing (100% COMPLETE)
- **Vite Configuration**: `/api` proxy setup and path aliases (`@/`) configured in [vite.config.js](file:///d:/Desktop/Projects/SketchFlow/client/vite.config.js).
- **Design System & Tailwind**: Integrated tailwind configuration with full custom design tokens (colors, layout spacing, border radii, shadows, typography, motion) mapped from `design.md`. Set default theme to Dark mode.
- **Axios client**: Setup [api/axios.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/axios.js) with lazy accessor to break store circular dependency, request header authorization attachment, and response interceptor to handle silent token refreshing via `/api/auth/refresh` cookie with request queuing.
- **Zustand stores**:
  - `authStore.js`: Session restoration flow via httpOnly cookie, registration/login state, token storage in memory (XSS protection).
  - `uiStore.js`: Sidebar toggles, panel management, local storage theme switcher.
- **Shared Components**: Reusable `LoadingSpinner`, Portal-based `Modal` (click-outside & ESC close, size variants), `Avatar` (initials fallback with hash-based color), `ConfirmDialog`, `EmptyState`, and `ErrorBoundary`.
- **App Routing & Initializer**: [AppInitializer.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/shared/AppInitializer.jsx) coordinates initial session checks showing branded splash screen. `ProtectedRoute` blocks unauthenticated routes. Routes defined in [routes.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/app/routes.jsx).
- **Compilation**: Clean production build via `npm run build`.

## ✅ Frontend Phase 2: Dashboard + Workspaces + Boards (100% COMPLETE)
- **API Layer**: `workspaces.api.js` (CRUD + member management), `boards.api.js` (workspace-scoped CRUD), `users.api.js` (profile + email search).
- **Zustand Stores**: `workspaceStore.js` (workspaces + members CRUD with toast), `boardStore.js` (boards CRUD with toast).
- **Dashboard Page**: Top nav with SketchFlow logo, user avatar dropdown (theme toggle, logout), responsive workspace grid, `WorkspaceCard` (useNavigate, member/board counts, accent gradient hover), `CreateWorkspaceModal` (react-hook-form, name max 50, description max 200), empty state.
- **Workspace Page**: Breadcrumb nav (Dashboard > Workspace Name), board grid with `BoardCard` (useNavigate, element/task count placeholders, relative timestamps), collapsible member sidebar (desktop + mobile overlay), `CreateBoardModal`, admin-only settings gear.
- **Member Management**: `MemberList` with consistent `ROLE_CONFIG` color mapping (admin=indigo, editor=cyan, viewer=slate), `RoleBadge` pill component, admin-only role change dropdown + remove with `ConfirmDialog`, `InviteMemberModal` (email input designed for future debounced autocomplete, radio role selector with descriptions). Real-time UI updates for role changes, joins, and removals via global socket.
- **In-App Notifications**: `NotificationsDropdown` in dashboard top nav (bell icon + badge) powered by global Socket.IO connection. Displays pending invites, allows direct accept/decline without page refresh, and automatically updates workspace list upon acceptance.
- **Workspace Settings**: Admin-only modal with edit form (name/description) + collapsible danger zone requiring exact workspace name typing to confirm deletion.
- **Route Updates**: Replaced `DashboardPlaceholder` with `DashboardPage`, added `/workspaces/:workspaceId` route.
- **Compilation**: Clean production build (✓ built in 2.61s, 0 errors).

## ✅ Frontend Phase 3: Infinite Canvas + Real-Time Elements (100% COMPLETE)
- **API Layer**: `elements.api.js` (CRUD + batch position update).
- **Zustand Stores**: `canvasStore.js` (elements, selection, tools, zoom/pan, locks), `presenceStore.js` (online users + cursors with deterministic color assignment).
- **Board Socket**: Separate `socket.js` (autoConnect:false, exponential backoff reconnection, token reauthentication). Coexists with global socket from `socketManager.js`.
- **Socket Hooks**: `useBoardSocket.js` (board room join/leave + element CRUD listeners), `usePresence.js` (cursor tracking throttled at ~15 FPS in canvas coordinates, 30s heartbeat), `useLock.js` (element locking with 10s heartbeat, auto-release on unmount).
- **Canvas Engine**: React-Konva `Canvas.jsx` with infinite pan (stage drag), zoom-toward-cursor (mouse wheel), click-to-create elements, area selection box, viewport culling (only visible elements rendered), and inline text editing via HTML textarea overlay.
- **Element Components** (all `React.memo`): `RectangleElement`, `CircleElement`, `StickyNoteElement` (warm yellow with fold effect), `LineElement` (wide hit area), `TextElement`, `ImageElement` (async loading with native Image API + placeholder).
- **Canvas Overlays**: `SelectionBox` (blue dashed rect), `CursorOverlay` (arrow + name pill per user), `LockIndicator` (🔒 badge), `ElementContextMenu` (edit/duplicate/color/convert-to-task/delete with batch support).
- **Canvas Controls**: `CanvasControls.jsx` (glassmorphism zoom in/out + percentage + fit-to-screen).
- **Board Page Layout**: `BoardPage.jsx` (orchestrates socket + canvas + layout), `BoardHeader.jsx` (glassmorphism with back nav, board name, presence avatar stack with online dots, ConnectionStatus pill), `Toolbar.jsx` (7 tools with Lucide icons + color picker), `RightSidebar.jsx` (collapsible with Tasks/Chat/Files tabs — placeholder for Phase 4/5).
- **Connection Status**: `ConnectionStatus.jsx` (🟢/🟡/🔴 pill with click-to-reconnect), `useConnectionStatus.js` hook (toast on reconnect/disconnect).
- **Route Wiring**: Lazy-loaded `BoardPage` at `/boards/:boardId` with Suspense fallback.
- **Compilation**: Clean production build (✓ built in 9.99s, 0 errors, code-split BoardPage chunk at 345 KB / 105 KB gzipped).

## 🚀 Next Up (Frontend Implementation)
- Proceed with Frontend Phase 4: Task Management + Sticky Conversion.
  - Implement tasks API, task Zustand store, and task socket hook.
  - Build Kanban board with @dnd-kit drag-and-drop in right sidebar.
  - Add create/edit/detail task modals.
  - Implement sticky note → task conversion flow.
  - Add task filters (status, assignee, priority).

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
- **Dual Socket Architecture**: Global socket (`socketManager.js`) handles workspace-level events (invites, member updates). Board socket (`sockets/socket.js`) handles canvas operations (element CRUD, presence, locking). Both coexist independently, each with its own connection lifecycle.
- **Viewport Culling**: Canvas only renders elements whose bounding box intersects the visible viewport (computed from zoom + panOffset + container dimensions with 100px padding). Critical for performance with 100+ elements.
- **Canvas Coordinate Conversion**: Mouse coordinates are converted to canvas space (`(screenPos / zoom) - panOffset`) before sending cursor updates, ensuring cursors align correctly across different zoom/pan levels.
- **Image Tool (Phase 3)**: Uses `<input type="file">` + `URL.createObjectURL()` for local image preview. Object URLs will be replaced with Cloudinary URLs in Phase 5.
- **Lazy-Loaded Board Page**: `BoardPage` is code-split via `React.lazy()` + `Suspense` to keep the main bundle lean. Canvas chunk is ~345 KB (105 KB gzipped).
- **Isolated Production Networking**: `docker-compose.prod.yml` keeps database and cache container ports unexposed to external networks.

## 📁 Files Created/Modified in Frontend Phase 3
- `client/src/api/elements.api.js` (NEW — Elements REST API: CRUD + batch position update)
- `client/src/stores/canvasStore.js` (NEW — Canvas Zustand store: elements, selection, tools, zoom/pan, locks)
- `client/src/stores/presenceStore.js` (NEW — Presence Zustand store: online users + cursors with deterministic colors)
- `client/src/sockets/socket.js` (NEW — Board socket instance with autoConnect:false, reconnection, reauthentication)
- `client/src/sockets/useBoardSocket.js` (NEW — Board room join/leave + element CRUD socket listeners)
- `client/src/sockets/usePresence.js` (NEW — Cursor tracking at ~15 FPS + 30s heartbeat + presence events)
- `client/src/sockets/useLock.js` (NEW — Element locking with 10s heartbeat + auto-release)
- `client/src/features/canvas/Canvas.jsx` (NEW — React-Konva infinite canvas with viewport culling + inline editing)
- `client/src/features/canvas/CanvasControls.jsx` (NEW — Glassmorphism zoom controls + fit-to-screen)
- `client/src/features/canvas/components/RectangleElement.jsx` (NEW — Konva Rect with selection handles)
- `client/src/features/canvas/components/CircleElement.jsx` (NEW — Konva Circle with selection handles)
- `client/src/features/canvas/components/StickyNoteElement.jsx` (NEW — Sticky note with fold effect + editable text)
- `client/src/features/canvas/components/LineElement.jsx` (NEW — Konva Line with wide hit area)
- `client/src/features/canvas/components/TextElement.jsx` (NEW — Editable text with dashed selection border)
- `client/src/features/canvas/components/ImageElement.jsx` (NEW — Async image loading with placeholder)
- `client/src/features/canvas/components/SelectionBox.jsx` (NEW — Blue dashed selection rectangle)
- `client/src/features/canvas/components/CursorOverlay.jsx` (NEW — Other users' cursor arrows + name pills)
- `client/src/features/canvas/components/LockIndicator.jsx` (NEW — 🔒 badge with user name)
- `client/src/features/canvas/components/ElementContextMenu.jsx` (NEW — Right-click menu with color picker + batch)
- `client/src/features/board/BoardPage.jsx` (NEW — Board page orchestrating socket + canvas + layout)
- `client/src/features/board/components/BoardHeader.jsx` (NEW — Glassmorphism header with presence avatars)
- `client/src/features/board/components/Toolbar.jsx` (NEW — 7-tool vertical toolbar with color picker)
- `client/src/features/board/components/RightSidebar.jsx` (NEW — Collapsible sidebar with tab nav)
- `client/src/features/board/components/ConnectionStatus.jsx` (NEW — 🟢/🟡/🔴 connection pill)
- `client/src/hooks/useConnectionStatus.js` (NEW — Socket event → uiStore connection status sync)
- `client/src/app/routes.jsx` (MODIFIED — Added lazy-loaded /boards/:boardId route with Suspense)
