# Product Requirements Document

---

## 1. Project Overview

| Attribute | Details |
| --- | --- |
| **Project Name** | SketchFlow |
| **Type** | Real-Time Visual Collaboration Platform |
| **Tagline** | Where Ideas Become Work |
| **Status** | MVP Development |
| **Version** | 1.0.0 |

**Description:** SketchFlow is a modern, real-time visual collaboration platform that seamlessly bridges brainstorming, communication, and task management into a single workspace. Teams collaborate on an infinite whiteboard with live drawing synchronization, cursor presence, and instant updates. Sticky notes convert to actionable tasks with assignees and deadlines, ensuring ideas never get lost. Built with React, Node.js, PostgreSQL, Redis, and [Socket.IO](http://socket.io/).

---

## 2. Target Users

| User Type | Description | Key Needs |
| --- | --- | --- |
| **Product Teams** | PMs, designers, developers planning roadmaps | Brainstorming, visual planning, task tracking |
| **Design Teams** | UI/UX designers, creative professionals | Visual collaboration, feedback, design reviews |
| **Remote Teams** | Distributed teams working async | Real-time sync, chat, file sharing |
| **Startups** | Small teams building products | All-in-one tool, low cost, ease of use |
| **Educators** | Teachers, students, trainers | Interactive sessions, group projects |
| **Freelancers** | Solo professionals managing clients | Project planning, client collaboration |

---

## 3. Problem Statement

**Current collaboration tools are fragmented:**

- Teams use separate apps for whiteboarding (Miro), task management (Jira), and communication (Slack)
- Ideas from brainstorming sessions get lost when moving to task management
- No single source of truth — information scattered across platforms
- Real-time collaboration gaps exist in many tools
- High costs from multiple subscriptions
- Steep learning curves for complex tools

**SketchFlow solves this by being the single workspace where ideas become work.**

---

## 4. Core Features

### 4.1. Whiteboard (Canvas)

| Feature | Description | Priority |
| --- | --- | --- |
| Infinite Canvas | Unlimited zoom and pan for unrestricted brainstorming | P0 |
| Shape Drawing | Rectangles, circles, lines, arrows, and text | P0 |
| Sticky Notes | Color-coded notes with editable text | P0 |
| Real-Time Sync | All drawings appear instantly for connected users | P0 |
| Cursor Presence | View teammates' cursors, names, and selected tools | P0 |
| Live Selection Indicators | Highlight objects being edited with user-specific colors | P0 |
| Element Locking | Prevent editing conflicts while modifying elements | P0 |
| Optimistic Updates | Apply changes immediately, sync in background | P0 |
| Auto-Save | Automatically save board changes | P0 |
| Image Uploads | Drag and drop images onto the canvas | P1 |
| Element Grouping | Group multiple elements for easier management | P2 |
| Undo/Redo | Standard undo/redo functionality | P1 |

### 4.2. Sticky Note → Task Conversion

| Feature | Description | Priority |
| --- | --- | --- |
| Convert Sticky to Task | Click a sticky note and convert to task | P0 |
| Preserve Context | Maintain link back to original sticky note | P0 |
| Snapshot Capture | Capture sticky note text at conversion time | P0 |
| Bulk Conversion | Convert multiple sticky notes to tasks | P2 |

### 4.3. Task Management

| Feature | Description | Priority |
| --- | --- | --- |
| Task Creation | Create tasks with title, description, priority | P0 |
| Task Board (Kanban) | Columns: Todo, In Progress, Review, Done | P0 |
| Task Assignment | Assign tasks to team members | P0 |
| Due Dates | Set deadlines for tasks | P0 |
| Task Status Updates | Move tasks across columns | P0 |
| Optimistic Locking | Prevent concurrent update conflicts | P0 |
| Task Filtering | Filter by assignee, status, priority | P1 |
| Task Search | Search across all tasks | P2 |

### 4.4. Real-Time Communication

| Feature | Description | Priority |
| --- | --- | --- |
| Board Chat | Contextual chat alongside the whiteboard | P0 |
| Threaded Replies | Reply to specific messages | P0 |
| User Presence | Display online/offline members | P0 |
| Activity Notifications | Notify when members join, tasks created, files uploaded | P0 |
| @Mentions | Mention users in chat | P1 |

### 4.5. Workspace Management

| Feature | Description | Priority |
| --- | --- | --- |
| Workspace Creation | Create and manage workspaces | P0 |
| Member Invites | Invite members via email or link | P0 |
| Role-Based Access | Admin, Editor, Viewer roles | P0 |
| Multiple Boards | Create multiple boards per workspace | P0 |
| Board Settings | Rename and delete boards | P0 |

### 4.6. File Management

| Feature | Description | Priority |
| --- | --- | --- |
| File Upload | Upload images, documents, and videos | P0 |
| File Previews | Preview images and documents | P1 |
| File Organization | Organize files by board | P1 |
| CDN Delivery | Fast file delivery via Cloudinary | P0 |

### 4.7. Activity & Logging

| Feature | Description | Priority |
| --- | --- | --- |
| Activity Feed | View recent activity in workspace | P0 |
| Audit Trail | Track all actions (task_created, member_joined, etc.) | P0 |

---

## 5. Technical Requirements

| Category | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React + React-Konva | UI rendering, whiteboard |
| **Real-Time** | [Socket.IO](http://socket.io/) | WebSocket communication |
| **Backend API** | Express.js | REST API endpoints |
| **Database** | PostgreSQL | Persistent data storage |
| **Cache** | Redis | Sessions, locks, presence, event log |
| **File Storage** | Cloudinary | File uploads, CDN delivery |
| **Authentication** | JWT + bcryptjs | User authentication |
| **Email** | Nodemailer | Email notifications |
| **Scheduling** | node-cron | Automated cleanup |
| **Hosting** | Vercel (FE) + Render (BE) | Deployment |

---

## 6. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| **Performance** | Page load < 2s, real-time latency < 100ms, API response < 300ms |
| **Scalability** | Support 10 concurrent users/board, 100 users/workspace |
| **Availability** | 99.9% uptime target, graceful shutdown, auto-reconnection |
| **Security** | JWT auth, bcrypt hashing, RBAC, rate limiting, CORS, input validation |
| **Usability** | Responsive design, keyboard shortcuts, dark mode, tooltips |
| **Rate Limiting** | 100 requests/15min per IP, 5 auth attempts/min |

---

## 7. User Journeys

### 7.1. New User Onboarding

```
1. User visits SketchFlow → Clicks "Sign Up"
2. User enters email, name, password
3. User redirected to dashboard
4. User clicks "Create Workspace" → Names workspace
5. User adds team members (optional)
6. User clicks "Create Board" → Starts brainstorming
```

### 7.2. Daily Team Workflow

```
1. User logs in → Sees workspace dashboard
2. User joins active board → Sees live cursors
3. User adds sticky notes for ideas
4. User collaborates with team on whiteboard
5. User converts sticky note to task → Assigns to team member
6. User updates task status
7. User chats with team in board sidebar
8. User uploads relevant file
9. User checks activity feed for updates
```

### 7.3. Sticky → Task Flow

```
1. User creates sticky note with idea
2. User right-clicks → "Convert to Task"
3. Popup appears with pre-filled title (from sticky)
4. User adds description, assignee, due date, priority
5. User clicks "Convert"
6. Task created → Appears in Task Board
7. Sticky note shows badge: "Converted to Task #123"
8. Clicking badge navigates to task
```

---

## 8. Success Metrics

| Metric | Target | Measurement |
| --- | --- | --- |
| Task Conversion Rate | 20%+ | Tasks created / Sticky notes created |
| Real-Time Sync Latency | < 100ms | Average WebSocket latency |
| User Retention | 70%+ | Users active after 30 days |
| Board Collaboration | 3+ users/board | Average users per board |
| User Satisfaction | 4.5/5 | User feedback rating |

---

## 9. Out of Scope

| Feature | Reason |
| --- | --- |
| Video/Audio Calling | WebRTC complexity, future phase |
| Screen Sharing | WebRTC complexity, future phase |
| Mobile App | React Native, future phase |
| Custom Templates | Nice-to-have, future phase |
| Advanced Analytics | Future phase |
| Third-Party Integrations | Slack, Jira, Trello, future phase |
| SSO / LDAP | Enterprise feature, future phase |

---

## 10. Development Timeline

| Phase | Duration | Focus | Deliverables |
| --- | --- | --- | --- |
| **1** | 2-3 days | Foundation & Auth | Auth system, users, database schema |
| **2** | 2-3 days | Workspaces & Boards | Workspace CRUD, boards, members |
| **3** | 3-4 days | Whiteboard + [Socket.IO](http://socket.io/) | Canvas, real-time sync, presence, locking |
| **4** | 2-3 days | Tasks + Conversion | Task CRUD, sticky → task conversion |
| **5** | 2-3 days | Chat + Files + Activity | Chat, file uploads, activity feed |
| **6** | 1-2 days | Production Hardening | Cron jobs, rate limiting, CORS, monitoring |
| **Total** | **12-18 days** |  | **Fully functional MVP** |

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Real-time sync complexity | High | Version-based conflict resolution, start simple |
| Database performance | Medium | Proper indexes, Redis caching |
| [Socket.IO](http://socket.io/) scaling | Medium | Redis adapter for horizontal scaling |
| Security vulnerabilities | High | JWT, RBAC, rate limiting, input validation |
| User adoption | Medium | Intuitive UX, onboarding hints |

---

## 12. Competitive Comparison

| Feature | SketchFlow | Miro | FigJam | Notion | Jira |
| --- | --- | --- | --- | --- | --- |
| Whiteboard | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sticky Notes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Real-Time Sync | ✅ | ✅ | ✅ | ✅ | ❌ |
| Task Management | ✅ | ❌ | ❌ | ✅ | ✅ |
| Sticky → Task | ✅ | ❌ | ❌ | ❌ | ❌ |
| Chat | ✅ | ✅ | ❌ | ❌ | ❌ |
| File Uploads | ✅ | ✅ | ✅ | ✅ | ✅ |
| RBAC | ✅ | ✅ | ✅ | ✅ | ✅ |
| Price | Free | $8/user | Free | $8/user | $7.50/user |

---

## 13. Glossary

| Term | Definition |
| --- | --- |
| **Board** | Collaborative workspace containing elements and tasks |
| **Element** | Object on canvas (rectangle, circle, sticky note, line, text, image) |
| **Sticky Note** | Colored note with editable text; can convert to task |
| **Task** | Actionable item with status, assignee, priority, due date |
| **Workspace** | Container for multiple boards and members |
| **RBAC** | Role-Based Access Control (Admin, Editor, Viewer) |
| **Optimistic Update** | UI updates immediately, syncs in background |
| **Versioning** | Element/task version number for conflict resolution |
| **Element Lock** | Prevents editing conflicts via temporary locking |
| **Event Log** | Redis event list for replay on reconnection |
| **Presence** | Real-time user status (online/offline, cursor location) |

---

## 14. Revision History

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 1.0 | 2026-07-13 | SketchFlow Team | Initial PRD |

---

**This PRD defines the complete scope for SketchFlow v1.0 MVP.**

**Ready to start building! 🚀**