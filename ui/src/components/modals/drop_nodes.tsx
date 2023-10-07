import { useState } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Spinner } from 'react-bootstrap';

import { fetcher_post, get_default_headers } from 'utils/fetcher';

import type { FolderType, NodeType } from 'types';


type Args = {
  onCancel: () => void;
  onSubmit: (uuids_list: string[]) => void;
  show: boolean;
  source_nodes: NodeType[];
  target_node: NodeType | FolderType | null | undefined;
}

type MoveNodeType = {
  source_ids: string[];
  target_id: string | undefined;
}


async function move_nodes(
  source_nodes: NodeType[],
  target_node: NodeType | FolderType | undefined | null,
  signal: AbortSignal
): Promise<Response> {
  return fetch(
    '/api/nodes/move',
    {
      'method': 'POST',
      'headers': get_default_headers(),
      'body': JSON.stringify({
        source_ids: source_nodes.map(node => node.id),
        target_id: target_node?.id
      }),
      'signal': signal
    },
  );
}


const DropNodesModal = ({
  show,
  onCancel,
  onSubmit,
  source_nodes,
  target_node
}: Args) => {
  const [inProgress, setInProgress] = useState(false);
  const [controller, setController] = useState<AbortController>(new AbortController());
  const [error, setError] = useState<string>('');

  let submit_button: JSX.Element;

  if (!controller) {
    setController(new AbortController());
  }

  const handleSubmit = async () => {
    setInProgress(true);
    setError('');

    let response = await move_nodes(
      source_nodes,
      target_node,
      controller.signal
    );
    let response_data = await response.json();

    if (response.status == 200) {
      onSubmit(response_data);
    }

    setError(response_data.detail);
    setInProgress(false);
  }

  const handleCancel = () => {
    controller.abort();
    setInProgress(false);
    setError('');
    onCancel();
    // recreate new controller for next time
    setController(new AbortController());
  }

  const source_titles = source_nodes.map(n => n.title);
  const target_title = target_node?.title;

  if (inProgress) {
    submit_button = <Button variant='primary'><Spinner size="sm" /></Button>;
  } else {
    submit_button = <Button variant='primary' onClick={handleSubmit}>Move</Button>;
  }

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
        {submit_button}
        {error && <span className='text-danger'>{error}</span>}
      </Modal.Footer>
    </Modal>
  );
}

export default DropNodesModal;
