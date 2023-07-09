import { useState } from 'react';
import React from 'react';

import RainbowTags from 'components/tags/rainbow-tags';
import GenericModal from './generic_modal';

import { get_default_headers, fetcher_post } from 'utils/fetcher';
import type { NodeType, ColoredTagType } from 'types';


type Args = {
  onCancel: () => void;
  onSubmit: (node: NodeType) => void;
  node_id: string;
  tags: Array<ColoredTagType> | null;
}

const EditTagsModal = ({onCancel, onSubmit, node_id, tags}: Args) => {
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [current_tags, setCurrentTags] = useState<ColoredTagType[]>([]);
  const headers = get_default_headers();

  const handleTagsChanged = (tags: ColoredTagType[]) => {
    setCurrentTags(tags);
  }

  const handleSubmit = async () => {
    let tag_names = current_tags.map(tag => tag.name);

    let response_node: NodeType = await fetcher_post<string[], NodeType>(
      `/api/nodes/${node_id}/tags`,
      tag_names,
      controller.signal
    );
    onSubmit(response_node);
  }

  const handleCancel = async () => {
    controller.abort();
    onCancel();
    setController(new AbortController());
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

export default EditTagsModal;
