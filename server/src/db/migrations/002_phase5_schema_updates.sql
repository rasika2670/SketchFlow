-- =============================================
-- SketchFlow — Phase 5 Database Schema Updates
-- Migration: 002_phase5_schema_updates.sql
-- =============================================

-- Add deleted_at column to chat_messages for soft deletes
ALTER TABLE chat_messages
ADD COLUMN deleted_at TIMESTAMP;

-- Create an index to help filter out deleted messages faster if needed
CREATE INDEX idx_chat_messages_deleted_at ON chat_messages(deleted_at) WHERE deleted_at IS NULL;

-- Make board_id nullable and add workspace_id for workspace-level activities
ALTER TABLE activity_logs
ALTER COLUMN board_id DROP NOT NULL,
ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX idx_activity_logs_workspace ON activity_logs(workspace_id, created_at DESC);
