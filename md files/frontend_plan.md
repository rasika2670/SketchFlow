# SketchFlow Frontend — Implementation Plan

## Overview

Build the complete React frontend for SketchFlow: a real-time visual collaboration platform with an infinite whiteboard (React-Konva), task management (Kanban board), real-time chat, file uploads, and workspace management — all connected to the Express.js + Socket.IO backend. Styled with **Tailwind CSS** using the design system (`design.md`) and centralized design tokens.

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **UI Library** | React 19 | Component rendering |
| **Styling** | Tailwind CSS 3.x | Utility-first styling with centralized design tokens |
| **Canvas** | React-Konva | Infinite whiteboard (Konva.js React wrapper) |
| **State Management** | Zustand | Global state (one store per domain, no providers) |
| **Routing** | React Router DOM v7 | Client-side routing with nested layouts |
| **Forms** | React Hook Form | Form handling + validation |
| **HTTP Client** | Axios | API calls with request/response interceptors |
| **Real-Time** | socket.io-client@4.x | WebSocket communication |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable | Kanban task drag-and-drop with visual drop indicators |
| **Notifications** | react-hot-toast | Toast notifications |
| **Build Tool** | Vite 8 | Fast dev server + HMR |
| **Icons** | Lucide React | Modern outlined icon set |
| **Date Handling** | date-fns | Lightweight date formatting |

---

## Tailwind Design Tokens (from `design.md`)

All design decisions from `design.md` are codified into `tailwind.config.js` as a single source of truth.

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary — Indigo (#6E56CF)
        primary: {
          50:  '#F4F0FF',
          100: '#E8E0FA',
          200: '#D1C4F0',
          300: '#B8A6E8',
          400: '#9E84DF',
          500: '#6E56CF', // design.md primary
          600: '#5C44B8',
          700: '#4A359A',
          800: '#38277C',
          900: '#261A5E',
        },
        // Surfaces — Neutral Slate (no pure black/gray)
        slate: {
          50:  '#F4F4FC',
          100: '#D4D4E8',
          200: '#B0B0C8',
          300: '#81819A',
          400: '#5C5C72',
          500: '#3F3F50',
          600: '#2E2E3C',
          700: '#242430',
          800: '#1A1A24',
          900: '#111118',
          950: '#0A0A0F',
        },
        // Semantic
        accent:  '#38BDF8', // design.md accent — Cyan
        success: '#34D399', // Emerald
        warning: '#FBBF24', // Amber
        error:   '#FB7185', // Rose
      },
      // Named surface colors for readability
      backgroundColor: {
        canvas:  '#0A0A0F', // slate-950 — deepest background
        deep:    '#111118', // slate-900 — page backgrounds
        raised:  '#1A1A24', // slate-800 — cards, panels
        overlay: 'rgba(26, 26, 36, 0.8)', // modal backdrop
      },
      borderColor: {
        default: '#242430', // slate-700
        hover:   '#3F3F50', // slate-500
        active:  '#6E56CF', // primary-500
      },
      textColor: {
        primary:   '#F4F4FC', // slate-50
        secondary: '#81819A', // slate-300
        muted:     '#3F3F50', // slate-500
      },
      // Spacing — 4px base system (design.md)
      spacing: {
        'sf-1':  '4px',
        'sf-2':  '8px',
        'sf-3':  '12px',
        'sf-4':  '16px',
        'sf-5':  '20px',
        'sf-6':  '24px',
        'sf-8':  '32px',
        'sf-10': '40px',
        'sf-12': '48px',
        'sf-16': '64px',
      },
      // Border Radius (design.md)
      borderRadius: {
        'sf-sm':   '4px',  // Buttons
        'sf-md':   '8px',  // Cards
        'sf-lg':   '12px', // Panels
        'sf-pill': '9999px', // Pills
      },
      // Shadows — soft, elevation-based (design.md)
      boxShadow: {
        'sf-raised':   '0 1px 2px rgba(0,0,10,0.4)',
        'sf-overlay':  '0 4px 12px rgba(0,0,10,0.5)',
        'sf-floating': '0 8px 24px rgba(0,0,10,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
        'sf-drag':     '0 16px 48px rgba(0,0,10,0.8)',
      },
      // Typography (design.md)
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'sf-xs':   ['12px', { lineHeight: '16px' }],
        'sf-sm':   ['13px', { lineHeight: '20px' }],
        'sf-base': ['14px', { lineHeight: '22px' }], // design.md preferred body
        'sf-lg':   ['16px', { lineHeight: '24px' }],
        'sf-xl':   ['20px', { lineHeight: '28px' }],
        'sf-2xl':  ['24px', { lineHeight: '32px' }],
        'sf-3xl':  ['30px', { lineHeight: '36px' }],
      },
      // Motion — quick and subtle (design.md)
      transitionDuration: {
        'sf-fast':   '120ms', // Hover states
        'sf-normal': '200ms', // Layout changes
        'sf-slow':   '300ms', // Complex animations
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 200ms cubic-bezier(0, 0, 0.2, 1)',
        'slide-up':       'slide-up 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slide-in-right 200ms cubic-bezier(0, 0, 0.2, 1)',
        'spin-slow':      'spin-slow 1.5s linear infinite',
      },
    },
  },
  plugins: [],
};
```

---

## Project Structure

```
d:\Desktop\Projects\SketchFlow\
└── client/
    ├── public/
    │   └── favicon.svg
    ├── src/
    │   ├── main.jsx                          # App entry point
    │   ├── App.jsx                           # Root component + router + providers
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
    │   │   ├── useKeyboardShortcuts.js       # Centralized keyboard shortcuts
    │   │   └── useConnectionStatus.js        # Online/offline indicator
    │   │
    │   ├── sockets/
    │   │   ├── socket.js                     # Socket.IO client instance + reauthentication
    │   │   ├── useBoardSocket.js             # Board room join/leave + element events
    │   │   ├── usePresence.js                # Cursor tracking + user presence
    │   │   ├── useLock.js                    # Element locking
    │   │   ├── useTaskSocket.js              # Task real-time events
    │   │   └── useChatSocket.js              # Chat real-time events
    │   │
    │   ├── stores/
    │   │   ├── authStore.js                  # Auth state (user, tokens, login/logout)
    │   │   ├── workspaceStore.js             # Workspaces + members
    │   │   ├── boardStore.js                 # Boards list
    │   │   ├── canvasStore.js                # Elements, selection, tool, zoom/pan
    │   │   ├── taskStore.js                  # Tasks + filters
    │   │   ├── chatStore.js                  # Chat messages
    │   │   ├── presenceStore.js              # Online users + cursors
    │   │   └── uiStore.js                    # Sidebar state, modals, theme, connection
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
    │   │   │   ├── BoardPage.jsx             # Main board view (canvas + sidebars)
    │   │   │   └── components/
    │   │   │       ├── BoardHeader.jsx        # Board name, presence avatars, settings
    │   │   │       ├── Toolbar.jsx            # Drawing tools sidebar
    │   │   │       ├── RightSidebar.jsx       # Tasks / Chat / Files panel
    │   │   │       └── ConnectionStatus.jsx   # Online/offline indicator
    │   │   │
    │   │   ├── canvas/
    │   │   │   ├── Canvas.jsx                # React-Konva Stage + Layer + viewport culling
    │   │   │   ├── CanvasControls.jsx        # Zoom buttons, fit to screen
    │   │   │   └── components/
    │   │   │       ├── RectangleElement.jsx
    │   │   │       ├── CircleElement.jsx
    │   │   │       ├── StickyNoteElement.jsx  # Task badge after conversion
    │   │   │       ├── LineElement.jsx
    │   │   │       ├── TextElement.jsx
    │   │   │       ├── ImageElement.jsx       # Konva.Image from Cloudinary URLs
    │   │   │       ├── SelectionBox.jsx       # Multi-select rectangle
    │   │   │       ├── CursorOverlay.jsx      # Other users' cursors
    │   │   │       ├── LockIndicator.jsx      # Lock badge on elements
    │   │   │       └── ElementContextMenu.jsx # Right-click context menu
    │   │   │
    │   │   ├── tasks/
    │   │   │   ├── TaskPanel.jsx             # Kanban board in sidebar
    │   │   │   └── components/
    │   │   │       ├── KanbanColumn.jsx       # Todo, In Progress, Review, Done
    │   │   │       ├── TaskCard.jsx           # Draggable task card
    │   │   │       ├── CreateTaskModal.jsx
    │   │   │       ├── TaskDetailModal.jsx    # Full task view + edit
    │   │   │       ├── ConvertStickyModal.jsx # Sticky → Task conversion
    │   │   │       └── TaskFilters.jsx        # Status, assignee, priority filters
    │   │   │
    │   │   ├── chat/
    │   │   │   ├── ChatPanel.jsx             # Chat sidebar panel
    │   │   │   └── components/
    │   │   │       ├── MessageList.jsx        # Scrollable message list
    │   │   │       ├── MessageBubble.jsx      # Single message
    │   │   │       ├── MessageInput.jsx       # Input + send button
    │   │   │       └── ThreadView.jsx         # Threaded replies
    │   │   │
    │   │   ├── files/
    │   │   │   ├── FilesPanel.jsx            # Files sidebar panel
    │   │   │   └── components/
    │   │   │       ├── FileCard.jsx
    │   │   │       ├── FileUploadButton.jsx   # Cloudinary upload widget + progress
    │   │   │       ├── UploadProgress.jsx     # Progress bar per file
    │   │   │       └── FilePreview.jsx
    │   │   │
    │   │   └── shared/
    │   │       ├── ProtectedRoute.jsx         # Auth guard
    │   │       ├── AppInitializer.jsx         # Session restore + loading screen
    │   │       ├── LoadingSpinner.jsx
    │   │       ├── Avatar.jsx                 # User avatar with fallback
    │   │       ├── Modal.jsx                  # Reusable modal component
    │   │       ├── ConfirmDialog.jsx          # Delete confirmations
    │   │       ├── EmptyState.jsx             # Empty list placeholder
    │   │       └── ErrorBoundary.jsx
    │   │
    │   └── styles/
    │       └── index.css                      # Tailwind directives + global overrides
    │
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── .env
```

---

## Proposed Changes — Phased Build

### FE Phase 1: Project Setup + Auth + Routing

Establish the entire client skeleton, Tailwind design system, auth flows, and protected routing.

---

#### [MODIFY] [vite.config.js](file:///d:/Desktop/Projects/SketchFlow/client/vite.config.js)
- Add proxy: `/api` → `http://localhost:5000` (matches backend port)
- Add path alias: `@` → `./src` for clean imports (`@/stores/authStore`)
- Add `resolve.alias` configuration

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

#### [MODIFY] [tailwind.config.js](file:///d:/Desktop/Projects/SketchFlow/client/tailwind.config.js)
- Replace empty config with full design token configuration (see "Tailwind Design Tokens" section above)
- Content paths: `['./index.html', './src/**/*.{js,ts,jsx,tsx}']`
- Dark mode: `'class'` (toggled via `<html class="dark">`)
- All colors, spacing, shadows, fonts, animations from `design.md`

#### [MODIFY] [postcss.config.js](file:///d:/Desktop/Projects/SketchFlow/client/postcss.config.js)
- Ensure Tailwind and Autoprefixer plugins are configured

#### [MODIFY] [index.html](file:///d:/Desktop/Projects/SketchFlow/client/index.html)
- Add `class="dark"` to `<html>` (dark mode default per `design.md`)
- Update `<title>` to `SketchFlow`
- Add Google Fonts preconnect links for Inter and JetBrains Mono
- Add meta description for SEO

```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="SketchFlow — Real-time visual collaboration platform" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <title>SketchFlow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

#### [NEW] [src/styles/index.css](file:///d:/Desktop/Projects/SketchFlow/client/src/styles/index.css)
- Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`
- `@layer base` overrides: `html` and `body` defaults (bg-canvas, text-primary, font-sans, antialiased, 14px body)
- Custom scrollbar styling (thin, slate-colored, minimal)
- Focus ring utilities for accessibility
- Selection highlight color (primary-500)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply bg-canvas text-slate-50 font-sans antialiased;
    font-size: 14px;
    line-height: 1.6;
  }

  body {
    @apply min-h-screen;
  }

  /* Custom scrollbar — thin, minimal */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-slate-600 rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-slate-500;
  }

  /* Selection highlight */
  ::selection {
    @apply bg-primary-500/30 text-slate-50;
  }

  /* Focus ring for accessibility */
  *:focus-visible {
    @apply outline-2 outline-offset-2 outline-primary-500;
  }
}
```

---

#### [NEW] [src/config/env.js](file:///d:/Desktop/Projects/SketchFlow/client/src/config/env.js)
- Export typed environment variables from `import.meta.env`
- `API_URL` — defaults to `/api` (proxied by Vite in dev)
- `WS_URL` — defaults to `http://localhost:5000` (direct Socket.IO connection)
- `CLOUDINARY_CLOUD_NAME` — for file upload widget

```js
export const env = {
  API_URL: import.meta.env.VITE_API_URL || '/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:5000',
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
};
```

---

#### [NEW] [src/api/axios.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/axios.js)
- Create Axios instance with `baseURL = env.API_URL`
- **Request interceptor**: read `accessToken` from `authStore.getState()`, attach `Authorization: Bearer <token>` header
- **Response interceptor**: on 401 with `TOKEN_EXPIRED` code → call `POST /api/auth/refresh` with `withCredentials: true` (sends httpOnly cookie) → save new access token → retry original request. If refresh fails → call `authStore.getState().logout()` + redirect to `/login`
- **Refresh queue**: while refreshing, queue concurrent 401 requests and replay them after new token is obtained (prevents multiple simultaneous refresh calls)

```js
// Simplified flow — full implementation will follow this pattern:
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
```

#### [NEW] [src/api/auth.api.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/auth.api.js)
- `register(name, email, password)` → `POST /api/auth/register` (withCredentials for cookie)
- `login(email, password)` → `POST /api/auth/login` (withCredentials for cookie)
- `refresh()` → `POST /api/auth/refresh` (withCredentials — sends httpOnly cookie, returns new accessToken)
- `logout()` → `POST /api/auth/logout` (withCredentials — clears httpOnly cookie)
- `forgotPassword(email)` → `POST /api/auth/forgot-password`
- `resetPassword(token, password)` → `POST /api/auth/reset-password`
- `getMe()` → `GET /api/auth/me`

---

#### [NEW] [src/stores/authStore.js](file:///d:/Desktop/Projects/SketchFlow/client/src/stores/authStore.js)
- Zustand store (no persist — access token in memory only, per security requirement)
- State: `{ user, accessToken, isAuthenticated, isLoading, isInitialized }`
- Actions:
  - `login(email, password)` → call auth API → store `user` + `accessToken` in state
  - `register(name, email, password)` → call auth API → store `user` + `accessToken`
  - `logout()` → call auth API → clear state → redirect to `/login`
  - `refreshToken()` → call `POST /api/auth/refresh` → update `accessToken`
  - `setAccessToken(token)` → update token (used by axios interceptor)
  - `initialize()` → attempt `refreshToken()` + `getMe()` → set `isInitialized = true` regardless of success. If refresh succeeds → `isAuthenticated = true`. If refresh fails → `isAuthenticated = false`. **Prevents flash of login page** for authenticated users on page reload.
- `isInitialized` gates rendering of the entire app (see `AppInitializer`)

```js
// Token lifecycle:
// accessToken → Zustand memory (NOT localStorage — XSS protection)
// refreshToken → httpOnly secure cookie (set by server, auto-sent with withCredentials)
```

#### [NEW] [src/stores/uiStore.js](file:///d:/Desktop/Projects/SketchFlow/client/src/stores/uiStore.js)
- State: `{ sidebarOpen, activePanel, theme, connectionStatus }`
- `theme`: `'dark'` (default) or `'light'`. Persisted in `localStorage`. Toggles `dark` class on `<html>` element.
- `connectionStatus`: `'connected'` | `'connecting'` | `'disconnected'` — driven by socket events (Phase 3)
- Actions: `toggleSidebar()`, `setActivePanel(panel)`, `toggleTheme()`, `setConnectionStatus(status)`

---

#### [NEW] [src/features/shared/ProtectedRoute.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/shared/ProtectedRoute.jsx)
- Reads `isAuthenticated` from `authStore`
- If not authenticated → `<Navigate to="/login" replace />`
- If authenticated → render `<Outlet />` (nested routes)

#### [NEW] [src/features/shared/AppInitializer.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/shared/AppInitializer.jsx)
- On mount: calls `authStore.initialize()`
- While `!isInitialized` → renders a **branded SketchFlow loading screen** (logo + subtle spinner, slate background, centered layout)
- When `isInitialized = true` → renders `children` (the route tree)
- Prevents flash of login page for authenticated users returning to the app

#### [NEW] [src/features/shared/LoadingSpinner.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/shared/LoadingSpinner.jsx)
- Animated SVG spinner with configurable `size` and `className` props
- Uses `primary-500` color by default
- Tailwind animation: `animate-spin-slow`

#### [NEW] [src/features/shared/Modal.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/shared/Modal.jsx)
- React Portal-based modal rendered into `document.body`
- Overlay backdrop (`bg-overlay`, `backdrop-blur-sm`)
- Content card (`bg-raised`, `rounded-sf-lg`, `shadow-sf-floating`)
- Close on `Escape` key press + click outside
- Focus trap for accessibility
- Props: `isOpen`, `onClose`, `title`, `children`, `size` (sm/md/lg)
- Entry animation: `animate-slide-up`

#### [NEW] [src/features/shared/Avatar.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/shared/Avatar.jsx)
- Displays user's `avatar_url` image if available
- Falls back to first two initials of user name on colored circle
- Deterministic background color derived from user name hash
- Props: `user`, `size` (sm/md/lg)

#### [NEW] [src/features/shared/ConfirmDialog.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/shared/ConfirmDialog.jsx)
- Extends `Modal` with confirm/cancel buttons
- Props: `title`, `message`, `confirmText`, `onConfirm`, `onCancel`, `variant` (danger/warning)
- Danger variant uses `error` colored confirm button

#### [NEW] [src/features/shared/EmptyState.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/shared/EmptyState.jsx)
- Centered placeholder for empty lists
- Props: `icon` (Lucide icon component), `title`, `description`, `action` (optional button)

#### [NEW] [src/features/shared/ErrorBoundary.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/shared/ErrorBoundary.jsx)
- React class component wrapping `componentDidCatch`
- Renders a user-friendly error screen with "Try Again" button
- Logs error details to console

---

#### [NEW] [src/features/auth/components/AuthLayout.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/auth/components/AuthLayout.jsx)
- Full-page centered layout (`min-h-screen`, `bg-deep`, `flex items-center justify-center`)
- Card container: `bg-raised`, `rounded-sf-lg`, `shadow-sf-floating`, `max-w-md w-full`, `p-sf-8`
- SketchFlow logo/name at top
- Props: `children`, `title`, `subtitle`

#### [NEW] [src/features/auth/LoginPage.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/auth/LoginPage.jsx)
- Uses `AuthLayout` + `react-hook-form`
- Fields: email (required, email format), password (required)
- Submit calls `authStore.login()` → on success navigate to `/`
- Error handling: show toast on invalid credentials
- Links: "Create an account" → `/register`, "Forgot password?" → `/forgot-password`
- Form inputs styled: `bg-slate-800 border border-default rounded-sf-sm px-sf-3 py-sf-2 text-slate-50 placeholder:text-slate-400 focus:border-active transition-colors duration-sf-fast`

#### [NEW] [src/features/auth/RegisterPage.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/auth/RegisterPage.jsx)
- Uses `AuthLayout` + `react-hook-form`
- Fields: name (required), email (required, email), password (required, min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
- Password strength indicator (visual bar: weak/medium/strong)
- Submit calls `authStore.register()` → on success navigate to `/`
- Link: "Already have an account?" → `/login`

#### [NEW] [src/features/auth/ForgotPasswordPage.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/auth/ForgotPasswordPage.jsx)
- Uses `AuthLayout` + `react-hook-form`
- Field: email
- Submit calls `authApi.forgotPassword()` → shows success toast ("Check your email")
- Link: "Back to login" → `/login`

#### [NEW] [src/features/auth/ResetPasswordPage.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/auth/ResetPasswordPage.jsx)
- Uses `AuthLayout` + `react-hook-form`
- Reads reset `token` from URL params (`useParams()`)
- Fields: new password, confirm password
- Submit calls `authApi.resetPassword(token, password)` → on success navigate to `/login`

---

#### [NEW] [src/app/routes.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/app/routes.jsx)
- Define route tree using React Router `createBrowserRouter` or `<Routes>`:
  - **Public routes** (no auth required):
    - `/login` → `LoginPage`
    - `/register` → `RegisterPage`
    - `/forgot-password` → `ForgotPasswordPage`
    - `/reset-password/:token` → `ResetPasswordPage`
  - **Protected routes** (wrapped in `ProtectedRoute`):
    - `/` → `DashboardPage` (Phase 2)
    - `/workspaces/:workspaceId` → `WorkspacePage` (Phase 2)
    - `/boards/:boardId` → `BoardPage` (Phase 3)
  - **Catch-all**: `*` → 404 page or redirect to `/`

#### [MODIFY] [src/App.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/App.jsx)
- Remove all Vite boilerplate (counter, logos, links)
- Mount: `<BrowserRouter>` → `<AppInitializer>` → `<Routes>` (from `routes.jsx`) → `<Toaster>` (from `react-hot-toast`)
- Toaster config: position `'bottom-right'`, styled with dark theme classes

```jsx
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppInitializer from '@/features/shared/AppInitializer';
import AppRoutes from '@/app/routes';

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'bg-raised text-slate-50 border border-default shadow-sf-overlay',
            duration: 4000,
          }}
        />
      </AppInitializer>
    </BrowserRouter>
  );
}
```

#### [MODIFY] [src/main.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/main.jsx)
- Change CSS import from `'./index.css'` to `'./styles/index.css'`
- Remove `StrictMode` wrapper (optional — can cause double-mount issues with socket connections in development)

#### [DELETE] [src/App.css](file:///d:/Desktop/Projects/SketchFlow/client/src/App.css)
- Remove Vite boilerplate CSS — replaced by Tailwind

#### [DELETE] [src/index.css](file:///d:/Desktop/Projects/SketchFlow/client/src/index.css)
- Remove Vite default CSS — replaced by `src/styles/index.css`

#### [NEW] [.env](file:///d:/Desktop/Projects/SketchFlow/client/.env)
- Template:
```
VITE_API_URL=/api
VITE_WS_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=
```

---

### FE Phase 2: Dashboard + Workspaces + Boards

Build the workspace management UI — the first screens users see after login.

---

#### [NEW] [src/api/workspaces.api.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/workspaces.api.js)
- `create({ name, description })` → `POST /api/workspaces`
- `list()` → `GET /api/workspaces`
- `getById(id)` → `GET /api/workspaces/:id`
- `update(id, { name, description })` → `PUT /api/workspaces/:id`
- `delete(id)` → `DELETE /api/workspaces/:id`
- `inviteMember(workspaceId, { email, role })` → `POST /api/workspaces/:id/members`
- `removeMember(workspaceId, userId)` → `DELETE /api/workspaces/:id/members/:userId`
- `updateMemberRole(workspaceId, userId, role)` → `PATCH /api/workspaces/:id/members/:userId`
- `listMembers(workspaceId)` → `GET /api/workspaces/:id/members`

#### [NEW] [src/api/boards.api.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/boards.api.js)
- `create({ name, workspaceId })` → `POST /api/workspaces/:workspaceId/boards`
- `listByWorkspace(workspaceId)` → `GET /api/workspaces/:workspaceId/boards`
- `getById(id)` → `GET /api/boards/:id`
- `update(id, { name })` → `PUT /api/boards/:id`
- `delete(id)` → `DELETE /api/boards/:id`

#### [NEW] [src/api/users.api.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/users.api.js)
- `getProfile()` → `GET /api/users/profile`
- `updateProfile({ name, avatar_url })` → `PUT /api/users/profile`
- `searchByEmail(email)` → `GET /api/users/search?email=`

---

#### [NEW] [src/stores/workspaceStore.js](file:///d:/Desktop/Projects/SketchFlow/client/src/stores/workspaceStore.js)
- State: `{ workspaces, currentWorkspace, members, isLoading }`
- Actions:
  - `fetchWorkspaces()` → GET list, store in state
  - `createWorkspace({ name, description })` → POST, append to list
  - `setCurrentWorkspace(workspace)` → set active workspace
  - `fetchMembers(workspaceId)` → GET members list
  - `inviteMember(workspaceId, email, role)` → POST, append to members
  - `removeMember(workspaceId, userId)` → DELETE, remove from members
  - `updateMemberRole(workspaceId, userId, role)` → PATCH, update in list
  - `deleteWorkspace(workspaceId)` → DELETE, remove from list

#### [NEW] [src/stores/boardStore.js](file:///d:/Desktop/Projects/SketchFlow/client/src/stores/boardStore.js)
- State: `{ boards, currentBoard, isLoading }`
- Actions:
  - `fetchBoards(workspaceId)` → GET list
  - `createBoard({ name, workspaceId })` → POST, append
  - `setCurrentBoard(board)` → set active board
  - `deleteBoard(boardId)` → DELETE, remove from list

---

#### [NEW] [src/features/dashboard/DashboardPage.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/dashboard/DashboardPage.jsx)
- Page layout: top nav (SketchFlow logo, Notifications dropdown, user avatar/profile dropdown) + content area
- Notifications dropdown: Bell icon with badge, shows pending invites via global Socket.IO, allows accept/decline.
- Content: responsive grid of `WorkspaceCard` components
- "Create Workspace" button → opens `CreateWorkspaceModal`
- Fetches workspaces on mount via `workspaceStore.fetchWorkspaces()`
- Empty state with illustration when no workspaces exist

#### [NEW] [src/features/dashboard/components/WorkspaceCard.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/dashboard/components/WorkspaceCard.jsx)
- Card: `bg-raised`, `border border-default`, `rounded-sf-md`, hover → `border-hover` transition
- Shows: workspace name, description (truncated), member count, board count, last activity
- Click → navigates to `/workspaces/:workspaceId`

#### [NEW] [src/features/dashboard/components/CreateWorkspaceModal.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/dashboard/components/CreateWorkspaceModal.jsx)
- Uses `Modal` + `react-hook-form`
- Fields: name (required), description (optional)
- Submit → `workspaceStore.createWorkspace()` → close modal + toast

---

#### [NEW] [src/features/workspace/WorkspacePage.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/workspace/WorkspacePage.jsx)
- Layout: workspace header + board grid (main) + members sidebar (right, collapsible)
- Header: workspace name (editable by admin), back to dashboard, settings gear icon
- Board grid: `BoardCard` components + "Create Board" button
- Fetches boards + members on mount

#### [NEW] [src/features/workspace/components/BoardCard.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/workspace/components/BoardCard.jsx)
- Card: `bg-raised`, `rounded-sf-md`, hover effect
- Shows: board name, element count, task count, last activity timestamp
- Click → navigates to `/boards/:boardId`

#### [NEW] [src/features/workspace/components/CreateBoardModal.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/workspace/components/CreateBoardModal.jsx)
- Uses `Modal` + `react-hook-form`
- Fields: board name (required)
- Submit → `boardStore.createBoard()`

#### [NEW] [src/features/workspace/components/MemberList.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/workspace/components/MemberList.jsx)
- Lists workspace members with `Avatar`, name, and role badge (`admin` = indigo, `editor` = accent, `viewer` = slate)
- Admin actions: change role dropdown, remove member (with `ConfirmDialog`)
- Invite button at top → opens `InviteMemberModal`
- **Real-Time Updates**: Automatically updates when roles change, members join, or are removed (via global socket)

#### [NEW] [src/features/workspace/components/InviteMemberModal.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/workspace/components/InviteMemberModal.jsx)
- Uses `Modal` + `react-hook-form`
- Email search input (debounced, calls `usersApi.searchByEmail()`)
- Role selector: admin / editor / viewer
- Submit → `workspaceStore.inviteMember()`

#### [NEW] [src/features/workspace/components/WorkspaceSettings.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/workspace/components/WorkspaceSettings.jsx)
- Admin-only panel (conditionally rendered based on membership role)
- Edit workspace name + description
- Danger zone: delete workspace (with `ConfirmDialog`, "type workspace name to confirm")

---

### FE Phase 3: Infinite Canvas + Real-Time Elements

The core whiteboard experience — the most complex phase.

---

#### [NEW] [src/api/elements.api.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/elements.api.js)
- `create(boardId, elementData)` → `POST /api/boards/:boardId/elements`
- `listByBoard(boardId)` → `GET /api/boards/:boardId/elements`
- `update(elementId, data, version)` → `PUT /api/elements/:id` (sends `{ ...data, version }`)
- `batchUpdate(elements)` → `PATCH /api/elements/batch` (sends `{ elements: [{ id, x, y, version }] }`)
- `delete(elementId)` → `DELETE /api/elements/:id`

#### [NEW] [src/stores/canvasStore.js](file:///d:/Desktop/Projects/SketchFlow/client/src/stores/canvasStore.js)
- State: `{ elements, selectedIds, tool, zoom, panOffset, isDrawing, history, historyIndex }`
- `tool`: `'select'` | `'rectangle'` | `'circle'` | `'sticky'` | `'line'` | `'text'` | `'image'`
- `zoom`: float (0.1 → 5.0, default 1.0)
- `panOffset`: `{ x, y }` (default `{ x: 0, y: 0 }`)
- Actions:
  - `setElements(elements)` → replace entire elements array (used on initial load)
  - `addElement(element)` → append to elements (optimistic)
  - `updateElement(id, changes)` → merge changes into element (optimistic)
  - `removeElement(id)` → filter out element (optimistic)
  - `revertElement(id, serverState)` → revert an element to server state on conflict
  - `setTool(tool)` → change active drawing tool
  - `setZoom(zoom)` → update zoom level (clamped 0.1–5.0)
  - `setPanOffset({ x, y })` → update pan position
  - `selectElement(id)` → set `selectedIds = [id]`
  - `toggleSelect(id)` → add/remove from `selectedIds` (Shift+click)
  - `selectArea(ids)` → set `selectedIds` from area selection
  - `clearSelection()` → `selectedIds = []`
  - `pushHistory(snapshot)` / `undo()` / `redo()` → undo/redo stack for local operations

#### [NEW] [src/stores/presenceStore.js](file:///d:/Desktop/Projects/SketchFlow/client/src/stores/presenceStore.js)
- State: `{ onlineUsers: {}, cursors: {} }` (keyed by userId)
- `onlineUsers`: `{ [userId]: { id, name, avatar_url, color } }` — color assigned on join for cursor display
- `cursors`: `{ [userId]: { x, y } }` — latest cursor position per user
- Actions: `setOnlineUsers(users)`, `addUser(user)`, `removeUser(userId)`, `updateCursor(userId, { x, y })`, `clearAll()`

---

#### [NEW] [src/sockets/socket.js](file:///d:/Desktop/Projects/SketchFlow/client/src/sockets/socket.js)
- Create and export Socket.IO client instance
- Connect with `auth: { token: accessToken }` from authStore
- `autoConnect: false` — manually connect when entering board
- Reconnect: exponential backoff (1s → 2s → 4s → max 30s)
- **Socket reauthentication**: on `connect_error` with auth failure → call `authStore.refreshToken()` → update `socket.auth.token` → `socket.connect()`. If refresh fails → disconnect + redirect to login.
- **Connection status**: emit `connect`, `disconnect`, `reconnect_attempt` events to `uiStore.setConnectionStatus()`
- Exported functions: `connectSocket(token)`, `disconnectSocket()`, `getSocket()`

```js
// Reauthentication flow:
socket.on('connect_error', async (err) => {
  if (err.message === 'AUTH_ERROR' || err.message === 'TOKEN_EXPIRED') {
    try {
      await useAuthStore.getState().refreshToken();
      const newToken = useAuthStore.getState().accessToken;
      socket.auth.token = newToken;
      socket.connect();
    } catch {
      useAuthStore.getState().logout();
    }
  }
});
```

#### [NEW] [src/sockets/useBoardSocket.js](file:///d:/Desktop/Projects/SketchFlow/client/src/sockets/useBoardSocket.js)
- Hook: takes `boardId` parameter
- On mount: `socket.emit('board:join', { boardId })`
- Listens for:
  - `element:created` → `canvasStore.addElement(element)`
  - `element:updated` → `canvasStore.updateElement(id, changes)`
  - `element:moved` → `canvasStore.updateElement(id, { x, y })`
  - `element:deleted` → `canvasStore.removeElement(id)`
  - `element:conflict` → `canvasStore.revertElement(id, serverState)` + show toast warning
  - `board:state:sync` → `canvasStore.setElements(elements)` (full state resync)
- On unmount: `socket.emit('board:leave', { boardId })`, remove all listeners

#### [NEW] [src/sockets/usePresence.js](file:///d:/Desktop/Projects/SketchFlow/client/src/sockets/usePresence.js)
- Hook: takes `boardId` parameter
- Track mouse position on canvas, emit `cursor:move` throttled at ~15 FPS via `lodash.throttle` (66ms interval)
- Listens for:
  - `cursor:updated` → `presenceStore.updateCursor(userId, { x, y })`
  - `user:joined` → `presenceStore.addUser(user)` + show toast
  - `user:left` → `presenceStore.removeUser(userId)`
  - `presence:list` → `presenceStore.setOnlineUsers(users)` (on initial join)
- Cleanup on unmount: stop tracking, remove listeners

#### [NEW] [src/sockets/useLock.js](file:///d:/Desktop/Projects/SketchFlow/client/src/sockets/useLock.js)
- Hook: provides `requestLock(elementId)`, `releaseLock(elementId)`
- `requestLock` → `socket.emit('element:lock', { elementId })`
- Listens for:
  - `element:locked` → mark element as locked in canvasStore (by whom)
  - `element:unlocked` → clear lock indicator
  - `lock:denied` → show toast "Element is being edited by [name]"
- **Heartbeat**: while lock is held, emit `element:lock:heartbeat` every 10 seconds
- **Auto-release**: release lock on element blur/deselect, page unload

---

#### [NEW] [src/features/canvas/Canvas.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/Canvas.jsx)
- React-Konva `<Stage>` + `<Layer>`:
  - **Infinite pan**: drag stage background (not elements) to pan. Updates `canvasStore.panOffset`.
  - **Zoom**: mouse wheel → `canvasStore.setZoom()`. Zoom toward cursor position.
  - **Click-to-create**: when a drawing tool is active, click on empty canvas → create element at click position → `socket.emit('element:created', data)`
  - **Drag-to-move**: dragging an element → optimistic update `canvasStore.updateElement()` → on drag end `socket.emit('element:moved', { elementId, x, y, version })`
  - **Multi-select**:
    - Click → select single element
    - Shift+click → toggle element in/out of selection
    - Drag on empty canvas (with select tool) → draw `SelectionBox`, on release select all elements within bounds
  - **Batch actions on multi-select**: move all selected, delete all selected, change color of all selected
  - **Double-click** text/sticky → enter inline edit mode
  - **Viewport culling**: compute visible bounds from `zoom` + `panOffset` + stage dimensions. Only render elements whose bounding box intersects visible viewport. Recomputed on pan/zoom change. Critical for performance on large boards (100+ elements).

#### Element Components (`src/features/canvas/components/`)

All element components follow this pattern:
- Wrapped in `React.memo` with shallow prop comparison
- Accept `element` prop (from canvasStore) + selection/lock state
- Render appropriate Konva shape with drag handles
- Show selection handles when selected
- Show lock indicator when locked by another user

#### [NEW] [src/features/canvas/components/RectangleElement.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/RectangleElement.jsx)
- Renders `<Rect>` with `x, y, width, height, fill` from element data
- Draggable (updates position on drag end)
- Resize handles on selection (corner circles that update width/height)

#### [NEW] [src/features/canvas/components/CircleElement.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/CircleElement.jsx)
- Renders `<Circle>` or `<Ellipse>` with `x, y, radius/width, height, fill`
- Same drag/resize pattern as Rectangle

#### [NEW] [src/features/canvas/components/StickyNoteElement.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/StickyNoteElement.jsx)
- Renders `<Group>` containing `<Rect>` (sticky background, default yellow-ish) + `<Text>` (sticky content)
- Double-click → editable `<textarea>` HTML overlay for text input (debounced 300ms save)
- **Task badge**: after sticky is converted to a task (tracked via `task_sources`), display a small badge icon on the sticky. Clicking badge → opens `TaskDetailModal` for the linked task.

#### [NEW] [src/features/canvas/components/LineElement.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/LineElement.jsx)
- Renders `<Line>` with `points` array from element data
- Endpoint handles for adjustment

#### [NEW] [src/features/canvas/components/TextElement.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/TextElement.jsx)
- Renders `<Text>` with position, font size, color from element data
- Double-click → inline edit (HTML textarea overlay)
- Text editing debounced 300ms before save

#### [NEW] [src/features/canvas/components/ImageElement.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/ImageElement.jsx)
- Renders `<Image>` using Konva's `Image` node
- Loads image from Cloudinary URL stored in element's `text` field
- Uses `useImage` hook from `react-konva-utils` for async loading
- Shows placeholder rect while image loads
- Supports drag + resize

#### [NEW] [src/features/canvas/components/SelectionBox.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/SelectionBox.jsx)
- Blue dashed rectangle drawn during multi-select drag
- On mouse release → computes intersection with all element bounding boxes → `canvasStore.selectArea(matchedIds)`

#### [NEW] [src/features/canvas/components/CursorOverlay.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/CursorOverlay.jsx)
- Renders other users' cursor positions from `presenceStore.cursors`
- Each cursor: small arrow SVG + name label pill with user's assigned color
- Positioned in canvas coordinates (accounts for zoom/pan)

#### [NEW] [src/features/canvas/components/LockIndicator.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/LockIndicator.jsx)
- Small lock icon badge overlaid on elements locked by another user
- Tooltip: "Being edited by [name]"

#### [NEW] [src/features/canvas/components/ElementContextMenu.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/components/ElementContextMenu.jsx)
- Right-click context menu (HTML overlay positioned at click point)
- Options: Edit, Duplicate, Change Color (color picker), Convert to Task (sticky only), Delete
- Batch mode: when multiple elements selected, show "Delete All", "Change Color"
- Click outside or Escape → dismiss

#### [NEW] [src/features/canvas/CanvasControls.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/canvas/CanvasControls.jsx)
- Floating control bar at bottom-center of canvas
- Glassmorphism styling: `bg-slate-800/80 backdrop-blur-md border border-default rounded-sf-lg shadow-sf-floating`
- Zoom out (−) button, zoom percentage display, zoom in (+) button
- Fit to screen button (calculates viewport to fit all elements)

---

#### [NEW] [src/features/board/BoardPage.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/board/BoardPage.jsx)
- Layout: `BoardHeader` (top) + `Toolbar` (left) + `Canvas` (center, fills remaining space) + `RightSidebar` (right, collapsible)
- Fetches board data + elements on mount
- Connects socket: `useBoardSocket(boardId)`, `usePresence(boardId)`, `useLock()`
- Disconnects socket on unmount

#### [NEW] [src/features/board/components/BoardHeader.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/board/components/BoardHeader.jsx)
- Fixed top bar: back button (←), board name (editable), online user avatars (from presenceStore), `ConnectionStatus`, settings dropdown
- Glassmorphism style consistent with canvas floating elements

#### [NEW] [src/features/board/components/Toolbar.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/board/components/Toolbar.jsx)
- Vertical bar on left side of canvas
- Tools: Select (pointer), Rectangle, Circle, Sticky Note, Line, Text, Image upload
- Active tool highlighted with `bg-primary-500/20 text-primary-400`
- Each tool has Lucide icon + tooltip on hover
- Color picker at bottom for new element color
- Glassmorphism styling

#### [NEW] [src/features/board/components/RightSidebar.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/board/components/RightSidebar.jsx)
- Collapsible panel on right side (320px width, slides in/out)
- Tab navigation at top: Tasks | Chat | Files
- Renders `TaskPanel`, `ChatPanel`, or `FilesPanel` based on active tab
- Close button to collapse

#### [NEW] [src/features/board/components/ConnectionStatus.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/board/components/ConnectionStatus.jsx)
- Small pill in board header showing connection state:
  - 🟢 `Connected` — green dot + text
  - 🟡 `Reconnecting...` — amber dot + pulsing animation
  - 🔴 `Disconnected` — red dot + "Click to reconnect" on click
- Reads from `uiStore.connectionStatus`

#### [NEW] [src/hooks/useConnectionStatus.js](file:///d:/Desktop/Projects/SketchFlow/client/src/hooks/useConnectionStatus.js)
- Listens to socket `connect`, `disconnect`, `reconnect_attempt`, `reconnect` events
- Updates `uiStore.setConnectionStatus(status)`
- Shows toast on: reconnected ("Back online"), disconnected ("Connection lost")

---

### FE Phase 4: Task Management + Sticky Conversion

Kanban board, task CRUD, and the sticky → task conversion flow.

---

#### [NEW] [src/api/tasks.api.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/tasks.api.js)
- `create(boardId, taskData)` → `POST /api/boards/:boardId/tasks`
- `convertFromSticky(boardId, { elementId, ...taskData })` → `POST /api/boards/:boardId/tasks/convert`
- `listByBoard(boardId, filters?)` → `GET /api/boards/:boardId/tasks?status=&assignee_id=&priority=`
- `getById(taskId)` → `GET /api/tasks/:taskId`
- `update(taskId, data)` → `PUT /api/tasks/:taskId` (includes `version`)
- `updateStatus(taskId, status, version)` → `PATCH /api/tasks/:taskId/status`
- `assignTask(taskId, assigneeId, version)` → `PATCH /api/tasks/:taskId/assign`
- `delete(taskId)` → `DELETE /api/tasks/:taskId`

#### [NEW] [src/stores/taskStore.js](file:///d:/Desktop/Projects/SketchFlow/client/src/stores/taskStore.js)
- State: `{ tasks, filters: { status, assignee_id, priority }, selectedTask, isLoading }`
- Derived getter: `tasksByStatus` — groups tasks into `{ todo: [], in_progress: [], review: [], done: [] }`
- Actions:
  - `fetchTasks(boardId, filters?)` → GET list, store
  - `createTask(boardId, data)` → POST, append to list
  - `convertFromSticky(boardId, data)` → POST convert, append
  - `updateTask(taskId, changes)` → PUT, update in list
  - `moveTask(taskId, newStatus, version)` → PATCH status (optimistic: move card immediately, revert on error/conflict)
  - `deleteTask(taskId)` → DELETE, remove from list
  - `setFilters(filters)` → update filter state, refetch
  - `addTask(task)` / `updateTaskFromSocket(task)` / `removeTask(taskId)` → for real-time sync from socket events

#### [NEW] [src/sockets/useTaskSocket.js](file:///d:/Desktop/Projects/SketchFlow/client/src/sockets/useTaskSocket.js)
- Hook: listens for task events in current board room
- Events:
  - `task:created` → `taskStore.addTask(task)` (if `convertedFrom`, also update sticky element badge in canvasStore)
  - `task:updated` → `taskStore.updateTaskFromSocket(task)`
  - `task:status_changed` → `taskStore.updateTaskFromSocket(task)`
  - `task:assigned` → `taskStore.updateTaskFromSocket(task)`
  - `task:deleted` → `taskStore.removeTask(taskId)`

---

#### [NEW] [src/features/tasks/TaskPanel.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/tasks/TaskPanel.jsx)
- Kanban board layout inside right sidebar panel
- 4 columns horizontal scroll: Todo | In Progress | Review | Done
- **@dnd-kit integration**: `<DndContext>` wraps the entire kanban. Collision detection: `closestCenter`. On drag end → determine target column → call `taskStore.moveTask(taskId, newStatus, version)`.
- **Optimistic drag-and-drop**: card moves immediately on drop. If server returns 409 conflict → revert card to original column + show toast "Task was modified by someone else. Refreshing..."
- `TaskFilters` bar at top
- "Create Task" button

#### [NEW] [src/features/tasks/components/KanbanColumn.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/tasks/components/KanbanColumn.jsx)
- Column header: title (e.g., "In Progress") + task count badge
- `useDroppable` from @dnd-kit — column is a drop target
- Visual indicator: accent border highlight when card is dragged over
- Scrollable task card list

#### [NEW] [src/features/tasks/components/TaskCard.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/tasks/components/TaskCard.jsx)
- `useDraggable` from @dnd-kit — card is draggable
- Card content: title, priority badge (color-coded: high=error, medium=warning, low=success), assignee `Avatar` (small), due date indicator (overdue = error text)
- Ghost preview while dragging (translucent card at cursor)
- `shadow-sf-drag` while dragging
- Click → opens `TaskDetailModal`

#### [NEW] [src/features/tasks/components/CreateTaskModal.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/tasks/components/CreateTaskModal.jsx)
- Uses `Modal` + `react-hook-form`
- Fields: title (required), description (optional textarea), status (dropdown: todo/in_progress/review/done), priority (dropdown: low/medium/high), assignee (dropdown from workspace members), due date (date picker)
- Submit → `taskStore.createTask()`

#### [NEW] [src/features/tasks/components/TaskDetailModal.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/tasks/components/TaskDetailModal.jsx)
- Full task view using `Modal` (size: lg)
- All fields editable inline (click to edit pattern)
- Shows: title, description (markdown-ish), status badge, priority badge, assignee (with avatar), due date, created/updated timestamps
- **Source sticky reference**: if task was converted from sticky, shows `original_sticky_text` and a "View on canvas" link that pans the canvas to the source element
- Version tracking displayed for conflict awareness

#### [NEW] [src/features/tasks/components/ConvertStickyModal.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/tasks/components/ConvertStickyModal.jsx)
- Triggered from canvas `ElementContextMenu` → "Convert to Task"
- Pre-fills title from sticky note text
- Fields: title, description, priority, assignee, due date
- Submit → `taskStore.convertFromSticky()` → on success: sticky element gets task badge overlay, toast "Task created from sticky note"

#### [NEW] [src/features/tasks/components/TaskFilters.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/tasks/components/TaskFilters.jsx)
- Horizontal filter bar with dropdown selectors:
  - Status: All / Todo / In Progress / Review / Done
  - Assignee: All / (list from workspace members)
  - Priority: All / Low / Medium / High
- Updates `taskStore.setFilters()`
- Active filters shown as pills with clear (×) buttons

---

### FE Phase 5: Chat + Files + Activity Feed

Real-time board chat, file uploads via Cloudinary, and activity feed.

---

#### [NEW] [src/api/chat.api.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/chat.api.js)
- `sendMessage(boardId, { message, parentId? })` → `POST /api/boards/:boardId/messages`
- `getMessages(boardId, { cursor?, limit? })` → `GET /api/boards/:boardId/messages?cursor=&limit=`
- `getThreadReplies(messageId)` → `GET /api/messages/:id/replies`

#### [NEW] [src/stores/chatStore.js](file:///d:/Desktop/Projects/SketchFlow/client/src/stores/chatStore.js)
- State: `{ messages, hasMore, isLoading, cursor }`
- Actions:
  - `fetchMessages(boardId)` → GET initial messages (newest first, limit 50)
  - `loadMore(boardId)` → GET older messages using cursor (scroll up to load)
  - `sendMessage(boardId, data)` → POST + optimistic add
  - `addMessage(message)` → prepend to list (from socket event)
  - `clearMessages()` → reset on board change

#### [NEW] [src/sockets/useChatSocket.js](file:///d:/Desktop/Projects/SketchFlow/client/src/sockets/useChatSocket.js)
- Listens for `chat:new_message` → `chatStore.addMessage(message)`
- Listens for `chat:updated` → update message in store
- Listens for `chat:deleted` → remove message from store

---

#### [NEW] [src/features/chat/ChatPanel.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/chat/ChatPanel.jsx)
- Layout: `MessageList` (scrollable, takes remaining height) + `MessageInput` (fixed at bottom)
- Fetches messages on mount

#### [NEW] [src/features/chat/components/MessageList.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/chat/components/MessageList.jsx)
- Reverse-chronological display (newest at bottom)
- **Infinite scroll up**: when user scrolls to top, call `chatStore.loadMore()` to fetch older messages
- Auto-scroll to bottom on new message (only if already near bottom)
- Date separators between messages from different days

#### [NEW] [src/features/chat/components/MessageBubble.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/chat/components/MessageBubble.jsx)
- Shows: `Avatar` (small), user name, timestamp (relative via `date-fns formatDistanceToNow`), message text
- Own messages: slightly different background (`bg-primary-500/10`)
- Reply button → opens thread view
- Shows thread indicator if has replies ("N replies" link)

#### [NEW] [src/features/chat/components/MessageInput.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/chat/components/MessageInput.jsx)
- Text input with placeholder "Type a message..."
- Enter → send, Shift+Enter → newline
- Send button (disabled when empty)
- Styled: `bg-slate-800 border border-default rounded-sf-md`

#### [NEW] [src/features/chat/components/ThreadView.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/chat/components/ThreadView.jsx)
- Slide-in panel showing parent message + threaded replies
- Own `MessageInput` for replying to thread
- Back button to return to main chat

---

#### [NEW] [src/api/files.api.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/files.api.js)
- `getUploadSignature(boardId)` → `POST /api/boards/:boardId/files/signature`
- `registerUpload(boardId, fileData)` → `POST /api/boards/:boardId/files`
- `listByBoard(boardId)` → `GET /api/boards/:boardId/files`
- `deleteFile(fileId)` → `DELETE /api/files/:id`

#### [NEW] [src/features/files/FilesPanel.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/files/FilesPanel.jsx)
- File list + `FileUploadButton` at top
- Fetches files on mount
- Empty state when no files

#### [NEW] [src/features/files/components/FileCard.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/files/components/FileCard.jsx)
- Shows: file type icon (from Lucide based on mime_type), filename, file size (formatted), uploader name, upload date
- Actions: download (external link to Cloudinary URL), preview (images only), delete (with `ConfirmDialog`)

#### [NEW] [src/features/files/components/FileUploadButton.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/files/components/FileUploadButton.jsx)
- Triggers Cloudinary Upload Widget with signed upload params (from `filesApi.getUploadSignature()`)
- **Upload progress**: subscribes to widget's `uploadprogress` event → shows `UploadProgress` inline
- On upload complete: calls `filesApi.registerUpload()` to store metadata on server

#### [NEW] [src/features/files/components/UploadProgress.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/files/components/UploadProgress.jsx)
- Progress bar per file: filename, percentage bar (primary-500 fill), cancel button
- Shown inline in the files panel during active uploads

#### [NEW] [src/features/files/components/FilePreview.jsx](file:///d:/Desktop/Projects/SketchFlow/client/src/features/files/components/FilePreview.jsx)
- Modal for image preview (full-size view of uploaded images)
- Uses `Modal` component with large size

---

#### [NEW] [src/api/activity.api.js](file:///d:/Desktop/Projects/SketchFlow/client/src/api/activity.api.js)
- `getByBoard(boardId, { cursor?, limit? })` → `GET /api/boards/:boardId/activity`

---

### FE Phase 6: Polish + Production

Final touches, responsiveness, keyboard shortcuts, and production build.

---

#### [NEW] [src/hooks/useKeyboardShortcuts.js](file:///d:/Desktop/Projects/SketchFlow/client/src/hooks/useKeyboardShortcuts.js)
- Centralized keyboard shortcut handler (registered in `BoardPage`)
- Shortcuts:
  - `Ctrl+Z` → undo (canvasStore.undo)
  - `Ctrl+Y` / `Ctrl+Shift+Z` → redo
  - `Delete` / `Backspace` → delete selected elements
  - `Escape` → clear selection, close modals
  - `1`–`7` → switch tools (select, rectangle, circle, sticky, line, text, image)
  - `Ctrl+A` → select all visible elements
  - `Ctrl+D` → duplicate selected elements
  - `Ctrl+C` / `Ctrl+V` → copy/paste elements
- Only active when no text input/textarea is focused

#### Polish & UX
- **Theme toggle**: Dark/light mode switch in board header and dashboard navbar. Toggles `dark` class on `<html>`. Persisted in localStorage. All Tailwind classes use `dark:` prefix variants where needed.
- **Responsive layout**: Sidebar auto-collapses on screens < 1024px. Toolbar shrinks to icons only. Canvas takes full width on mobile.
- **Loading states**: Skeleton screens (pulsing slate rectangles) for dashboard workspace cards, workspace board cards, task panel loading
- **Error handling**: All API errors show toast notifications via `react-hot-toast`. Version conflict → show "Conflict detected — refreshing..." toast + refetch latest state. Network errors → "Connection error. Retrying..."
- **Tooltips**: All toolbar buttons, action icons have title-based tooltips or custom tooltip component
- **Empty states**: Custom illustrations/icons + descriptive text for empty workspaces, boards, tasks, chat, files

#### Performance
- `React.memo` on all canvas element components (prevent re-render on unrelated state changes)
- **Viewport culling**: only elements visible in current viewport rendered on Konva layer (computed from zoom + panOffset + element bounding boxes)
- Throttle cursor/move events (~15 FPS via `lodash.throttle`)
- Virtualize large task lists if > 100 tasks (optional, based on perf testing)
- Lazy load board page components with `React.lazy` + `Suspense`
- Debounce text editing (300ms before save)
- `useImage` hook for async Cloudinary image loading (prevents canvas blocking)

#### Production Build
- `npm run build` — Vite production build
- `.env.production` with production API URL
- SEO meta tags on all public pages
- 404 page component

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
User drags task card → optimistic move in taskStore
                     → PATCH /api/tasks/:id/status { status, version }
                     → Server updates DB + emits 'task:status_changed'
                     → All users in board room receive event → update taskStore
                     → If 409 → revert card position + toast
```

### Auth Token Flow
```
App Launch → AppInitializer calls authStore.initialize()
          → POST /api/auth/refresh (httpOnly cookie sent automatically)
          → Success: accessToken saved in memory, isInitialized=true, isAuthenticated=true
          → Failure: isInitialized=true, isAuthenticated=false → render login

API Call → Axios request interceptor attaches Bearer token
        → On 401 → response interceptor attempts silent refresh
        → New accessToken saved → original request retried
        → If refresh fails → logout + redirect to /login

Socket → connect_error with auth message
      → refreshToken() → update socket.auth.token → socket.connect()
      → If refresh fails → disconnect + redirect to /login
```

---

## Key Design Decisions

> [!NOTE]
> **Styling**: Tailwind CSS with centralized design tokens in `tailwind.config.js`. All design values from `design.md` (colors, spacing, shadows, fonts, motion) codified as custom Tailwind theme extensions. No separate CSS files per component. Dark mode via `class` strategy on `<html>`.

> [!NOTE]
> **State management**: Zustand over Redux/Context. One store per feature domain. No providers needed. Stores accessed via hooks or `getState()` (for non-React code like axios interceptors).

> [!NOTE]
> **Canvas library**: React-Konva wraps Konva.js for declarative canvas rendering. Each element is a React component that renders a Konva shape. HTML overlays for text editing and context menus.

> [!NOTE]
> **Socket architecture**: Custom hooks per domain (`useBoardSocket`, `usePresence`, `useLock`, `useTaskSocket`, `useChatSocket`). Each hook manages its own listeners and syncs to its Zustand store.

> [!NOTE]
> **Auth tokens**: Access token in Zustand memory (not localStorage — XSS protection). Refresh token in httpOnly secure cookie (set by server, auto-sent with `withCredentials`). Axios interceptor + socket reauthentication handle expiry transparently.

> [!NOTE]
> **File uploads**: Direct Cloudinary upload from browser (Upload Widget). Server only stores metadata. Upload progress tracked via widget's `uploadprogress` event.

> [!NOTE]
> **Drag & drop**: @dnd-kit for Kanban task cards. Smooth animations, visual drop indicators, keyboard accessibility. Optimistic updates with rollback on conflict.

> [!NOTE]
> **Canvas performance**: Viewport culling + React.memo on element components. Only visible elements rendered. Supports boards with hundreds of elements without frame drops.

---

## Estimation

| Phase | Duration | Focus |
|---|---|---|
| **FE Phase 1** | 3–4 days | Project setup, Tailwind design tokens, auth, routing |
| **FE Phase 2** | 3–4 days | Dashboard, workspaces, boards |
| **FE Phase 3** | 5–7 days | Infinite canvas, real-time elements, presence, locking |
| **FE Phase 4** | 3–4 days | Kanban tasks, sticky conversion, filters |
| **FE Phase 5** | 3–4 days | Chat, files, activity feed |
| **FE Phase 6** | 2–3 days | Polish, keyboard shortcuts, production build |
| **Total** | **19–26 days** | **Fully functional frontend** |

---

## Verification Plan

### After Each Phase
```bash
npm run dev                    # Dev server starts, HMR works
# Open http://localhost:5173   # UI renders without errors
# Check browser console        # No React warnings/errors
```

### Phase 1 Verification
```
- Dark theme applied (slate backgrounds, Inter font)
- Login page renders at /login
- Register page renders at /register
- Forgot/reset password pages render
- Form validation works (react-hook-form)
- Protected routes redirect to /login when unauthenticated
- Login → redirects to / (dashboard placeholder)
- Page refresh → session persists (silent refresh via cookie)
- Logout → redirects to /login, clears auth state
- Tailwind classes applied (no unstyled elements)
- Toast notifications appear (react-hot-toast)
```

### Phase 2 Verification
```
- Dashboard shows workspace cards
- Create workspace modal works
- Workspace page shows board grid + members
- Create board works
- Invite member works (email search + role)
- Admin-only actions visible only to admins
- Navigation: dashboard → workspace → board (back works)
```

### Phase 3 Verification
```
- Canvas renders (React-Konva Stage)
- Drawing tools create elements
- Drag to move elements
- Zoom + pan works (mouse wheel + drag)
- Multi-select (Shift+click, area select)
- Real-time sync: open two browser tabs, changes appear in both
- Cursor presence shows other users
- Element locking prevents simultaneous edits
- Connection status indicator updates
- Viewport culling: only visible elements rendered (check React DevTools)
```

### Phase 4 Verification
```
- Kanban board renders 4 columns
- Create task works
- Drag-and-drop between columns (optimistic + version check)
- Convert sticky to task works (badge appears on sticky)
- Task detail modal shows all fields + source sticky link
- Task filters work
- Real-time task updates across tabs
```

### Phase 5 Verification
```
- Chat messages send and receive in real-time
- Scroll up loads older messages (cursor pagination)
- Threaded replies work
- File upload to Cloudinary works (progress bar shows)
- File list displays correctly
- File preview modal works for images
```

### Phase 6 Verification
```
- Keyboard shortcuts work (Ctrl+Z, Delete, 1-7, etc.)
- Theme toggle (dark ↔ light) works and persists
- Responsive layout on smaller screens
- Error states show meaningful toasts
- npm run build succeeds (production build)
```
