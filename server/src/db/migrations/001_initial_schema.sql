-- =============================================
-- SketchFlow — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- =============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS
-- =============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    avatar_url      VARCHAR(500),
    reset_token_hash      VARCHAR(255),
    reset_token_expires_at TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- =============================================
-- 2. WORKSPACES
-- =============================================
CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    created_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. WORKSPACE_MEMBERS (Join Table)
-- =============================================
CREATE TABLE workspace_members (
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer',
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    invited_by      UUID REFERENCES users(id) ON DELETE SET NULL,

    PRIMARY KEY (workspace_id, user_id),

    CONSTRAINT chk_workspace_member_role
        CHECK (role IN ('admin', 'editor', 'viewer'))
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- =============================================
-- 4. BOARDS
-- =============================================
CREATE TABLE boards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boards_workspace ON boards(workspace_id);

-- =============================================
-- 5. ELEMENTS (Whiteboard shapes — with versioning)
-- =============================================
CREATE TABLE elements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id        UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL,
    x               DECIMAL(10,2) NOT NULL DEFAULT 0,
    y               DECIMAL(10,2) NOT NULL DEFAULT 0,
    width           DECIMAL(10,2),
    height          DECIMAL(10,2),
    color           VARCHAR(20),
    text            TEXT,
    version         INTEGER NOT NULL DEFAULT 1,
    created_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,

    CONSTRAINT chk_element_type
        CHECK (type IN ('rectangle', 'circle', 'sticky', 'line', 'text', 'image'))
);

CREATE INDEX idx_elements_board ON elements(board_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_elements_board_full ON elements(board_id, deleted_at);

-- =============================================
-- 6. TASKS (with optimistic locking via version)
-- =============================================
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'todo',
    priority        VARCHAR(10) NOT NULL DEFAULT 'medium',
    assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date        DATE,
    board_id        UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,

    CONSTRAINT chk_task_status
        CHECK (status IN ('todo', 'in_progress', 'review', 'done')),

    CONSTRAINT chk_task_priority
        CHECK (priority IN ('low', 'medium', 'high'))
);

CREATE INDEX idx_tasks_board ON tasks(board_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id) WHERE deleted_at IS NULL;

-- =============================================
-- 7. TASK_SOURCES (Links tasks to source sticky notes)
-- =============================================
CREATE TABLE task_sources (
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    element_id      UUID NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
    snapshot_text   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (task_id, element_id)
);

-- =============================================
-- 8. CHAT_MESSAGES (with threaded replies)
-- =============================================
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id        UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message         TEXT NOT NULL,
    parent_id       UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_board ON chat_messages(board_id, created_at DESC);
CREATE INDEX idx_chat_messages_parent ON chat_messages(parent_id);

-- =============================================
-- 9. FILES (Cloudinary metadata)
-- =============================================
CREATE TABLE files (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id        UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    public_id       VARCHAR(255) NOT NULL,
    mime_type       VARCHAR(100),
    size            INTEGER,
    uploaded_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_board ON files(board_id);

-- =============================================
-- 10. ACTIVITY_LOGS (Audit trail)
-- =============================================
CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id        UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action          VARCHAR(50) NOT NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_activity_action
        CHECK (action IN (
            'task_created', 'task_status_changed', 'task_assigned',
            'member_joined', 'member_removed',
            'file_uploaded', 'file_deleted',
            'element_created', 'element_deleted',
            'board_created', 'message_sent'
        ))
);

CREATE INDEX idx_activity_logs_board ON activity_logs(board_id, created_at DESC);
