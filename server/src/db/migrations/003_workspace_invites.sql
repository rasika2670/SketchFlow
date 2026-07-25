-- =============================================
-- SketchFlow — Schema Updates
-- Migration: 003_workspace_invites.sql
-- =============================================

CREATE TABLE workspace_invites (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer',
    invited_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_workspace_invite_role
        CHECK (role IN ('admin', 'editor', 'viewer')),

    -- A user can only have one pending invite per workspace at a time
    CONSTRAINT uq_workspace_invite_user UNIQUE (workspace_id, user_id)
);

CREATE INDEX idx_workspace_invites_user ON workspace_invites(user_id);
