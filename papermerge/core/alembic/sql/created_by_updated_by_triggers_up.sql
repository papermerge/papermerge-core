-- Function to handle audit fields for roles table
CREATE OR REPLACE FUNCTION set_created_by_updated_by()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get the user_id from the session context
    BEGIN
        current_user_id := current_setting('app.user_id', true)::uuid;
    EXCEPTION
        WHEN others THEN
            current_user_id := NULL;
    END;

    -- Handle INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Set created_by to the current user from context
        NEW.created_by := current_user_id;
        -- Also set updated_by for consistency (since it's a new record)
        NEW.updated_by := current_user_id;
        RETURN NEW;
    END IF;

    -- Handle UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- Don't allow changing created_by on updates
        NEW.created_by := OLD.created_by;
        -- Set updated_by to the current user from context
        NEW.updated_by := current_user_id;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_created_by_updated_by_trigger
    BEFORE INSERT OR UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_updated_by();
