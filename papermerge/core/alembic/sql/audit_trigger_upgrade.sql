-- Generic audit trigger function for PostgreSQL
-- This function can be reused across multiple tables

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_log%ROWTYPE;
    old_data jsonb;
    new_data jsonb;
    changed_fields jsonb;
BEGIN
    -- Determine operation and set up data
    IF TG_OP = 'DELETE' THEN
        audit_row.record_id = OLD.id;
        old_data = row_to_json(OLD)::jsonb;
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        audit_row.record_id = NEW.id;
        old_data = NULL;
        new_data = row_to_json(NEW)::jsonb;
    ELSIF TG_OP = 'UPDATE' THEN
        audit_row.record_id = NEW.id;
        old_data = row_to_json(OLD)::jsonb;
        new_data = row_to_json(NEW)::jsonb;

        -- Calculate changed fields
        SELECT jsonb_agg(key) INTO changed_fields
        FROM (
            SELECT o.key
            FROM jsonb_each(old_data) o
            JOIN jsonb_each(new_data) n USING (key)
            WHERE o.value IS DISTINCT FROM n.value
        ) diff;
    END IF;

    -- Populate audit record
    audit_row.id = gen_random_uuid();
    audit_row.table_name = TG_TABLE_NAME;
    audit_row.operation = TG_OP;
    audit_row.timestamp = now();
    audit_row.old_values = old_data;
    audit_row.new_values = new_data;
    audit_row.changed_fields = changed_fields;

    -- Try to get application context from PostgreSQL session variables
    -- These can be set by the application before operations
    BEGIN
        audit_row.user_id = nullif(current_setting('app.user_id', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
        audit_row.user_id = NULL;
    END;

    BEGIN
        audit_row.username = nullif(current_setting('app.username', true), '');
    EXCEPTION WHEN OTHERS THEN
        audit_row.username = NULL;
    END;

    BEGIN
        audit_row.session_id = nullif(current_setting('app.session_id', true), '');
    EXCEPTION WHEN OTHERS THEN
        audit_row.session_id = NULL;
    END;

    BEGIN
        audit_row.reason = nullif(current_setting('app.reason', true), '');
    EXCEPTION WHEN OTHERS THEN
        audit_row.reason = NULL;
    END;

    -- Insert audit record
    INSERT INTO audit_log VALUES (audit_row.*);

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for specific tables
-- For nodes table
CREATE TRIGGER audit_nodes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON nodes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- For document_versions table
CREATE TRIGGER audit_document_versions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_versions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- For custom_fields table
CREATE TRIGGER audit_custom_fields_trigger
    AFTER INSERT OR UPDATE OR DELETE ON custom_fields
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- For document_types/categories table
CREATE TRIGGER audit_categories_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_types
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- For shared_nodes table
CREATE TRIGGER audit_shared_nodes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON shared_nodes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- For tags table
CREATE TRIGGER audit_tags_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tags
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- For roles table
CREATE TRIGGER audit_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- For users table
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- For groups table
CREATE TRIGGER audit_groups_trigger
    AFTER INSERT OR UPDATE OR DELETE ON groups
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Helper function to set application context
CREATE OR REPLACE FUNCTION set_audit_context(
    p_user_id uuid,
    p_username text,
    p_session_id text DEFAULT NULL,
    p_reason text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    IF p_user_id IS NOT NULL THEN
        PERFORM set_config('app.user_id', p_user_id::text, false);
    END IF;

    IF p_username IS NOT NULL AND trim(p_username) != '' THEN
        PERFORM set_config('app.username', p_username, false);
    END IF;

    IF p_session_id IS NOT NULL THEN
        PERFORM set_config('app.session_id', p_session_id, false);
    END IF;
    IF p_reason IS NOT NULL THEN
        PERFORM set_config('app.reason', p_reason, false);
    END IF;
END;
$$ LANGUAGE plpgsql;
