import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { fetcher_delete } from '@/utils/fetcher';
import type { FolderType, NodeType } from '@/types';


type Args = {
  onCancel: () => void;
  onSubmit: (node_ids: string[]) => void;
  show: boolean;
  node_ids: string[];
}


async function delete_nodes(node_ids: string[]): Promise<string[]> {
  return fetcher_delete<string[], string[]>('/nodes/', node_ids);
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

const DeleteNodesModal = ({show, onCancel, onSubmit, node_ids}: Args) => {
  const [title, setTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  const handleSubmit = async () => {
    let response = await delete_nodes(node_ids);
    onSubmit(node_ids);
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
          Delete Selected Nodes
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure?
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        <Button variant='danger' onClick={handleSubmit}>Delete</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DeleteNodesModal;