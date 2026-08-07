-- =============================================
-- Migration: 008_add_element_properties.sql
-- =============================================

-- Add properties JSONB column for advanced styling (stroke, layer, opacity, etc.)
ALTER TABLE elements
ADD COLUMN properties JSONB DEFAULT '{}'::jsonb;
