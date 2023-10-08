import React, { ChangeEvent } from 'react';
import { useState } from 'react';
import { createRoot } from "react-dom/client";

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import SpinnerButton from 'components/SpinnerButton';
import { fetcher_post } from 'utils/fetcher';
import type { FolderType, NodeType } from 'types';


type CreateFolderType = {
  title: string;
  parent_id: string;
  ctype: 'folder';
}

type Args = {
  parent_id: string;
  onOK: (node: NodeType) => void;
  onCancel: () => void;
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

function validate_title(value: string): boolean {
  if (!value) {
    return false;
  }

  if (!value.trim()) {
    return false;
  }

  return true;
}

const NewFolderModal = ({parent_id, onOK, onCancel}: Args) => {
  const [show, setShow] = useState<boolean>(true);
  const [title, setTitle] = useState('');
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [errorMessage, setErrorMessage] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  if (!controller) {
    setController(new AbortController());
  }

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;

    setTitle(value);
    setErrorMessage('');
    setIsEnabled(validate_title(value))
  }

  const handleSubmit = async () => {
    setInProgress(true);
    setIsEnabled(false);

    let response = await api_create_new_folder(title, parent_id, controller.signal);
    let new_node: NodeType = response as NodeType;

    onOK(new_node);
    setShow(false);
  }

  const handleCancel = () => {
    controller.abort();
    setTitle('');
    setErrorMessage('');

    onCancel();

    setShow(false);
    setInProgress(false);
    setController(new AbortController());
  }

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      animation={false}>
      <Modal.Header closeButton onClick={onCancel}>
        <Modal.Title id="contained-modal-title-vcenter">
          Create Folder
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Label htmlFor="title">Folder Title</Form.Label>
        <Form.Control
          aria-describedby="new title"
          onChange={handleTitleChanged} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        <SpinnerButton
          inProgress={inProgress}
          title={"Create"}
          onClick={() => handleSubmit()} />
      </Modal.Footer>
    </Modal>
  );
}


function create_new_folder(parent_id: string) {
  let modals = document.getElementById('modals');

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
