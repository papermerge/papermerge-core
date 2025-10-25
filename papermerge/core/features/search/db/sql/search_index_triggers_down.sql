DROP TRIGGER IF EXISTS trg_cf_name_search_update ON custom_fields;
DROP TRIGGER IF EXISTS trg_ownership_search_update ON ownerships;
DROP TRIGGER IF EXISTS trg_doctype_cf_search_update ON document_types_custom_fields;
DROP TRIGGER IF EXISTS trg_doctype_search_update ON document_types;
DROP TRIGGER IF EXISTS trg_tag_name_search_update ON tags;
DROP TRIGGER IF EXISTS trg_tags_search_update ON nodes_tags;
DROP TRIGGER IF EXISTS trg_cfv_search_update ON custom_field_values;
DROP TRIGGER IF EXISTS trg_documents_search_update ON documents;
DROP TRIGGER IF EXISTS trg_nodes_search_update ON nodes;


DROP FUNCTION IF EXISTS trigger_update_search_on_cf_name();
DROP FUNCTION IF EXISTS trigger_update_search_on_ownership();
DROP FUNCTION IF EXISTS trigger_update_search_on_doctype_cf();
DROP FUNCTION IF EXISTS trigger_update_search_on_doctype();
DROP FUNCTION IF EXISTS trigger_update_search_on_tag_name();
DROP FUNCTION IF EXISTS trigger_update_search_on_tags();
DROP FUNCTION IF EXISTS trigger_update_search_on_cfv();
DROP FUNCTION IF EXISTS trigger_update_search_on_document();
DROP FUNCTION IF EXISTS trigger_update_search_on_node();