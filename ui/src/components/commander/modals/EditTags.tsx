import { useState } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';

import RainbowTags from 'components/tag-input/rainbow-tags';
import GenericModal from 'components/modals/Generic';

import { get_default_headers, fetcher_post } from 'utils/fetcher';
import type { NodeType, ColoredTagType } from 'types';
import { MODALS } from 'cconstants';


type Args = {
  onCancel: (msg?: string) => void;
  onOK: (node: NodeType) => void;
  node_id: string;
  tags: Array<ColoredTagType> | null;
}

const EditTagsModal = ({onCancel, onOK, node_id, tags}: Args) => {
  const [current_tags, setCurrentTags] = useState<ColoredTagType[]>([]);
  const headers = get_default_headers();

  const handleTagsChanged = (tags: ColoredTagType[]) => {
    setCurrentTags(tags);
  }

  const handleSubmit = async (signal: AbortSignal) => {
    let tag_names = current_tags.map(tag => tag.name);

    try {
      let response_node: NodeType = await fetcher_post<string[], NodeType>(
        `/api/nodes/${node_id}/tags`,
        tag_names,
        signal
      );
      onOK(response_node);
    } catch (error: any) {
      onCancel(error.toString());
    }
  }

  const handleCancel = async () => {
    onCancel();
  }

  return (
    <GenericModal
      modal_title='Tags'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        <RainbowTags
          endpoint_url="/api/tags/"
          headers={headers}
          initial_tags={tags || []}
          onChange={handleTagsChanged} />
    </GenericModal>
  );
}

function edit_tags(node_id: string, initial_tags: ColoredTagType[] | null) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<NodeType>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <EditTagsModal
          node_id={node_id}
          tags={initial_tags}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default edit_tags;
