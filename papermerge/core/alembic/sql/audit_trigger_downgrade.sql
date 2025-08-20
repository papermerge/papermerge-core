DROP TRIGGER IF EXISTS audit_nodes_trigger ON nodes;
DROP TRIGGER IF EXISTS audit_document_versions_trigger ON document_versions;
DROP TRIGGER IF EXISTS audit_custom_fields_trigger ON custom_fields;
DROP TRIGGER IF EXISTS audit_categories_trigger ON document_types;
DROP TRIGGER IF EXISTS audit_shared_nodes_trigger ON shared_nodes;
DROP TRIGGER IF EXISTS audit_tags_trigger ON tags;
DROP TRIGGER IF EXISTS audit_roles_trigger ON roles;
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
DROP TRIGGER IF EXISTS audit_groups_trigger ON groups;

DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
