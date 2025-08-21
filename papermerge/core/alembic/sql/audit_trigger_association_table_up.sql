CREATE OR REPLACE FUNCTION audit_association_trigger_function()
RETURNS TRIGGER AS $
DECLARE
    audit_row audit_log%ROWTYPE;
    audit_message text;
    entity1_name text;
    entity2_name text;
    node_name_or_path text;
    custom_field_label text;
BEGIN
    -- Generate human-readable audit messages
    CASE TG_TABLE_NAME
        WHEN 'users_roles' THEN
            SELECT username INTO entity1_name FROM users WHERE id = COALESCE(NEW.user_id, OLD.user_id);
            SELECT name INTO entity2_name FROM roles WHERE id = COALESCE(NEW.role_id, OLD.role_id);

            IF TG_OP = 'INSERT' THEN
                audit_message = format('User "%s" was assigned role "%s"', entity1_name, entity2_name);
            ELSIF TG_OP = 'DELETE' THEN
                audit_message = format('User "%s" was removed from role "%s"', entity1_name, entity2_name);
            END IF;

        WHEN 'users_groups' THEN
            SELECT username INTO entity1_name FROM users WHERE id = COALESCE(NEW.user_id, OLD.user_id);
            SELECT name INTO entity2_name FROM groups WHERE id = COALESCE(NEW.group_id, OLD.group_id);

            IF TG_OP = 'INSERT' THEN
                audit_message = format('User "%s" was added to group "%s"', entity1_name, entity2_name);
            ELSIF TG_OP = 'DELETE' THEN
                audit_message = format('User "%s" was removed from group "%s"', entity1_name, entity2_name);
            END IF;

        WHEN 'roles_permissions' THEN
            SELECT name INTO entity1_name FROM roles WHERE id = COALESCE(NEW.role_id, OLD.role_id);
            SELECT name INTO entity2_name FROM permissions WHERE id = COALESCE(NEW.permission_id, OLD.permission_id);

            IF TG_OP = 'INSERT' THEN
                audit_message = format('Permission "%s" was granted to role "%s"', entity2_name, entity1_name);
            ELSIF TG_OP = 'DELETE' THEN
                audit_message = format('Permission "%s" was revoked from role "%s"', entity2_name, entity1_name);
            END IF;

        WHEN 'nodes_tags' THEN
            -- Get node name or path (assuming nodes table has name/path field)
            SELECT COALESCE(name, path, 'Node ID: ' || id::text)
            INTO node_name_or_path
            FROM nodes
            WHERE id = COALESCE(NEW.node_id, OLD.node_id);

            SELECT name INTO entity2_name FROM tags WHERE id = COALESCE(NEW.tag_id, OLD.tag_id);

            IF TG_OP = 'INSERT' THEN
                audit_message = format('Tag "%s" was added to node "%s"', entity2_name, node_name_or_path);
            ELSIF TG_OP = 'DELETE' THEN
                audit_message = format('Tag "%s" was removed from node "%s"', entity2_name, node_name_or_path);
            END IF;

        WHEN 'document_types_custom_fields' THEN
            SELECT name INTO entity1_name FROM document_types WHERE id = COALESCE(NEW.document_type_id, OLD.document_type_id);

            -- Get custom field name/label (assuming custom_fields table has name or label field)
            SELECT COALESCE(label, name, 'Field ID: ' || id::text)
            INTO custom_field_label
            FROM custom_fields
            WHERE id = COALESCE(NEW.custom_field_id, OLD.custom_field_id);

            IF TG_OP = 'INSERT' THEN
                audit_message = format('Custom field "%s" was added to document type "%s"', custom_field_label, entity1_name);
            ELSIF TG_OP = 'DELETE' THEN
                audit_message = format('Custom field "%s" was removed from document type "%s"', custom_field_label, entity1_name);
            ELSIF TG_OP = 'UPDATE' THEN
                -- Handle case where association table has additional fields like sort_order, is_required, etc.
                audit_message = format('Custom field "%s" configuration updated for document type "%s"', custom_field_label, entity1_name);
            END IF;
    END CASE;

    -- Populate audit record
    audit_row.id = gen_random_uuid();
    audit_row.record_id = gen_random_uuid(); -- Generate UUID for association records
    audit_row.table_name = TG_TABLE_NAME;
    audit_row.operation = TG_OP;
    audit_row.timestamp = now();
    audit_row.old_values = CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD)::jsonb END;
    audit_row.new_values = CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb END;
    audit_row.audit_message = audit_message; -- Human-readable message

    -- Get application context
    BEGIN
        audit_row.user_id = nullif(current_setting('app.user_id', true), '')::uuid;
        audit_row.username = nullif(current_setting('app.username', true), '');
        audit_row.session_id = nullif(current_setting('app.session_id', true), '');
        audit_row.reason = nullif(current_setting('app.reason', true), '');
    EXCEPTION WHEN OTHERS THEN
        -- Continue if context retrieval fails
    END;

    INSERT INTO audit_log VALUES (audit_row.*);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- User-Role associations
CREATE TRIGGER audit_users_roles_trigger
    AFTER INSERT OR DELETE ON users_roles
    FOR EACH ROW EXECUTE FUNCTION audit_association_trigger_function();

-- User-Group associations
CREATE TRIGGER audit_users_groups_trigger
    AFTER INSERT OR DELETE ON users_groups
    FOR EACH ROW EXECUTE FUNCTION audit_association_trigger_function();

-- Role-Permission associations
CREATE TRIGGER audit_roles_permissions_trigger
    AFTER INSERT OR DELETE ON roles_permissions
    FOR EACH ROW EXECUTE FUNCTION audit_association_trigger_function();

-- Node-Tag associations
CREATE TRIGGER audit_nodes_tags_trigger
    AFTER INSERT OR DELETE ON nodes_tags
    FOR EACH ROW EXECUTE FUNCTION audit_association_trigger_function();

-- Document Type-Custom Field associations (includes UPDATE for configuration changes)
CREATE TRIGGER audit_document_types_custom_fields_trigger
    AFTER INSERT OR UPDATE OR DELETE ON document_types_custom_fields
    FOR EACH ROW EXECUTE FUNCTION audit_association_trigger_function();
