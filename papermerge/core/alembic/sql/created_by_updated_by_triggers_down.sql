DROP TRIGGER IF EXISTS set_created_by_updated_by_trigger_document_versions ON document_versions;
DROP TRIGGER IF EXISTS set_created_by_updated_by_trigger_nodes ON nodes;
DROP TRIGGER IF EXISTS set_created_by_updated_by_trigger_tags ON tags;
DROP TRIGGER IF EXISTS set_created_by_updated_by_trigger_document_types ON document_types;
DROP TRIGGER IF EXISTS set_created_by_updated_by_trigger_custom_fields ON custom_fields;
DROP TRIGGER IF EXISTS set_created_by_updated_by_trigger_groups ON groups;
DROP TRIGGER IF EXISTS set_created_by_updated_by_trigger_users ON users;
DROP TRIGGER IF EXISTS set_created_by_updated_by_trigger_roles ON roles;
DROP FUNCTION IF EXISTS set_created_by_updated_by();
