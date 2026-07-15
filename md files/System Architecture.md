# System Architecture

---

## 1. Architecture Overview

SketchFlow follows a **Hybrid Event-Driven Real-Time Modular Monolith** architecture. This means:

- **Event-Driven**: [Socket.IO](http://socket.io/) events drive real-time updates
- **Real-Time**: WebSocket connections for instant sync
- **Modular Monolith**: Single codebase with clear module boundaries
- **Synchronous**: Email sending happens in the request cycle
- **Scheduled**: Cron jobs handle periodic cleanup tasks

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Vercel)                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │   React    │  │  React-    │  │ Socket.IO  │  │  Cloudinary        │  │
│  │ Application│  │   Konva    │  │   Client   │  │  Upload Widget     │  │
│  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                    ┌───────┴───────┐                    │
         │                    │ HTTP/REST API │                    │
         │                    │   (HTTPS)     │                    │
         │                    └───────┬───────┘                    │
         │                            │                            │
         ▼                            ▼                            ▼
  ┌───────────────┐    ┌─────────────────────────┐    ┌───────────────┐
  │   LOAD        │    │   API GATEWAY           │    │   WebSocket   │
  │   BALANCER    │───▶│   EXPRESS.js API        │◄───│   UPGRADE     │
  └───────────────┘    └──────────┬──────────────┘    └───────────────┘
                                  │                         │
                                  ▼                         ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                     BACKEND SERVICES (Render)                       │
  │                                                                     │
  │  ┌────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
  │  │   REST     │  │   Socket.IO      │  │   Email Service        │  │
  │  │   API      │  │   Server         │  │   (Nodemailer)         │  │
  │  │  Endpoints │  │  - Rooms         │  │   - Synchronous        │  │
  │  │  - Auth    │  │  - Presence      │  │   - SMTP Integration   │  │
  │  │  - CRUD    │  │  - Locks         │  │                        │  │
  │  │  - RBAC    │  │  - Event Log     │  │                        │  │
  │  └────────────┘  └──────────────────┘  └────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────┘
                      │                          │
                      ▼                          ▼
          ┌─────────────────────┐    ┌─────────────────────┐
          │     REDIS CACHE     │    │    POSTGRESQL       │
          │   (Render/Railway)  │    │  (Neon/Supabase)    │
          ├─────────────────────┤    ├─────────────────────┤
          │ • Sessions         │    │ • Users             │
          │ • Element Locks    │    │ • Workspaces        │
          │ • Presence         │    │ • Boards            │
          │ • Event Log (60s)  │    │ • Elements (v)      │
          │ • Board Cache (5s) │    │ • Tasks (v)         │
          │ • Rate Limiting    │    │ • Chat Messages     │
          └─────────────────────┘    │ • Files             │
                                      │ • Activity Logs    │
                                      └─────────────────────┘
                                                  │
                                      ┌───────────┴───────────┐
                                      │   CLOUDINARY STORAGE   │
                                      │   (File Storage/CDN)   │
                                      ├───────────────────────┤
                                      │ • Images              │
                                      │ • Documents           │
                                      │ • Automatic CDN       │
                                      │ • Optimizations       │
                                      └───────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                     EXTERNAL SERVICES                               │
  │  ┌────────────────────┐  ┌────────────────────────────────────┐   │
  │  │  Cron Jobs         │  │  Email Service                     │   │
  │  │  (node-cron)       │  │  (Nodemailer - Synchronous)        │   │
  │  │  - Hourly: Cleanup │  │  - Task Assignment Emails          │   │
  │  │  - Daily: Logs     │  │  - Invitation Emails               │   │
  │  └────────────────────┘  └────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Patterns

### 3.1. Optimistic Update (Shapes)

```
User drags shape
    │
    ▼
UI updates immediately (optimistic)
    │
    ▼
Socket.IO emits ELEMENT_MOVED (throttled to 15fps)
    │
    ▼
Server validates version
    │
    ├── Version matches → Updates PostgreSQL
    │   │
    │   └── Broadcasts to room (except sender)
    │       │
    │       └── Other users see shape move
    │
    └── Version mismatch → Sends UPDATE_REJECTED
        │
        └── Client fetches latest, re-applies change
```

### 3.2. Lock + Release (Sticky Notes)

```
User clicks sticky note
    │
    ▼
Socket.IO emits REQUEST_LOCK
    │
    ▼
Server: Redis SETNX lock:element:{id} (30s TTL)
    │
    ├── Success → Emit LOCK_GRANTED
    │   │
    │   ├── User edits
    │   ├── Heartbeat every 10s (renews TTL)
    │   └── User blurs → Emit UNLOCK → Redis DEL key
    │
    └── Failure → Emit LOCK_DENIED (someone else editing)
```

### 3.3. REST + [Socket.IO](http://socket.io/) (Tasks)

```
User converts sticky to task
    │
    ▼
REST API: POST /api/boards/:boardId/tasks/convert
    │
    ▼
Server: Transaction (create task + task_sources)
    │
    ▼
Server: Socket.IO emit TASK_CREATED to board room
    │
    ▼
All users see new task appear instantly
```

### 3.4. Reconnection with Event Replay

```
User reconnects
    │
    ▼
Socket.IO reconnects with exponential backoff + jitter
    │
    ▼
Client requests missed events: REQUEST_MISSED_EVENTS
    │
    ▼
Server replays from Redis event log (60s TTL)
    │
    ▼
Client applies missed events → Board state catches up
```

### 3.5. File Upload (Cloudinary)

```
User selects file
    │
    ▼
Cloudinary Upload Widget opens
    │
    ▼
Uploads directly to Cloudinary
    │
    ▼
Returns public_id/URL
    │
    ▼
Frontend sends public_id to Express API
    │
    ▼
Server stores metadata in PostgreSQL
    │
    ▼
Server emits FILE_UPLOADED via Socket.IO
    │
    ▼
All users see file in workspace
```

---

## 4. ERD Summary (10 Tables)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SKETCHFLOW ERD                                │
├─────────────────────────────────────────────────────────────────────────────┤

┌─────────────────────┐        ┌─────────────────────┐
│      USERS          │        │    WORKSPACES       │
├─────────────────────┤        ├─────────────────────┤
│ █ id (PK)          │1───┐   │ █ id (PK)          │
│   email (UNIQUE)   │    │   │   name             │
│   name             │    │   │   description      │
│   password_hash    │    │   │ ─ created_by (FK)  │
│   avatar_url       │    │   │   created_at       │
│   created_at       │    │   │   updated_at       │
│   updated_at       │    │   └─────────────────────┘
└─────────────────────┘    │                │
         │                 │                │
         │                 │                │
         └─────────────────┘                │
                                           │
                    ┌──────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │     BOARDS          │
        ├─────────────────────┤
        │ █ id (PK)          │
        │   name             │
        │ ─ workspace_id (FK)│
        │ ─ created_by (FK)  │
        │   created_at       │
        │   updated_at       │
        └─────────────────────┘
                    │
                    │
        ┌───────────┼────────────────────────┬───────────┐
        │           │                        │           │
        ▼           ▼                        ▼           ▼
┌───────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   ELEMENTS    │ │       TASKS         │ │    CHAT_MESSAGES    │
├───────────────┤ ├─────────────────────┤ ├─────────────────────┤
│ █ id (PK)    │ │ █ id (PK)          │ │ █ id (PK)          │
│ ─ board_id(FK)│ │   title            │ │ ─ board_id (FK)    │
│   type        │ │   description      │ │ ─ user_id (FK)     │
│   x           │ │   status           │ │   message          │
│   y           │ │   priority         │ │ ─ parent_id (FK)   │
│   width       │ │ ─ assignee_id (FK) │ │   created_at       │
│   height      │ │   due_date         │ │   updated_at       │
│   color       │ │ ─ board_id (FK)   │ └─────────────────────┘
│   text        │ │ ─ created_by (FK) │
│   version     │ │   version          │
│ ─ created_by(FK)│   created_at       │
│   created_at  │ │   updated_at       │
│   updated_at  │ │   deleted_at       │
│   deleted_at  │ └──────────┬──────────┘
└───────┬───────┘            │
        │                    │
        │         ┌──────────┘
        │         │
        │         ▼
        │ ┌─────────────────────┐
        │ │    TASK_SOURCES     │
        │ ├─────────────────────┤
        │ │ █ task_id (PK)     │
        │ │ █ element_id (PK)  │
        │ │   snapshot_text    │
        │ │   created_at       │
        │ └─────────────────────┘
        │
        ▼
┌─────────────────────┐        ┌─────────────────────┐
│   ACTIVITY_LOGS     │        │       FILES         │
├─────────────────────┤        ├─────────────────────┤
│ █ id (PK)          │        │ █ id (PK)          │
│ ─ board_id (FK)    │        │ ─ board_id (FK)    │
│ ─ user_id (FK)     │        │   name             │
│   action            │        │   public_id        │
│   metadata (JSON)   │        │   mime_type        │
│   created_at        │        │   size             │
└─────────────────────┘        │ ─ uploaded_by (FK) │
                               │   created_at       │
                               └─────────────────────┘

┌─────────────────────┐
│  WORKSPACE_MEMBERS  │
├─────────────────────┤
│ █ workspace_id (PK) │
│ █ user_id (PK)     │
│   role              │
│   joined_at         │
│ ─ invited_by (FK)  │
└─────────────────────┘

LEGEND: █ = Primary Key (PK)  ─ = Foreign Key (FK)  1 = One  N = Many
```

---

## 5. Redis Key Structure

```
# Presence
presence:board:{boardId}          → Hash { userId: name }    [TTL: 60s]

# Cursors
cursor:board:{boardId}:{userId}   → Hash { x, y }            [TTL: 5s]

# Element Locks
lock:element:{elementId}          → String userId             [TTL: 30s]

# Event Log (for replay)
board:events:{boardId}            → List [event1, event2...]  [TTL: 60s]

# Board State Cache
board:state:{boardId}             → JSON { elements: [...] }  [TTL: 5s]

# Rate Limiting
rate:board:{boardId}:{userId}     → Counter                   [TTL: 1s, max: 15]

# Sessions
session:{sessionId}               → JSON { userId }

# Invite Tokens
invite:{token}                    → JSON { workspaceId, role, expiresAt } [TTL: 7d]
```

---

## 6. Project Structure

### 6.1. Complete Folder Structure

```
sketchflow/
│
├── client/                                 # React Frontend (Vercel)
│   ├── src/
│   │   ├── features/                       # Feature-based modules
│   │   │   ├── auth/
│   │   │   ├── workspace/
│   │   │   ├── board/
│   │   │   ├── canvas/
│   │   │   ├── tasks/
│   │   │   ├── chat/
│   │   │   ├── files/
│   │   │   └── shared/
│   │   ├── app/
│   │   │   ├── App.jsx
│   │   │   ├── routes.jsx
│   │   │   └── providers.jsx
│   │   ├── styles/
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── server/                                 # Express Backend (Render)
│   ├── src/
│   │   ├── index.js                        # Entry point
│   │   ├── config/
│   │   │   ├── db.js                       # PostgreSQL pool
│   │   │   ├── redis.js                    # Redis client
│   │   │   ├── cloudinary.js               # Cloudinary config
│   │   │   ├── cors.js                     # CORS config
│   │   │   └── env.js                      # Environment validation
│   │   ├── db/
│   │   │   └── migrations/
│   │   │       └── 001_initial_schema.sql  # Full DDL
│   │   ├── middleware/
│   │   │   ├── auth.js                     # JWT verification
│   │   │   ├── rbac.js                     # Role-based access control
│   │   │   ├── rateLimiter.js              # Express rate limiting
│   │   │   ├── validate.js                 # Request validation
│   │   │   └── errorHandler.js             # Centralized error handling
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   └── auth.validation.js
│   │   │   ├── users/
│   │   │   │   ├── users.routes.js
│   │   │   │   ├── users.controller.js
│   │   │   │   └── users.service.js
│   │   │   ├── workspaces/
│   │   │   │   ├── workspaces.routes.js
│   │   │   │   ├── workspaces.controller.js
│   │   │   │   ├── workspaces.service.js
│   │   │   │   └── workspaces.validation.js
│   │   │   ├── boards/
│   │   │   │   ├── boards.routes.js
│   │   │   │   ├── boards.controller.js
│   │   │   │   ├── boards.service.js
│   │   │   │   └── boards.validation.js
│   │   │   ├── elements/
│   │   │   │   ├── elements.routes.js
│   │   │   │   ├── elements.controller.js
│   │   │   │   ├── elements.service.js
│   │   │   │   └── elements.validation.js
│   │   │   ├── tasks/
│   │   │   │   ├── tasks.routes.js
│   │   │   │   ├── tasks.controller.js
│   │   │   │   ├── tasks.service.js
│   │   │   │   └── tasks.validation.js
│   │   │   ├── chat/
│   │   │   │   ├── chat.routes.js
│   │   │   │   ├── chat.controller.js
│   │   │   │   ├── chat.service.js
│   │   │   │   └── chat.validation.js
│   │   │   ├── files/
│   │   │   │   ├── files.routes.js
│   │   │   │   ├── files.controller.js
│   │   │   │   ├── files.service.js
│   │   │   │   └── files.validation.js
│   │   │   └── activity/
│   │   │       ├── activity.routes.js
│   │   │       ├── activity.controller.js
│   │   │       └── activity.service.js
│   │   ├── sockets/
│   │   │   ├── index.js                    # Socket.IO server setup
│   │   │   ├── boardHandler.js             # Board room, element events
│   │   │   ├── presenceHandler.js          # Cursor tracking, presence
│   │   │   ├── lockHandler.js              # Element locking (SETNX + TTL)
│   │   │   ├── chatHandler.js              # Real-time chat
│   │   │   ├── taskHandler.js              # Task event broadcasting
│   │   │   └── eventLog.js                 # Redis event log for replay
│   │   ├── services/
│   │   │   └── email.service.js            # Nodemailer service
│   │   ├── jobs/
│   │   │   └── cron.js                     # node-cron cleanup
│   │   └── utils/
│   │       ├── ApiError.js                 # Custom error class
│   │       ├── catchAsync.js               # Async error wrapper
│   │       └── logger.js                   # Winston logger
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   └── docker-compose.yml
│
├── docker-compose.yml                      # Full stack (dev)
├── .gitignore
└── README.md
```

### 6.2. Module Pattern

Each module follows this structure:

```
modules/feature/
├── feature.routes.js       # Route definitions
├── feature.controller.js   # Request handlers
├── feature.service.js      # Business logic
└── feature.validation.js   # Joi validation schemas
```

### 6.3. Shared Code

```
shared/
├── config/                 # Configuration files
├── middleware/             # Shared middleware (auth, rbac)
├── services/               # Shared services (email)
└── utils/                  # Shared utilities
```

---

## 7. Tech Stack Summary

| Layer | Technology | Purpose | Hosting |
| --- | --- | --- | --- |
| **Frontend** | React + React-Konva | UI + Canvas | Vercel |
| **Real-Time** | [Socket.IO](http://socket.io/) | WebSocket | Render |
| **Backend** | Express.js | REST API | Render |
| **Database** | PostgreSQL | Persistent Data | Neon/Supabase |
| **Cache** | Redis | Sessions, Locks, Presence | Render/Railway |
| **Files** | Cloudinary | Uploads, CDN | Cloudinary |
| **Email** | Nodemailer | Notifications | Render |
| **Scheduling** | node-cron | Cleanup | Render |
| **Auth** | JWT + bcryptjs | Authentication | - |

---

## 8. Environment Variables

### Backend (.env)

```
# Server
NODE_ENV=development
PORT=5000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=sketchflow
DB_PASSWORD=sketchflow
DB_NAME=sketchflow
DB_POOL_MAX=20
DB_POOL_IDLE=30000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=SketchFlow <noreply@sketchflow.com>

# CORS
CORS_ORIGIN=http://localhost:5173,<https://sketchflow.vercel.app>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api/v1
VITE_WS_URL=ws://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

---

## 9. API Endpoints Summary

| Module | Endpoints | Description |
| --- | --- | --- |
| **Auth** | `/auth/register`, `/auth/login`, `/auth/me` | Authentication |
| **Users** | `/users/profile`, `/users/search` | User management |
| **Workspaces** | `/workspaces/*`, `/workspaces/:id/members/*` | Workspace + members |
| **Boards** | `/boards/*`, `/workspaces/:id/boards` | Board management |
| **Elements** | `/elements/*`, `/boards/:id/elements` | Whiteboard elements |
| **Tasks** | `/tasks/*`, `/boards/:id/tasks`, `/tasks/convert` | Task management |
| **Chat** | `/chat/*`, `/boards/:id/chat` | Real-time chat |
| **Files** | `/files/*`, `/boards/:id/files` | File management |
| **Activity** | `/boards/:id/activities` | Activity feed |
| **Health** | `/health`, `/health/detailed` | Monitoring |

---

## 10. [Socket.IO](http://socket.io/) Events Summary

| Client → Server | Server → Client | Purpose |
| --- | --- | --- |
| `board:join` | `user:joined` | Join board room |
| `board:leave` | `user:left` | Leave board room |
| `element:created` | `element:created` | Create element |
| `element:moved` | `element:updated` | Move element |
| `element:updated` | `element:updated` | Update element |
| `element:deleted` | `element:deleted` | Delete element |
| `element:lock` | `element:locked` | Lock element |
| `element:unlock` | `element:unlocked` | Unlock element |
| `lock:heartbeat` | `lock:lost` | Renew lock TTL |
| `cursor:move` | `cursor:updated` | Share cursor |
| `chat:send` | `chat:message` | Send chat message |
| `events:replay` | `events:replayed` | Replay missed events |

---

## 11. Key Patterns & Practices

| Pattern | Implementation | Purpose |
| --- | --- | --- |
| **Optimistic Updates** | UI updates immediately, sync in background | Responsive feel |
| **Version-Based Conflict Resolution** | Version counters on elements/tasks | Prevent concurrent edits |
| **TTL-Based Locking** | Redis SETNX with 30s TTL | Prevent edit conflicts |
| **Event Log + Replay** | Redis list with 60s TTL | Reconnection recovery |
| **RBAC** | Admin, Editor, Viewer roles | Access control |
| **Soft Delete** | `deleted_at` timestamp | Data recovery |
| **Direct Cloudinary Uploads** | Frontend uploads directly | No server bottleneck |

---

**This architecture is production-ready and scalable.** 🚀