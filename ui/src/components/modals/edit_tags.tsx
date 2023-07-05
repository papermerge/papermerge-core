import { useState } from 'react';
import React, { ChangeEvent } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { fetcher_patch } from 'utils/fetcher';
import type { NodeType, ColoredTagType } from 'types';


type Args = {
  onCancel: () => void;
  onSubmit: (node: NodeType) => void;
  show: boolean;
  node_id: string;
  tags: Array<ColoredTagType>;
}

type RenameType = {
  title: string;
}

async function rename_node(node_id: string, title: string): Promise<NodeType> {
  let data: RenameType = {
    'title': title
  };

  return fetcher_patch<RenameType, NodeType>(`/api/nodes/${node_id}`, data);
}



const EditTagsModal = ({show, onCancel, onSubmit, node_id, tags}: Args) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  const handleTagsChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;
  }

  const handleSubmit = async () => {
  }

  const handleCancel = () => {
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
          Tags
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Label htmlFor="tags">Tags</Form.Label>
        <Form.Control
          aria-describedby="tags"
          defaultValue={[]}
          onChange={handleTagsChanged} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!isEnabled}>Submit</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default EditTagsModal;
