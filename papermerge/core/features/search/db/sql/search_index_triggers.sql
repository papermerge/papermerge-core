-- papermerge/core/alembic/sql/search_index_triggers.sql

-- ============================================================================
-- TRIGGER: Update search index when document title changes
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_search_on_node()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process documents, not folders
    IF COALESCE(NEW.ctype, OLD.ctype) != 'document' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'UPDATE' AND (OLD.title IS DISTINCT FROM NEW.title) THEN
        PERFORM upsert_document_search_index(NEW.id);
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM upsert_document_search_index(NEW.id);
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM document_search_index WHERE document_id = OLD.id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nodes_search_update
AFTER INSERT OR UPDATE OF title OR DELETE ON nodes
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_node();


-- ============================================================================
-- TRIGGER: Update search index when document type or language changes
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_search_on_document()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND (
        OLD.document_type_id IS DISTINCT FROM NEW.document_type_id
    ) THEN
        PERFORM upsert_document_search_index(NEW.node_id);
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM upsert_document_search_index(NEW.node_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_search_update
AFTER INSERT OR UPDATE OF document_type_id ON documents
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_document();

CREATE TRIGGER trg_nodes_lang_search_update
AFTER UPDATE OF lang ON nodes
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_node();


-- ============================================================================
-- TRIGGER: Update search index when custom field values change
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_search_on_cfv()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM upsert_document_search_index(OLD.document_id);
    ELSE
        PERFORM upsert_document_search_index(NEW.document_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cfv_search_update
AFTER INSERT OR UPDATE OR DELETE ON custom_field_values
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_cfv();


-- ============================================================================
-- TRIGGER: Update search index when tags change
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_search_on_tags()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM upsert_document_search_index(OLD.node_id);
    ELSE
        PERFORM upsert_document_search_index(NEW.node_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tags_search_update
AFTER INSERT OR DELETE ON nodes_tags
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_tags();


-- ============================================================================
-- TRIGGER: Update search index when tag name changes
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_search_on_tag_name()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
        -- Update all documents with this tag
        PERFORM upsert_document_search_index(nt.node_id)
        FROM nodes_tags nt
        WHERE nt.tag_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tag_name_search_update
AFTER UPDATE OF name ON tags
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_tag_name();


-- ============================================================================
-- TRIGGER: Update search index when document type name changes
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_search_on_doctype()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
        -- Update all documents of this type
        PERFORM upsert_document_search_index(d.node_id)
        FROM documents d
        WHERE d.document_type_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_doctype_search_update
AFTER UPDATE OF name ON document_types
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_doctype();


-- ============================================================================
-- TRIGGER: Update search index when document type custom fields change
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_search_on_doctype_cf()
RETURNS TRIGGER AS $$
BEGIN
    -- When custom fields are added/removed from a document type,
    -- reindex all documents of that type
    IF TG_OP = 'DELETE' THEN
        PERFORM upsert_document_search_index(d.node_id)
        FROM documents d
        WHERE d.document_type_id = OLD.document_type_id;
    ELSE
        PERFORM upsert_document_search_index(d.node_id)
        FROM documents d
        WHERE d.document_type_id = NEW.document_type_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_doctype_cf_search_update
AFTER INSERT OR DELETE ON document_types_custom_fields
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_doctype_cf();


-- ============================================================================
-- TRIGGER: Update search index when ownership changes
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_search_on_ownership()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND (
        OLD.owner_type IS DISTINCT FROM NEW.owner_type
        OR OLD.owner_id IS DISTINCT FROM NEW.owner_id
    ) THEN
        IF NEW.resource_type = 'node' THEN
            PERFORM upsert_document_search_index(NEW.resource_id);
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.resource_type = 'node' THEN
        DELETE FROM document_search_index WHERE document_id = OLD.resource_id;
    ELSIF TG_OP = 'INSERT' AND NEW.resource_type = 'node' THEN
        PERFORM upsert_document_search_index(NEW.resource_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ownership_search_update
AFTER INSERT OR UPDATE OR DELETE ON ownerships
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_ownership();


-- ============================================================================
-- TRIGGER: Update search index when custom field name changes
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_search_on_cf_name()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
        -- Update all documents that have values for this custom field
        PERFORM upsert_document_search_index(cfv.document_id)
        FROM custom_field_values cfv
        WHERE cfv.field_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cf_name_search_update
AFTER UPDATE OF name ON custom_fields
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_on_cf_name();
