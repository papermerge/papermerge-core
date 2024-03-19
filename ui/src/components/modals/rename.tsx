import React, { ChangeEvent, useState } from 'react';
import { createRoot } from "react-dom/client";

import Form from 'react-bootstrap/Form';
import GenericModal from 'components/modals/Generic';
import { fetcher_patch } from 'utils/fetcher';
import type { NodeType } from 'types';
import { MODALS } from 'cconstants';


type Args = {
  onCancel: (msg?: string) => void;
  onOK: (node: NodeType) => void;
  node_id: string;
  old_title: string | null | undefined;
}

type RenameType = {
  title: string;
}


async function api_rename_node(
  node_id: string,
  title: string,
  signal: AbortSignal
): Promise<NodeType> {
  let data: RenameType = {
    'title': title || ''
  };

  return fetcher_patch<RenameType, NodeType>(
    `/api/nodes/${node_id}`,
    data,
    signal
  );
}


const RenameModal = ({onCancel, onOK, node_id, old_title}: Args) => {
  const [title, setTitle] = useState<string>(old_title || '');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;

    setTitle(value);
    setErrorMessage('');
  }

  const handleSubmit = async (signal: AbortSignal) => {
    try {
      let response = await api_rename_node(node_id, title, signal);
      let new_node: NodeType = response as NodeType;

      onOK(new_node);
    } catch (error: any) {
      onCancel(error.toString());
    }
  }

  const handleCancel = () => {
    setTitle('');
    setErrorMessage('');

    onCancel();
  }

  return (
    <GenericModal
      modal_title='Rename'
      submit_button_title='Rename'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        <Form.Label htmlFor="title">Rename</Form.Label>
        <Form.Control
          aria-describedby="new title"
          defaultValue={old_title || ''}
          onChange={handleTitleChanged} />
    </GenericModal>
  );
}


function rename_node(
  node_id: string,
  old_title: string | null | undefined
): Promise<NodeType> {
  /* Opens rename modal dialog

  Returns a promise with NodeType.
  NodeType will be fulfilled when server returns.
  Fulfilled NodeType has new nodes titles (or whatever server returns).
  */
  let modals = document.getElementById(MODALS);

  let promise = new Promise<NodeType>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <RenameModal
          node_id={node_id}
          old_title={old_title}
          onOK={onOK}  // handler for resolve
          onCancel={onCancel} // handler for reject
        />
      );
    }
  }); // END of new Promise...

  return promise;
}

export default rename_node;
