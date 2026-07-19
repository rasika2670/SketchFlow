# SketchFlow Frontend — Implementation Plan

## Overview

Build the complete React frontend for SketchFlow: a real-time visual collaboration platform with an infinite whiteboard (React-Konva), task management (Kanban board), real-time chat, file uploads, and workspace management — all connected to the Express.js + Socket.IO backend.

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **UI Library** | React 18+ | Component rendering |
| **Canvas** | React-Konva | Infinite whiteboard |
| **State Management** | Zustand | Global state (lightweight, no boilerplate) |
| **Routing** | React Router DOM v6 | Client-side routing |
| **Forms** | React Hook Form | Form handling + validation |
| **HTTP Client** | Axios | API calls with interceptors |
| **Real-Time** | socket.io-client@4.x | WebSocket communication |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable | Kanban task drag-and-drop with visual drop indicators |
| **Notifications** | react-hot-toast | Toast notifications |
| **Build Tool** | Vite | Fast dev server + HMR |
| **Styling** | CSS Modules or Vanilla CSS | Scoped styles |
| **Icons** | Lucide React | Modern icon set |
| **Date Handling** | date-fns | Lightweight date formatting |

---

## Project Structure

```
client/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                          # App entry point
│   ├── App.jsx                           # Root component + router
│   ├── app/
│   │   ├── routes.jsx                    # Route definitions
│   │   └── providers.jsx                 # Context providers wrapper
│   │
│   ├── config/
│   │   └── env.js                        # Environment variables
│   │
│   ├── api/
│   │   ├── axios.js                      # Axios instance + interceptors
│   │   ├── auth.api.js                   # Auth endpoints
│   │   ├── users.api.js                  # User endpoints
│   │   ├── workspaces.api.js             # Workspace endpoints
│   │   ├── boards.api.js                 # Board endpoints
│   │   ├── elements.api.js               # Element endpoints
│   │   ├── tasks.api.js                  # Task endpoints
│   │   ├── chat.api.js                   # Chat endpoints
│   │   ├── files.api.js                  # File endpoints
│   │   └── activity.api.js               # Activity endpoints
│   │
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.js       # Hook: centralized keyboard shortcuts (undo, redo, delete, etc.)
│   │   └── useConnectionStatus.js        # Hook: online/offline indicator + reconnect feedback
│   │
│   ├── sockets/
│   │   ├── socket.js                     # Socket.IO client instance + connection + reauthentication
│   │   ├── useBoardSocket.js             # Hook: board room join/leave + element events
│   │   ├── usePresence.js                # Hook: cursor tracking + user presence
│   │   ├── useLock.js                    # Hook: element locking
│   │   ├── useTaskSocket.js              # Hook: task real-time events
│   │   └── useChatSocket.js              # Hook: chat real-time events
│   │
│   ├── stores/
│   │   ├── authStore.js                  # Auth state (user, tokens, login/logout)
│   │   ├── workspaceStore.js             # Workspaces + members
│   │   ├── boardStore.js                 # Boards list
│   │   ├── canvasStore.js                # Elements, selection, tool, zoom/pan
│   │   ├── taskStore.js                  # Tasks + filters
│   │   ├── chatStore.js                  # Chat messages
│   │   ├── presenceStore.js              # Online users + cursors
│   │   └── uiStore.js                    # Sidebar state, modals, theme
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   └── components/
│   │   │       └── AuthLayout.jsx        # Shared auth page layout
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.jsx         # Workspace list + create
│   │   │   └── components/
│   │   │       ├── WorkspaceCard.jsx
│   │   │       └── CreateWorkspaceModal.jsx
│   │   │
│   │   ├── workspace/
│   │   │   ├── WorkspacePage.jsx          # Board list + members
│   │   │   └── components/
│   │   │       ├── BoardCard.jsx
│   │   │       ├── CreateBoardModal.jsx
│   │   │       ├── MemberList.jsx
│   │   │       ├── InviteMemberModal.jsx
│   │   │       └── WorkspaceSettings.jsx
│   │   │
│   │   ├── board/
│   │   │   ├── BoardPage.jsx              # Main board view (canvas + sidebars)
│   │   │   └── components/
│   │   │       ├── BoardHeader.jsx        # Board name, presence avatars, settings
│   │   │       ├── Toolbar.jsx            # Drawing tools sidebar
│   │   │       ├── RightSidebar.jsx       # Tasks / Chat / Files panel
│   │   │       └── ConnectionStatus.jsx   # Online/offline indicator + reconnect feedback
│   │   │
│   │   ├── canvas/
│   │   │   ├── Canvas.jsx                 # React-Konva Stage + Layer + viewport culling
│   │   │   ├── CanvasControls.jsx         # Zoom buttons, fit to screen
│   │   │   └── components/
│   │   │       ├── RectangleElement.jsx
│   │   │       ├── CircleElement.jsx
│   │   │       ├── StickyNoteElement.jsx   # Includes task badge/link after conversion
│   │   │       ├── LineElement.jsx
│   │   │       ├── TextElement.jsx
│   │   │       ├── ImageElement.jsx        # Konva.Image from Cloudinary URLs
│   │   │       ├── SelectionBox.jsx       # Multi-select rectangle
│   │   │       ├── CursorOverlay.jsx      # Other users' cursors
│   │   │       ├── LockIndicator.jsx      # Lock badge on elements
│   │   │       └── ElementContextMenu.jsx # Right-click menu (edit, convert, delete)
│   │   │
│   │   ├── tasks/
│   │   │   ├── TaskPanel.jsx              # Kanban board in sidebar
│   │   │   └── components/
│   │   │       ├── KanbanColumn.jsx       # Todo, In Progress, Review, Done
│   │   │       ├── TaskCard.jsx           # Draggable task card
│   │   │       ├── CreateTaskModal.jsx
│   │   │       ├── TaskDetailModal.jsx    # Full task view + edit
│   │   │       ├── ConvertStickyModal.jsx # Sticky → Task conversion dialog
│   │   │       └── TaskFilters.jsx        # Status, assignee, priority filters
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatPanel.jsx              # Chat sidebar panel
│   │   │   └── components/
│   │   │       ├── MessageList.jsx        # Scrollable message list
│   │   │       ├── MessageBubble.jsx      # Single message
│   │   │       ├── MessageInput.jsx       # Input + send button
│   │   │       └── ThreadView.jsx         # Threaded replies
│   │   │
│   │   ├── files/
│   │   │   ├── FilesPanel.jsx             # Files sidebar panel
│   │   │   └── components/
│   │   │       ├── FileCard.jsx
│   │   │       ├── FileUploadButton.jsx   # Cloudinary upload widget trigger + progress
│   │   │       ├── UploadProgress.jsx     # Upload progress bar per file
│   │   │       └── FilePreview.jsx
│   │   │
│   │   └── shared/
│   │       ├── ProtectedRoute.jsx         # Auth guard
│   │       ├── AppInitializer.jsx         # Session restore before rendering protected routes
│   │       ├── LoadingSpinner.jsx
│   │       ├── Avatar.jsx                 # User avatar with fallback
│   │       ├── Modal.jsx                  # Reusable modal component
│   │       ├── ConfirmDialog.jsx          # Delete confirmations
│   │       ├── EmptyState.jsx             # Empty list placeholder
│   │       └── ErrorBoundary.jsx
│   │
│   └── styles/
│       ├── index.css                      # Global styles + CSS variables
│       ├── reset.css                      # CSS reset
│       └── variables.css                  # Design tokens (colors, spacing, etc.)
│
├── index.html
├── vite.config.js
├── package.json
└── .env
```

---

## Proposed Changes — Phased Build

### Frontend Phase 1: Project Setup + Auth + Routing (3-4 days)

Establish the entire client skeleton, design system, auth flows, and protected routing.

---

#### [NEW] Project Initialization
- Initialize Vite React project: `npx -y create-vite@latest ./`
- Install dependencies: `react-router-dom`, `zustand`, `axios`, `socket.io-client@4`, `react-hook-form`, `react-hot-toast`, `lucide-react`, `date-fns`, `react-konva`, `konva`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lodash.throttle`
- Configure Vite: proxy `/api` to `http://localhost:5000`, set up path aliases

#### [NEW] Design System (`styles/`)
- `variables.css` — Design tokens:
  - Color palette (dark mode primary): slate/zinc backgrounds, indigo/violet accents
  - Light mode palette: token overrides via `[data-theme="light"]` selector (dark is default)
  - Typography scale: Inter font from Google Fonts
  - Spacing scale: 4px base unit
  - Border radius, shadow levels, z-index layers
  - Transition durations
- `reset.css` — Modern CSS reset (box-sizing, margin, font inheritance)
- `index.css` — Global styles: body defaults, scrollbar styling, focus states, utility classes

#### [NEW] Config (`config/env.js`)
- Export typed env vars: `VITE_API_URL`, `VITE_WS_URL`, `VITE_CLOUDINARY_CLOUD_NAME`

#### [NEW] Axios Instance (`api/axios.js`)
- Create Axios instance with `baseURL = VITE_API_URL`
- **Request interceptor**: attach `Authorization: Bearer <accessToken>` from auth store
- **Response interceptor**: on 401 → attempt silent token refresh via `/api/auth/refresh` → retry original request. If refresh fails → logout + redirect to `/login`
- Handle `withCredentials: true` for refresh token cookie

#### [NEW] Auth API (`api/auth.api.js`)
- `register(name, email, password)`, `login(email, password)`, `refresh()`, `logout()`, `forgotPassword(email)`, `resetPassword(token, password)`, `getMe()`

#### [NEW] Auth Store (`stores/authStore.js`)
- Zustand store: `{ user, accessToken, isAuthenticated, isLoading, isInitialized }`
- Actions: `login()`, `register()`, `logout()`, `refreshToken()`, `loadUser()`, `initialize()`
- Persist `accessToken` in memory (NOT localStorage per security requirement)
- On app load: call `refresh()` to restore session from httpOnly cookie
- `isInitialized` flag gates rendering of protected routes until session restore completes

#### [NEW] Auth Pages (`features/auth/`)
- `LoginPage.jsx` — Email + password form, link to register/forgot password
- `RegisterPage.jsx` — Name + email + password form, password strength indicator
- `ForgotPasswordPage.jsx` — Email input, sends reset link
- `ResetPasswordPage.jsx` — Token from URL param + new password
- `AuthLayout.jsx` — Centered card layout, SketchFlow branding

#### [NEW] Routing (`app/routes.jsx`)
- Public routes: `/login`, `/register`, `/forgot-password`, `/reset-password/:token`
- Protected routes (require auth): `/`, `/workspaces/:workspaceId`, `/boards/:boardId`
- `ProtectedRoute.jsx` — Redirects to `/login` if not authenticated

#### [NEW] Shared Components
- `LoadingSpinner.jsx` — Animated spinner
- `Modal.jsx` — Portal-based modal with overlay, close on escape/click-outside
- `Avatar.jsx` — User avatar with image or initials fallback
- `ErrorBoundary.jsx` — Catches React render errors
- `AppInitializer.jsx` — Wraps the app; calls `authStore.initialize()` on mount. **Displays a branded SketchFlow loading screen** during authentication/session initialization until `isInitialized = true`. Prevents flash of login page for authenticated users.

#### [NEW] App Entry (`App.jsx`, `main.jsx`)
- Mount providers: `BrowserRouter`, `Toaster` (react-hot-toast)
- Wrap routes with `<AppInitializer>` — restores session via `POST /api/auth/refresh` before rendering any protected routes. Renders a branded loading screen until initialization completes.

---

### Frontend Phase 2: Dashboard + Workspaces + Boards (3-4 days)

Build the workspace management UI — the first screens users see after login.

---

#### [NEW] Workspace API (`api/workspaces.api.js`)
- CRUD: `create()`, `list()`, `getById()`, `update()`, `delete()`
- Members: `inviteMember()`, `removeMember()`, `updateRole()`, `listMembers()`

#### [NEW] Board API (`api/boards.api.js`)
- CRUD: `create()`, `listByWorkspace()`, `getById()`, `update()`, `delete()`

#### [NEW] Workspace Store (`stores/workspaceStore.js`)
- `{ workspaces, currentWorkspace, members }`
- Actions: `fetchWorkspaces()`, `createWorkspace()`, `fetchMembers()`, `inviteMember()`

#### [NEW] Board Store (`stores/boardStore.js`)
- `{ boards, currentBoard }`
- Actions: `fetchBoards()`, `createBoard()`, `deleteBoard()`

#### [NEW] Dashboard Page (`features/dashboard/`)
- `DashboardPage.jsx` — Grid of workspace cards + "Create Workspace" button
- `WorkspaceCard.jsx` — Name, description, member count, board count
- `CreateWorkspaceModal.jsx` — React Hook Form: name + description

#### [NEW] Workspace Page (`features/workspace/`)
- `WorkspacePage.jsx` — Board grid + members sidebar
- `BoardCard.jsx` — Board name, element/task counts, last activity
- `CreateBoardModal.jsx` — Board name input
- `MemberList.jsx` — Members with role badges, admin actions (change role, remove)
- `InviteMemberModal.jsx` — Email search + role selector
- `WorkspaceSettings.jsx` — Edit name/description, delete workspace (admin only)

#### [NEW] Users API (`api/users.api.js`)
- `getProfile()`, `updateProfile()`, `searchByEmail()`

#### [NEW] UI Store (`stores/uiStore.js`)
- `{ sidebarOpen, activePanel, theme, modals, connectionStatus }`
- Actions: `toggleSidebar()`, `setActivePanel()`, `toggleTheme()`, `openModal()`, `closeModal()`, `setConnectionStatus()`
- Theme: `'dark'` (default) or `'light'`. Persisted in localStorage. Sets `data-theme` attribute on `<html>` to toggle CSS variable overrides.
- Connection status: `'connected'`, `'connecting'`, `'disconnected'` — driven by socket events

---

### Frontend Phase 3: Infinite Canvas + Real-Time Elements (5-7 days)

The core whiteboard experience — this is the most complex phase.

---

#### [NEW] Elements API (`api/elements.api.js`)
- `create()`, `listByBoard()`, `update()`, `batchUpdate()`, `delete()`

#### [NEW] Canvas Store (`stores/canvasStore.js`)
- `{ elements, selectedIds, tool, zoom, panOffset, isDrawing }`
- Actions: `addElement()`, `updateElement()`, `deleteElement()`, `setTool()`, `setZoom()`, `selectElement()`, `clearSelection()`
- Optimistic updates: apply change immediately, revert on server conflict

#### [NEW] Socket Client (`sockets/socket.js`)
- Create/export Socket.IO client instance
- Connect with `auth: { token: accessToken }`
- Auto-reconnect with exponential backoff
- **Socket reauthentication**: on `connect_error` with auth failure message → call `authStore.refreshToken()` to get a new access token → update `socket.auth.token` → `socket.connect()` to retry. Prevents disconnection when access tokens expire during an active session.
- **Connection status events**: emit `'connect'`, `'disconnect'`, `'reconnect_attempt'` to uiStore for the connection indicator
- `connectSocket()`, `disconnectSocket()`, `getSocket()`

#### [NEW] Board Socket Hook (`sockets/useBoardSocket.js`)
- On mount: emit `board:join`, listen for `element:created`, `element:updated`, `element:moved`, `element:deleted`, `element:conflict`
- On unmount: emit `board:leave`
- Sync received events to canvas store

#### [NEW] Presence Hook (`sockets/usePresence.js`)
- Track mouse position, throttled `cursor:move` emit (~15 FPS via `lodash.throttle`)
- Listen for `cursor:updated`, `user:joined`, `user:left`
- Store in `presenceStore`: `{ onlineUsers, cursors }`

#### [NEW] Lock Hook (`sockets/useLock.js`)
- `requestLock(elementId)` → emit `element:lock`
- Listen for `element:locked`, `element:unlocked`, `lock:lost`
- Heartbeat every 10s while lock held
- Release on blur/deselect

#### [NEW] Canvas Component (`features/canvas/`)
- `Canvas.jsx` — React-Konva `Stage` + `Layer`:
  - Infinite pan (drag stage) + zoom (mouse wheel)
  - Click-to-create elements based on active tool
  - Drag-to-move elements (optimistic + socket emit)
  - **Multi-select**: Click to select, Shift+click to toggle selection, Ctrl+click to add to selection, drag rectangle for area select
  - **Batch actions on multi-select**: move all selected, delete all selected, change color of all selected
  - Double-click to edit text/sticky
  - **Viewport culling**: only render elements whose bounding box intersects the visible viewport (based on zoom + panOffset). Elements outside the viewport are excluded from the Konva Layer. Recomputed on pan/zoom change. Dramatically improves performance on large boards with 100+ elements.
- Element components: `RectangleElement`, `CircleElement`, `StickyNoteElement`, `LineElement`, `TextElement`, `ImageElement`
  - Each renders a Konva shape with drag, resize, selection handles
  - All wrapped in `React.memo` with shallow prop comparison to prevent unnecessary re-renders
  - Lock indicator overlay when locked by another user
- `StickyNoteElement.jsx` — **Sticky-to-task badge**: after a sticky is converted to a task, display a small badge/link icon on the sticky (sourced from task_sources). Clicking the badge opens `TaskDetailModal` for the linked task.
- `ImageElement.jsx` — Renders using `Konva.Image`. Loads image from Cloudinary URL stored in the element's `text` field (used as `src`). Uses `useImage` hook from `react-konva-utils` for async loading with a placeholder while the image loads.
- `CursorOverlay.jsx` — Render other users' cursor positions with name labels
- `CanvasControls.jsx` — Zoom in/out buttons, zoom percentage, fit-to-screen
- `SelectionBox.jsx` — Rectangle drawn during multi-select drag. On release, selects all elements within the box bounds.
- `ElementContextMenu.jsx` — Right-click: Edit, Convert to Task (sticky only), Delete, Change Color. Shows batch actions when multiple elements are selected.

#### [NEW] Toolbar (`features/board/components/Toolbar.jsx`)
- Tools: Select (pointer), Rectangle, Circle, Sticky Note, Line, Text, Image
- Active tool indicator
- Color picker for new elements

#### [NEW] Board Page (`features/board/BoardPage.jsx`)
- Layout: Toolbar (left) + Canvas (center) + Right Sidebar (tasks/chat/files)
- `BoardHeader.jsx` — Board name, online user avatars, back button, board settings
- `RightSidebar.jsx` — Tab navigation: Tasks | Chat | Files
- `ConnectionStatus.jsx` — Small pill indicator in the header. Shows: 🟢 Connected, 🟡 Reconnecting..., 🔴 Disconnected. Uses `uiStore.connectionStatus`. On click: manual reconnect option (alongside automatic reconnection).

#### [NEW] Connection Status Hook (`hooks/useConnectionStatus.js`)
- Listens to socket `connect`, `disconnect`, `reconnect_attempt`, `reconnect` events
- Updates `uiStore.connectionStatus`
- Shows toast notifications for connection, reconnection, and disconnect events

#### [NEW] Presence Store (`stores/presenceStore.js`)
- `{ onlineUsers: Map<userId, userData>, cursors: Map<userId, {x, y}> }`

---

### Frontend Phase 4: Task Management + Sticky Conversion (3-4 days)

Kanban board, task CRUD, and the signature sticky → task conversion flow.

---

#### [NEW] Tasks API (`api/tasks.api.js`)
- `create()`, `convertFromSticky()`, `listByBoard()`, `getById()`, `update()`, `updateStatus()`, `assignTask()`, `delete()`

#### [NEW] Task Store (`stores/taskStore.js`)
- `{ tasks, filters: { status, assignee_id, priority }, selectedTask }`
- Actions: `fetchTasks()`, `createTask()`, `updateTask()`, `moveTask()`, `deleteTask()`, `setFilters()`
- Derived: `tasksByStatus` — groups tasks into columns { todo: [], in_progress: [], review: [], done: [] }

#### [NEW] Task Socket Hook (`sockets/useTaskSocket.js`)
- Listen for: `task:created`, `task:updated`, `task:status_changed`, `task:assigned`, `task:deleted`
- Sync to task store in real-time

#### [NEW] Task Panel (`features/tasks/TaskPanel.jsx`)
- Kanban board with 4 columns: Todo, In Progress, Review, Done
- **Drag-and-drop via @dnd-kit**: `DndContext` wraps the kanban board. Each `KanbanColumn` is a `useDroppable` zone. Each `TaskCard` is a `useDraggable` item. Visual drop indicators (highlighted column border, insertion line) show where the card will land. On drop: call `PATCH /api/tasks/:id/status` with new status + version. **Uses optimistic updates** with rollback on drag-and-drop conflict/error.
- "Create Task" button
- Filter bar (status, assignee, priority)

#### [NEW] Task Components (`features/tasks/components/`)
- `KanbanColumn.jsx` — Column header (title + count) + scrollable task list. `useDroppable` from @dnd-kit. Highlights with accent border when a card is dragged over.
- `TaskCard.jsx` — Title, priority badge, assignee avatar, due date indicator (overdue = red). `useDraggable` from @dnd-kit. Shows drag handle and ghost preview.
- `CreateTaskModal.jsx` — React Hook Form: title, description, status, priority, assignee dropdown, due date picker
- `TaskDetailModal.jsx` — Full task view: all fields editable, source sticky reference (if converted — shows `original_sticky_text` and link to source element on canvas), version tracking
- `ConvertStickyModal.jsx` — Triggered from canvas context menu. Pre-fills title from sticky text. Fields: title, description, priority, assignee, due date. On success: sticky gets a badge overlay linking back to the created task.
- `TaskFilters.jsx` — Dropdown filters: status, assignee (from workspace members), priority

---

### Frontend Phase 5: Chat + Files + Activity Feed (3-4 days)

Real-time board chat, file uploads via Cloudinary, and activity feed.

---

#### [NEW] Chat API (`api/chat.api.js`)
- `sendMessage()`, `getMessages()`, `getThreadReplies()`

#### [NEW] Chat Store (`stores/chatStore.js`)
- `{ messages, hasMore, isLoading }`
- Actions: `fetchMessages()`, `sendMessage()`, `addMessage()`
- Cursor-based pagination (scroll up to load more)

#### [NEW] Chat Socket Hook (`sockets/useChatSocket.js`)
- Listen for `chat:new_message` → add to store
- Emit `chat:send` for real-time message delivery

#### [NEW] Chat Panel (`features/chat/`)
- `ChatPanel.jsx` — Message list + input
- `MessageList.jsx` — Reverse-chronological, infinite scroll up
- `MessageBubble.jsx` — Avatar, name, timestamp, message text, reply button
- `MessageInput.jsx` — Text input + send button, Enter to send
- `ThreadView.jsx` — Threaded replies view

#### [NEW] Files API (`api/files.api.js`)
- `getUploadSignature()`, `registerUpload()`, `listByBoard()`, `deleteFile()`

#### [NEW] Files Panel (`features/files/`)
- `FilesPanel.jsx` — File list + upload button
- `FileCard.jsx` — Name, type icon, size, uploader, download link
- `FileUploadButton.jsx` — Triggers Cloudinary Upload Widget, registers metadata on server. **Upload progress**: subscribes to the Cloudinary widget's `uploadprogress` event to track byte progress per file. Shows `UploadProgress` component inline in the panel during upload.
- `UploadProgress.jsx` — Progress bar per file: filename, percentage bar, cancel button. Shown in the files panel during active uploads.
- `FilePreview.jsx` — Image preview modal

#### [NEW] Activity API (`api/activity.api.js`)
- `getByBoard()`

---

### Frontend Phase 6: Polish + Production (2-3 days)

Final touches, responsiveness, keyboard shortcuts, and production build.

---

#### Polish & UX
- **Keyboard shortcuts**: Centralized via `useKeyboardShortcuts` hook for common actions (Ctrl+Z/Y undo/redo, Delete key, Escape to deselect, 1-7 for tools, Ctrl+A select all)
- **Multi-select batch shortcuts**: Delete all selected, Ctrl+D duplicate selected
- **Responsive layout**: Collapsible sidebars on smaller screens
- **Theme toggle**: Dark mode (default) + light mode. Toggle in board header and user profile. Uses `data-theme` attribute on `<html>` with CSS variable overrides. Preference persisted in localStorage.
- **Loading states**: Skeleton screens for dashboard, workspace, board
- **Error handling**: Toast notifications for API errors, conflict resolution UI (version mismatch dialog)
- **Tooltips**: Tool descriptions, button hints
- **Onboarding**: First-time user hints/tooltips
- **Connection status**: Persistent indicator in board header — green/yellow/red pill with text

#### Performance
- `React.memo` on all canvas element components (prevent re-render on unrelated changes)
- **Viewport culling**: only elements visible in the current viewport are rendered on the Konva layer (computed from zoom + panOffset + element bounding boxes)
- Throttle cursor/move events (~15 FPS via `lodash.throttle`)
- Virtualize large task lists if >100 tasks
- Lazy load board page components (React.lazy + Suspense)
- Debounce text editing (300ms before save)
- `useImage` hook for async Cloudinary image loading (prevents canvas blocking)

#### Production Build
- Vite production build: `npm run build`
- Environment-specific configs (.env.production)
- SEO meta tags for public pages
- 404 page

---

## Data Flow Patterns

### Optimistic Update (Element Move)
```
User drags element → canvasStore.updateElement(optimistic)
                   → socket.emit('element:moved', { boardId, elementId, x, y, version })
                   → Server validates version
                   → Success: other users receive 'element:moved' → update their canvasStore
                   → Conflict: sender receives 'element:conflict' → revert to server state
```

### REST + Socket (Task Status Change)
```
User drags task card → PATCH /api/tasks/:id/status
                     → Server updates DB + emits 'task:status_changed'
                     → All users in board room receive event → update taskStore
```

### Auth Token Flow
```
App Launch → AppInitializer calls authStore.initialize()
          → POST /api/auth/refresh (cookie sent automatically)
          → Success: accessToken saved, isInitialized=true, render app
          → Failure: isInitialized=true, isAuthenticated=false, render login

Login → accessToken in Zustand (memory) + refreshToken in httpOnly cookie
     → Axios interceptor attaches Bearer token
     → On 401 → POST /api/auth/refresh (cookie sent automatically)
     → New accessToken saved → original request retried
     → If refresh fails → logout + redirect to /login

Socket Reauthentication:
     → Socket connect_error with auth message
     → Call authStore.refreshToken() → get new accessToken
     → Update socket.auth.token → socket.connect()
     → If refresh fails → disconnect socket + redirect to /login
```

---

## Key Design Decisions

> [!NOTE]
> **State management**: Zustand over Redux/Context. Minimal boilerplate, great devtools, no providers needed. One store per feature domain.

> [!NOTE]
> **Canvas library**: React-Konva wraps Konva.js for declarative canvas rendering inside React. Each element is a React component that renders a Konva shape.

> [!NOTE]
> **Socket architecture**: Custom hooks per domain (useBoardSocket, usePresence, useLock, useTaskSocket, useChatSocket). Each hook manages its own event listeners and syncs to the corresponding Zustand store.

> [!NOTE]
> **Auth tokens**: Access token kept in memory (Zustand, not persisted). Refresh token in httpOnly cookie. This prevents XSS token theft while maintaining session persistence.

> [!NOTE]
> **Styling approach**: Vanilla CSS with CSS custom properties (design tokens). CSS Modules for component-level scoping. Dark-first design with optional light mode via `data-theme` attribute.

> [!NOTE]
> **File uploads**: Direct Cloudinary upload from browser (Cloudinary Upload Widget). Server only stores metadata — no file data passes through the backend. Upload progress tracked via widget's `uploadprogress` event.

> [!NOTE]
> **Drag & drop**: @dnd-kit (not react-beautiful-dnd) for Kanban task cards. Provides smooth animations, visual drop indicators, keyboard accessibility, and framework-agnostic architecture.

> [!NOTE]
> **Canvas performance**: Viewport culling ensures only visible elements are rendered. Combined with React.memo on element components, this supports boards with hundreds of elements without frame drops.

> [!NOTE]
> **Socket resilience**: Automatic reauthentication on token expiry. Connection status indicator gives users real-time feedback on their connection state.

> [!NOTE]
> **Image elements**: Cloudinary URLs stored in the element's data. Rendered via `Konva.Image` + `useImage` hook for async loading with placeholder.

---

## Estimation

| Phase | Duration | Focus |
|---|---|---|
| **FE Phase 1** | 3-4 days | Project setup, auth, routing, design system |
| **FE Phase 2** | 3-4 days | Dashboard, workspaces, boards |
| **FE Phase 3** | 5-7 days | Infinite canvas, real-time elements, presence, locking |
| **FE Phase 4** | 3-4 days | Kanban tasks, sticky conversion, filters |
| **FE Phase 5** | 3-4 days | Chat, files, activity feed |
| **FE Phase 6** | 2-3 days | Polish, keyboard shortcuts, production build |
| **Total** | **19-26 days** | **Fully functional frontend** |
