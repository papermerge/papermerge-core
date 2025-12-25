-- Triggers to enforce special folders business rules
-- 1. Users must always have exactly one home and one inbox folder
-- 2. Special folders cannot be deleted while owner exists

-- =============================================================================
-- Function: Check that user has exactly one home and one inbox folder
-- =============================================================================
CREATE OR REPLACE FUNCTION check_user_special_folders()
RETURNS TRIGGER AS $$
DECLARE
    home_count INTEGER;
    inbox_count INTEGER;
BEGIN
    -- Count home folders for this user
    SELECT COUNT(*) INTO home_count
    FROM special_folders
    WHERE owner_type = 'user'
      AND owner_id = NEW.id
      AND folder_type = 'home';

    -- Count inbox folders for this user
    SELECT COUNT(*) INTO inbox_count
    FROM special_folders
    WHERE owner_type = 'user'
      AND owner_id = NEW.id
      AND folder_type = 'inbox';

    -- User must have EXACTLY one home and EXACTLY one inbox
    IF home_count != 1 OR inbox_count != 1 THEN
        RAISE EXCEPTION 'User must have exactly one home folder and exactly one inbox folder. Found: % home, % inbox',
            home_count, inbox_count
            USING HINT = 'Every user requires both home and inbox folders';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Ensure user has special folders after insert
CREATE CONSTRAINT TRIGGER ensure_user_special_folders_after_insert
AFTER INSERT ON users
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_user_special_folders();


-- =============================================================================
-- Function: Prevent deletion of required special folders
-- =============================================================================
CREATE OR REPLACE FUNCTION prevent_special_folder_deletion()
RETURNS TRIGGER AS $$
DECLARE
    owner_exists BOOLEAN;
BEGIN
    -- Check if owner (user or group) still exists and is not deleted
    IF OLD.owner_type = 'user' THEN
        SELECT EXISTS(
            SELECT 1 FROM users
            WHERE id = OLD.owner_id
            AND deleted_at IS NULL
        ) INTO owner_exists;
    ELSIF OLD.owner_type = 'group' THEN
        SELECT EXISTS(
            SELECT 1 FROM groups
            WHERE id = OLD.owner_id
            AND deleted_at IS NULL
        ) INTO owner_exists;
    ELSE
        owner_exists := FALSE;
    END IF;

    -- If owner exists and is active, prevent deletion of home/inbox
    IF owner_exists AND (OLD.folder_type = 'home' OR OLD.folder_type = 'inbox') THEN
        RAISE EXCEPTION 'Cannot delete % folder while % exists. Delete the % (id: %) instead.',
            OLD.folder_type, OLD.owner_type, OLD.owner_type, OLD.owner_id
            USING HINT = 'Special folders are automatically deleted when the owner is deleted';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Prevent deletion of required special folders
CREATE TRIGGER prevent_required_special_folder_deletion
BEFORE DELETE ON special_folders
FOR EACH ROW
EXECUTE FUNCTION prevent_special_folder_deletion();
