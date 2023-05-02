import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { fetcher_post } from '../../utils/fetcher';
import type { NodeType } from '@/types';


type Args = {
  onCancel: () => void;
  onSubmit: () => void;
  show: boolean;
  source_nodes: NodeType[];
  target_node: NodeType | undefined;
}

type MoveNodeType = {
  source_ids: string[];
  target_id: string | undefined;
}


async function move_nodes(
  source_nodes: NodeType[],
  target_node: NodeType | undefined
): Promise<string[]> {

  return fetcher_post<MoveNodeType, string[]>(
    '/api/nodes/move', {
      source_ids: source_nodes.map(node => node.id),
      target_id: target_node?.id
    }
  );
}


const DropNodesModal = ({
  show,
  onCancel,
  onSubmit,
  source_nodes,
  target_node
}: Args) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  const handleSubmit = async () => {
    let response = await move_nodes(source_nodes, target_node);
    onSubmit();
  }

  const handleCancel = () => {
    onCancel();
  }

  const source_titles = source_nodes.map(n => n.title);
  const target_title = target_node?.title;

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      animation={false}>
      <Modal.Header closeButton onClick={onCancel}>
        <Modal.Title id="contained-modal-title-vcenter">
          Move {source_nodes.length} Item(s)
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to move <span className='text-primary'>
          {source_titles.join(', ')}
        </span> to <span className='text-success'>{target_title}</span>?
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
        <Button variant='success' onClick={handleSubmit}>Move</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DropNodesModal;
