import React, { ChangeEvent, useState } from 'react';
import { createRoot } from "react-dom/client";

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { fetcher_patch } from 'utils/fetcher';
import type { NodeType } from 'types';
import SpinnerButton from 'components/SpinnerButton';
import { MODALS } from 'cconstants';


type Args = {
  onCancel: () => void;
  onOK: (node: NodeType) => void;
  node_id: string;
  old_title: string | null | undefined;
}

type RenameType = {
  title: string;
}

async function api_rename_node(node_id: string, title: string): Promise<NodeType> {
  let data: RenameType = {
    'title': title || ''
  };

  return fetcher_patch<RenameType, NodeType>(`/api/nodes/${node_id}`, data);
}

function validate_title(value: string, old_title: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  if (!value.trim()) {
    return false;
  }

  if (value === old_title) {
    return false;
  }

  return true;
}


const RenameModal = ({onCancel, onOK, node_id, old_title}: Args) => {
  const [show, setShow] = useState<boolean>(true);
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [title, setTitle] = useState<string>(old_title || '');
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
    setIsEnabled(validate_title(value, old_title))
  }

  const handleSubmit = async () => {
    setInProgress(true);
    setIsEnabled(false);

    let response = await api_rename_node(node_id, title);
    let new_node: NodeType = response as NodeType;

    onOK(new_node);

    setInProgress(false);
    setShow(false);
    setIsEnabled(true);
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
          Rename
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Label htmlFor="title">Rename</Form.Label>
        <Form.Control
          aria-describedby="new title"
          defaultValue={old_title || ''}
          onChange={handleTitleChanged} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        <SpinnerButton
          inProgress={inProgress}
          title={"Rename"}
          onClick={handleSubmit} />
      </Modal.Footer>
    </Modal>
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
