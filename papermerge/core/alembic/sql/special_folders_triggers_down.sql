-- =============================================================================
-- Drop triggers first (must drop before dropping functions)
-- =============================================================================

DROP TRIGGER IF EXISTS prevent_required_special_folder_deletion ON special_folders;
DROP TRIGGER IF EXISTS ensure_user_special_folders_after_insert ON users;

-- Optional: Drop group validation trigger if you enabled it
-- DROP TRIGGER IF EXISTS ensure_group_special_folders_after_update ON groups;


-- =============================================================================
-- Drop functions (can only drop after triggers are removed)
-- =============================================================================

DROP FUNCTION IF EXISTS prevent_special_folder_deletion();
DROP FUNCTION IF EXISTS check_user_special_folders();
=====================================================================
