-- Migration: 004_chat_attachments
-- Description: Adds an optional attachment_id column to the chat_messages table to support file uploads in chat.

BEGIN;

ALTER TABLE chat_messages
ADD COLUMN attachment_id UUID REFERENCES files(id) ON DELETE SET NULL;

ALTER TABLE files
ADD COLUMN url VARCHAR(1000);

COMMIT;
