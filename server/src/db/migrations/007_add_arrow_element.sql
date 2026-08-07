-- =============================================
-- Migration: 007_add_arrow_element.sql
-- =============================================

ALTER TABLE elements DROP CONSTRAINT IF EXISTS chk_element_type;

ALTER TABLE elements ADD CONSTRAINT chk_element_type 
    CHECK (type IN ('rectangle', 'circle', 'sticky', 'line', 'arrow', 'text', 'image'));
