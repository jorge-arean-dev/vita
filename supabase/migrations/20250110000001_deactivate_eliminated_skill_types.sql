-- Skill Type Simplification Migration  
-- Created: 2025-09-10
-- Purpose: Eliminate redundant skill types to simplify matching algorithms
-- 
-- CHANGE SUMMARY:
-- - Deactivate 3 eliminated skill types: 'industry', 'role', 'technology_domain'
-- - Keep 3 core types active: 'technical_skill', 'soft_skill', 'certification'
-- - Maintains referential integrity (no data deletion)
-- - Allows future reactivation if needed
--
-- IMPACT:
-- - Frontend dropdowns will show only 3 skill types (via is_active filtering)
-- - Backend matching routes eliminated types to technical skill matching
-- - Existing skills with eliminated types remain in database but are treated as technical skills
-- - New skills can only be created with the 3 core types

UPDATE skill_types 
SET is_active = false 
WHERE name IN ('industry', 'role', 'technology_domain');

-- Post-migration verification:
-- Expected active types: technical_skill, soft_skill, certification (3 total)
-- Expected inactive types: industry, role, technology_domain (3 total)
-- Total skill types: 6 (3 active + 3 inactive)