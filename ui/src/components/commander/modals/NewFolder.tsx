import React, { ChangeEvent } from 'react';
import { useState } from 'react';
import { createRoot } from "react-dom/client";

import Form from 'react-bootstrap/Form';

import GenericModal from 'components/modals/Generic';
import { fetcher_post } from 'utils/fetcher';
import type { FolderType, NodeType } from 'types';
import { MODALS } from 'cconstants';


type CreateFolderType = {
  title: string;
  parent_id: string;
  ctype: 'folder';
}

type Args = {
  parent_id: string;
  onOK: (node: NodeType) => void;
  onCancel: (msg?: string) => void;
}


async function api_create_new_folder(
  title: string,
  parent_id: string,
  signal: AbortSignal
): Promise<FolderType> {
  let data: CreateFolderType = {
    'title': title,
    'parent_id': parent_id,
    'ctype': 'folder'
  };

  return fetcher_post<CreateFolderType, FolderType>('/api/nodes/', data, signal);
}


const NewFolderModal = ({parent_id, onOK, onCancel}: Args) => {
  const [title, setTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;

    setTitle(value);
    setErrorMessage('');
  }

  const handleSubmit = async (signal: AbortSignal) => {
    try {
      let response = await api_create_new_folder(title, parent_id, signal);
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
      modal_title='Create Folder'
      submit_button_title='Create'
      onSubmit={handleSubmit}
      onCancel={handleCancel}>
        <Form.Label htmlFor="title">Folder Title</Form.Label>
        <Form.Control
          aria-describedby="new title"
          onChange={handleTitleChanged} />
    </GenericModal>
  );
}


function create_new_folder(parent_id: string) {
  let modals = document.getElementById(MODALS);

  let promise = new Promise<NodeType>(function(onOK, onCancel){
    if (modals) {
      let dom_root = createRoot(modals);

      dom_root.render(
        <NewFolderModal
          parent_id={parent_id}
          onOK={onOK}
          onCancel={onCancel} />
      );
    }
  }); // new Promise...

  return promise;
}

export default create_new_folder;
