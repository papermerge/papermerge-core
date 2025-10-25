-- Helper function: Get document tags as array
CREATE OR REPLACE FUNCTION get_document_tags(p_document_id UUID)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT t.name
        FROM tags t
        INNER JOIN nodes_tags nt ON nt.tag_id = t.id
        WHERE nt.node_id = p_document_id
        ORDER BY t.name
    );
END;
$$ LANGUAGE plpgsql STABLE;


-- Helper function: Get custom fields text (only text-based fields for document type)
CREATE OR REPLACE FUNCTION get_document_custom_fields_text(
    p_document_id UUID,
    p_document_type_id UUID
) RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    IF p_document_type_id IS NULL THEN
        RETURN '';
    END IF;

    SELECT string_agg(cfv.value_text, ' ')
    INTO result
    FROM custom_field_values cfv
    INNER JOIN custom_fields cf ON cf.id = cfv.field_id
    INNER JOIN document_types_custom_fields dtcf
        ON dtcf.custom_field_id = cf.id
        AND dtcf.document_type_id = p_document_type_id
    WHERE cfv.document_id = p_document_id
      AND cf.type_handler IN ('text', 'url', 'email')
      AND cfv.value_text IS NOT NULL
      AND cfv.value_text != '';

    RETURN COALESCE(result, '');
END;
$$ LANGUAGE plpgsql STABLE;


-- Helper function: Map language code to PostgreSQL regconfig
CREATE OR REPLACE FUNCTION map_lang_to_regconfig(p_lang VARCHAR)
RETURNS REGCONFIG AS $$
BEGIN
    RETURN CASE p_lang
        -- Map ISO 639-3 codes to PostgreSQL text search configs
        WHEN 'deu' THEN 'german'::regconfig
        WHEN 'eng' THEN 'english'::regconfig
        WHEN 'fra' THEN 'french'::regconfig
        WHEN 'spa' THEN 'spanish'::regconfig
        WHEN 'ita' THEN 'italian'::regconfig
        WHEN 'por' THEN 'portuguese'::regconfig
        WHEN 'rus' THEN 'russian'::regconfig
        WHEN 'nld' THEN 'dutch'::regconfig
        WHEN 'swe' THEN 'swedish'::regconfig
        WHEN 'nor' THEN 'norwegian'::regconfig
        WHEN 'dan' THEN 'danish'::regconfig
        WHEN 'fin' THEN 'finnish'::regconfig
        WHEN 'tur' THEN 'turkish'::regconfig
        WHEN 'ron' THEN 'romanian'::regconfig
        ELSE 'simple'::regconfig  -- fallback
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Main function: Upsert document search index
CREATE OR REPLACE FUNCTION upsert_document_search_index(p_document_id UUID)
RETURNS VOID AS $$
DECLARE
    v_title TEXT;
    v_title_clean TEXT;
    v_lang VARCHAR(10);
    v_document_type_id UUID;
    v_document_type_name TEXT;
    v_owner_type VARCHAR(20);
    v_owner_id UUID;
    v_tags TEXT[];
    v_custom_fields TEXT;
    v_searchable_text TEXT;
    v_regconfig REGCONFIG;
BEGIN
    -- Get document basic info
    SELECT
        n.title,
        COALESCE(n.lang, 'eng'),
        d.document_type_id
    INTO v_title, v_lang, v_document_type_id
    FROM documents d
    INNER JOIN nodes n ON n.id = d.node_id
    WHERE d.node_id = p_document_id;

    IF NOT FOUND THEN
        -- Document doesn't exist, delete from index if present
        DELETE FROM document_search_index WHERE document_id = p_document_id;
        RETURN;
    END IF;

    -- Get ownership
    SELECT owner_type, owner_id
    INTO v_owner_type, v_owner_id
    FROM ownerships
    WHERE resource_type = 'node' AND resource_id = p_document_id;

    IF NOT FOUND THEN
        -- No owner = no access, remove from index
        DELETE FROM document_search_index WHERE document_id = p_document_id;
        RETURN;
    END IF;

    -- Get document type name
    IF v_document_type_id IS NOT NULL THEN
        SELECT name INTO v_document_type_name
        FROM document_types
        WHERE id = v_document_type_id;
    END IF;

    -- Get tags
    v_tags := get_document_tags(p_document_id);

    -- Get custom fields text
    v_custom_fields := get_document_custom_fields_text(p_document_id, v_document_type_id);

    v_title_clean := replace(v_title, '.', ' ');

    -- Concatenate all searchable content
    v_searchable_text := CONCAT_WS(' ',
        v_title_clean,
        v_document_type_name,
        array_to_string(v_tags, ' '),
        v_custom_fields
    );

    -- Map language to regconfig
    v_regconfig := map_lang_to_regconfig(v_lang);

    -- Insert or update
    INSERT INTO document_search_index (
        document_id,
        document_type_id,
        owner_type,
        owner_id,
        lang,
        title,
        document_type_name,
        tags,
        custom_fields_text,
        search_vector,
        last_updated
    ) VALUES (
        p_document_id,
        v_document_type_id,
        v_owner_type,
        v_owner_id,
        v_lang,
        v_title,
        v_document_type_name,
        v_tags,
        v_custom_fields,
        to_tsvector(v_regconfig, v_searchable_text),
        NOW()
    )
    ON CONFLICT (document_id) DO UPDATE SET
        document_type_id = EXCLUDED.document_type_id,
        owner_type = EXCLUDED.owner_type,
        owner_id = EXCLUDED.owner_id,
        lang = EXCLUDED.lang,
        title = EXCLUDED.title,
        document_type_name = EXCLUDED.document_type_name,
        tags = EXCLUDED.tags,
        custom_fields_text = EXCLUDED.custom_fields_text,
        search_vector = EXCLUDED.search_vector,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;
