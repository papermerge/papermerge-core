import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import React, { ChangeEvent } from 'react';
import { fetcher_patch } from '@/utils/fetcher';
import type { NodeType } from '@/types';


type Args = {
  onCancel: () => void;
  onSubmit: (node: NodeType) => void;
  show: boolean;
  node_id: string;
  old_title: string;
}

type RenameType = {
  title: string;
}

async function rename_node(node_id: string, title: string): Promise<NodeType> {
  let data: RenameType = {
    'title': title
  };

  return fetcher_patch<RenameType, NodeType>(`/nodes/${node_id}`, data);
}

function validate_title(value: string, old_title: string): boolean {
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

const RenameModal = ({show, onCancel, onSubmit, node_id, old_title}: Args) => {
  const [title, setTitle] = useState(old_title);
  const [errorMessage, setErrorMessage] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;

    setTitle(value);
    setErrorMessage('');
    setIsEnabled(validate_title(value, old_title))
  }

  const handleSubmit = async () => {
    let response = await rename_node(node_id, title);
    let new_node: NodeType = response as NodeType;
    onSubmit(new_node);
  }

  const handleCancel = () => {
    setTitle('');
    setErrorMessage('');
    onCancel();
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
          defaultValue={old_title}
          onChange={handleTitleChanged} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!isEnabled}>Rename</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RenameModal;