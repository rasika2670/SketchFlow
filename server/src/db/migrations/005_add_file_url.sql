-- Migration: 005_add_file_url
-- Description: Adds url column to files table

BEGIN;

ALTER TABLE files
ADD COLUMN IF NOT EXISTS url VARCHAR(1000);

COMMIT;
