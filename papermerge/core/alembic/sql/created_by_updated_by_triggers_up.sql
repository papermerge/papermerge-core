-- Function to handle audit fields for roles table
CREATE OR REPLACE FUNCTION set_created_by_updated_by()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
BEGIN
    BEGIN
        current_user_id := current_setting('app.user_id', true)::uuid;
    EXCEPTION
        WHEN others THEN
            current_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        -- Only set if not already provided
        IF NEW.created_by IS NULL THEN
            NEW.created_by := current_user_id;
        END IF;
        IF NEW.updated_by IS NULL THEN
            NEW.updated_by := current_user_id;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        NEW.created_by := OLD.created_by;
        IF NEW.updated_by IS NULL THEN
            NEW.updated_by := current_user_id;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_created_by_updated_by_trigger_roles
    BEFORE INSERT OR UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_updated_by();

CREATE TRIGGER set_created_by_updated_by_trigger_users
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_updated_by();

CREATE TRIGGER set_created_by_updated_by_trigger_groups
    BEFORE INSERT OR UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_updated_by();

CREATE TRIGGER set_created_by_updated_by_trigger_custom_fields
    BEFORE INSERT OR UPDATE ON custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_updated_by();

CREATE TRIGGER set_created_by_updated_by_trigger_document_types
    BEFORE INSERT OR UPDATE ON document_types
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_updated_by();

CREATE TRIGGER set_created_by_updated_by_trigger_tags
    BEFORE INSERT OR UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_updated_by();

CREATE TRIGGER set_created_by_updated_by_trigger_nodes
    BEFORE INSERT OR UPDATE ON nodes
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_updated_by();

CREATE TRIGGER set_created_by_updated_by_trigger_document_versions
    BEFORE INSERT OR UPDATE ON document_versions
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by_updated_by();
